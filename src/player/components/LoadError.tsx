import { useTranslation } from 'react-i18next';
import { AlertTriangle, RotateCw } from 'lucide-react';

interface Props {
  error: string | null;
  onRetry: () => void;
}

/**
 * Error state for a failed data load.
 *
 * Kept visually distinct from an empty result on purpose: the pages these
 * replace showed "no programs yet" on failure, which reads as a broken site
 * rather than an unreachable API.
 */
export default function LoadError({ error, onRetry }: Props) {
  const { t } = useTranslation('programs');

  return (
    <div
      role="alert"
      className="text-center py-16 px-6 glass-panel rounded-2xl"
    >
      <AlertTriangle size={44} className="text-amber-500 mx-auto mb-4" />
      <p className="dark:text-white text-dark-900 text-lg font-semibold">
        {t('loadError.title')}
      </p>
      {error && (
        <p className="dark:text-dark-300 text-dark-600 text-sm mt-2 max-w-md mx-auto break-words">
          {error}
        </p>
      )}
      <button
        onClick={onRetry}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary-600 hover:bg-primary-500 px-5 py-2.5 text-sm font-medium text-white transition"
      >
        <RotateCw size={15} />
        {t('loadError.retry')}
      </button>
    </div>
  );
}