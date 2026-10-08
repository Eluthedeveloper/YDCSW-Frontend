import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { api } from '../utils/api';

export interface TrackLike {
  liked: boolean;
  likeCount: number;
  /** True while a toggle is in flight, so the button can disable itself. */
  pending: boolean;
  toggle: () => void;
}

interface LikeState {
  /** The track this state was read for; a mismatch means it is not yet loaded. */
  trackId: string | undefined;
  liked: boolean;
  likeCount: number;
}

/**
 * Owns one track's like state: reads it on mount and toggles it against the API.
 *
 * This replaces four hand-rolled copies of the same logic across the track rows,
 * the search results, and the player. The copies had two defects:
 *
 *  - `toggleLike` was awaited with no catch, so a network failure surfaced as
 *    an unhandled rejection and the heart simply never moved.
 *  - The search page never called `checkLiked`, so a track already liked from
 *    another page rendered as unliked until reloaded.
 *
 * The state records which track it belongs to rather than being reset when
 * `trackId` changes. Resetting inside the effect would be a second render pass
 * per track; comparing against the current id derives the same "start fresh"
 * behaviour during the existing one. The `cancelled` flag stops a slow read
 * from a previous track overwriting the current one.
 */
export function useTrackLike(trackId: string | undefined, initialCount = 0): TrackLike {
  const { t } = useTranslation('programs');
  const [state, setState] = useState<LikeState>({ trackId: undefined, liked: false, likeCount: 0 });
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!trackId) return;
    let cancelled = false;

    api.checkLiked(trackId)
      .then((r) => {
        if (cancelled) return;
        setState({ trackId, liked: r.liked, likeCount: initialCount });
      })
      .catch(() => {
        // A failed check is not worth surfacing: the heart still works, it just
        // starts from the unliked state.
        if (cancelled) return;
        setState({ trackId, liked: false, likeCount: initialCount });
      });

    return () => {
      cancelled = true;
    };
  }, [trackId, initialCount]);

  // Until the read for this track lands, show the server-provided count and an
  // unliked heart rather than the previous track's answer.
  const settled = state.trackId === trackId;
  const liked = settled ? state.liked : false;
  const likeCount = settled ? state.likeCount : initialCount;

  const toggle = useCallback(() => {
    if (!trackId || pending) return;
    setPending(true);

    api.toggleLike(trackId)
      .then((res) => {
        setState((prev) => {
          const base = prev.trackId === trackId ? prev.likeCount : initialCount;
          return {
            trackId,
            liked: res.liked,
            likeCount: res.liked ? base + 1 : Math.max(0, base - 1),
          };
        });
      })
      .catch(() => {
        // The count is deliberately left untouched on failure so it stays
        // consistent with the heart, rather than drifting apart optimistically.
        toast.error(t('like.failed'));
      })
      .finally(() => setPending(false));
  }, [trackId, pending, initialCount, t]);

  return { liked, likeCount, pending, toggle };
}