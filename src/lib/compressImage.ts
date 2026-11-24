/**
 * In-browser image compression before upload.
 *
 * A phone photo can be 5–15 MB. Uploading that raw over a slow link takes
 * minutes and then has to be downloaded again by every visitor. Resizing to a
 * sane display size and re-encoding as WebP typically turns a 10 MB JPEG into
 * ~200–400 KB with no visible quality loss at gallery sizes.
 *
 * HEIC/HEIF (the default format on many iPhones and some Android cameras) is
 * not in the server's jpeg/png/webp allowlist, and most browsers cannot decode
 * it in a canvas. Those files are converted to JPEG first; otherwise the upload
 * would travel all the way to the API only to be rejected as "Invalid file
 * type" after the progress bar reached 100%.
 *
 * All other failures fall back to the original file: an undecodable image, a
 * browser without canvas, or a re-encode that somehow grew the file must never
 * block the upload.
 */

export interface CompressOptions {
  /** Longest edge in pixels. Covers and leader photos render well under 2048. */
  maxDim?: number;
  /** Encoder quality, 0–1. 0.85 is visually lossless for web-sized images. */
  quality?: number;
}

const SKIP_BELOW_BYTES = 150 * 1024;

// Must match the server's ALLOWED_IMAGE_EXTENSIONS / ALLOWED_IMAGE_MIMES in
// backend/src/routes/site.ts. A file that is not one of these is always
// re-encoded, even when it is small, or the API will reject it.
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXT = /\.(jpe?g|png|webp)$/i;
const HEIC_EXT = /\.(heic|heif)$/i;

function baseName(name: string): string {
  const stripped = name.replace(/\.[^.]+$/, '');
  return stripped || 'image';
}

function isHeic(file: File): boolean {
  return /^image\/(heic|heif)$/i.test(file.type) || HEIC_EXT.test(file.name);
}

function isUploadableName(name: string, type: string): boolean {
  return ALLOWED_TYPES.includes(type.toLowerCase()) && ALLOWED_EXT.test(name);
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** Decodes a Blob with createImageBitmap, falling back to an <img> tag. */
async function decodeImage(blob: Blob): Promise<{
  image: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
} | null> {
  try {
    const bitmap = await createImageBitmap(blob);
    if (!bitmap.width || !bitmap.height) {
      bitmap.close?.();
      return null;
    }
    return {
      image: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      release: () => bitmap.close?.(),
    };
  } catch {
    // Safari can decode some formats in <img> that createImageBitmap rejects.
  }

  let url: string | undefined;
  try {
    url = URL.createObjectURL(blob);
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('decode failed'));
      img.src = url!;
    });
    if (!img.naturalWidth || !img.naturalHeight) return null;
    return {
      image: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      release: () => {},
    };
  } catch {
    return null;
  } finally {
    // The image is fully decoded once onload fired, so the URL is no longer
    // needed and can be released immediately.
    if (url) URL.revokeObjectURL(url);
  }
}

/** Converts a HEIC/HEIF photo to JPEG using a lazily-loaded decoder. */
async function heicToJpeg(file: File): Promise<Blob | null> {
  try {
    // Dynamic import keeps the ~1 MB decoder out of the main bundle; only
    // admins who actually pick a HEIC photo download it.
    const { default: heic2any } = await import('heic2any');
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
    const blob = Array.isArray(converted) ? converted[0] : converted;
    return blob && blob.size > 0 ? blob : null;
  } catch {
    return null;
  }
}

/**
 * Returns a File that is smaller than the input, or the input unchanged when
 * compression is unnecessary or impossible.
 *
 * Throws only when the input is an image the server would reject and it cannot
 * be converted (for example a HEIC the decoder cannot read). Silently returning
 * that file would make the upload fail later with a confusing server error.
 */
export async function compressImage(file: File, opts: CompressOptions = {}): Promise<File> {
  const maxDim = opts.maxDim ?? 2048;
  const quality = opts.quality ?? 0.85;

  if (!file.type.startsWith('image/') && !isHeic(file)) return file;

  let source: Blob = file;
  let sourceName = file.name;

  if (isHeic(file)) {
    const jpeg = await heicToJpeg(file);
    if (!jpeg) {
      throw new Error(
        'This HEIC photo could not be converted. Please choose a JPEG or PNG, or set your phone camera to "Most Compatible".'
      );
    }
    source = jpeg;
    sourceName = `${baseName(file.name)}.jpg`;
  }

  const original = (): File =>
    source === file
      ? file
      : new File([source], sourceName, { type: source.type || 'image/jpeg', lastModified: Date.now() });

  // Already a format the server accepts and small enough: send as-is.
  if (isUploadableName(sourceName, source.type) && source.size <= SKIP_BELOW_BYTES) {
    return original();
  }

  const decoded = await decodeImage(source);
  if (!decoded) {
    if (isUploadableName(file.name, file.type)) return file;
    throw new Error('This image format is not supported. Please choose a JPEG, PNG or WebP photo.');
  }

  try {
    const scale = Math.min(1, maxDim / Math.max(decoded.width, decoded.height));
    const targetW = Math.max(1, Math.round(decoded.width * scale));
    const targetH = Math.max(1, Math.round(decoded.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return original();
    // White matte: drawing a transparent PNG onto a black default would turn
    // transparent pixels black in the JPEG fallback.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.drawImage(decoded.image, 0, 0, targetW, targetH);

    const inUploadableFormat = isUploadableName(file.name, file.type);
    const outputBase = baseName(file.name);

    const webp = await toBlob(canvas, 'image/webp', quality);
    if (webp && webp.size > 0 && (webp.size < source.size || !inUploadableFormat)) {
      return new File([webp], `${outputBase}.webp`, {
        type: 'image/webp',
        lastModified: Date.now(),
      });
    }

    // WebP unsupported (older Safari) or larger than the source — try JPEG.
    const jpeg = await toBlob(canvas, 'image/jpeg', quality);
    if (jpeg && jpeg.size > 0 && (jpeg.size < source.size || !inUploadableFormat)) {
      return new File([jpeg], `${outputBase}.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });
    }

    return original();
  } catch {
    return original();
  } finally {
    decoded.release();
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
