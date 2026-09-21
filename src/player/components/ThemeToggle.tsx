import { usePlayerTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggle } = usePlayerTheme();

  return (
    <button onClick={toggle}
      className="p-2 rounded-lg hover:bg-dark-500/50 transition-colors"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
      {theme === 'dark' ? (
        <Sun size={18} className="text-yellow-400" />
      ) : (
        <Moon size={18} className="text-primary-600" />
      )}
    </button>
  );
}
