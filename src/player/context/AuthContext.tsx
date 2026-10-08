import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { api, ApiError } from '../utils/api';
import type { AuthUser } from '../utils/types';

interface AuthContextType {
  user: AuthUser | null;
  /** True until the initial session check finishes, so guards don't flash. */
  isChecking: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function PlayerAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  // The session lives in an httpOnly cookie, so the only way to know whether it
  // is still valid is to ask the server once on mount.
  useEffect(() => {
    let cancelled = false;
    api.getMe()
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // 401/403 just means "not signed in"; anything else is worth surfacing
        // in the console but must not block the public site.
        if (!(err instanceof ApiError) || (err.status !== 401 && err.status !== 403)) {
          console.warn('Session check failed:', err);
        }
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const { user: loggedIn } = await api.login({ username, password });
    setUser(loggedIn);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch (err) {
      // The cookie is cleared server-side; if that call failed the user must
      // still be dropped locally, otherwise a stale admin UI hangs around.
      console.warn('Logout request failed, clearing local session anyway:', err);
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isChecking, login, logout, isSuperAdmin: user?.role === 'super_admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const usePlayerAuth = () => useContext(AuthContext);
