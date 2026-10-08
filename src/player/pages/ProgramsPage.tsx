import { errorMessage } from '../utils/errors';
import { useState, useEffect } from 'react';
import { usePlayerAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../utils/api';
import CoverBg from '../components/CoverBg';
import BulkUploadModal from '../components/BulkUploadModal';
import { toast } from 'sonner';
import { readAudioMetadata } from '../utils/metadata';
import { FolderOpen, Plus, Trash2, Play, Pause, Upload, X, Loader2, ChevronUp, ChevronDown, ListMusic, FileAudio, Pencil, Check } from 'lucide-react';
import type { Program, Track } from '../utils/types';

// Mirrors the backend's cover cap (programs.ts MAX_COVER_BYTES) so an oversized
// image is rejected before the upload starts. Without this the request is sent,
// multer rejects it, and the modal just sits there looking unresponsive.
const MAX_COVER_BYTES = 15 * 1024 * 1024;
const MAX_COVER_MB = MAX_COVER_BYTES / (1024 * 1024);

export default function ProgramsPage() {
  const { isSuperAdmin } = usePlayerAuth();
  const { play, currentTrack, isPlaying } = usePlayer();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showUploadTrack, setShowUploadTrack] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [trackForm, setTrackForm] = useState({ title: '', artist: '', album: '', track_type: 'episode' });
  const [trackFile, setTrackFile] = useState<File | null>(null);
  const [detectingMeta, setDetectingMeta] = useState(false);
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', artist: '', album: '', track_type: '' });
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [editProgramForm, setEditProgramForm] = useState({ title: '', description: '' });
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const data = await api.getPrograms();
        if (mounted) setPrograms(data);
      } catch (err: unknown) {
        // Without this the request failure is indistinguishable from a
        // genuinely empty library, and the user sees "No programs yet".
        if (mounted) toast.error(errorMessage(err, 'Failed to load programs'));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => { mounted = false; };
  }, []);

  const loadPrograms = async () => {
    try {
      const data = await api.getPrograms();
      setPrograms(data);
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Failed to load programs'));
    } finally {
      setLoading(false);
    }
  };

  const loadTracks = async (programId: string) => {
    setSelectedProgram(programId);
    try {
      const data = await api.getTracks(programId);
      setTracks(data);
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Failed to load tracks'));
    }
  };

  const createProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      if (coverFile) fd.append('cover_image', coverFile);
      await api.createProgram(fd);
      setShowCreate(false);
      setForm({ title: '', description: '' });
      setCoverFile(null);
      loadPrograms();
      toast.success('Program created successfully');
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Failed to create program'));
    } finally { setCreating(false); }
  };

  const deleteProgram = async (id: string) => {
    toast.warning('Delete this program and all its tracks?', {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await api.deleteProgram(id);
            if (selectedProgram === id) { setSelectedProgram(null); setTracks([]); }
            loadPrograms();
            toast.success('Program deleted');
          } catch (err: unknown) {
            toast.error(errorMessage(err, 'Failed to delete program'));
          }
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
    });
  };

  const setCover = (file: File | null | undefined, apply: (f: File | null) => void) => {
    if (!file) return;
    if (file.size > MAX_COVER_BYTES) {
      toast.error(`Cover image is too large. Max is ${MAX_COVER_MB} MB.`);
      return;
    }
    apply(file);
  };

  const startEditProgram = (program: Program, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProgram(program);
    setEditProgramForm({ title: program.title, description: program.description ?? '' });
    setEditCoverFile(null);
  };

  const saveEditProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProgram) return;
    setCreating(true);
    try {
      const fd = new FormData();
      fd.append('title', editProgramForm.title);
      fd.append('description', editProgramForm.description);
      if (editCoverFile) fd.append('cover_image', editCoverFile);
      await api.updateProgram(editingProgram.id, fd);
      setEditingProgram(null);
      setEditProgramForm({ title: '', description: '' });
      setEditCoverFile(null);
      loadPrograms();
      toast.success('Program updated successfully');
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Failed to update program'));
    } finally { setCreating(false); }
  };

  // --- Single Upload ---
  const handleTrackFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTrackFile(file);
    setDetectingMeta(true);
    try {
      const meta = await readAudioMetadata(file);
      setTrackForm(prev => ({
        ...prev,
        title: prev.title || meta.title,
        artist: prev.artist || meta.artist,
        album: prev.album || meta.album,
      }));
    } finally { setDetectingMeta(false); }
  };

  const uploadTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackFile || !selectedProgram) return;
    setCreating(true);
    try {
      const fd = new FormData();
      fd.append('title', trackForm.title);
      fd.append('artist', trackForm.artist);
      fd.append('album', trackForm.album);
      fd.append('track_type', trackForm.track_type);
      fd.append('program_id', selectedProgram);
      fd.append('audio_file', trackFile);
      await api.createTrack(fd);
      setShowUploadTrack(false);
      setTrackForm({ title: '', artist: '', album: '', track_type: 'episode' });
      setTrackFile(null);
      loadTracks(selectedProgram);
      loadPrograms();
      toast.success('Track uploaded successfully');
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Failed to upload track'));
    } finally { setCreating(false); }
  };

  // --- Bulk Upload ---
  // --- Track Management ---
  const deleteTrack = async (id: string) => {
    toast.warning('Delete this track?', {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await api.deleteTrack(id);
            if (selectedProgram) loadTracks(selectedProgram);
            loadPrograms();
            toast.success('Track deleted');
          } catch (err: unknown) {
            toast.error(errorMessage(err, 'Failed to delete track'));
          }
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
    });
  };

  const moveTrack = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= tracks.length) return;
    const newTracks = [...tracks];
    [newTracks[index], newTracks[newIndex]] = [newTracks[newIndex], newTracks[index]];
    setTracks(newTracks);
    try { await api.reorderTracks(selectedProgram!, newTracks.map(t => t.id)); }
    catch { loadTracks(selectedProgram!); }
  };

  const startEditTrack = (track: Track) => {
    setEditingTrackId(track.id);
    setEditForm({ title: track.title, artist: track.artist || '', album: track.album || '', track_type: track.track_type ?? '' });
  };

  const saveEditTrack = async (id: string) => {
    try {
      await api.updateTrack(id, editForm);
      setEditingTrackId(null);
      if (selectedProgram) loadTracks(selectedProgram);
      toast.success('Track updated');
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Failed to update track'));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold dark:text-white text-dark-900">Programs</h1>
          <p className="text-sm dark:text-dark-200 text-dark-600 mt-1">Manage your audio programs</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-primary-600/20">
          <Plus size={16} /> New Program
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-primary-400" /></div>
      ) : programs.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-xl">
          <FolderOpen size={48} className="dark:text-dark-400 text-dark-500 mx-auto mb-3" />
          <p className="dark:text-dark-200 text-dark-600">No programs yet. Create your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map((p) => (
            <div key={p.id} className={`glass-panel rounded-xl overflow-hidden cursor-pointer transition-all hover:border-primary-600/30 ${selectedProgram === p.id ? 'ring-1 ring-primary-600/50' : ''}`}
              onClick={() => loadTracks(p.id)}>
              <div className="h-36 dark:bg-dark-600 bg-light-200 flex items-center justify-center relative">
                <CoverBg src={p.cover_image} fallbackSize={36} />
                {isSuperAdmin && (
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                    <button aria-label={`Edit program ${p.title}`} title="Edit program" onClick={(e) => startEditProgram(p, e)} className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button aria-label={`Delete program ${p.title}`} title="Delete program" onClick={(e) => { e.stopPropagation(); deleteProgram(p.id); }} className="p-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold dark:text-white text-dark-900 truncate">{p.title}</h3>
                <p className="text-xs dark:text-dark-200 text-dark-600 mt-1 truncate">{p.description || 'No description'}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs dark:text-dark-300 text-dark-500">{p.track_count} tracks</span>
                   <span className="text-xs dark:text-dark-300 text-dark-500">by {p.creator_name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedProgram && (
        <div className="mt-8 glass-panel rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold dark:text-white text-dark-900">Tracks</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => { setTrackForm({ title: '', artist: '', album: '', track_type: 'episode' }); setTrackFile(null); setShowUploadTrack(true); }}
                className="flex items-center gap-2 px-3 py-2 dark:bg-dark-500 bg-light-300 dark:hover:bg-dark-400 hover:bg-light-400 dark:text-white text-dark-900 text-xs font-medium rounded-lg transition-all">
                <FileAudio size={14} /> Single Upload
              </button>
              <button onClick={() => setShowBulkUpload(true)}
                className="flex items-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-lg transition-all">
                <ListMusic size={14} /> Bulk Upload
              </button>
            </div>
          </div>
          {tracks.length === 0 ? (
            <p className="text-sm dark:text-dark-300 text-dark-500 py-8 text-center">No tracks yet. Upload some!</p>
          ) : (
            <div className="space-y-1">
              {tracks.map((t, i) => (
                <div key={t.id} className={`flex items-center gap-2 p-2.5 rounded-lg transition-colors ${
                  currentTrack?.id === t.id ? 'bg-primary-600/10' : 'dark:hover:bg-dark-500/50 hover:bg-light-300/50'
                }`}>
                  {/* min-w-0 lets the title cell shrink so `truncate` works; without
                      it a long title pushes the row wider than the viewport. */}
                  <div className="flex flex-col gap-0">
                    <button onClick={() => moveTrack(i, 'up')} disabled={i === 0}
                      className="p-0.5 dark:text-dark-400 text-dark-500 dark:hover:text-white hover:text-dark-900 disabled:opacity-20 disabled:cursor-not-allowed"><ChevronUp size={13} /></button>
                     <button onClick={() => moveTrack(i, 'down')} disabled={i === tracks.length - 1}
                       className="p-0.5 dark:text-dark-400 text-dark-500 dark:hover:text-white hover:text-dark-900 disabled:opacity-20 disabled:cursor-not-allowed"><ChevronDown size={13} /></button>
                  </div>
                  <button onClick={() => play(t, tracks)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      currentTrack?.id === t.id && isPlaying ? 'bg-primary-600 text-white' : 'bg-primary-600/20 text-primary-400 hover:bg-primary-600 hover:text-white'
                    }`}>
                    {currentTrack?.id === t.id && isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                  </button>
                  <span className="text-[10px] dark:text-dark-400 text-dark-500 w-4 text-center">{i + 1}</span>

                  {editingTrackId === t.id ? (
                    <div className="flex-1 flex items-center gap-2 flex-wrap">
                      <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="px-2 py-1 dark:bg-dark-600 bg-white dark:border-white/5 border-dark-300 rounded dark:text-white text-dark-900 text-xs w-36 min-w-0 flex-1 sm:flex-none focus:ring-1 focus:ring-primary-600" placeholder="Title" />
                       <input value={editForm.artist} onChange={(e) => setEditForm({ ...editForm, artist: e.target.value })}
                         className="px-2 py-1 dark:bg-dark-600 bg-white dark:border-white/5 border-dark-300 rounded dark:text-white text-dark-900 text-xs w-28 min-w-0 flex-1 sm:flex-none focus:ring-1 focus:ring-primary-600" placeholder="Artist" />
                       <input value={editForm.album} onChange={(e) => setEditForm({ ...editForm, album: e.target.value })}
                         className="px-2 py-1 dark:bg-dark-600 bg-white dark:border-white/5 border-dark-300 rounded dark:text-white text-dark-900 text-xs w-28 min-w-0 flex-1 sm:flex-none focus:ring-1 focus:ring-primary-600" placeholder="Album" />
                       <select value={editForm.track_type} onChange={(e) => setEditForm({ ...editForm, track_type: e.target.value })}
                         className="px-2 py-1 dark:bg-dark-600 bg-white dark:border-white/5 border-dark-300 rounded dark:text-white text-dark-900 text-xs focus:ring-1 focus:ring-primary-600">
                        <option value="episode">Episode</option>
                        <option value="single">Single</option>
                        <option value="mix">Mix</option>
                        <option value="live">Live</option>
                      </select>
                      <button onClick={() => saveEditTrack(t.id)} className="p-1 text-green-400 hover:bg-green-500/15 rounded"><Check size={14} /></button>
                      <button onClick={() => setEditingTrackId(null)} className="p-1 dark:text-dark-300 text-dark-500 dark:hover:bg-dark-500 hover:bg-light-300 rounded"><X size={14} /></button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium dark:text-white text-dark-900 truncate">{t.title}</p>
                         <p className="text-[11px] dark:text-dark-200 text-dark-600 truncate">{t.artist || 'Unknown'}{t.album ? ` · ${t.album}` : ''}</p>
                      </div>
                      <span className="text-[10px] dark:text-dark-300 text-dark-500 uppercase dark:bg-dark-600 bg-light-200 px-1.5 py-0.5 rounded hidden sm:block">{t.track_type}</span>
                        <button aria-label={`Edit track ${t.title}`} title="Edit track" onClick={() => startEditTrack(t)} className="p-1 dark:text-dark-300 text-dark-500 hover:text-primary-400 transition-all"><Pencil size={13} /></button>
                      {isSuperAdmin && (
                        <button aria-label={`Delete track ${t.title}`} title="Delete track" onClick={() => deleteTrack(t.id)} className="p-1 dark:text-dark-300 text-dark-500 hover:text-red-400 transition-all"><Trash2 size={13} /></button>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Program Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="glass-panel rounded-2xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold dark:text-white text-dark-900">New Program</h2>
               <button onClick={() => setShowCreate(false)} className="p-1 rounded dark:hover:bg-dark-500 hover:bg-light-300 dark:text-dark-200 text-dark-600"><X size={18} /></button>
            </div>
            <form onSubmit={createProgram}>
              <div className="mb-4">
                <label className="block text-xs font-medium dark:text-dark-100 text-dark-700 mb-1.5">Title</label>
                 <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                   className="w-full px-4 py-3 dark:bg-dark-600 bg-white dark:border-white/5 border-dark-300 rounded-lg dark:text-white text-dark-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600" required />
              </div>
              <div className="mb-4">
                <label className="block text-xs font-medium dark:text-dark-100 text-dark-700 mb-1.5">Description</label>
                 <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                   className="w-full px-4 py-3 dark:bg-dark-600 bg-white dark:border-white/5 border-dark-300 rounded-lg dark:text-white text-dark-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 h-20 resize-none" />
              </div>
              <div className="mb-6">
                <label className="block text-xs font-medium dark:text-dark-100 text-dark-700 mb-1.5">Cover Image</label>
                 <input type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0], setCoverFile)}
                  className="w-full max-w-full min-w-0 text-sm dark:text-dark-200 text-dark-600 file:mr-4 file:max-w-full file:min-w-0 file:truncate file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-600 file:text-white file:cursor-pointer hover:file:bg-primary-700" />
               </div>
               <button type="submit" disabled={creating} className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2">
                {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                {creating ? 'Creating...' : 'Create Program'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Program Modal */}
      {editingProgram && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditingProgram(null)}>
          <div className="glass-panel rounded-2xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold dark:text-white text-dark-900">Edit Program</h2>
               <button onClick={() => setEditingProgram(null)} className="p-1 rounded dark:hover:bg-dark-500 hover:bg-light-300 dark:text-dark-200 text-dark-600"><X size={18} /></button>
            </div>
            <form onSubmit={saveEditProgram}>
              <div className="mb-4">
                <label className="block text-xs font-medium dark:text-dark-100 text-dark-700 mb-1.5">Title</label>
                 <input type="text" value={editProgramForm.title} onChange={(e) => setEditProgramForm({ ...editProgramForm, title: e.target.value })}
                   className="w-full px-4 py-3 dark:bg-dark-600 bg-white dark:border-white/5 border-dark-300 rounded-lg dark:text-white text-dark-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600" required />
              </div>
              <div className="mb-4">
                <label className="block text-xs font-medium dark:text-dark-100 text-dark-700 mb-1.5">Description</label>
                 <textarea value={editProgramForm.description} onChange={(e) => setEditProgramForm({ ...editProgramForm, description: e.target.value })}
                   className="w-full px-4 py-3 dark:bg-dark-600 bg-white dark:border-white/5 border-dark-300 rounded-lg dark:text-white text-dark-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 h-20 resize-none" />
              </div>
              <div className="mb-6">
                <label htmlFor="edit-cover" className="block text-xs font-medium dark:text-dark-100 text-dark-700 mb-1.5">Cover Image</label>
                {editingProgram.cover_image && !editCoverFile && (
                  <div className="mb-2">
                    {/* Sized by the wrapper, not by className: CoverBg always
                        applies h-full, so passing h-32 to it directly would
                        collide and let a tall cover grow the dialog instead of
                        cropping. */}
                    <div className="h-32 overflow-hidden rounded-lg">
                      <CoverBg src={editingProgram.cover_image} fallbackSize={48} className="rounded-lg" />
                    </div>
                    <p className="text-xs dark:text-dark-300 text-dark-500 mt-1">Current cover image</p>
                  </div>
                )}
                <input id="edit-cover" type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0], setEditCoverFile)}
                  className="w-full max-w-full min-w-0 text-sm dark:text-dark-200 text-dark-600 file:mr-4 file:max-w-full file:min-w-0 file:truncate file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-600 file:text-white file:cursor-pointer hover:file:bg-primary-700" />
               </div>
               <button type="submit" disabled={creating} className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2">
                {creating ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {creating ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Single Upload Modal */}
      {showUploadTrack && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => !creating && setShowUploadTrack(false)}>
          <div className="glass-panel rounded-2xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold dark:text-white text-dark-900 flex items-center gap-2"><FileAudio size={18} /> Upload Track</h2>
               {!creating && <button onClick={() => setShowUploadTrack(false)} className="p-1 rounded dark:hover:bg-dark-500 hover:bg-light-300 dark:text-dark-200 text-dark-600"><X size={18} /></button>}
            </div>
            {creating ? (
              <div className="py-4">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Loader2 size={20} className="animate-spin text-primary-400" />
                  <span className="text-sm dark:text-dark-200 text-dark-600">Uploading track...</span>
                </div>
                <div className="h-2 dark:bg-dark-600 bg-light-200 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-600 rounded-full animate-[indeterminate_1.5s_ease-in-out_infinite]" style={{ width: '40%' }} />
                </div>
              </div>
            ) : (
            <form onSubmit={uploadTrack}>
              <div className="mb-4">
                <label className="block text-xs font-medium dark:text-dark-100 text-dark-700 mb-1.5">Audio File</label>
                 <input type="file" accept="audio/*" onChange={handleTrackFileChange} required
                   className="w-full max-w-full min-w-0 text-sm dark:text-dark-200 text-dark-600 file:mr-4 file:max-w-full file:min-w-0 file:truncate file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-600 file:text-white file:cursor-pointer hover:file:bg-primary-700" />
                {detectingMeta && <p className="text-xs text-primary-400 mt-1 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Detecting metadata...</p>}
                {trackFile && !detectingMeta && <p className="text-xs text-green-400 mt-1">Metadata detected - edit below if needed</p>}
              </div>
              <div className="mb-3">
                <label className="block text-xs font-medium dark:text-dark-100 text-dark-700 mb-1.5">Title</label>
                 <input type="text" value={trackForm.title} onChange={(e) => setTrackForm({ ...trackForm, title: e.target.value })}
                   className="w-full px-4 py-2.5 dark:bg-dark-600 bg-white dark:border-white/5 border-dark-300 rounded-lg dark:text-white text-dark-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600" required />
               </div>
               <div className="grid grid-cols-2 gap-3 mb-3">
                 <div>
                   <label className="block text-xs font-medium dark:text-dark-100 text-dark-700 mb-1.5">Artist</label>
                   <input type="text" value={trackForm.artist} onChange={(e) => setTrackForm({ ...trackForm, artist: e.target.value })}
                     className="w-full px-3 py-2.5 dark:bg-dark-600 bg-white dark:border-white/5 border-dark-300 rounded-lg dark:text-white text-dark-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600" />
                 </div>
                 <div>
                   <label className="block text-xs font-medium dark:text-dark-100 text-dark-700 mb-1.5">Album</label>
                   <input type="text" value={trackForm.album} onChange={(e) => setTrackForm({ ...trackForm, album: e.target.value })}
                     className="w-full px-3 py-2.5 dark:bg-dark-600 bg-white dark:border-white/5 border-dark-300 rounded-lg dark:text-white text-dark-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600" />
                 </div>
              </div>
              <div className="mb-6">
                <label className="block text-xs font-medium dark:text-dark-100 text-dark-700 mb-1.5">Type</label>
                 <select value={trackForm.track_type} onChange={(e) => setTrackForm({ ...trackForm, track_type: e.target.value })}
                   className="w-full px-4 py-2.5 dark:bg-dark-600 bg-white dark:border-white/5 border-dark-300 rounded-lg dark:text-white text-dark-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600">
                  <option value="episode">Episode</option>
                  <option value="single">Single</option>
                  <option value="mix">Mix</option>
                  <option value="live">Live</option>
                </select>
              </div>
              <button type="submit" className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2">
                <Upload size={16} /> Upload Track
              </button>
            </form>
            )}
          </div>
        </div>
      )}

      {showBulkUpload && selectedProgram && (
        <BulkUploadModal
          programId={selectedProgram}
          onUploaded={() => {
            setShowBulkUpload(false);
            loadTracks(selectedProgram);
            loadPrograms();
          }}
        />
      )}
    </div>
  );
}
