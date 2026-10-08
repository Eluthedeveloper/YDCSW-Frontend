import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'light', toggle: () => {} });

const STORAGE_KEY = 'player_theme';

/**
 * Reads the stored theme, tolerating storage being unavailable.
 *
 * `localStorage` throws a SecurityError when cookies and site data are blocked —
 * Safari Private Browsing, "block all cookies", some enterprise policies. This
 * read runs in a useState initializer inside PlayerThemeProvider, which wraps
 * the entire app, so an uncaught throw here was caught by the root ErrorBoundary
 * and took down every page including the public portfolio. The site merely
 * forgets the preference instead.
 */
function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'dark' || stored === 'light' ? stored : 'light';
  } catch {
    return 'light';
  }
}

function persistTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Non-fatal: the theme still applies for this session via the class below.
  }
}

export function PlayerThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readStoredTheme);

  useEffect(() => {
    persistTheme(theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  // The provider is mounted for the life of the app, but a stray unmount would
  // otherwise leave the `dark` class on <html> with no provider to remove it.
  useEffect(() => {
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, []);

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const usePlayerTheme = () => useContext(ThemeContext);