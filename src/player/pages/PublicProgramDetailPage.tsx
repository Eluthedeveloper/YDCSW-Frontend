import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePlayer } from '../context/PlayerContext';
import { usePlayerAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import CoverBg from '../components/CoverBg';
import { toast } from 'sonner';
import { Play, Pause, Heart, Music, MessageCircle, Clock, ArrowLeft, Lock } from 'lucide-react';
import { getFingerprint } from '../utils/fingerprint';

export default function PublicProgramDetailPage() {
  const { t } = useTranslation('programs');
  const { id: programId = '' } = useParams();
  const navigate = useNavigate();
  const onBack = () => navigate('/programs');
  const { play, pause, resume, currentTrack, isPlaying } = usePlayer();
  const { user } = usePlayerAuth();
  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';
  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    api.getPublicProgram(programId).then(setProgram).finally(() => setLoading(false));
  }, [programId]);

  useEffect(() => {
    if (isAdmin) {
      setLoadingComments(true);
      api.getComments(programId).then(setComments).catch(() => setComments([])).finally(() => setLoadingComments(false));
    }
  }, [programId, isAdmin]);

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName || !commentText) return;
    setSubmitting(true);
    try {
      await api.postComment(programId, { guest_name: commentName, content: commentText });
      setCommentText('');
      toast.success(t('programDetail.commentSuccess'));
      const updated = await api.getPublicProgram(programId);
      setProgram(updated);
      if (isAdmin) {
        const updatedComments = await api.getComments(programId);
        setComments(updatedComments);
      }
    } catch {
      toast.error(t('programDetail.commentFailed'));
    } finally { setSubmitting(false); }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!program) return <p className="dark:text-dark-200 text-dark-600 text-center py-20">{t('programDetail.notFound')}</p>;

  return (
    <div>
      <button onClick={onBack} className="text-sm dark:text-dark-200 text-dark-600 hover:text-primary-400 transition-colors mb-6 inline-flex items-center gap-1">
        <ArrowLeft size={16} /> {t('programDetail.backToPrograms')}
      </button>

      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="w-full md:w-64 h-64 rounded-2xl dark:bg-dark-600 bg-light-200 flex items-center justify-center overflow-hidden flex-shrink-0">
          <CoverBg src={program.cover_image} fallbackSize={48} className="rounded-2xl" />
        </div>
        <div className="flex-1">
          <h2 className="text-3xl font-bold dark:text-white text-dark-900 mb-2">{program.title}</h2>
          <p className="dark:text-dark-200 text-dark-600 mb-4">{program.description || 'No description'}</p>
          <div className="flex items-center gap-4 text-sm dark:text-dark-300 text-dark-500">
            <span className="flex items-center gap-1"><Music size={14} /> {program.tracks?.length || 0} tracks</span>
            <span className="flex items-center gap-1"><Heart size={14} /> {program.like_count || 0} likes</span>
            <span className="flex items-center gap-1"><MessageCircle size={14} /> {program.comment_count || 0} comments</span>
            <span className="flex items-center gap-1"><Clock size={14} /> {new Date(program.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h3 className="text-sm font-semibold dark:text-dark-100 text-dark-700 uppercase tracking-wider mb-3">Tracks</h3>
          {program.tracks?.length === 0 ? (
            <div className="text-center py-12 glass-panel rounded-xl">
              <p className="dark:text-dark-300 text-dark-500">No tracks in this program yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {program.tracks?.map((t: any, i: number) => (
                <TrackRow key={t.id} track={t} index={i + 1}
                  isActive={currentTrack?.id === t.id}
                  isPlaying={currentTrack?.id === t.id && isPlaying}
                  onPlay={() => {
                    if (currentTrack?.id === t.id && isPlaying) { pause(); }
                    else if (currentTrack?.id === t.id && !isPlaying) { resume(); }
                    else { play(t, program.tracks); }
                  }} />
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold dark:text-dark-100 text-dark-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <MessageCircle size={14} /> Comments
          </h3>
          <form onSubmit={handleComment} className="glass-panel rounded-xl p-4 mb-4">
            <input type="text" placeholder="Your name" value={commentName} onChange={(e) => setCommentName(e.target.value)}
              className="w-full px-3 py-2 dark:bg-dark-600 bg-white dark:border-white/5 border-dark-300 rounded-lg dark:text-white text-dark-900 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-primary-600" required />
            <textarea placeholder="Leave a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)}
              className="w-full px-3 py-2 dark:bg-dark-600 bg-white dark:border-white/5 border-dark-300 rounded-lg dark:text-white text-dark-900 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-primary-600 h-20 resize-none" required />
            <button type="submit" disabled={submitting}
              className="w-full py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all">
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </form>
          {isAdmin ? (
            <div className="space-y-3">
              {loadingComments ? (
                <div className="flex justify-center py-4"><div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
              ) : comments.length === 0 ? (
                <p className="text-sm dark:text-dark-300 text-dark-500 text-center py-4">No comments yet</p>
              ) : (
                comments.map((c: any) => (
                  <div key={c.id} className="glass-panel rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 text-[10px] font-bold">
                        {c.guest_name[0].toUpperCase()}
                      </div>
                      <span className="text-xs font-medium dark:text-white text-dark-900">{c.guest_name}</span>
                      <span className="text-[10px] dark:text-dark-300 text-dark-500">{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm dark:text-dark-100 text-dark-700">{c.content}</p>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="glass-panel rounded-xl p-4 text-center">
              <Lock size={18} className="dark:text-dark-400 text-dark-500 mx-auto mb-1" />
              <p className="text-xs dark:text-dark-300 text-dark-500">Comments are visible to admins only</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TrackRow({ track, index, isActive, isPlaying, onPlay }: {
  track: any; index: number; isActive: boolean; isPlaying: boolean; onPlay: () => void;
}) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(track.like_count || 0);

  useEffect(() => {
    const fp = getFingerprint();
    api.checkLiked(track.id, fp).then((r: any) => setLiked(r.liked)).catch(() => {});
  }, [track.id]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const fp = getFingerprint();
    const res = await api.toggleLike(track.id, fp);
    setLiked(res.liked);
    setLikeCount((c: number) => res.liked ? c + 1 : Math.max(0, c - 1));
  };

  return (
    <div onClick={onPlay}
      className={`flex items-center gap-1.5 sm:gap-4 p-2 sm:p-3 rounded-xl cursor-pointer transition-all group ${
        isActive ? 'bg-primary-600/15 border border-primary-600/20' : 'dark:hover:bg-dark-500/50 hover:bg-light-300/50'
      }`}>
      <div className="w-6 sm:w-8 text-center text-[11px] sm:text-xs dark:text-dark-300 text-dark-500 flex-shrink-0">{index}</div>
      <button className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
        isActive ? 'bg-primary-600 text-white' : 'bg-primary-600/20 text-primary-400 group-hover:bg-primary-600 group-hover:text-white'
      }`}>
        {isActive && isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] sm:text-sm font-medium truncate ${isActive ? 'text-primary-400' : 'dark:text-white text-dark-900'}`}>{track.title}</p>
        <p className="text-[11px] sm:text-xs dark:text-dark-200 text-dark-600 truncate">{track.artist || 'Unknown'}</p>
      </div>
      {track.track_type && (
        <span className="hidden sm:inline text-[10px] dark:text-dark-300 text-dark-500 uppercase dark:bg-dark-600 bg-light-200 px-2 py-0.5 rounded flex-shrink-0">{track.track_type}</span>
      )}
      <button onClick={handleLike}
        className={`p-1.5 sm:p-2 rounded-full transition-all flex-shrink-0 ${liked ? 'text-red-400 bg-red-500/15' : 'dark:text-dark-300 text-dark-500 hover:text-red-400 hover:bg-red-500/10'}`}>
        <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
      </button>
      <span className="text-[11px] sm:text-xs dark:text-dark-300 text-dark-500 w-5 sm:w-6 text-right flex-shrink-0">{likeCount}</span>
    </div>
  );
}
