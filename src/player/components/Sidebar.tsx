import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerAuth } from '../context/AuthContext';
import { LogOut, Users, Music, FolderOpen, ChevronDown, BarChart3, Headphones, ExternalLink, MessageCircle, UserCog, Menu } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const { user, logout } = usePlayerAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { id: 'programs', label: 'Programs', icon: FolderOpen },
    { id: 'player', label: 'Player', icon: Music },
    { id: 'comments', label: 'Comments', icon: MessageCircle },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    ...(user?.role === 'super_admin' ? [
      { id: 'users', label: 'Users', icon: Users },
      { id: 'account', label: 'Account', icon: UserCog },
    ] : []),
  ];

  const handleNavigate = (id: string) => {
    onNavigate(id);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <>
      <div className="p-4 flex items-center justify-between border-b dark:border-white/5 border-dark-300">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-lg object-contain shadow-lg shadow-primary-600/25" />
            <span className="font-bold dark:text-white text-dark-900 gradient-text text-sm">Yemisrach Dimts</span>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg dark:hover:bg-dark-500 hover:bg-light-300 transition-colors hidden md:block">
          <ChevronDown size={16} className={`dark:text-dark-200 text-dark-600 transition-transform ${collapsed ? '-rotate-90' : 'rotate-90'}`} />
        </button>
      </div>

      <nav className="p-2 mt-2 flex-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all ${
              activePage === item.id
                ? 'bg-primary-600/15 text-primary-400'
                : 'dark:text-dark-200 text-dark-600 dark:hover:bg-dark-500 hover:bg-light-300 dark:hover:text-white hover:text-dark-900'
            } ${collapsed ? 'justify-center' : ''}`}
          >
            <item.icon size={18} />
            {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className={`p-3 border-t dark:border-white/5 border-dark-300 pb-24 ${collapsed ? 'hidden' : ''}`}>
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 text-sm font-bold">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium dark:text-white text-dark-900 truncate">{user?.username}</p>
              <p className="text-[10px] dark:text-dark-200 text-dark-600 uppercase">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
        <button onClick={() => { logout(); navigate('/'); }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg dark:text-dark-200 text-dark-600 hover:bg-red-500/10 hover:text-red-400 transition-all text-sm">
          <LogOut size={16} />
          <span>Logout</span>
        </button>
        <button onClick={() => { navigate('/programs'); setMobileOpen(false); }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg dark:text-dark-200 text-dark-600 hover:bg-primary-500/10 hover:text-primary-400 transition-all text-sm mt-1">
          <Headphones size={16} />
          <span>Public Page</span>
          <ExternalLink size={10} className="ml-auto" />
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg glass-panel border dark:border-white/5 border-dark-300 md:hidden">
        <Menu size={20} className="dark:text-white text-dark-900" />
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Desktop sidebar - always visible */}
      <aside className={`hidden md:flex fixed left-0 top-0 h-full glass-panel border-r dark:border-white/5 border-dark-300 z-40 transition-all duration-300 flex-col ${collapsed ? 'w-16' : 'w-64'}`}>
        {sidebarContent}
      </aside>

      {/* Mobile sidebar - drawer */}
      <aside className={`fixed left-0 top-0 h-full glass-panel border-r dark:border-white/5 border-dark-300 z-50 transition-transform duration-300 flex flex-col w-64 md:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </aside>
    </>
  );
}
