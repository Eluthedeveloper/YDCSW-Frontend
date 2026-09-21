import { useState, useEffect } from 'react';
import { usePlayerAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../utils/api';
import CoverBg from '../components/CoverBg';
import { toast } from 'sonner';
import { readAudioMetadata } from '../utils/metadata';
import { FolderOpen, Plus, Trash2, Play, Pause, Upload, X, Loader2, ChevronUp, ChevronDown, ListMusic, FileAudio, Pencil, Check } from 'lucide-react';

interface Program {
  id: string;
  title: string;
  description: string;
  cover_image: string | null;
  track_count: number;
  creator_name: string;
  created_at: string;
}

export default function ProgramsPage() {
  const { isSuperAdmin } = usePlayerAuth();
  const { play, currentTrack, isPlaying } = usePlayer();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [tracks, setTracks] = useState<any[]>([]);
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
  const [bulkFiles, setBulkFiles] = useState<{ file: File; meta: { title: string; artist: string; album: string } }[]>([]);
  const [bulkDetecting, setBulkDetecting] = useState(false);
  const [bulkTrackType, setBulkTrackType] = useState('episode');
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [editProgramForm, setEditProgramForm] = useState({ title: '', description: '' });
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);

  useEffect(() => { loadPrograms(); }, []);

  const loadPrograms = async () => {
    try { const data = await api.getPrograms(); setPrograms(data); } finally { setLoading(false); }
  };

  const loadTracks = async (programId: string) => {
    setSelectedProgram(programId);
    const data = await api.getTracks(programId);
    setTracks(data);
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
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create program');
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
          } catch (err: any) {
            toast.error(err?.message || 'Failed to delete program');
          }
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
    });
  };

  const startEditProgram = (program: Program, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProgram(program);
    setEditProgramForm({ title: program.title, description: program.description });
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
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update program');
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
    } catch (err: any) {
      toast.error(err?.message || 'Failed to upload track');
    } finally { setCreating(false); }
  };

  // --- Bulk Upload ---
  const handleBulkFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    // Backend caps at 50 files per bulk request (multer array limit).
    const selected = Array.from(files).slice(0, 50);
    if (files.length > 50) {
      toast.error('Maximum 50 files per bulk upload. Only the first 50 were added.');
    }
    setBulkDetecting(true);
    const items: typeof bulkFiles = [];
    for (const file of selected) {
      const meta = await readAudioMetadata(file);
      items.push({ file, meta });
    }
    setBulkFiles(items);
    setBulkDetecting(false);
  };

  const updateBulkMeta = (index: number, field: 'title' | 'artist' | 'album', value: string) => {
    setBulkFiles(prev => prev.map((item, i) =>
      i === index ? { ...item, meta: { ...item.meta, [field]: value } } : item
    ));
  };

  const removeBulkFile = (index: number) => {
    setBulkFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadBulk = async () => {
    if (bulkFiles.length === 0 || !selectedProgram) return;
    setCreating(true);
    setBulkProgress({ done: 0, total: bulkFiles.length });
    try {
      const fd = new FormData();
      for (const item of bulkFiles) {
        fd.append('titles', item.meta.title || item.file.name.replace(/\.[^.]+$/, ''));
        fd.append('artists', item.meta.artist);
        fd.append('albums', item.meta.album);
        fd.append('audio_files', item.file);
      }
      fd.append('track_type', bulkTrackType);
      fd.append('program_id', selectedProgram);

      // Single request with all files so big batches don't trip the per-IP
      // write rate limit imposed on the single-upload endpoint.
      await api.bulkUploadTracks(fd);
      setShowBulkUpload(false);
      setBulkFiles([]);
      loadTracks(selectedProgram);
      loadPrograms();
      toast.success('All tracks uploaded successfully');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload tracks');
    } finally {
      setCreating(false);
      setBulkProgress({ done: 0, total: 0 });
    }
  };

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
          } catch (err: any) {
            toast.error(err?.message || 'Failed to delete track');
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

  const startEditTrack = (track: any) => {
    setEditingTrackId(track.id);
    setEditForm({ title: track.title, artist: track.artist || '', album: track.album || '', track_type: track.track_type });
  };

  const saveEditTrack = async (id: string) => {
    try {
      await api.updateTrack(id, editForm);
      setEditingTrackId(null);
      if (selectedProgram) loadTracks(selectedProgram);
      toast.success('Track updated');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update track');
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
                  <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    <button onClick={(e) => startEditProgram(p, e)} className="p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteProgram(p.id); }} className="p-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white transition-colors">
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
              <button onClick={() => { setBulkFiles([]); setShowBulkUpload(true); }}
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
                <div key={t.id} className={`flex items-center gap-2 p-2.5 rounded-lg transition-colors group ${
                  currentTrack?.id === t.id ? 'bg-primary-600/10' : 'dark:hover:bg-dark-500/50 hover:bg-light-300/50'
                }`}>
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
                        className="px-2 py-1 dark:bg-dark-600 bg-white dark:border-white/5 border-dark-300 rounded dark:text-white text-dark-900 text-xs w-36 focus:ring-1 focus:ring-primary-600" placeholder="Title" />
                       <input value={editForm.artist} onChange={(e) => setEditForm({ ...editForm, artist: e.target.value })}
                         className="px-2 py-1 dark:bg-dark-600 bg-white dark:border-white/5 border-dark-300 rounded dark:text-white text-dark-900 text-xs w-28 focus:ring-1 focus:ring-primary-600" placeholder="Artist" />
                       <input value={editForm.album} onChange={(e) => setEditForm({ ...editForm, album: e.target.value })}
                         className="px-2 py-1 dark:bg-dark-600 bg-white dark:border-white/5 border-dark-300 rounded dark:text-white text-dark-900 text-xs w-28 focus:ring-1 focus:ring-primary-600" placeholder="Album" />
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
                       <button onClick={() => startEditTrack(t)} className="p-1 dark:text-dark-300 text-dark-500 hover:text-primary-400 opacity-0 group-hover:opacity-100 transition-all"><Pencil size={13} /></button>
                      {isSuperAdmin && (
                        <button onClick={() => deleteTrack(t.id)} className="p-1 dark:text-dark-300 text-dark-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={13} /></button>
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
          <div className="glass-panel rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
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
                <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                  className="w-full text-sm dark:text-dark-200 text-dark-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-600 file:text-white file:cursor-pointer hover:file:bg-primary-700" />
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
          <div className="glass-panel rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
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
                <label className="block text-xs font-medium dark:text-dark-100 text-dark-700 mb-1.5">Cover Image</label>
                {editingProgram.cover_image && !editCoverFile && (
                  <div className="mb-2">
                    <CoverBg src={editingProgram.cover_image} fallbackSize={48} className="w-full h-32 rounded-lg" />
                    <p className="text-xs dark:text-dark-300 text-dark-500 mt-1">Current cover image</p>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={(e) => setEditCoverFile(e.target.files?.[0] || null)}
                  className="w-full text-sm dark:text-dark-200 text-dark-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-600 file:text-white file:cursor-pointer hover:file:bg-primary-700" />
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
          <div className="glass-panel rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
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
                   className="w-full text-sm dark:text-dark-200 text-dark-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-600 file:text-white file:cursor-pointer hover:file:bg-primary-700" />
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

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => !creating && setShowBulkUpload(false)}>
          <div className="glass-panel rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 pb-4">
              <h2 className="text-lg font-bold dark:text-white text-dark-900 flex items-center gap-2"><ListMusic size={18} /> Bulk Upload Tracks</h2>
               {!creating && <button onClick={() => setShowBulkUpload(false)} className="p-1 rounded dark:hover:bg-dark-500 hover:bg-light-300 dark:text-dark-200 text-dark-600"><X size={18} /></button>}
            </div>
            <div className="px-6 flex-1 overflow-y-auto">
              <div className="mb-4">
                <label className="block text-xs font-medium dark:text-dark-100 text-dark-700 mb-1.5">Select Audio Files</label>
                 <input type="file" accept="audio/*" multiple onChange={handleBulkFilesChange}
                   className="w-full text-sm dark:text-dark-200 text-dark-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-600 file:text-white file:cursor-pointer hover:file:bg-primary-700" />
                {bulkDetecting && <p className="text-xs text-primary-400 mt-2 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Reading metadata from {bulkFiles.length || '...'} files...</p>}
              </div>

              {bulkFiles.length > 0 && (
                <>
                  <div className="mb-4">
                    <label className="block text-xs font-medium dark:text-dark-100 text-dark-700 mb-1.5">Track Type (for all)</label>
                     <select value={bulkTrackType} onChange={(e) => setBulkTrackType(e.target.value)}
                       className="w-full px-3 py-2 dark:bg-dark-600 bg-white dark:border-white/5 border-dark-300 rounded-lg dark:text-white text-dark-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600">
                      <option value="episode">Episode</option>
                      <option value="single">Single</option>
                      <option value="mix">Mix</option>
                      <option value="live">Live</option>
                    </select>
                  </div>

                  <p className="text-xs dark:text-dark-200 text-dark-600 mb-2">{bulkFiles.length} files ready - edit metadata below</p>
                  <div className="space-y-2 mb-4">
                    {bulkFiles.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 p-2.5 dark:bg-dark-600/50 bg-light-200/50 rounded-lg">
                         <span className="text-[10px] dark:text-dark-400 text-dark-500 w-4 text-center">{i + 1}</span>
                         <div className="flex-1 grid grid-cols-3 gap-2">
                           <input value={item.meta.title} onChange={(e) => updateBulkMeta(i, 'title', e.target.value)}
                             className="px-2 py-1.5 dark:bg-dark-600 bg-white dark:border-white/5 border-dark-300 rounded dark:text-white text-dark-900 text-xs focus:ring-1 focus:ring-primary-600" placeholder="Title" />
                           <input value={item.meta.artist} onChange={(e) => updateBulkMeta(i, 'artist', e.target.value)}
                             className="px-2 py-1.5 dark:bg-dark-600 bg-white dark:border-white/5 border-dark-300 rounded dark:text-white text-dark-900 text-xs focus:ring-1 focus:ring-primary-600" placeholder="Artist" />
                           <input value={item.meta.album} onChange={(e) => updateBulkMeta(i, 'album', e.target.value)}
                             className="px-2 py-1.5 dark:bg-dark-600 bg-white dark:border-white/5 border-dark-300 rounded dark:text-white text-dark-900 text-xs focus:ring-1 focus:ring-primary-600" placeholder="Album" />
                        </div>
                        <span className="text-[10px] dark:text-dark-400 text-dark-500 w-20 truncate" title={item.file.name}>{item.file.name}</span>
                        {!creating && (
                          <button onClick={() => removeBulkFile(i)} className="p-1 dark:text-dark-400 text-dark-500 hover:text-red-400"><X size={12} /></button>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="p-6 pt-3 border-t dark:border-white/5 border-dark-300">
              {creating ? (
                <div>
                  <div className="flex items-center justify-between text-xs dark:text-dark-200 text-dark-600 mb-2">
                    <span>Uploading {bulkProgress.done} of {bulkProgress.total}</span>
                    <span>{Math.round((bulkProgress.done / bulkProgress.total) * 100)}%</span>
                  </div>
                  <div className="h-2 dark:bg-dark-600 bg-light-200 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-600 rounded-full transition-all" style={{ width: `${(bulkProgress.done / bulkProgress.total) * 100}%` }} />
                  </div>
                </div>
              ) : (
                <button onClick={uploadBulk} disabled={bulkFiles.length === 0}
                  className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2">
                  <Upload size={16} /> Upload {bulkFiles.length} Track{bulkFiles.length !== 1 ? 's' : ''}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
