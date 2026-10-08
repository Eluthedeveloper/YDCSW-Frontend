import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, ApiError } from './api';

const originalFetch = globalThis.fetch;
const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe('api client', () => {
  beforeEach(() => {
    localStorage.clear();
    fetchMock.mockReset();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('sends the session cookie on every request instead of an auth header', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ user: { id: '1', username: 'a', email: 'a@b.c', role: 'admin' } }));

    await api.login({ username: 'a', password: 'pw' });

    const [, options] = fetchMock.mock.calls[0];
    expect(options.credentials).toBe('include');
    expect(options.headers).not.toHaveProperty('Authorization');
  });

  it('never reads or writes a token in localStorage', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: '1', username: 'a', email: 'a@b.c', role: 'admin' }));

    await api.getMe();

    expect(localStorage.getItem('token')).toBeNull();
  });

  it('sends the listener identity in a header rather than the URL', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ liked: true }));

    await api.toggleLike('track-1');

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).not.toContain('fingerprint');
    expect(url).not.toContain('fp=');
    expect(options.headers['x-client-fingerprint']).toMatch(/^[A-Za-z0-9_-]{8,255}$/);
  });

  it('sends the same fingerprint header on a like check', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ liked: false }));

    await api.checkLiked('track-1');

    const [, options] = fetchMock.mock.calls[0];
    expect(options.method).toBe('GET');
    expect(options.headers['x-client-fingerprint']).toBeTruthy();
  });

  it('omits the JSON content type on multipart uploads so the boundary is set', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 'p1' }));

    const form = new FormData();
    form.append('title', 'Show');
    await api.createProgram(form);

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers).toBeUndefined();
    expect(options.body).toBe(form);
    expect(options.credentials).toBe('include');
  });

  it('surfaces the server error message with its status', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'Super Admin access required' }, 403));

    await expect(api.getUsers()).rejects.toMatchObject({
      message: 'Super Admin access required',
      status: 403,
    });
  });

  it('reports a network failure as a readable error, not a raw TypeError', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(api.getMe()).rejects.toThrow(/Network error/);
  });

  it('falls back to a generic message when the error body is not JSON', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('invalid json');
      },
    } as unknown as Response);

    await expect(api.getPrograms()).rejects.toBeInstanceOf(ApiError);
  });

  it('rejects a 2xx upload whose body is empty instead of resolving as empty', async () => {
    // The old fallback for an unparseable body was `{}`, which passes a shape
    // check, so a server that replied early resolved as a successful upload of
    // nothing rather than an error.
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('Unexpected end of JSON input');
      },
    } as unknown as Response);

    const form = new FormData();
    form.append('audio_files', new Blob());
    await expect(api.bulkUploadTracks(form)).rejects.toMatchObject({
      message: 'Malformed response from server',
    });
  });
});

/**
 * A minimal XMLHttpRequest stand-in. The upload-progress API only exists on
 * XHR, so these tests drive the event listeners directly.
 */
class FakeXhr {
  static last: FakeXhr | null = null;

  method = '';
  url = '';
  withCredentials = false;
  status = 200;
  responseText = '{}';
  sent: FormData | null = null;

  uploadListeners: Array<(e: ProgressEvent) => void> = [];
  loadListeners: Array<() => void> = [];
  errorListeners: Array<() => void> = [];

  upload = {
    addEventListener: (_: string, fn: (e: ProgressEvent) => void) => {
      this.uploadListeners.push(fn);
    },
  };

  constructor() {
    FakeXhr.last = this;
  }

  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }

  send(data: FormData) {
    this.sent = data;
  }

  addEventListener(type: string, fn: () => void) {
    if (type === 'load') this.loadListeners.push(fn);
    if (type === 'error') this.errorListeners.push(fn);
  }

  /** Drives an upload progress event the way a browser would. */
  emitProgress(loaded: number, total: number, lengthComputable = true) {
    const event = { loaded, total, lengthComputable } as ProgressEvent;
    this.uploadListeners.forEach((fn) => fn(event));
  }

  finish(status = this.status, body = this.responseText) {
    this.status = status;
    this.responseText = body;
    this.loadListeners.forEach((fn) => fn());
  }

  fail() {
    this.errorListeners.forEach((fn) => fn());
  }
}

describe('bulk upload progress', () => {
  const originalXhr = globalThis.XMLHttpRequest;

  beforeEach(() => {
    FakeXhr.last = null;
    globalThis.XMLHttpRequest = FakeXhr as unknown as typeof XMLHttpRequest;
  });

  afterEach(() => {
    globalThis.XMLHttpRequest = originalXhr;
  });

  const form = () => {
    const fd = new FormData();
    fd.append('program_id', 'p1');
    return fd;
  };

  it('reports byte progress and resolves with the parsed body', async () => {
    const seen: number[] = [];
    const promise = api.bulkUploadTracksWithProgress(form(), (p) => seen.push(p));

    const xhr = FakeXhr.last!;
    xhr.emitProgress(512, 1024);
    xhr.emitProgress(1024, 1024);
    xhr.finish(200, JSON.stringify({ uploaded: 1, tracks: [] }));

    await expect(promise).resolves.toMatchObject({ uploaded: 1 });
    expect(seen).toEqual([50, 100, 100]);
  });

  it('sends the session cookie and posts multipart without a content type', async () => {
    const promise = api.bulkUploadTracksWithProgress(form(), () => {});
    const xhr = FakeXhr.last!;

    expect(xhr.method).toBe('POST');
    expect(xhr.url).toContain('/tracks/bulk');
    expect(xhr.withCredentials).toBe(true);
    expect(xhr.sent).toBeInstanceOf(FormData);

    xhr.finish();
    await promise;
  });

  it('ignores a progress event with an unknown total rather than reporting NaN', async () => {
    const seen: number[] = [];
    const promise = api.bulkUploadTracksWithProgress(form(), (p) => seen.push(p));
    const xhr = FakeXhr.last!;

    xhr.emitProgress(1024, 0, false);
    xhr.finish();

    await promise;
    // Only the final 100% from the load event; no NaN reached the bar.
    expect(seen).toEqual([100]);
    expect(seen.every((p) => Number.isFinite(p))).toBe(true);
  });

  it('surfaces the server error message with its status', async () => {
    const promise = api.bulkUploadTracksWithProgress(form(), () => {});
    FakeXhr.last!.finish(500, JSON.stringify({ error: 'No files uploaded' }));

    await expect(promise).rejects.toMatchObject({ message: 'No files uploaded', status: 500 });
  });

  it('rejects a 2xx with an empty body instead of resolving with nothing', async () => {
    const promise = api.bulkUploadTracksWithProgress(form(), () => {});
    FakeXhr.last!.finish(200, '');

    await expect(promise).rejects.toMatchObject({ message: 'Malformed response from server' });
  });

  it('reports a network failure as a readable error', async () => {
    const promise = api.bulkUploadTracksWithProgress(form(), () => {});
    FakeXhr.last!.fail();

    await expect(promise).rejects.toThrow(/Network error/);
  });
});