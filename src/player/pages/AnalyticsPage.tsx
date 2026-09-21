import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { BarChart3, Users, Music, FolderOpen, MessageCircle, Heart, TrendingUp, Headphones } from 'lucide-react';

interface AnalyticsData {
  totals: { programs: number; tracks: number; users: number; comments: number; likes: number; listens: number; listeners: number };
  programsByUser: any[];
  tracksByType: any[];
  tracksByProgram: any[];
  mostLikedTracks: any[];
  recentComments: any[];
  programsByMonth: any[];
  tracksByMonth: any[];
  listensByMonth: any[];
  listenersByMonth: any[];
  commentsByMonth: any[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAnalytics().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return <p className="dark:text-dark-200 text-dark-600 text-center py-20">Failed to load analytics</p>;

  const statCards = [
    { label: 'Programs', value: data.totals.programs, icon: FolderOpen, color: 'from-blue-500 to-blue-600' },
    { label: 'Tracks', value: data.totals.tracks, icon: Music, color: 'from-purple-500 to-purple-600' },
    { label: 'Total Listeners', value: data.totals.listeners, icon: Headphones, color: 'from-cyan-500 to-cyan-600' },
    { label: 'Total Comments', value: data.totals.comments, icon: MessageCircle, color: 'from-orange-500 to-orange-600' },
    { label: 'Total Likes', value: data.totals.likes, icon: Heart, color: 'from-red-500 to-red-600' },
  ];

  const maxProgramsByUser = Math.max(...data.programsByUser.map(p => p.count), 1);
  const maxTracksByProgram = Math.max(...data.tracksByProgram.map(p => p.count), 1);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold dark:text-white text-dark-900">Analytics</h1>
        <p className="text-sm dark:text-dark-200 text-dark-600 mt-1">Platform overview and statistics</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map((s) => (
          <div key={s.label} className="glass-panel rounded-xl p-4">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
              <s.icon size={18} className="text-white" />
            </div>
            <p className="text-2xl font-bold dark:text-white text-dark-900">{s.value}</p>
            <p className="text-xs dark:text-dark-200 text-dark-600 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-sm font-semibold dark:text-white text-dark-900 mb-4 flex items-center gap-2">
            <Users size={16} className="text-primary-400" /> Programs by User
          </h3>
          <div className="space-y-3">
            {data.programsByUser.map((u) => (
              <div key={u.username}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm dark:text-dark-100 text-dark-700">{u.username}</span>
                  <span className="text-xs dark:text-dark-300 text-dark-500">{u.count}</span>
                </div>
                <div className="h-2 dark:bg-dark-600 bg-light-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full transition-all"
                    style={{ width: `${(u.count / maxProgramsByUser) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-sm font-semibold dark:text-white text-dark-900 mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-purple-400" /> Tracks by Program
          </h3>
          <div className="space-y-3">
            {data.tracksByProgram.map((p) => (
              <div key={p.title}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm dark:text-dark-100 text-dark-700 truncate">{p.title}</span>
                  <span className="text-xs dark:text-dark-300 text-dark-500">{p.count}</span>
                </div>
                <div className="h-2 dark:bg-dark-600 bg-light-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all"
                    style={{ width: `${(p.count / maxTracksByProgram) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-sm font-semibold dark:text-white text-dark-900 mb-1 flex items-center gap-2">
            <Headphones size={16} className="text-cyan-400" /> Listeners by Month
          </h3>
          <p className="text-xs dark:text-dark-300 text-dark-500 mb-4">Total: <span className="font-semibold text-cyan-400">{data.totals.listeners}</span> unique listeners</p>
          {data.listenersByMonth.length === 0 ? (
            <p className="text-sm dark:text-dark-300 text-dark-500 text-center py-4">No listeners yet</p>
          ) : (
            <div className="space-y-3">
              {data.listenersByMonth.map((m) => {
                const maxCount = Math.max(...data.listenersByMonth.map((x: any) => x.count), 1);
                return (
                  <div key={m.month}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm dark:text-dark-100 text-dark-700">{m.month}</span>
                      <span className="text-xs dark:text-dark-300 text-dark-500">{m.count} listeners</span>
                    </div>
                    <div className="h-2 dark:bg-dark-600 bg-light-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all"
                        style={{ width: `${(m.count / maxCount) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-sm font-semibold dark:text-white text-dark-900 mb-1 flex items-center gap-2">
            <MessageCircle size={16} className="text-orange-400" /> Comments by Month
          </h3>
          <p className="text-xs dark:text-dark-300 text-dark-500 mb-4">Total: <span className="font-semibold text-orange-400">{data.totals.comments}</span> comments</p>
          {data.commentsByMonth.length === 0 ? (
            <p className="text-sm dark:text-dark-300 text-dark-500 text-center py-4">No comments yet</p>
          ) : (
            <div className="space-y-3">
              {data.commentsByMonth.map((m) => {
                const maxCount = Math.max(...data.commentsByMonth.map((x: any) => x.count), 1);
                return (
                  <div key={m.month}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm dark:text-dark-100 text-dark-700">{m.month}</span>
                      <span className="text-xs dark:text-dark-300 text-dark-500">{m.count} comments</span>
                    </div>
                    <div className="h-2 dark:bg-dark-600 bg-light-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all"
                        style={{ width: `${(m.count / maxCount) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-sm font-semibold dark:text-white text-dark-900 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-green-400" /> Tracks by Type
          </h3>
          <div className="space-y-3">
            {data.tracksByType.length === 0 ? (
              <p className="text-sm dark:text-dark-300 text-dark-500 text-center py-4">No tracks yet</p>
            ) : (
              data.tracksByType.map((t) => {
                const colors: Record<string, string> = {
                  episode: 'from-blue-500 to-blue-400',
                  single: 'from-purple-500 to-purple-400',
                  mix: 'from-orange-500 to-orange-400',
                  live: 'from-red-500 to-red-400',
                };
                const total = data.tracksByType.reduce((sum, x) => sum + x.count, 0);
                return (
                  <div key={t.track_type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm dark:text-dark-100 text-dark-700 capitalize">{t.track_type}</span>
                      <span className="text-xs dark:text-dark-300 text-dark-500">{t.count} ({Math.round((t.count / total) * 100)}%)</span>
                    </div>
                    <div className="h-2 dark:bg-dark-600 bg-light-200 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${colors[t.track_type] || 'from-gray-500 to-gray-400'} rounded-full`}
                        style={{ width: `${(t.count / total) * 100}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-sm font-semibold dark:text-white text-dark-900 mb-4 flex items-center gap-2">
            <Heart size={16} className="text-red-400" /> Most Liked Tracks
          </h3>
          {data.mostLikedTracks.length === 0 ? (
            <p className="text-sm dark:text-dark-300 text-dark-500 text-center py-4">No likes yet</p>
          ) : (
            <div className="space-y-2">
              {data.mostLikedTracks.map((t, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg dark:hover:bg-dark-500/30 hover:bg-light-300/30 transition-colors">
                  <span className="text-xs dark:text-dark-300 text-dark-500 w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium dark:text-white text-dark-900 truncate">{t.title}</p>
                    <p className="text-[10px] dark:text-dark-300 text-dark-500 truncate">{t.artist || 'Unknown'} {t.program_title ? `· ${t.program_title}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-1 text-red-400">
                    <Heart size={12} fill="currentColor" />
                    <span className="text-xs font-medium">{t.like_count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
