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

  it('does not keep a larger PNG when WebP encoding falls back for a HEIC photo', async () => {
    // iOS before 16.4 returns a lossless PNG from toBlob('image/webp'). That
    // PNG is bigger than the JPEG heic2any already produced, so uploading it
    // would be slower than the file it replaced (and can time out on mobile).
    heic2any.mockResolvedValue(new Blob([new Uint8Array(500 * 1024)], { type: 'image/jpeg' }));
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn().mockResolvedValue({ width: 3000, height: 2000, close: vi.fn() })
    );
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({
        fillStyle: '',
        fillRect: vi.fn(),
        drawImage: vi.fn(),
      } as unknown as CanvasRenderingContext2D);
    const toBlob = vi
      .spyOn(HTMLCanvasElement.prototype, 'toBlob')
      .mockImplementation((callback: BlobCallback, type?: string) => {
        if (type === 'image/webp') {
          callback(new Blob([new Uint8Array(2 * 1024 * 1024)], { type: 'image/png' }));
        } else {
          callback(new Blob([new Uint8Array(300 * 1024)], { type: 'image/jpeg' }));
        }
      });

    try {
      const out = await compressImage(file('IMG_0003.HEIC', 'image/heic', 2 * 1024 * 1024), {
        maxDim: 1600,
        quality: 0.8,
      });
      expect(out.name).toBe('IMG_0003.jpg');
      expect(out.type).toBe('image/jpeg');
      expect(out.size).toBe(300 * 1024);
    } finally {
      toBlob.mockRestore();
      getContext.mockRestore();
      vi.unstubAllGlobals();
    }
  });

  it('names the output after the blob type when WebP encoding falls back to PNG', async () => {
    // Older Safari returns a PNG from toBlob('image/webp'). Labelling it .webp
    // makes a server that validates the file reject the upload.
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn().mockResolvedValue({ width: 2000, height: 1000, close: vi.fn() })
    );
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({
        fillStyle: '',
        fillRect: vi.fn(),
        drawImage: vi.fn(),
      } as unknown as CanvasRenderingContext2D);
    const toBlob = vi
      .spyOn(HTMLCanvasElement.prototype, 'toBlob')
      .mockImplementation((callback: BlobCallback) => {
        callback(new Blob([new Uint8Array(1000)], { type: 'image/png' }));
      });

    try {
      const out = await compressImage(file('photo.png', 'image/png', 200 * 1024), {
        maxDim: 1600,
        quality: 0.8,
      });
      expect(out.name).toBe('photo.png');
      expect(out.type).toBe('image/png');
    } finally {
      toBlob.mockRestore();
      getContext.mockRestore();
      vi.unstubAllGlobals();
    }
  });
});
