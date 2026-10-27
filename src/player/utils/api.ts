import { API_BASE, uploadUrl as baseUploadUrl, trackStreamUrl as baseTrackStreamUrl } from '../../lib/apiBase';
import { getFingerprint } from './fingerprint';
import type {
  AuthUser, Comment, MeUpdateInput, CreateUserInput, Program,
  SearchResults, Track, TrackUpdateInput, UserRow,
  Leader, Album, Announcement, SiteEvent, BlogPost, WhatsNewItem, RadioSlot,
} from './types';

export const uploadUrl = baseUploadUrl;
export const trackStreamUrl = baseTrackStreamUrl;

// Matches the server's FINGERPRINT_RE. Rejecting a malformed value client-side
// keeps it out of the request entirely; the server still validates.
const FINGERPRINT_RE = /^[A-Za-z0-9_-]{8,255}$/;

function clientId(): string {
  const fp = getFingerprint();
  if (!FINGERPRINT_RE.test(fp)) {
    throw new Error('Invalid client fingerprint');
  }
  return fp;
}

/**
 * Every call sends `credentials: 'include'`. The session lives in an httpOnly
 * cookie the browser attaches automatically, so there is no token in
 * localStorage for injected script to read and nothing to keep in sync.
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch {
    throw new Error('Network error. Please check your connection.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new ApiError(err.error || 'Request failed', res.status);
  }
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Parses a response body, remembering whether it parsed at all.
 *
 * The flag matters because the callers' fallback for an unparseable body is
 * `{}`, and `{}` is a perfectly good object — so checking only the shape would
 * let a truncated or empty 2xx body resolve as a successful empty result.
 */
async function readJson(res: Response): Promise<{ value: unknown; parsed: boolean }> {
  try {
    return { value: await res.json(), parsed: true };
  } catch {
    return { value: undefined, parsed: false };
  }
}

/** Pulls `error` out of a parsed error body without assuming it parsed. */
function errorTextFrom(json: { value: unknown }): string | undefined {
  if (json.value === null || typeof json.value !== 'object') return undefined;
  const { error } = json.value as { error?: unknown };
  return typeof error === 'string' ? error : undefined;
}

/** Multipart upload helper: no Content-Type, so the browser sets the boundary. */
async function formRequest<T>(
  endpoint: string,
  data: FormData,
  method: 'POST' | 'PUT' = 'POST',
  onProgress?: (percent: number) => void
): Promise<T> {
  // `fetch` exposes no upload-progress events, so any caller that wants a
  // progress bar has to go through XHR. Without a callback the plain fetch
  // path is kept for calls that do not need one.
  if (onProgress) {
    return formRequestWithProgress<T>(endpoint, data, onProgress, method);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, {
      method,
      credentials: 'include',
      body: data,
    });
  } catch {
    throw new Error('Network error. Please check your connection.');
  }

  const json = await readJson(res);
  if (!res.ok) {
    throw new ApiError(errorTextFrom(json) || 'Request failed', res.status);
  }

  // A 2xx whose body is empty or not an object means the server replied before
  // finishing (an aborted upload, for instance). Resolving with it would hand
  // the caller a value that is not shaped like T.
  if (!json.parsed || json.value === null || typeof json.value !== 'object') {
    throw new ApiError('Malformed response from server', res.status);
  }
  return json.value as T;
}

/** Sends the listener identity in a header so it stays out of URLs and logs. */
function withClientId(body?: unknown, method: 'GET' | 'POST' = 'POST'): RequestInit {
  return {
    method,
    headers: { 'x-client-fingerprint': clientId() },
    ...(method === 'POST' ? { body: JSON.stringify(body ?? {}) } : {}),
  };
}

export interface BulkUploadResult {
  uploaded: number;
  tracks: Array<{ id: string; title: string; file_path: string; sort_order: number }>;
}

/**
 * Multipart upload with real byte-level progress.
 *
 * `fetch` exposes no upload-progress events, so a batch of audio — up to 50
 * files, and nginx allows 200 MB per request — could sit behind a spinner with
 * no feedback for minutes. XHR is the only browser transport that reports bytes
 * sent, and it can still send the session cookie, so only uploads use it.
 *
 * The resolution and rejection values deliberately match `formRequest`, so the
 * caller cannot tell the two apart except by the progress callback.
 */
function formRequestWithProgress<T>(
  endpoint: string,
  data: FormData,
  onProgress: (percent: number) => void,
  method: 'POST' | 'PUT' = 'POST'
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, `${API_BASE}${endpoint}`);
    // Matches `credentials: 'include'` on every other call.
    xhr.withCredentials = true;

    xhr.upload.addEventListener('progress', (e: ProgressEvent) => {
      // lengthComputable is false when the size is unknown, which would make
      // the ratio NaN and render a bar stuck at "NaN%".
      if (e.lengthComputable && e.total > 0) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      let value: unknown;
      let parsed = true;
      try {
        value = JSON.parse(xhr.responseText);
      } catch {
        parsed = false;
      }
      const json = { value, parsed };

      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new ApiError(errorTextFrom(json) || 'Request failed', xhr.status));
        return;
      }
      if (!parsed || value === null || typeof value !== 'object') {
        reject(new ApiError('Malformed response from server', xhr.status));
        return;
      }

      // The load event fires once the body is in, so this is the only point
      // where reporting 100% is honest.
      onProgress(100);
      resolve(value as T);
    });

    xhr.addEventListener('error', () =>
      reject(new Error('Network error. Please check your connection.'))
    );
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

    xhr.send(data);
  });
}

// ---------------------------------------------------------------------------
// Chunked, resumable audio upload.
//
// A single multi-minute POST over a slow or lossy link dies on any blip and
// restarts from zero. Splitting into ~5 MB chunks means a drop costs one chunk,
// and `status` lets a retried call skip parts the server already has. The
// chunk size itself comes from the server's init response so the two sides
// can never disagree.
// ---------------------------------------------------------------------------

const CHUNK_RETRIES = 3;

interface ChunkInitResponse {
  upload_id: string;
  chunk_size: number;
  chunk_count: number;
  received: number[];
}

export interface TrackUploadMeta {
  title: string;
  artist?: string;
  album?: string;
  program_id: string;
  track_type?: string;
  duration?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sendChunk(uploadId: string, index: number, blob: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/tracks/upload/chunk/${uploadId}/${index}`);
    xhr.withCredentials = true;
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      let message = `Chunk ${index} failed (HTTP ${xhr.status})`;
      try {
        const parsed = JSON.parse(xhr.responseText) as { error?: string };
        if (parsed.error) message = parsed.error;
      } catch {
        // Non-JSON error body — keep the status message.
      }
      reject(new ApiError(message, xhr.status));
    });
    xhr.addEventListener('error', () =>
      reject(new Error('Network error. Please check your connection.'))
    );
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));
    xhr.send(blob);
  });
}

/**
 * Uploads one audio file via the chunked endpoints.
 *
 * `onProgress` is overall percent of this file's bytes (already-resumed chunks
 * count as done). Safe to call again after a failure: the server's `status`
 * endpoint lists chunks it already holds, so the retry continues from there.
 */
export async function uploadTrackResumable(
  file: File,
  meta: TrackUploadMeta,
  onProgress: (percent: number) => void
): Promise<Track> {
  const init = await request<ChunkInitResponse>('/tracks/upload/init', {
    method: 'POST',
    body: JSON.stringify({
      original_name: file.name,
      size: file.size,
      mime_type: file.type || 'audio/mpeg',
    }),
  });

  const { upload_id, chunk_size, chunk_count } = init;

  // Prefer the server's list over init's empty `received` in case an earlier
  // attempt already uploaded some parts and the client kept the upload_id.
  let receivedSet = new Set<number>(init.received ?? []);
  if (receivedSet.size === 0 && chunk_count > 0) {
    try {
      const status = await request<{ received: number[] }>(`/tracks/upload/status/${upload_id}`);
      receivedSet = new Set(status.received);
    } catch {
      // Status is an optimisation; a miss just re-uploads every chunk.
    }
  }

  const bytesOfChunk = (i: number) => Math.min(chunk_size, Math.max(0, file.size - i * chunk_size));
  let uploadedBytes = [...receivedSet].reduce((sum, i) => sum + bytesOfChunk(i), 0);

  const report = () => {
    if (file.size > 0) {
      onProgress(Math.min(99, Math.round((uploadedBytes / file.size) * 100)));
    }
  };
  report();

  for (let i = 0; i < chunk_count; i++) {
    if (receivedSet.has(i)) continue;
    const start = i * chunk_size;
    const end = Math.min(start + chunk_size, file.size);
    const blob = file.slice(start, end);

    let attempt = 0;
    for (;;) {
      try {
        await sendChunk(upload_id, i, blob);
        receivedSet.add(i);
        uploadedBytes += blob.size;
        report();
        break;
      } catch (err) {
        attempt++;
        // A 4xx other than 429 will not get better by retrying (bad session,
        // invalid chunk); only network errors and 5xx are worth another try.
        const retryable =
          err instanceof ApiError ? err.status >= 500 || err.status === 429 : true;
        if (!retryable || attempt >= CHUNK_RETRIES) throw err;
        await sleep(1000 * attempt);
      }
    }
  }

  const track = await request<Track>('/tracks/upload/finalize', {
    method: 'POST',
    body: JSON.stringify({
      upload_id,
      title: meta.title,
      artist: meta.artist,
      album: meta.album,
      program_id: meta.program_id,
      track_type: meta.track_type,
      duration: meta.duration,
    }),
  });
  onProgress(100);
  return track;
}

export const api = {
  login: (data: { username: string; password: string }) =>
    request<{ user: AuthUser }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),

  getMe: () => request<UserRow>('/auth/me'),

  updateMe: (data: MeUpdateInput) =>
    request<AuthUser>('/auth/me', { method: 'PUT', body: JSON.stringify(data) }),

  getUsers: () => request<UserRow[]>('/auth/'),

  createUser: (data: CreateUserInput) =>
    request<AuthUser>('/auth/', { method: 'POST', body: JSON.stringify(data) }),

  deleteUser: (id: string) => request<{ message: string }>(`/auth/${id}`, { method: 'DELETE' }),

  updatePassword: (id: string, password: string) =>
    request<{ message: string }>(`/auth/${id}/password`, { method: 'PUT', body: JSON.stringify({ password }) }),

  getPrograms: () => request<Program[]>('/programs/'),
  getProgram: (id: string) => request<Program>(`/programs/${id}`),
  getComments: (programId: string) => request<Comment[]>(`/programs/${programId}/comments`),
  getAllComments: () => request<Comment[]>('/programs/comments/all'),
  createProgram: (data: FormData, onProgress?: (percent: number) => void) =>
    formRequest<Program>('/programs', data, 'POST', onProgress),
  deleteProgram: (id: string) => request<{ message: string }>(`/programs/${id}`, { method: 'DELETE' }),
  updateProgram: (id: string, data: FormData, onProgress?: (percent: number) => void) =>
    formRequest<{ message: string }>(`/programs/${id}`, data, 'PUT', onProgress),

  getTracks: (programId: string) => request<Track[]>(`/tracks/program/${programId}`),
  createTrack: (data: FormData, onProgress?: (percent: number) => void) =>
    formRequest<Track>('/tracks', data, 'POST', onProgress),
  deleteTrack: (id: string) => request<{ message: string }>(`/tracks/${id}`, { method: 'DELETE' }),
  deleteTracks: (trackIds: string[]) =>
    request<{ message: string; deleted: number; notFound: string[] }>('/tracks', {
      method: 'DELETE',
      body: JSON.stringify({ trackIds }),
    }),
  updateTrack: (id: string, data: TrackUpdateInput) =>
    request<{ message: string }>(`/tracks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  reorderTracks: (programId: string, trackIds: string[]) =>
    request<{ message: string }>(`/tracks/reorder/${programId}`, {
      method: 'PUT',
      body: JSON.stringify({ trackIds }),
    }),
  bulkUploadTracks: (data: FormData, onProgress?: (percent: number) => void) =>
    formRequest<BulkUploadResult>('/tracks/bulk', data, 'POST', onProgress),

  bulkUploadTracksWithProgress: (data: FormData, onProgress: (percent: number) => void) =>
    formRequestWithProgress<BulkUploadResult>('/tracks/bulk', data, onProgress),

  uploadTrackResumable,

  // ---- Site content: leadership, albums, announcements, events, blog ----

  // Public reads (anonymous, cached on the server).
  getLeaders: () => request<Leader[]>('/site/leaders'),
  getAlbums: (department?: string) =>
    request<Album[]>(`/site/albums${department ? `?department=${encodeURIComponent(department)}` : ''}`),
  getAnnouncements: () => request<Announcement[]>('/site/announcements'),
  getSiteEvents: () => request<SiteEvent[]>('/site/events'),

  // Weekly radio grid. `saveRadioSlot` upserts on (day, hour).
  getRadioSchedule: () => request<RadioSlot[]>('/site/schedule'),
  saveRadioSlot: (data: Pick<RadioSlot, 'day' | 'hour' | 'title' | 'category'> & { host?: string | null }) =>
    request<{ message: string }>('/site/schedule', { method: 'PUT', body: JSON.stringify(data) }),
  deleteRadioSlot: (id: string) =>
    request<{ message: string }>(`/site/schedule/${id}`, { method: 'DELETE' }),

  // Leaders. Create/update are multipart because a photo rides along; the
  // backend reads `req.body` the same way either way.
  createLeader: (data: FormData, onProgress?: (percent: number) => void) =>
    formRequest<Leader>('/site/leaders', data, 'POST', onProgress),
  updateLeader: (id: string, data: FormData, onProgress?: (percent: number) => void) =>
    formRequest<{ message: string }>(`/site/leaders/${id}`, data, 'PUT', onProgress),
  deleteLeader: (id: string) =>
    request<{ message: string }>(`/site/leaders/${id}`, { method: 'DELETE' }),
  reorderLeaders: (ids: string[]) =>
    request<{ message: string }>('/site/leaders/reorder', {
      method: 'PUT',
      body: JSON.stringify({ ids }),
    }),

  createAlbum: (data: { title: string; description?: string; department?: string | null }) =>
    request<Album>('/site/albums', { method: 'POST', body: JSON.stringify(data) }),
  updateAlbum: (id: string, data: { title?: string; description?: string | null; department?: string | null }) =>
    request<{ message: string }>(`/site/albums/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAlbum: (id: string) =>
    request<{ message: string }>(`/site/albums/${id}`, { method: 'DELETE' }),
  addAlbumPhotos: (albumId: string, data: FormData, onProgress?: (percent: number) => void) =>
    formRequest<{ uploaded: number }>(`/site/albums/${albumId}/photos`, data, 'POST', onProgress),
  deleteAlbumPhoto: (albumId: string, photoId: string) =>
    request<{ message: string }>(`/site/albums/${albumId}/photos/${photoId}`, { method: 'DELETE' }),

  createAnnouncement: (data: { title: string; body?: string; pinned?: boolean }) =>
    request<Announcement>('/site/announcements', { method: 'POST', body: JSON.stringify(data) }),
  updateAnnouncement: (id: string, data: { title?: string; body?: string | null; pinned?: boolean }) =>
    request<{ message: string }>(`/site/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAnnouncement: (id: string) =>
    request<{ message: string }>(`/site/announcements/${id}`, { method: 'DELETE' }),

  createSiteEvent: (data: { title: string; description?: string; location?: string; starts_at: string; ends_at?: string }) =>
    request<SiteEvent>('/site/events', { method: 'POST', body: JSON.stringify(data) }),
  updateSiteEvent: (id: string, data: { title?: string; description?: string | null; location?: string | null; starts_at?: string; ends_at?: string | null }) =>
    request<{ message: string }>(`/site/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSiteEvent: (id: string) =>
    request<{ message: string }>(`/site/events/${id}`, { method: 'DELETE' }),

  // ---- Blog ----

  // Public reads: published posts only, cached on the server.
  getBlogPosts: () => request<BlogPost[]>('/site/blog'),
  getBlogPost: (slug: string) => request<BlogPost>(`/site/blog/${encodeURIComponent(slug)}`),
  // Admin listing with drafts. The route sits before /blog/:slug server-side,
  // so "admin" is never mistaken for a slug.
  getAdminBlogPosts: () => request<BlogPost[]>('/site/blog/admin'),
  // Multipart: the cover image rides along with the fields.
  createBlogPost: (data: FormData, onProgress?: (percent: number) => void) =>
    formRequest<BlogPost>('/site/blog', data, 'POST', onProgress),
  updateBlogPost: (id: string, data: FormData, onProgress?: (percent: number) => void) =>
    formRequest<{ message: string }>(`/site/blog/${id}`, data, 'PUT', onProgress),
  deleteBlogPost: (id: string) =>
    request<{ message: string }>(`/site/blog/${id}`, { method: 'DELETE' }),

  /** Merged blogs + announcements + events, newest first, for the bell. */
  getWhatsNew: () => request<WhatsNewItem[]>('/site/whats-new'),

  getAnalytics: () => request<Analytics>('/analytics/'),

  getPublicPrograms: () => request<Program[]>('/public/programs'),
  getPublicProgram: (id: string) => request<Program>(`/public/programs/${id}`),
  getLatestTracks: () => request<Track[]>('/public/latest-tracks'),
  search: (q: string) => request<SearchResults>(`/public/search?q=${encodeURIComponent(q)}`),

  postComment: (programId: string, data: { guest_name: string; content: string }) =>
    request<Comment>(`/public/programs/${programId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  toggleLike: (trackId: string) =>
    request<{ liked: boolean }>(`/public/tracks/${trackId}/like`, withClientId()),

  getLikeCount: (trackId: string) => request<{ count: number }>(`/public/tracks/${trackId}/likes`),

  checkLiked: (trackId: string) => request<{ liked: boolean }>(
    `/public/tracks/${trackId}/liked`,
    withClientId(undefined, 'GET')
  ),

  recordListen: (trackId: string) =>
    request<{ success: boolean }>(`/public/tracks/${trackId}/listen`, withClientId()),
};

export interface MonthCount {
  month: string;
  count: number;
}

export interface Analytics {
  totals: {
    programs: number;
    tracks: number;
    users: number;
    comments: number;
    likes: number;
    listens: number;
    listeners: number;
  };
  programsByUser: Array<{ username: string; count: number }>;
  tracksByType: Array<{ track_type: string | null; count: number }>;
  tracksByProgram: Array<{ title: string; count: number }>;
  mostLikedTracks: Array<{ title: string; artist: string | null; like_count: number; program_title: string }>;
  recentComments: Comment[];
  programsByMonth: MonthCount[];
  tracksByMonth: MonthCount[];
  listensByMonth: MonthCount[];
  listenersByMonth: MonthCount[];
  commentsByMonth: MonthCount[];
}
