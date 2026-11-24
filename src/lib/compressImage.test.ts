import { beforeEach, describe, expect, it, vi } from 'vitest';
import { compressImage } from './compressImage';

const { heic2any } = vi.hoisted(() => ({ heic2any: vi.fn() }));

vi.mock('heic2any', () => ({ default: heic2any }));

function file(name: string, type: string, size = 1024): File {
  return new File([new Uint8Array(size)], name, { type });
}

describe('compressImage', () => {
  beforeEach(() => {
    heic2any.mockReset();
  });

  it('leaves a small JPEG untouched', async () => {
    const input = file('small.jpg', 'image/jpeg', 1024);
    expect(await compressImage(input)).toBe(input);
  });

  it('converts a HEIC photo into a server-accepted JPEG', async () => {
    heic2any.mockResolvedValue(new Blob([new Uint8Array(2048)], { type: 'image/jpeg' }));

    const out = await compressImage(file('IMG_0001.HEIC', 'image/heic', 4096));

    expect(heic2any).toHaveBeenCalledOnce();
    expect(out.name).toBe('IMG_0001.jpg');
    expect(out.type).toBe('image/jpeg');
  });

  it('throws a clear error when a HEIC photo cannot be decoded', async () => {
    heic2any.mockResolvedValue(null);

    await expect(compressImage(file('IMG_0002.heic', 'image/heic', 4096))).rejects.toThrow(
      /HEIC photo could not be converted/
    );
  });
});
