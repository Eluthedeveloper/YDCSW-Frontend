import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../utils/api';
import CoverImg from '../components/CoverImg';
import { Play, Pause, Heart, Music } from 'lucide-react';
import { getFingerprint } from '../utils/fingerprint';

export default function PublicLatestTracksPage() {
  const { t } = useTranslation('programs');
  const { play, pause, resume, currentTrack, isPlaying } = usePlayer();
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.getLatestTracks().then(setTracks).finally(() => setLoading(false)); }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold dark:text-white text-dark-900 mb-2">{t('latestTracks.title')}</h1>
        <p className="dark:text-dark-200 text-dark-600">{t('latestTracks.subtitle')}</p>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3, 4, 5].map(i => <div key={i} className="glass-panel rounded-xl h-16 animate-pulse" />)}</div>
      ) : tracks.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-2xl">
          <Music size={56} className="dark:text-dark-400 text-dark-500 mx-auto mb-4" />
          <p className="dark:text-dark-200 text-dark-600 text-lg">{t('latestTracks.noTracks')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tracks.map((t, i) => (
            <TrackRow key={t.id} track={t} index={i + 1}
              isActive={currentTrack?.id === t.id}
              isPlaying={currentTrack?.id === t.id && isPlaying}
              onPlay={() => {
                if (currentTrack?.id === t.id && isPlaying) { pause(); }
                else if (currentTrack?.id === t.id && !isPlaying) { resume(); }
                else { play(t, tracks); }
              }} />
          ))}
        </div>
      )}
    </div>
  );
}

function TrackRow({ track, index, isActive, isPlaying, onPlay }: {
  track: any; index: number; isActive: boolean; isPlaying: boolean; onPlay: () => void;
}) {
  const { t } = useTranslation('programs');
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(track.like_count || 0);

  useEffect(() => {
    const fp = getFingerprint();
    api.checkLiked(track.id, fp).then((r: any) => setLiked(r.liked)).catch(() => {});
  }, [track.id]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const fp = getFingerprint();
    const res = await api.toggleLike(track.id, fp);
    setLiked(res.liked);
    setLikeCount((c: number) => res.liked ? c + 1 : Math.max(0, c - 1));
  };

  return (
    <div onClick={onPlay}
      className={`flex items-center gap-1.5 sm:gap-4 p-2 sm:p-3 rounded-xl cursor-pointer transition-all group ${
        isActive ? 'bg-primary-600/15 border border-primary-600/20' : 'dark:hover:bg-dark-500/50 hover:bg-light-300/50'
      }`}>
      <div className="w-5 sm:w-6 text-center text-[11px] sm:text-xs dark:text-dark-300 text-dark-500 flex-shrink-0">{index}</div>
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg dark:bg-dark-600 bg-light-200 flex items-center justify-center overflow-hidden flex-shrink-0">
        <CoverImg src={track.program_cover} size={40} rounded="rounded-lg" />
      </div>
      <button className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
        isActive && isPlaying ? 'bg-primary-600 text-white' : 'bg-primary-600/20 text-primary-400 group-hover:bg-primary-600 group-hover:text-white'
      }`}>
        {isActive && isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] sm:text-sm font-medium truncate ${isActive ? 'text-primary-400' : 'dark:text-white text-dark-900'}`}>{track.title}</p>
        <p className="text-[11px] sm:text-xs dark:text-dark-200 text-dark-600 truncate">{track.artist || t('latestTracks.unknown')} {track.program_title ? ` · ${track.program_title}` : ''}</p>
      </div>
      {track.track_type && (
        <span className="hidden sm:inline text-[10px] dark:text-dark-300 text-dark-500 uppercase dark:bg-dark-600 bg-light-200 px-2 py-0.5 rounded flex-shrink-0">{track.track_type}</span>
      )}
      <button onClick={handleLike}
        className={`p-1.5 sm:p-2 rounded-full transition-all flex-shrink-0 ${liked ? 'text-red-400 bg-red-500/15' : 'dark:text-dark-300 text-dark-500 hover:text-red-400 hover:bg-red-500/10'}`}>
        <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
      </button>
      <span className="text-[11px] sm:text-xs dark:text-dark-300 text-dark-500 w-5 sm:w-6 text-right flex-shrink-0">{likeCount}</span>
    </div>
  );
}
