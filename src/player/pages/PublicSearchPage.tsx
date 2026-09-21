import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../utils/api';
import CoverImg from '../components/CoverImg';
import { Play, Pause, Heart, Music, Search as SearchIcon, X } from 'lucide-react';
import { getFingerprint } from '../utils/fingerprint';

export default function PublicSearchPage() {
  const { t } = useTranslation('programs');
  const navigate = useNavigate();
  const onViewProgram = (id: string) => navigate(`/programs/${id}`);
  const { play, pause, resume, currentTrack, isPlaying } = usePlayer();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ programs: any[]; tracks: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    clearTimeout(timerRef.current ?? undefined);
    timerRef.current = setTimeout(async () => {
      try {
        const data = await api.search(query.trim());
        setResults(data);
      } finally { setLoading(false); }
    }, 350);
    return () => clearTimeout(timerRef.current ?? undefined);
  }, [query]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold dark:text-white text-dark-900 mb-4">{t('search.title')}</h1>
        <div className="relative max-w-2xl">
          <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 dark:text-dark-300 text-dark-500" />
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            className="w-full pl-11 pr-10 py-3.5 dark:bg-dark-600 bg-white border dark:border-white/5 border-dark-300 rounded-xl dark:text-white text-dark-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent placeholder:text-dark-300" />
          {query && (
            <button type="button" onClick={() => { setQuery(''); setResults(null); setSearched(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 dark:text-dark-300 text-dark-500 dark:hover:text-white hover:text-dark-900">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="glass-panel rounded-xl h-16 animate-pulse" />)}</div>
      ) : results ? (
        <div>
          {results.programs.length === 0 && results.tracks.length === 0 ? (
            <div className="text-center py-16 glass-panel rounded-2xl">
              <Music size={48} className="dark:text-dark-400 text-dark-500 mx-auto mb-3" />
              <p className="dark:text-dark-200 text-dark-600 text-lg">{t('search.noResults')} "{query}"</p>
              <p className="dark:text-dark-300 text-dark-500 text-sm mt-1">{t('search.tryDifferent')}</p>
            </div>
          ) : (
            <>
              {results.programs.length > 0 && (
                <section className="mb-8">
                  <h2 className="text-sm font-semibold dark:text-dark-100 text-dark-700 uppercase tracking-wider mb-3">{t('search.programs')} ({results.programs.length})</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.programs.map((p) => (
                      <div key={p.id} onClick={() => onViewProgram(p.id)}
                        className="glass-panel rounded-xl p-4 cursor-pointer hover:border-primary-600/30 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg dark:bg-dark-600 bg-light-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                            <CoverImg src={p.cover_image} size={48} rounded="rounded-lg" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold dark:text-white text-dark-900 truncate">{p.title}</p>
                            <p className="text-xs dark:text-dark-200 text-dark-600 truncate">{p.track_count} {t('search.tracksSuffix')}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {results.tracks.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold dark:text-dark-100 text-dark-700 uppercase tracking-wider mb-3">{t('search.tracks')} ({results.tracks.length})</h2>
                  <div className="space-y-2">
                    {results.tracks.map((t, i) => (
                      <TrackRow key={t.id} track={t} index={i + 1}
                        isActive={currentTrack?.id === t.id}
                        isPlaying={currentTrack?.id === t.id && isPlaying}
                        onPlay={() => {
                          if (currentTrack?.id === t.id && isPlaying) { pause(); }
                          else if (currentTrack?.id === t.id && !isPlaying) { resume(); }
                          else { play(t, results.tracks); }
                        }} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      ) : searched ? null : (
        <div className="text-center py-16 glass-panel rounded-2xl">
          <SearchIcon size={48} className="dark:text-dark-400 text-dark-500 mx-auto mb-3" />
          <p className="dark:text-dark-200 text-dark-600 text-lg">{t('search.startTyping')}</p>
          <p className="dark:text-dark-300 text-dark-500 text-sm mt-1">{t('search.searchHint')}</p>
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
      <button className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
        isActive && isPlaying ? 'bg-primary-600 text-white' : 'bg-primary-600/20 text-primary-400 group-hover:bg-primary-600 group-hover:text-white'
      }`}>
        {isActive && isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] sm:text-sm font-medium truncate ${isActive ? 'dark:text-primary-400 text-primary-600' : 'dark:text-white text-dark-900'}`}>{track.title}</p>
        <p className="text-[11px] sm:text-xs dark:text-dark-200 text-dark-600 truncate">{track.artist || t('search.unknown')} {track.program_title ? ` · ${track.program_title}` : ''}</p>
      </div>
      <button onClick={handleLike}
        className={`p-1.5 sm:p-2 rounded-full transition-all flex-shrink-0 ${liked ? 'text-red-400 bg-red-500/15' : 'dark:text-dark-300 text-dark-500 hover:text-red-400 hover:bg-red-500/10'}`}>
        <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
      </button>
      <span className="text-[11px] sm:text-xs dark:text-dark-300 text-dark-500 w-5 sm:w-6 text-right flex-shrink-0">{likeCount}</span>
    </div>
  );
}
