const STORAGE_KEY = 'audio_client_id';

/**
 * Stable anonymous id used for one-like-per-listener and listen dedup.
 *
 * This is deliberately not a fingerprint of the browser or machine: those are
 * invasive, easy to spoof, and change unexpectedly. It is just a random id kept
 * in localStorage so the same browser is recognised across reloads. If storage
 * is unavailable the value regenerates per session, which costs per-listener
 * accuracy and nothing else.
 */
export function getFingerprint(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing && /^[A-Za-z0-9_-]{8,255}$/.test(existing)) {
      return existing;
    }

    const generated = generate();
    localStorage.setItem(STORAGE_KEY, generated);
    return generated;
  } catch {
    return generate();
  }
}

function generate(): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return uuid.replace(/-/g, '');

  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return `c${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
}
