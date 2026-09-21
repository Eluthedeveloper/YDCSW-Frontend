import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerAuth } from '../context/AuthContext';
import { Radio, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = usePlayerAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(username, password);
      navigate('/admin/player/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="glass-panel rounded-2xl p-8 shadow-2xl shadow-black/20">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-600/25">
              <Radio size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold dark:text-white text-dark-900 gradient-text">AudioStream</h1>
            <p className="text-sm dark:text-dark-200 text-dark-600 mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-medium dark:text-dark-100 text-dark-700 mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 dark:bg-dark-600 bg-white dark:border-white/5 border-dark-300 rounded-lg dark:text-white text-dark-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all placeholder:text-dark-300"
                placeholder="Enter username"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-xs font-medium dark:text-dark-100 text-dark-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 dark:bg-dark-600 bg-white dark:border-white/5 border-dark-300 rounded-lg dark:text-white text-dark-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all placeholder:text-dark-300"
                placeholder="Enter password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-600/25"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <a href="/" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">&larr; Back to Public Page</a>
          </div>

          {/* <div className="mt-4 p-4 rounded-lg dark:bg-dark-600/50 bg-light-200/50 dark:border-white/5 border-dark-300">
            <p className="text-xs dark:text-dark-200 text-dark-600 mb-2 font-medium">Demo Credentials:</p>
            <div className="space-y-1">
              <p className="text-xs dark:text-dark-100 text-dark-700"><span className="text-primary-400">Super Admin:</span> superadmin / superadmin123</p>
              <p className="text-xs dark:text-dark-100 text-dark-700"><span className="text-primary-400">Admin:</span> admin / admin123</p>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}
