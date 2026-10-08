import { useCallback, useEffect, useState } from 'react';

export interface GalleryImage {
  id: number;
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

  return { selectedImage, selectedIndex, isOpen, open, close, goToNext, goToPrevious };
}