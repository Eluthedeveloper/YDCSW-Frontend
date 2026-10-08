import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getFingerprint } from './fingerprint';

describe('getFingerprint', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns a value the server fingerprint regex accepts', () => {
    expect(getFingerprint()).toMatch(/^[A-Za-z0-9_-]{8,255}$/);
  });

  it('is stable across calls so a listener is not re-counted each render', () => {
    expect(getFingerprint()).toBe(getFingerprint());
  });

  it('replaces a stored value that does not match the expected format', () => {
    localStorage.setItem('audio_client_id', 'short');
    const result = getFingerprint();
    expect(result).toMatch(/^[A-Za-z0-9_-]{8,255}$/);
    expect(result).not.toBe('short');
  });

  it('still returns a usable id when localStorage throws', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    const result = getFingerprint();
    expect(result).toMatch(/^[A-Za-z0-9_-]{8,255}$/);

    setItem.mockRestore();
  });

  it('falls back to getRandomValues when randomUUID is unavailable', () => {
    vi.stubGlobal('crypto', {
      getRandomValues: (bytes: Uint8Array) => {
        for (let i = 0; i < bytes.length; i++) bytes[i] = i;
        return bytes;
      },
    });

    expect(getFingerprint()).toBe('c000102030405060708090a0b0c0d0e0f');
  });
});