import { Heart, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTrackLike } from '../hooks/useTrackLike';

interface Props {
  trackId: string;
  likeCount?: number;
  showCount?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  size?: number;
  /** `row` matches the track-list styling; `bar` the compact player styling. */
  variant?: 'row' | 'bar';
  className?: string;
}

/**
 * The like control, in one place so every list and the player behave the same.
 *
 * The button is labelled for screen readers, which the previous bare-icon
 * buttons were not, and reflects the in-flight request so a slow connection
 * cannot fire several toggles from one click.
 */
export default function LikeButton({
  trackId,
  likeCount = 0,
  showCount = true,
  onClick,
  size = 14,
  variant = 'row',
  className = '',
}: Props) {
  const { t } = useTranslation('programs');
  const { liked, likeCount: count, pending, toggle } = useTrackLike(trackId, likeCount);

  const handleClick = (e: React.MouseEvent) => {
    // The row itself is clickable and starts playback.
    e.stopPropagation();
    onClick?.(e);
    toggle();
  };

  const color = liked
    ? 'text-red-400 bg-red-500/15'
    : variant === 'bar'
      ? 'text-white/40 hover:text-white'
      : 'dark:text-dark-300 text-dark-500 hover:text-red-400 hover:bg-red-500/10';

  return (
    <div className={`flex items-center gap-1.5 flex-shrink-0 ${className}`}>
      <button
        onClick={handleClick}
        disabled={pending}
        aria-pressed={liked}
        aria-label={liked ? t('like.labelActive') : t('like.label')}
        className={`p-1.5 sm:p-2 rounded-full transition-all disabled:opacity-60 ${color}`}
      >
        {pending ? (
          <Loader2 size={size} className="animate-spin" />
        ) : (
          <Heart size={size} fill={liked ? 'currentColor' : 'none'} />
        )}
      </button>
      {showCount && (
        <span className="text-[11px] sm:text-xs dark:text-dark-300 text-dark-500 w-5 sm:w-6 text-right">
          {count}
        </span>
      )}
    </div>
  );
}
