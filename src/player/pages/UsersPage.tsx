import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { usePlayerAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Plus, Trash2, X, Loader2, Shield, ShieldCheck, KeyRound, Eye, EyeOff } from 'lucide-react';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'super_admin' | 'admin';
  created_at: string;
}

export default function UsersPage() {
  const { isSuperAdmin, user: currentUser } = usePlayerAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'admin' });
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } finally { setLoading(false); }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.createUser(form);
      setShowCreate(false);
      setForm({ username: '', email: '', password: '', role: 'admin' });
      loadUsers();
      toast.success('User created');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create user');
    } finally { setCreating(false); }
  };

  const deleteUser = async (id: string) => {
    toast.warning('Delete this user?', {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await api.deleteUser(id);
            loadUsers();
            toast.success('User deleted');
          } catch (err: any) {
            toast.error(err.message || 'Failed to delete');
          }
        },
      },
      cancel: { label: 'Cancel', onClick: () => {} },
    });
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser || !newPassword) return;
    setResetting(true);
    try {
      await api.updatePassword(resetUser.id, newPassword);
      setResetUser(null);
      setNewPassword('');
      toast.success('Password updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally { setResetting(false); }
  };

  if (!isSuperAdmin) {
    return (
      <div className="text-center py-20">
        <Shield size={48} className="dark:text-dark-400 text-dark-500 mx-auto mb-3" />
        <p className="dark:text-dark-200 text-dark-600">Super Admin access required</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="dark:text-white text-dark-900 text-2xl font-bold">Users</h1>
          <p className="text-sm dark:text-dark-200 text-dark-600 mt-1">Manage admin accounts</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-primary-600/20">
          <Plus size={16} /> New User
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-primary-400" /></div>
      ) : (
        <div className="glass-panel rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-white/5 border-dark-300">
                <th className="text-left text-xs font-medium dark:text-dark-200 text-dark-600 uppercase tracking-wider px-6 py-4">User</th>
                <th className="text-left text-xs font-medium dark:text-dark-200 text-dark-600 uppercase tracking-wider px-6 py-4">Email</th>
                <th className="text-left text-xs font-medium dark:text-dark-200 text-dark-600 uppercase tracking-wider px-6 py-4">Role</th>
                <th className="text-right text-xs font-medium dark:text-dark-200 text-dark-600 uppercase tracking-wider px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b dark:border-white/5 border-dark-300 last:border-0 dark:hover:bg-dark-500/30 hover:bg-light-300/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 text-sm font-bold">
                        {u.username[0].toUpperCase()}
                      </div>
                      <span className="dark:text-white text-dark-900 text-sm font-medium">{u.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm dark:text-dark-200 text-dark-600">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${u.role === 'super_admin' ? 'bg-purple-500/15 text-purple-400' : 'bg-primary-500/15 text-primary-400'}`}>
                      {u.role === 'super_admin' ? <ShieldCheck size={12} /> : <Shield size={12} />}
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {u.id !== currentUser?.id && u.role === 'admin' && (
                        <button onClick={() => { setResetUser(u); setNewPassword(''); setShowPassword(false); }}
                          className="p-1.5 rounded dark:text-dark-300 text-dark-500 hover:text-primary-400 hover:bg-primary-500/10 transition-all" title="Reset Password">
                          <KeyRound size={14} />
                        </button>
                      )}
                      {u.id !== currentUser?.id && (
                        <button onClick={() => deleteUser(u.id)} className="p-1.5 rounded dark:text-dark-300 text-dark-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="glass-panel rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="dark:text-white text-dark-900 text-lg font-bold">New User</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded dark:hover:bg-dark-500 hover:bg-light-300 dark:text-dark-200 text-dark-600"><X size={18} /></button>
            </div>
            <form onSubmit={createUser}>
              <div className="mb-4">
                <label className="block text-xs font-medium dark:text-dark-100 text-dark-700 mb-1.5">Username</label>
                <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full px-4 py-3 dark:bg-dark-600 bg-white border dark:border-white/5 border-dark-300 rounded-lg dark:text-white text-dark-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600" required />
              </div>
              <div className="mb-4">
                <label className="block text-xs font-medium dark:text-dark-100 text-dark-700 mb-1.5">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 dark:bg-dark-600 bg-white border dark:border-white/5 border-dark-300 rounded-lg dark:text-white text-dark-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600" required />
              </div>
              <div className="mb-4">
                <label className="block text-xs font-medium dark:text-dark-100 text-dark-700 mb-1.5">Password</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 dark:bg-dark-600 bg-white border dark:border-white/5 border-dark-300 rounded-lg dark:text-white text-dark-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600" required />
              </div>
              <div className="mb-6">
                <label className="block text-xs font-medium dark:text-dark-100 text-dark-700 mb-1.5">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-4 py-3 dark:bg-dark-600 bg-white border dark:border-white/5 border-dark-300 rounded-lg dark:text-white text-dark-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600">
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <button type="submit" disabled={creating} className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2">
                {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                {creating ? 'Creating...' : 'Create User'}
              </button>
            </form>
          </div>
        </div>
      )}

      {resetUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setResetUser(null)}>
          <div className="glass-panel rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-600/15 flex items-center justify-center">
                  <KeyRound size={18} className="text-primary-400" />
                </div>
                <div>
                  <h2 className="dark:text-white text-dark-900 text-lg font-bold">Reset Password</h2>
                  <p className="text-xs dark:text-dark-200 text-dark-600">for {resetUser.username}</p>
                </div>
              </div>
              <button onClick={() => setResetUser(null)} className="p-1 rounded dark:hover:bg-dark-500 hover:bg-light-300 dark:text-dark-200 text-dark-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleResetPassword}>
              <div className="mb-6">
                <label className="block text-xs font-medium dark:text-dark-100 text-dark-700 mb-1.5">New Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6}
                    placeholder="Enter new password (min 6 characters)"
                    className="w-full px-4 py-3 pr-12 dark:bg-dark-600 bg-white border dark:border-white/5 border-dark-300 rounded-lg dark:text-white text-dark-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 dark:text-dark-300 text-dark-500 hover:text-primary-400 transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={resetting || newPassword.length < 6} className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2">
                {resetting ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                {resetting ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
