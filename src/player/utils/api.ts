import { API_BASE, uploadUrl as baseUploadUrl, trackStreamUrl as baseTrackStreamUrl } from '../../lib/apiBase';
import { getFingerprint } from './fingerprint';
import type {
  AuthUser, Comment, MeUpdateInput, CreateUserInput, Program,
  SearchResults, Track, TrackUpdateInput, UserRow,
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
async function formRequest<T>(endpoint: string, data: FormData, method: 'POST' | 'PUT' = 'POST'): Promise<T> {
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
 * sent, and it can still send the session cookie, so only this one call uses it.
 *
 * The resolution and rejection values deliberately match `formRequest`, so the
 * caller cannot tell the two apart except by the progress callback.
 */
function formRequestWithProgress<T>(
  endpoint: string,
  data: FormData,
  onProgress: (percent: number) => void
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}${endpoint}`);
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
  createProgram: (data: FormData) => formRequest<Program>('/programs', data),
  deleteProgram: (id: string) => request<{ message: string }>(`/programs/${id}`, { method: 'DELETE' }),
  updateProgram: (id: string, data: FormData) => formRequest<{ message: string }>(`/programs/${id}`, data, 'PUT'),

  getTracks: (programId: string) => request<Track[]>(`/tracks/program/${programId}`),
  createTrack: (data: FormData) => formRequest<Track>('/tracks', data),
  deleteTrack: (id: string) => request<{ message: string }>(`/tracks/${id}`, { method: 'DELETE' }),
  updateTrack: (id: string, data: TrackUpdateInput) =>
    request<{ message: string }>(`/tracks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  reorderTracks: (programId: string, trackIds: string[]) =>
    request<{ message: string }>(`/tracks/reorder/${programId}`, {
      method: 'PUT',
      body: JSON.stringify({ trackIds }),
    }),
  bulkUploadTracks: (data: FormData) => formRequest<BulkUploadResult>('/tracks/bulk', data),

  bulkUploadTracksWithProgress: (data: FormData, onProgress: (percent: number) => void) =>
    formRequestWithProgress<BulkUploadResult>('/tracks/bulk', data, onProgress),

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
