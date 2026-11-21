import type Hls from 'hls.js';

export interface HlsHandle {
  destroy: () => void;
}

interface AttachOptions {
  /** Called once when hls.js gives up, so the caller can fall back. */
  onFatal: () => void;
  /**
   * Checked after the dynamic import resolves and before the library touches
   * the element. Without it, an import that finishes after the listener picked
   * another track would attach a MediaSource over the new source.
   */
  isCurrent?: () => boolean;
}

/**
 * Whether the element can play an HLS playlist by itself.
 *
 * Safari and iOS answer yes, and using their native path avoids loading the
 * library at all. Chrome and Firefox answer no and need hls.js.
 */
export const supportsNativeHls = (audio: HTMLAudioElement): boolean =>
  audio.canPlayType('application/vnd.apple.mpegurl') !== '';

/**
 * Whether Media Source Extensions exist, which is what hls.js requires.
 *
 * Checked synchronously before importing the library so test environments
 * (jsdom has no MediaSource) never pay for the dynamic import.
 */
export const supportsMse = (): boolean =>
  typeof window !== 'undefined' && typeof window.MediaSource !== 'undefined';

/** HLS is on by default; `VITE_HLS_ENABLED=false` forces the progressive path. */
export const hlsEnabled = (): boolean => import.meta.env.VITE_HLS_ENABLED !== 'false';

/**
 * Attaches hls.js to an audio element and starts loading `url`.
 *
 * Returns null when the library is loaded but MSE is unsupported, so the
 * caller can fall back to the progressive stream. The returned handle must be
 * destroyed before the next source is assigned.
 */
export async function attachHls(
  audio: HTMLAudioElement,
  url: string,
  { onFatal, isCurrent }: AttachOptions
): Promise<HlsHandle | null> {
  const { default: HlsCtor } = await import('hls.js');
  if (!HlsCtor.isSupported()) return null;
  // The element may have moved on while the chunk was loading. Returning null
  // here is safe: the caller checks its own token before treating null as a
  // fallback, and this branch never touched the element.
  if (isCurrent && !isCurrent()) return null;

  const hls: Hls = new HlsCtor({
    // Audio-only playlists gain little from a worker, and some older browsers
    // fail to start one; the main thread is enough for a 6-second segment.
    enableWorker: false,
    lowLatencyMode: false,
    // Keep a short back-buffer so a seek backwards does not re-fetch segments.
    backBufferLength: 90,
  });

  let fellBack = false;
  hls.on(HlsCtor.Events.ERROR, (_event, data) => {
    if (!data.fatal || fellBack) return;
    fellBack = true;
    onFatal();
  });

  hls.loadSource(url);
  hls.attachMedia(audio);

  return {
    destroy: () => {
      hls.destroy();
    },
  };
}
