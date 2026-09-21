import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../utils/api';
import CoverBg from '../components/CoverBg';
import { Music, Heart, MessageCircle, Clock } from 'lucide-react';

export default function PublicProgramsPage() {
  const { t } = useTranslation('programs');
  const navigate = useNavigate();
  const onViewProgram = (id: string) => navigate(`/programs/${id}`);
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.getPublicPrograms().then(setPrograms).finally(() => setLoading(false)); }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold dark:text-white text-dark-900 mb-2">{t('programs.title')}</h1>
        <p className="dark:text-dark-200 text-dark-600">{t('programs.subtitle')}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => <div key={i} className="glass-panel rounded-2xl h-72 animate-pulse" />)}
        </div>
      ) : programs.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-2xl">
          <Music size={56} className="dark:text-dark-400 text-dark-500 mx-auto mb-4" />
          <p className="dark:text-dark-200 text-dark-600 text-lg">{t('programs.noPrograms')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {programs.map((p) => (
            <div key={p.id} onClick={() => onViewProgram(p.id)}
              className="glass-panel rounded-2xl overflow-hidden cursor-pointer group hover:border-primary-600/30 transition-all hover:shadow-lg hover:shadow-primary-600/5">
              <div className="h-44 dark:bg-dark-600 bg-light-200 flex items-center justify-center relative overflow-hidden">
                <CoverBg src={p.cover_image} fallbackSize={40} className="group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="absolute bottom-3 left-3 text-xs text-white/80 bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  {p.track_count} {t('programs.tracks')}
                </span>
              </div>
              <div className="p-5">
                <h3 className="font-bold dark:text-white text-dark-900 text-lg group-hover:text-primary-400 transition-colors truncate">{p.title}</h3>
                <p className="text-sm dark:text-dark-200 text-dark-600 mt-1 line-clamp-2">{p.description || t('programs.noDescription')}</p>
                <div className="flex items-center gap-4 mt-3 text-xs dark:text-dark-300 text-dark-500">
                  <span className="flex items-center gap-1"><Heart size={12} /> {p.like_count || 0}</span>
                  <span className="flex items-center gap-1"><MessageCircle size={12} /> {p.comment_count || 0}</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {new Date(p.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
