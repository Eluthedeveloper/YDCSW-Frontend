import { useState } from 'react';
import { Music } from 'lucide-react';
import { uploadUrl } from '../utils/api';

export default function CoverImg({
  src,
  size = 40,
  className = '',
  rounded = 'rounded-lg',
}: {
  src?: string | null;
  size?: number;
  className?: string;
  rounded?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center flex-shrink-0 ${rounded} ${className}`}
        style={{ width: size, height: size }}>
        <Music size={size > 32 ? 24 : 14} className="dark:text-dark-400 text-dark-500" />
      </div>
    );
  }

  return (
    <img
      src={uploadUrl(`covers/${src}`)}
      alt=""
      className={`object-cover flex-shrink-0 ${rounded} ${className}`}
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
}
