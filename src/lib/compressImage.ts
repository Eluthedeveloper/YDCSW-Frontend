/**
 * In-browser image compression before upload.
 *
 * A phone photo can be 5–15 MB. Uploading that raw over a slow link takes
 * minutes and then has to be downloaded again by every visitor. Resizing to a
 * sane display size and re-encoding as WebP typically turns a 10 MB JPEG into
 * ~200–400 KB with no visible quality loss at gallery sizes.
 *
 * All failures fall back to the original file: an undecodable HEIC, a browser
 * without canvas, or a re-encode that somehow grew the file must never block
 * the upload.
 */

export interface CompressOptions {
  /** Longest edge in pixels. Covers and leader photos render well under 2048. */
  maxDim?: number;
  /** Encoder quality, 0–1. 0.85 is visually lossless for web-sized images. */
  quality?: number;
}

const SKIP_BELOW_BYTES = 150 * 1024;

function baseName(name: string): string {
  const stripped = name.replace(/\.[^.]+$/, '');
  return stripped || 'image';
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Returns a File that is smaller than the input, or the input unchanged when
 * compression is unnecessary or impossible.
 */
export async function compressImage(file: File, opts: CompressOptions = {}): Promise<File> {
  const maxDim = opts.maxDim ?? 2048;
  const quality = opts.quality ?? 0.85;

  if (!file.type.startsWith('image/')) return file;
  if (file.size <= SKIP_BELOW_BYTES) return file;

  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    if (!width || !height) return file;

    const scale = Math.min(1, maxDim / Math.max(width, height));
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    // White matte: drawing a transparent PNG onto a black default would turn
    // transparent pixels black in the JPEG fallback.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);

    const webp = await toBlob(canvas, 'image/webp', quality);
    if (webp && webp.size > 0 && webp.size < file.size) {
      return new File([webp], `${baseName(file.name)}.webp`, {
        type: 'image/webp',
        lastModified: Date.now(),
      });
    }

    // WebP unsupported (older Safari) or larger than the source — try JPEG.
    const jpeg = await toBlob(canvas, 'image/jpeg', quality);
    if (jpeg && jpeg.size > 0 && jpeg.size < file.size) {
      return new File([jpeg], `${baseName(file.name)}.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });
    }

    return file;
  } catch {
    return file;
  } finally {
    bitmap?.close?.();
  }
}

/** Sequential so a 30-photo album does not spawn 30 canvases at once. */
export async function compressImages(files: File[], opts: CompressOptions = {}): Promise<File[]> {
  const out: File[] = [];
  for (const file of files) {
    out.push(await compressImage(file, opts));
  }
  return out;
}
