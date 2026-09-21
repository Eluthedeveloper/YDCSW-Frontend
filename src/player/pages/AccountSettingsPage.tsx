import { useState } from 'react';
import { api } from '../utils/api';
import { usePlayerAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { User, Mail, Lock, Save, Loader2, ShieldCheck } from 'lucide-react';

export default function AccountSettingsPage() {
  const { user, isSuperAdmin } = usePlayerAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isSuperAdmin) {
    return (
      <div className="text-center py-20">
        <ShieldCheck size={48} className="dark:text-dark-400 text-dark-500 mx-auto mb-3" />
        <p className="dark:text-dark-200 text-dark-600">Super Admin access required</p>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updates: { username?: string; email?: string; password?: string } = {};
      if (username !== user?.username) updates.username = username;
      if (email !== user?.email) updates.email = email;
      if (password) updates.password = password;

      if (Object.keys(updates).length === 0) {
        toast.info('No changes to save');
        setSaving(false);
        return;
      }

      const updated = await api.updateMe(updates);
      toast.success('Account updated successfully');
      setPassword('');
      if (updated.username) setUsername(updated.username);
      if (updated.email) setEmail(updated.email);
      if (updated.token) localStorage.setItem('token', updated.token);
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update account');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="dark:text-white text-dark-900 text-2xl font-bold">Account Settings</h1>
        <p className="text-sm dark:text-dark-200 text-dark-600 mt-1">Manage your super admin account</p>
      </div>

      <div className="glass-panel rounded-xl p-6 max-w-lg">
        <form onSubmit={handleSave}>
          <div className="mb-5">
            <label className="flex items-center gap-2 text-xs font-medium dark:text-dark-100 text-dark-700 mb-1.5">
              <User size={14} /> Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 dark:bg-dark-600 bg-white border dark:border-white/5 border-dark-300 rounded-lg dark:text-white text-dark-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
              required
            />
          </div>

          <div className="mb-5">
            <label className="flex items-center gap-2 text-xs font-medium dark:text-dark-100 text-dark-700 mb-1.5">
              <Mail size={14} /> Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 dark:bg-dark-600 bg-white border dark:border-white/5 border-dark-300 rounded-lg dark:text-white text-dark-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
              required
            />
          </div>

          <div className="mb-6">
            <label className="flex items-center gap-2 text-xs font-medium dark:text-dark-100 text-dark-700 mb-1.5">
              <Lock size={14} /> New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
              minLength={6}
              className="w-full px-4 py-3 dark:bg-dark-600 bg-white border dark:border-white/5 border-dark-300 rounded-lg dark:text-white text-dark-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 placeholder:text-dark-400"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-primary-600/20"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
