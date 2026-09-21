import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePlayer } from '../context/PlayerContext';
import { uploadUrl } from '../utils/api';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Music, ChevronDown, ChevronUp, Heart, Shuffle, Repeat, Loader2, X } from 'lucide-react';
import WaveSpectrum from './WaveSpectrum';

function formatTime(s: number) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function DraggableProgress({
  progress,
  duration,
  onSeek,
  onSeekStart,
  onSeekEnd,
  height = 'h-1',
  thumbSize = 'w-3 h-3',
  showThumb = true,
  className = '',
}: {
  progress: number;
  duration: number;
  onSeek: (time: number) => void;
  onSeekStart: () => void;
  onSeekEnd: () => void;
  height?: string;
  thumbSize?: string;
  showThumb?: boolean;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [dragPercent, setDragPercent] = useState<number | null>(null);
  const rafRef = useRef<number>(0);
  const pendingSeekRef = useRef<number>(0);
  const durationRef = useRef(duration);
  durationRef.current = duration;
  const onSeekRef = useRef(onSeek);
  onSeekRef.current = onSeek;

  const getPercent = useCallback((clientX: number) => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }, []);

  const handleDown = useCallback((clientX: number) => {
    dragging.current = true;
    onSeekStart();
    const pct = getPercent(clientX);
    setDragPercent(pct * 100);
    pendingSeekRef.current = pct * duration;
    onSeek(pct * duration);
    document.body.style.userSelect = 'none';
  }, [getPercent, duration, onSeek, onSeekStart]);

  const handleMove = useCallback((clientX: number) => {
    if (!dragging.current) return;
    const pct = getPercent(clientX);
    setDragPercent(pct * 100);
    pendingSeekRef.current = pct * durationRef.current;
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        if (dragging.current) {
          onSeekRef.current(pendingSeekRef.current);
        }
      });
    }
  }, [getPercent]);

  const handleUp = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    onSeekRef.current(pendingSeekRef.current);
    setDragPercent(null);
    onSeekEnd();
    document.body.style.userSelect = '';
  }, [onSeekEnd]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onMouseUp = () => handleUp();
    const onTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);
    const onTouchEnd = () => handleUp();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [handleMove, handleUp]);

  const percent = dragPercent !== null ? dragPercent : (duration > 0 ? (progress / duration) * 100 : 0);

  return (
    <div
      ref={trackRef}
      className={`relative cursor-pointer group ${className}`}
      onMouseDown={(e) => handleDown(e.clientX)}
      onTouchStart={(e) => handleDown(e.touches[0].clientX)}
    >
      <div className={`${height} dark:bg-dark-400 bg-light-300 rounded-full overflow-hidden`}>
        <div
          className={`h-full bg-primary-500 rounded-full group-hover:bg-primary-400 ${dragPercent !== null ? 'transition-none' : 'transition-[width] duration-300 ease-out'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showThumb && (
        <div
          className={`absolute top-1/2 -translate-y-1/2 ${thumbSize} bg-white rounded-full shadow-md transition-opacity ${dragging.current ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          style={{ left: `calc(${percent}% - ${thumbSize.includes('3.5') ? '7px' : '6px'})` }}
        />
      )}
    </div>
  );
}

function DraggableVolume({
  value,
  onChange,
  className = '',
}: {
  value: number;
  onChange: (vol: number) => void;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [dragPercent, setDragPercent] = useState<number | null>(null);

  const getPercent = useCallback((clientX: number) => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }, []);

  const handleDown = useCallback((clientX: number) => {
    dragging.current = true;
    const pct = getPercent(clientX);
    setDragPercent(pct * 100);
    onChange(pct);
    document.body.style.userSelect = 'none';
  }, [getPercent, onChange]);

  const handleMove = useCallback((clientX: number) => {
    if (!dragging.current) return;
    const pct = getPercent(clientX);
    setDragPercent(pct * 100);
    onChange(pct);
  }, [getPercent, onChange]);

  const handleUp = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    setDragPercent(null);
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onMouseUp = () => handleUp();
    const onTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);
    const onTouchEnd = () => handleUp();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [handleMove, handleUp]);

  const percent = dragPercent !== null ? dragPercent : value * 100;

  return (
    <div
      ref={trackRef}
      className={`relative cursor-pointer group ${className}`}
      onMouseDown={(e) => handleDown(e.clientX)}
      onTouchStart={(e) => handleDown(e.touches[0].clientX)}
    >
      <div className="h-1 dark:bg-dark-400 bg-light-300 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-500 rounded-full transition-colors group-hover:bg-primary-400"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div
        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ left: `calc(${percent}% - 6px)` }}
      />
    </div>
  );
}

function CoverArt({ src, size, className = '' }: { src?: string; size: string; className?: string }) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      <div className={`${size} rounded-full overflow-hidden flex-shrink-0 ${className}`}>
        <img src={uploadUrl(`covers/${src}`)} alt="" className="w-full h-full object-cover" onError={() => setFailed(true)} />
      </div>
    );
  }
  return (
    <div className={`${size} rounded-full dark:bg-dark-600 bg-light-200 flex items-center justify-center flex-shrink-0 ${className}`}>
      <Music size={size.includes('[') ? 32 : 16} className="text-primary-400" />
    </div>
  );
}

export default function AudioPlayer() {
  const { currentTrack, isPlaying, isBuffering, volume, progress, duration, pause, resume, seek, startSeeking, endSeeking, setVolume, next, prev, close } = usePlayer();
  const { t } = useTranslation('programs');
  const [muted, setMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(0.8);
  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0);

  const touchStartY = useRef(0);
  const isDragging = useRef(false);

  const toggleMute = () => {
    if (muted) { setVolume(prevVolume); setMuted(false); }
    else { setPrevVolume(volume); setVolume(0); setMuted(true); }
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const diff = touchStartY.current - e.touches[0].clientY;
    if (diff > 80 && !expanded) {
      setExpanded(true);
      isDragging.current = false;
    } else if (diff < -80 && expanded) {
      setExpanded(false);
      isDragging.current = false;
    }
  }, [expanded]);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    if (expanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [expanded]);

  if (!currentTrack) {
    return null;
  }

  const coverSrc = (currentTrack as any).program_cover;

  return (
    <>
      {/* Mobile Full-Screen Player */}
      {expanded && (
        <div className="fixed inset-0 z-[100] md:hidden"
          style={{ background: coverSrc
            ? `linear-gradient(180deg, rgba(26,16,64,0.95) 0%, #0d0d12 100%)`
            : 'linear-gradient(180deg, #1a1040 0%, #0d0d12 100%)' }}>
          <div className="h-full flex flex-col px-6 pt-3 pb-8">
            <div className="flex items-center justify-center mb-4">
              <button onClick={() => setExpanded(false)}
                className="w-10 h-1 rounded-full bg-white/20 active:bg-white/40 transition-colors" />
            </div>

            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setExpanded(false)}
                className="p-2 -ml-2 rounded-full text-white/60 hover:text-white active:bg-white/10 transition-colors">
                <ChevronDown size={24} />
              </button>
              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">{t('audioPlayer.playingFrom')}</p>
                <p className="text-xs font-semibold text-white/80 truncate max-w-[200px]">{t('audioPlayer.program')}</p>
              </div>
              <button onClick={close}
                className="p-2 -mr-2 rounded-full text-white/60 hover:text-white active:bg-white/10 transition-colors">
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center mb-8">
              <div className="cover-fade-in">
                <CoverArt src={coverSrc} size="w-[280px] h-[280px]" />
              </div>
            </div>

            <div className="flex items-center justify-between mb-5">
              <div className="flex-1 min-w-0 mr-4">
                <h3 className="text-xl font-bold text-white truncate">{currentTrack.title}</h3>
                <p className="text-sm text-white/50 truncate flex items-center gap-1.5">
                  {currentTrack.artist || t('audioPlayer.unknownArtist')}
                  {isBuffering && <Loader2 size={12} className="animate-spin text-primary-400" />}
                </p>
              </div>
              <button onClick={() => setLiked(!liked)}
                className={`p-2 rounded-full transition-all ${liked ? 'text-red-400' : 'text-white/40 hover:text-white'}`}>
                <Heart size={22} fill={liked ? 'currentColor' : 'none'} />
              </button>
            </div>

            <div className="mb-4">
              <DraggableProgress
                progress={progress}
                duration={duration}
                onSeek={seek}
                onSeekStart={startSeeking}
                onSeekEnd={endSeeking}
                height="h-1.5"
                thumbSize="w-3.5 h-3.5"
              />
              <div className="flex justify-between mt-2">
                <span className="text-[11px] text-white/40 font-medium">{formatTime(progress)}</span>
                <span className="text-[11px] text-white/40 font-medium">{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setShuffled(!shuffled)}
                className={`p-2 rounded-full transition-all ${shuffled ? 'text-primary-400' : 'text-white/40 hover:text-white'}`}>
                <Shuffle size={20} />
              </button>
              <button onClick={prev}
                className="p-2 text-white hover:scale-105 active:scale-95 transition-transform">
                <SkipBack size={28} fill="currentColor" />
              </button>
              <button onClick={() => isPlaying ? pause() : resume()}
                className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-transform shadow-xl">
                {isBuffering ? <Loader2 size={30} className="animate-spin" /> : isPlaying ? <Pause size={30} fill="currentColor" /> : <Play size={30} fill="currentColor" className="ml-1" />}
              </button>
              <button onClick={next}
                className="p-2 text-white hover:scale-105 active:scale-95 transition-transform">
                <SkipForward size={28} fill="currentColor" />
              </button>
              <button onClick={() => setRepeatMode((repeatMode + 1) % 3)}
                className={`p-2 rounded-full transition-all ${repeatMode > 0 ? 'text-primary-400' : 'text-white/40 hover:text-white'}`}>
                <Repeat size={20} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={toggleMute} className="text-white/40 hover:text-white transition-colors">
                {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input type="range" min={0} max={1} step={0.01} value={muted ? 0 : volume}
                onChange={(e) => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
                className="flex-1 h-1 accent-white" />
            </div>
          </div>
        </div>
      )}

      {/* Desktop / Mobile Bottom Bar */}
      <div className={`fixed bottom-0 left-0 right-0 glass-panel border-t dark:border-white/5 border-dark-300 z-50 transition-all ${expanded ? 'md:block hidden' : ''}`}
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>

        <div className="absolute inset-x-0 bottom-full h-12 pointer-events-none overflow-hidden opacity-20">
          <WaveSpectrum />
        </div>

        {/* Mobile Mini Bar */}
        <div className="md:hidden" onClick={() => setExpanded(true)}>
          <div className="h-0.5 w-full dark:bg-dark-600 bg-light-300">
            <div className="h-full bg-primary-500 transition-all duration-300" style={{ width: `${duration > 0 ? (progress / duration) * 100 : 0}%` }} />
          </div>

          <div className="flex justify-center py-0.5">
            <ChevronUp size={14} className="dark:text-dark-400 text-dark-500" />
          </div>

          <div className="px-4 py-3 flex items-center gap-3">
            <CoverArt src={coverSrc} size="w-11 h-11" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold dark:text-white text-dark-900 truncate leading-tight">{currentTrack.title}</p>
              <p className="text-[11px] dark:text-dark-200 text-dark-600 truncate flex items-center gap-1">
                {currentTrack.artist || t('audioPlayer.unknownArtist')}
                {isBuffering && <Loader2 size={10} className="animate-spin text-primary-400" />}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={(e) => { e.stopPropagation(); prev(); }}
                className="p-2 dark:text-dark-200 text-dark-600 active:scale-90 transition-transform">
                <SkipBack size={18} fill="currentColor" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); isPlaying ? pause() : resume(); }}
                className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-600/30 active:scale-90 transition-transform">
                {isBuffering ? <Loader2 size={18} className="animate-spin" /> : isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
              </button>
              <button onClick={(e) => { e.stopPropagation(); next(); }}
                className="p-2 dark:text-dark-200 text-dark-600 active:scale-90 transition-transform">
                <SkipForward size={18} fill="currentColor" />
              </button>
              <div className="w-px h-5 dark:bg-white/10 bg-dark-300" />
              <button onClick={(e) => { e.stopPropagation(); close(); }}
                className="p-2 dark:text-dark-300 text-dark-500 dark:hover:text-red-400 hover:text-red-500 active:scale-90 transition-all">
                <X size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Bar */}
        <div className="hidden md:block max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-3 min-w-0 w-64">
              <CoverArt src={coverSrc} size="w-12 h-12" className="rounded-xl" />
              <div className="min-w-0">
                <p className="text-sm font-semibold dark:text-white text-dark-900 truncate">{currentTrack.title}</p>
                <p className="text-[11px] dark:text-dark-200 text-dark-600 truncate flex items-center gap-1">
                  {currentTrack.artist || t('audioPlayer.unknownArtist')}
                  {isBuffering && <Loader2 size={10} className="animate-spin text-primary-400" />}
                </p>
              </div>
              <button onClick={() => setLiked(!liked)}
                className={`p-1.5 rounded-full transition-all flex-shrink-0 ${liked ? 'text-red-400' : 'dark:text-dark-300 text-dark-500 hover:text-red-400'}`}>
                <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
              </button>
            </div>

            <div className="flex-1 max-w-xl">
              <div className="flex items-center justify-center gap-4 mb-1.5">
                <button onClick={() => setShuffled(!shuffled)}
                  className={`p-1.5 rounded-full transition-all ${shuffled ? 'text-primary-400' : 'dark:text-dark-300 text-dark-500 hover:text-primary-400'}`}>
                  <Shuffle size={15} />
                </button>
                <button onClick={prev}
                  className="p-1.5 rounded-full dark:text-dark-100 text-dark-700 dark:hover:text-white hover:text-dark-900 hover:scale-105 active:scale-95 transition-all">
                  <SkipBack size={18} fill="currentColor" />
                </button>
                <button onClick={() => isPlaying ? pause() : resume()}
                  className="w-9 h-9 rounded-full bg-primary-600 hover:bg-primary-700 flex items-center justify-center text-white shadow-lg shadow-primary-600/25 hover:scale-105 active:scale-95 transition-all">
                  {isBuffering ? <Loader2 size={16} className="animate-spin" /> : isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                </button>
                <button onClick={next}
                  className="p-1.5 rounded-full dark:text-dark-100 text-dark-700 dark:hover:text-white hover:text-dark-900 hover:scale-105 active:scale-95 transition-all">
                  <SkipForward size={18} fill="currentColor" />
                </button>
                <button onClick={() => setRepeatMode((repeatMode + 1) % 3)}
                  className={`p-1.5 rounded-full transition-all ${repeatMode > 0 ? 'text-primary-400' : 'dark:text-dark-300 text-dark-500 hover:text-primary-400'}`}>
                  <Repeat size={15} />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] dark:text-dark-300 text-dark-500 w-10 text-right font-medium tabular-nums">{formatTime(progress)}</span>
                <DraggableProgress
                  progress={progress}
                  duration={duration}
                  onSeek={seek}
                  onSeekStart={startSeeking}
                  onSeekEnd={endSeeking}
                  height="h-1"
                  className="flex-1"
                />
                <span className="text-[10px] dark:text-dark-300 text-dark-500 w-10 font-medium tabular-nums">{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-36">
              <button onClick={toggleMute} className="p-1.5 dark:text-dark-100 text-dark-700 dark:hover:text-white hover:text-dark-900 transition-colors">
                {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <DraggableVolume
                value={muted ? 0 : volume}
                onChange={(v) => { setVolume(v); setMuted(false); }}
                className="flex-1"
              />
            </div>
            <div className="w-px h-6 dark:bg-white/10 bg-dark-300 flex-shrink-0" />
            <button onClick={close}
              className="p-2 dark:text-dark-300 text-dark-500 dark:hover:text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all flex-shrink-0">
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
