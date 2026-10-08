// Default to local dev backend. Override in production via VITE_API_URL
// e.g. VITE_API_URL=https://audiostreaming.yemisrachdimts.org/api
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:7000/api';

export const uploadUrl = (path: string) => `${API_BASE}/uploads/${path}`;

/**
 * Audio URL for the player, with the on-disk extension replaced by `.stream`.
 *
 * IDM and similar download managers decide a response is a file to save from
 * the extension in the URL, and they capture a byte-range-capable `audio/*`
 * stream even when the server sends `Content-Disposition: inline`. A
 * `<uuid>.stream` URL has no extension to build a download task around, so the
 * capture prompt never appears. The server resolves the stem back to the real
 * file; see `STREAM_SUFFIX` in backend/src/index.ts.
 *
 * Covers still use `uploadUrl`: IDM does not capture images, and rewriting
 * those URLs would buy nothing.
 */
export const trackStreamUrl = (filePath: string) =>
  `${API_BASE}/uploads/tracks/${filePath.replace(/\.[^./\\]+$/, '')}.stream`;