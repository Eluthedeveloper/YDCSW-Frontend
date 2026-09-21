import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../utils/api';
import CoverBg from '../components/CoverBg';
import CoverImg from '../components/CoverImg';
import { Play, Pause, Music, TrendingUp, Headphones } from 'lucide-react';

export default function PublicHomePage() {
  const { t } = useTranslation('programs');
  const navigate = useNavigate();
  const onViewProgram = (id: string) => navigate(`/programs/${id}`);
  const { play, pause, resume, currentTrack, isPlaying } = usePlayer();
  const [programs, setPrograms] = useState<any[]>([]);
  const [latestTracks, setLatestTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getPublicPrograms(), api.getLatestTracks()])
      .then(([p, t]) => { setPrograms(p); setLatestTracks(t); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="glass-panel rounded-2xl h-72 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold dark:text-white text-dark-900 mb-3">
          {t('home.welcome')} <span className="gradient-text">{t('home.brand')}</span>
        </h1>
        <p className="dark:text-dark-200 text-dark-600 text-lg max-w-xl mx-auto">
        {t('home.description')}
        </p>
      </div>

      <section className="mb-10">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp size={18} className="text-primary-400" />
          <h2 className="text-xl font-bold dark:text-white text-dark-900">{t('home.featuredPrograms')}</h2>
        </div>
        {programs.length === 0 ? (
          <div className="text-center py-16 glass-panel rounded-2xl">
            <Headphones size={48} className="dark:text-dark-400 text-dark-500 mx-auto mb-3" />
            <p className="dark:text-dark-200 text-dark-600">{t('home.noPrograms')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {programs.slice(0, 6).map((p) => (
              <div key={p.id} onClick={() => onViewProgram(p.id)}
                className="glass-panel rounded-2xl overflow-hidden cursor-pointer group hover:border-primary-600/30 transition-all hover:shadow-lg hover:shadow-primary-600/5">
                <div className="h-44 dark:bg-dark-600 bg-light-200 flex items-center justify-center relative overflow-hidden">
                  <CoverBg src={p.cover_image} fallbackSize={40} className="group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="p-5">
                  <h3 className="font-bold dark:text-white text-dark-900 group-hover:text-primary-400 transition-colors truncate">{p.title}</h3>
                  <p className="text-sm dark:text-dark-200 text-dark-600 mt-1 line-clamp-2">{p.description || t('home.noDescription')}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs dark:text-dark-300 text-dark-500">
                    <span>{p.track_count} {t('home.tracks')}</span>
                    <span>{p.like_count || 0} {t('home.likes')}</span>
                    <span>{p.comment_count || 0} {t('home.comments')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-5">
          <Music size={18} className="text-purple-400" />
          <h2 className="text-xl font-bold dark:text-white text-dark-900">{t('home.latestTracks')}</h2>
        </div>
        {latestTracks.length === 0 ? (
          <div className="text-center py-12 glass-panel rounded-2xl">
            <p className="dark:text-dark-300 text-dark-500">{t('home.noTracks')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {latestTracks.slice(0, 10).map((track, i) => (
              <div key={track.id}
                onClick={() => {
                  if (currentTrack?.id === track.id && isPlaying) { pause(); }
                  else if (currentTrack?.id === track.id && !isPlaying) { resume(); }
                  else { play(track, latestTracks); }
                }}
                className={`flex items-center gap-1.5 sm:gap-4 p-2 sm:p-3 rounded-xl cursor-pointer transition-all group ${
                  currentTrack?.id === track.id ? 'bg-primary-600/15 border border-primary-600/20' : 'dark:hover:bg-dark-500/50 hover:bg-light-300/50'
                }`}>
                <div className="w-5 sm:w-6 text-center text-[11px] sm:text-xs dark:text-dark-300 text-dark-500 flex-shrink-0">{i + 1}</div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg dark:bg-dark-600 bg-light-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                  <CoverImg src={track.program_cover} size={40} rounded="rounded-lg" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] sm:text-sm font-medium truncate ${currentTrack?.id === track.id ? 'text-primary-400' : 'dark:text-white text-dark-900'}`}>{track.title}</p>
                  <p className="text-[11px] sm:text-xs dark:text-dark-200 text-dark-600 truncate">{track.artist || t('home.unknown')} {track.program_title ? ` · ${track.program_title}` : ''}</p>
                </div>
                <span className="hidden sm:inline text-[10px] dark:text-dark-300 text-dark-500 uppercase dark:bg-dark-600 bg-light-200 px-2 py-0.5 rounded flex-shrink-0">{track.track_type}</span>
                <button className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                  currentTrack?.id === track.id && isPlaying ? 'bg-primary-600 text-white' : 'bg-primary-600/20 text-primary-400 opacity-0 group-hover:opacity-100'
                }`}>
                  {currentTrack?.id === track.id && isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
