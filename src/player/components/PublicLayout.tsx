import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, FolderOpen, Music, Search, Menu, X, ArrowLeft } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import Footer from './Footer';

interface Props {
  children: ReactNode;
}

export default function PublicLayout({ children }: Props) {
  const { t } = useTranslation('programs');
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: '/programs', label: t('publicNav.home'), icon: Home },
    { id: '/programs/all', label: t('publicNav.programs'), icon: FolderOpen },
    { id: '/programs/latest', label: t('publicNav.latestTracks'), icon: Music },
    { id: '/programs/search', label: t('publicNav.search'), icon: Search },
  ];

  const isActive = (path: string) => {
    if (path === '/programs') return location.pathname === '/programs';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="glass-panel border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button onClick={() => navigate('/')}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium dark:text-dark-200 text-dark-600 hover:text-primary-400 dark:hover:bg-dark-500/50 hover:bg-light-300/50 transition-all border dark:border-white/10 border-dark-300">
              <ArrowLeft size={14} />
              {t('publicNav.homepage')}
            </button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/programs')}>
              <img src="/logo.png" alt="Logo" className="w-11 h-11 rounded-xl object-contain shadow-lg shadow-primary-600/25" />
              <span className="font-bold gradient-text text-lg">{t('publicNav.brand')}</span>
            </div>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <button key={item.id} onClick={() => navigate(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive(item.id)
                      ? 'bg-primary-600/15 text-primary-400'
                      : 'dark:text-dark-200 text-dark-600 dark:hover:text-white hover:text-dark-900 dark:hover:bg-dark-500/50 hover:bg-light-300/50'
                  }`}>
                  <item.icon size={15} />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={() => navigate('/admin/player')}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium dark:text-dark-200 text-dark-600 hover:text-primary-400 dark:hover:bg-dark-500/50 hover:bg-light-300/50 transition-all border dark:border-white/10 border-dark-300">
              {t('publicNav.admin')}
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 dark:text-dark-200 text-dark-600">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t p-3 space-y-1">
            <button onClick={() => { navigate('/'); setMobileOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium dark:text-dark-200 text-dark-600 dark:hover:bg-dark-500/50 hover:bg-light-300/50 border dark:border-white/10 border-dark-300">
              <ArrowLeft size={16} />
              {t('publicNav.homepage')}
            </button>
            {navItems.map((item) => (
              <button key={item.id} onClick={() => { navigate(item.id); setMobileOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive(item.id) ? 'bg-primary-600/15 text-primary-400' : 'dark:text-dark-200 text-dark-600 dark:hover:bg-dark-500/50 hover:bg-light-300/50'
                }`}>
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
            <button onClick={() => { navigate('/admin/player'); setMobileOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium dark:text-dark-200 text-dark-600 dark:hover:bg-dark-500/50 hover:bg-light-300/50">
              {t('publicNav.admin')}
            </button>
          </div>
        )}
      </header>
      <main className="max-w-7xl mx-auto px-6 py-6 pb-24">
        {children}
      </main>
      <Footer />
    </div>
  );
}
