import { useCallback, useEffect, useState } from 'react';
import { useAsyncData } from '../player/hooks/useAsyncData';
import { api, uploadUrl } from '../player/utils/api';
import type { Album } from '../player/utils/types';

export interface GalleryImage {
  // Static galleries number their images, dynamic ones reuse the photo row's
  // uuid; the modal only needs the value for findIndex, not its type.
  id: string | number;
  src: string;
  caption: string;
  details: string;
  category: string;
}

/**
 * Lightbox state for the division galleries: which image is open, plus
 * next/previous/close handlers with Escape and arrow-key support.
 *
 * All four gallery pages were duplicating this logic, and each copy mutated
 * `document.body` from an event handler, which the hooks linter rejects.
 * Scroll locking is now an effect keyed on `isOpen`, so it also runs on
 * unmount, which the old inline version never did.
 */
export function useGalleryModal(images: GalleryImage[]) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const selectedImage = selectedIndex === null ? null : images[selectedIndex] ?? null;

  const open = useCallback((image: GalleryImage) => {
    const index = images.findIndex((candidate) => candidate.id === image.id);
    setSelectedIndex(index === -1 ? null : index);
  }, [images]);

  const close = useCallback(() => setSelectedIndex(null), []);

  const goToPrevious = useCallback(() => {
    setSelectedIndex((index) => {
      if (index === null || images.length === 0) return index;
      return index === 0 ? images.length - 1 : index - 1;
    });
  }, [images.length]);

  const goToNext = useCallback(() => {
    setSelectedIndex((index) => {
      if (index === null || images.length === 0) return index;
      return index === images.length - 1 ? 0 : index + 1;
    });
  }, [images.length]);

  const isOpen = selectedImage !== null;

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') goToPrevious();
      else if (e.key === 'ArrowRight') goToNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close, goToNext, goToPrevious]);

  // Include `images` itself: the division pages destructure it from this hook
  // to render the grid; omitting it handed them `undefined` and their
  // `images.map(...)` crashed the route behind the error boundary.
  return { images, selectedImage, selectedIndex, isOpen, open, close, goToNext, goToPrevious };
}

/**
 * Gallery images for a department page: the albums the admin mounted on that
 * department (see routes/site.ts), rendered as lightbox images, falling back to
 * the page's built-in static photos while the feed is empty or unreachable.
 *
 * The hook is an extension of `useGalleryModal`, so callers destructure the
 * same members plus `images` — the list actually blurring behind the modal,
 * which is not always the static fallback.
 */
export function useSiteGallery(department: string, fallback: GalleryImage[] = []) {
  // Same fallback contract as the Gallery page: a failed request resolves to
  // an empty list, which selects the built-in photos.
  const { data: albums } = useAsyncData<Album[]>(
    () => api.getAlbums(department).catch(() => [] as Album[]),
    []
  );
  return useGalleryModal(toGalleryImages(albums, fallback));
}

function toGalleryImages(albums: Album[], fallback: GalleryImage[]): GalleryImage[] {
  const albumImages: GalleryImage[] = albums.flatMap((album) =>
    album.photos.map((photo) => ({
      id: photo.id,
      src: uploadUrl(`albums/${photo.file_name}`),
      caption: photo.caption || album.title,
      details: album.description || album.title,
      category: album.title,
    }))
  );
  return albumImages.length > 0 ? albumImages : fallback;
}