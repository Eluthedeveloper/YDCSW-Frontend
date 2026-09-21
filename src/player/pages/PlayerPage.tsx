import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../utils/api';
import CoverBg from '../components/CoverBg';
import { Play, Pause, Music } from 'lucide-react';
import WaveSpectrum from '../components/WaveSpectrum';

interface Program {
  id: string;
  title: string;
  description: string;
  cover_image: string | null;
  track_count: number;
}

export default function PlayerPage() {
  const { play, currentTrack, isPlaying, pause, resume } = usePlayer();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const { t } = useTranslation('programs');

  useEffect(() => { api.getPrograms().then(setPrograms).catch(console.error); }, []);

  const loadTracks = async (programId: string) => {
    setSelectedProgram(programId);
    const data = await api.getTracks(programId);
    setTracks(data);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold dark:text-white text-dark-900">{t('player.title')}</h1>
        <p className="text-sm dark:text-dark-200 text-dark-600 mt-1">{t('player.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <h2 className="text-sm font-semibold dark:text-dark-100 text-dark-700 uppercase tracking-wider mb-3">{t('player.programs')}</h2>
          <div className="space-y-2">
            {programs.map((p) => (
              <button key={p.id} onClick={() => loadTracks(p.id)}
                className={`w-full text-left p-3 rounded-xl transition-all ${selectedProgram === p.id ? 'bg-primary-600/15 border border-primary-600/30' : 'glass-panel dark:hover:border-white/10 hover:border-dark-300'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg dark:bg-dark-500 bg-light-300 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <CoverBg src={p.cover_image} fallbackSize={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium dark:text-white text-dark-900 truncate">{p.title}</p>
                    <p className="text-xs dark:text-dark-300 text-dark-500">{p.track_count} {t('player.tracks')}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="glass-panel rounded-2xl overflow-hidden mb-6">
            <div className="h-48 relative">
              <WaveSpectrum />
              {currentTrack && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-lg font-bold dark:text-white text-dark-900">{currentTrack.title}</p>
                    <p className="text-sm dark:text-dark-200 text-dark-600">{currentTrack.artist || t('player.unknownArtist')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <h2 className="text-sm font-semibold dark:text-dark-100 text-dark-700 uppercase tracking-wider mb-3">
            {selectedProgram ? t('player.tracks') : t('player.selectProgram')}
          </h2>

          {tracks.length > 0 ? (
            <div className="space-y-1">
              {tracks.map((t, i) => (
                <div key={t.id}
                  className={`flex items-center gap-1.5 sm:gap-4 p-2 sm:p-3 rounded-xl transition-all cursor-pointer ${currentTrack?.id === t.id ? 'bg-primary-600/15 border border-primary-600/20' : 'dark:hover:bg-dark-500/50 hover:bg-light-300/50'}`}
                  onClick={() => play(t, tracks)}>
                  <div className="w-6 sm:w-8 text-center text-[11px] sm:text-xs dark:text-dark-300 text-dark-500 flex-shrink-0">{i + 1}</div>
                  <button onClick={(e) => {
                      e.stopPropagation();
                      if (currentTrack?.id === t.id && isPlaying) pause();
                      else if (currentTrack?.id === t.id && !isPlaying) resume();
                      else play(t, tracks);
                    }}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 hover:bg-primary-600 hover:text-white transition-all flex-shrink-0">
                    {currentTrack?.id === t.id && isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] sm:text-sm font-medium truncate ${currentTrack?.id === t.id ? 'text-primary-400' : 'dark:text-white text-dark-900'}`}>{t.title}</p>
                    <p className="text-[11px] sm:text-xs dark:text-dark-200 text-dark-600 truncate">{t.artist || 'Unknown'}</p>
                  </div>
                  <span className="hidden sm:inline text-[10px] dark:text-dark-300 text-dark-500 uppercase dark:bg-dark-600 bg-light-200 px-2 py-0.5 rounded flex-shrink-0">{t.track_type}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 glass-panel rounded-xl">
              <Music size={40} className="dark:text-dark-400 text-dark-500 mx-auto mb-3" />
              <p className="dark:text-dark-300 text-dark-500 text-sm">{t('player.noTracks')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
