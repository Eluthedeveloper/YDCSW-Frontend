import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { MessageCircle, Search, FolderOpen } from 'lucide-react';

export default function CommentsPage() {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getAllComments().then(setComments).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = comments.filter((c) =>
    c.guest_name.toLowerCase().includes(search.toLowerCase()) ||
    c.content.toLowerCase().includes(search.toLowerCase()) ||
    c.program_title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold dark:text-white text-dark-900">Comments</h1>
        <p className="text-sm dark:text-dark-200 text-dark-600 mt-1">All comments from listeners across programs</p>
      </div>

      <div className="glass-panel rounded-xl p-4 mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-dark-400 text-dark-500" />
          <input type="text" placeholder="Search by name, content, or program..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 dark:bg-dark-600 bg-white dark:border-white/5 border-dark-300 rounded-lg dark:text-white text-dark-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-xl">
          <MessageCircle size={40} className="dark:text-dark-400 text-dark-500 mx-auto mb-3" />
          <p className="dark:text-dark-300 text-dark-500">{comments.length === 0 ? 'No comments yet' : 'No comments match your search'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div key={c.id} className="glass-panel rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 text-xs font-bold flex-shrink-0">
                  {c.guest_name[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium dark:text-white text-dark-900">{c.guest_name}</span>
                    <span className="text-[10px] dark:text-dark-300 text-dark-500">{new Date(c.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] dark:text-dark-400 text-dark-500">
                    <FolderOpen size={10} />
                    <span>{c.program_title}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm dark:text-dark-100 text-dark-700 ml-11">{c.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
