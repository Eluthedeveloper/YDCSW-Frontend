import { useState } from 'react';
import { Music } from 'lucide-react';
import { uploadUrl } from '../utils/api';

export default function CoverBg({
  src,
  fallbackSize = 40,
  className = '',
}: {
  src?: string | null;
  fallbackSize?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <Music size={fallbackSize} className={`dark:text-dark-400 text-dark-500 ${className}`} />;
  }

  return (
    <img
      src={uploadUrl(`covers/${src}`)}
      alt=""
      className={`w-full h-full object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
