import { errorMessage } from '../utils/errors';
import { useState, useEffect } from 'react';
import { usePlayerAuth } from '../context/AuthContext';
import { api, uploadUrl } from '../utils/api';
import { toast } from 'sonner';
import {
  Users, Images, Megaphone, CalendarDays, Plus, Trash2, X, Loader2,
  ChevronUp, ChevronDown, Pencil, Check, Upload, Pin,
} from 'lucide-react';
import type { Leader, Album, AlbumPhoto, Announcement, SiteEvent } from '../utils/types';

// Mirrors the backend's image cap (site.ts MAX_PHOTO_BYTES) so an oversized
// photo is rejected before the upload starts instead of dying in multer.
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_IMAGE_MB = MAX_IMAGE_BYTES / (1024 * 1024);

type Tab = 'leaders' | 'albums' | 'announcements' | 'events';

const TABS: Array<{ id: Tab; label: string; icon: typeof Users }> = [
  { id: 'leaders', label: 'Leadership', icon: Users },
  { id: 'albums', label: 'Photo Albums', icon: Images },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'events', label: 'Events', icon: CalendarDays },
];

/** MySQL DATETIME → the value a `datetime-local` input expects. */
function toInputValue(mysql: string | null | undefined): string {
  if (!mysql) return '';
  return mysql.replace(' ', 'T').slice(0, 16);
}

function formatDateTime(mysql: string): string {
  const parsed = new Date(mysql.replace(' ', 'T'));
  return Number.isNaN(parsed.getTime()) ? mysql : parsed.toLocaleString();
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass-panel rounded-2xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold dark:text-white text-dark-900">{title}</h2>
          <button onClick={onClose} className="p-1 rounded dark:hover:bg-dark-500 hover:bg-light-300 dark:text-dark-200 text-dark-600" aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputClass =
  'w-full px-4 py-2.5 dark:bg-dark-600 bg-white dark:border-white/5 border-dark-300 rounded-lg dark:text-white text-dark-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600';
const labelClass = 'block text-xs font-medium dark:text-dark-100 text-dark-700 mb-1.5';
const primaryButton =
  'flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-primary-600/20';
const secondaryButton =
  'flex items-center gap-2 px-3 py-2 dark:bg-dark-500 bg-light-300 dark:hover:bg-dark-400 hover:bg-light-400 dark:text-white text-dark-900 text-xs font-medium rounded-lg transition-all';
const submitButton =
  'w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2';

export default function SiteContentPage() {
  const { isSuperAdmin } = usePlayerAuth();
  const [tab, setTab] = useState<Tab>('leaders');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<SiteEvent[]>([]);

  // One shared "editing" slot per tab: null means the dialog is closed (or
  // creating, tracked separately), so create and edit share one form.
  const [leaderForm, setLeaderForm] = useState({ name: '', title: '', quote: '', role_label: '' });
  const [leaderPhoto, setLeaderPhoto] = useState<File | null>(null);
  const [editingLeader, setEditingLeader] = useState<Leader | null>(null);
  const [showLeaderForm, setShowLeaderForm] = useState(false);

  const [albumForm, setAlbumForm] = useState({ title: '', description: '' });
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [showAlbumForm, setShowAlbumForm] = useState(false);
  const [expandedAlbum, setExpandedAlbum] = useState<string | null>(null);

  const [annForm, setAnnForm] = useState({ title: '', body: '', pinned: false });
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);
  const [showAnnForm, setShowAnnForm] = useState(false);

  const [eventForm, setEventForm] = useState({ title: '', description: '', location: '', starts_at: '', ends_at: '' });
  const [editingEvent, setEditingEvent] = useState<SiteEvent | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);

  const loadLeaders = async () => setLeaders(await api.getLeaders());
  const loadAlbums = async () => setAlbums(await api.getAlbums());
  const loadAnnouncements = async () => setAnnouncements(await api.getAnnouncements());
  const loadEvents = async () => setEvents(await api.getSiteEvents());

  useEffect(() => {
    let mounted = true;
    // One settled promise per resource: a failing endpoint reports its own
    // error and the other three still populate, rather than one rejection
    // blanking the whole screen.
    const loaders: Array<[Promise<unknown>, string]> = [
      [api.getLeaders(), 'leadership'],
      [api.getAlbums(), 'albums'],
      [api.getAnnouncements(), 'announcements'],
      [api.getSiteEvents(), 'events'],
    ];
    Promise.all(
      loaders.map(([promise, label]) =>
        promise.then(
          (rows) => {
            if (!mounted) return;
            if (label === 'leadership') setLeaders(rows as Leader[]);
            if (label === 'albums') setAlbums(rows as Album[]);
            if (label === 'announcements') setAnnouncements(rows as Announcement[]);
            if (label === 'events') setEvents(rows as SiteEvent[]);
          },
          (err: unknown) => {
            if (mounted) toast.error(errorMessage(err, `Failed to load ${label}`));
          }
        )
      )
    ).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const checkImage = (file: File | null | undefined): file is File => {
    if (!file) return false;
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error(`Image is too large. Max is ${MAX_IMAGE_MB} MB.`);
      return false;
    }
    return true;
  };

  const closeLeaderForm = () => { setShowLeaderForm(false); setEditingLeader(null); setLeaderPhoto(null); };

  const openLeaderCreate = () => {
    setLeaderForm({ name: '', title: '', quote: '', role_label: '' });
    setLeaderPhoto(null);
    setEditingLeader(null);
    setShowLeaderForm(true);
  };

  const openLeaderEdit = (leader: Leader) => {
    setLeaderForm({ name: leader.name, title: leader.title, quote: leader.quote ?? '', role_label: leader.role_label ?? '' });
    setLeaderPhoto(null);
    setEditingLeader(leader);
    setShowLeaderForm(true);
  };

  const saveLeader = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', leaderForm.name);
      fd.append('title', leaderForm.title);
      fd.append('quote', leaderForm.quote);
      fd.append('role_label', leaderForm.role_label);
      if (leaderPhoto) fd.append('photo', leaderPhoto);
      if (editingLeader) {
        await api.updateLeader(editingLeader.id, fd);
        toast.success('Leader updated');
      } else {
        await api.createLeader(fd);
        toast.success('Leader added');
      }
      closeLeaderForm();
      loadLeaders();
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Failed to save leader'));
    } finally { setSaving(false); }
  };

  const deleteLeader = (leader: Leader) => {
    toast.warning(`Delete ${leader.name}?`, {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await api.deleteLeader(leader.id);
            loadLeaders();
            toast.success('Leader deleted');
          } catch (err: unknown) { toast.error(errorMessage(err, 'Failed to delete leader')); }
        },
      },
      cancel: { label: 'Cancel', onClick: () => {} },
    });
  };

  // Optimistic swap first so the list reacts instantly; a failed reorder puts
  // the server's order back rather than leaving the UI out of step.
  const moveLeader = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= leaders.length) return;
    const next = [...leaders];
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    setLeaders(next);
    try { await api.reorderLeaders(next.map((l) => l.id)); }
    catch { loadLeaders(); }
  };

  const closeAlbumForm = () => { setShowAlbumForm(false); setEditingAlbum(null); };

  const saveAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingAlbum) {
        await api.updateAlbum(editingAlbum.id, albumForm);
        toast.success('Album updated');
      } else {
        await api.createAlbum(albumForm);
        toast.success('Album created');
      }
      closeAlbumForm();
      loadAlbums();
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Failed to save album'));
    } finally { setSaving(false); }
  };

  const deleteAlbum = (album: Album) => {
    toast.warning(`Delete "${album.title}" and all its photos?`, {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await api.deleteAlbum(album.id);
            if (expandedAlbum === album.id) setExpandedAlbum(null);
            loadAlbums();
            toast.success('Album deleted');
          } catch (err: unknown) { toast.error(errorMessage(err, 'Failed to delete album')); }
        },
      },
      cancel: { label: 'Cancel', onClick: () => {} },
    });
  };

  const addAlbumPhotos = async (album: Album, files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      if (!checkImage(file)) return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      for (const file of Array.from(files)) fd.append('photos', file);
      const result = await api.addAlbumPhotos(album.id, fd);
      toast.success(`${result.uploaded} photo${result.uploaded === 1 ? '' : 's'} added`);
      loadAlbums();
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Failed to add photos'));
    } finally {
      setSaving(false);
      // Reset so re-selecting the same file fires a change event.
      const input = document.getElementById(`photos-${album.id}`) as HTMLInputElement | null;
      if (input) input.value = '';
    }
  };

  const deleteAlbumPhoto = (album: Album, photo: AlbumPhoto) => {
    toast.warning('Delete this photo?', {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await api.deleteAlbumPhoto(album.id, photo.id);
            loadAlbums();
            toast.success('Photo deleted');
          } catch (err: unknown) { toast.error(errorMessage(err, 'Failed to delete photo')); }
        },
      },
      cancel: { label: 'Cancel', onClick: () => {} },
    });
  };

  const closeAnnForm = () => { setShowAnnForm(false); setEditingAnn(null); };

  const saveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingAnn) {
        await api.updateAnnouncement(editingAnn.id, annForm);
        toast.success('Announcement updated');
      } else {
        await api.createAnnouncement(annForm);
        toast.success('Announcement published');
      }
      closeAnnForm();
      loadAnnouncements();
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Failed to save announcement'));
    } finally { setSaving(false); }
  };

  const deleteAnnouncement = (announcement: Announcement) => {
    toast.warning(`Delete "${announcement.title}"?`, {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await api.deleteAnnouncement(announcement.id);
            loadAnnouncements();
            toast.success('Announcement deleted');
          } catch (err: unknown) { toast.error(errorMessage(err, 'Failed to delete announcement')); }
        },
      },
      cancel: { label: 'Cancel', onClick: () => {} },
    });
  };

  const closeEventForm = () => { setShowEventForm(false); setEditingEvent(null); };

  const saveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...eventForm, description: eventForm.description, location: eventForm.location };
      if (editingEvent) {
        await api.updateSiteEvent(editingEvent.id, payload);
        toast.success('Event updated');
      } else {
        await api.createSiteEvent(payload);
        toast.success('Event added');
      }
      closeEventForm();
      loadEvents();
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Failed to save event'));
    } finally { setSaving(false); }
  };

  const deleteEvent = (event: SiteEvent) => {
    toast.warning(`Delete "${event.title}"?`, {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await api.deleteSiteEvent(event.id);
            loadEvents();
            toast.success('Event deleted');
          } catch (err: unknown) { toast.error(errorMessage(err, 'Failed to delete event')); }
        },
      },
      cancel: { label: 'Cancel', onClick: () => {} },
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold dark:text-white text-dark-900">Site Content</h1>
          <p className="text-sm dark:text-dark-200 text-dark-600 mt-1">
            Leadership, photo albums, announcements and events shown on the public site
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                : 'dark:bg-dark-500 bg-light-300 dark:text-dark-200 text-dark-600 dark:hover:bg-dark-400 hover:bg-light-400'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-primary-400" /></div>
      ) : tab === 'leaders' ? (
        /* ---------------- Leadership ---------------- */
        <section>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm dark:text-dark-300 text-dark-500">Photos and titles shown on the Leadership page. Use the arrows to set the display order.</p>
            <button onClick={openLeaderCreate} className={primaryButton}><Plus size={16} /> Add Leader</button>
          </div>
          {leaders.length === 0 ? (
            <div className="text-center py-20 glass-panel rounded-xl">
              <Users size={48} className="dark:text-dark-400 text-dark-500 mx-auto mb-3" />
              <p className="dark:text-dark-200 text-dark-600">No leaders yet. Add the first one!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leaders.map((leader, index) => (
                <div key={leader.id} className="glass-panel rounded-xl overflow-hidden">
                  <div className="h-44 dark:bg-dark-600 bg-light-200 flex items-center justify-center overflow-hidden">
                    {leader.photo ? (
                      <img src={uploadUrl(`leaders/${leader.photo}`)} alt={leader.name} className="w-full h-full object-cover" />
                    ) : (
                      <Users size={40} className="dark:text-dark-400 text-dark-500" />
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold dark:text-white text-dark-900 truncate">{leader.name}</h3>
                        <p className="text-xs text-primary-400 mt-0.5 truncate">{leader.title}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button aria-label={`Move ${leader.name} up`} title="Move up" onClick={() => moveLeader(index, 'up')} disabled={index === 0}
                          className="p-1 dark:text-dark-400 text-dark-500 dark:hover:text-white hover:text-dark-900 disabled:opacity-20"><ChevronUp size={14} /></button>
                        <button aria-label={`Move ${leader.name} down`} title="Move down" onClick={() => moveLeader(index, 'down')} disabled={index === leaders.length - 1}
                          className="p-1 dark:text-dark-400 text-dark-500 dark:hover:text-white hover:text-dark-900 disabled:opacity-20"><ChevronDown size={14} /></button>
                        <button aria-label={`Edit ${leader.name}`} title="Edit" onClick={() => openLeaderEdit(leader)}
                          className="p-1 dark:text-dark-300 text-dark-500 hover:text-primary-400"><Pencil size={13} /></button>
                        {isSuperAdmin && (
                          <button aria-label={`Delete ${leader.name}`} title="Delete" onClick={() => deleteLeader(leader)}
                            className="p-1 dark:text-dark-300 text-dark-500 hover:text-red-400"><Trash2 size={13} /></button>
                        )}
                      </div>
                    </div>
                    {leader.quote && <p className="text-xs dark:text-dark-200 text-dark-600 mt-2 line-clamp-2">“{leader.quote}”</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {showLeaderForm && (
            <Modal title={editingLeader ? 'Edit Leader' : 'Add Leader'} onClose={closeLeaderForm}>
              <form onSubmit={saveLeader}>
                <div className="mb-3">
                  <label className={labelClass} htmlFor="leader-name">Name</label>
                  <input id="leader-name" type="text" value={leaderForm.name} required
                    onChange={(e) => setLeaderForm({ ...leaderForm, name: e.target.value })} className={inputClass} />
                </div>
                <div className="mb-3">
                  <label className={labelClass} htmlFor="leader-title">Title</label>
                  <input id="leader-title" type="text" value={leaderForm.title} required
                    onChange={(e) => setLeaderForm({ ...leaderForm, title: e.target.value })} className={inputClass} placeholder="e.g. Senior Pastor" />
                </div>
                <div className="mb-3">
                  <label className={labelClass} htmlFor="leader-quote">Quote</label>
                  <textarea id="leader-quote" value={leaderForm.quote}
                    onChange={(e) => setLeaderForm({ ...leaderForm, quote: e.target.value })} className={`${inputClass} h-20 resize-none`} />
                </div>
                <div className="mb-3">
                  <label className={labelClass} htmlFor="leader-role">Role label</label>
                  <input id="leader-role" type="text" value={leaderForm.role_label}
                    onChange={(e) => setLeaderForm({ ...leaderForm, role_label: e.target.value })} className={inputClass} placeholder="e.g. Leadership Team" />
                </div>
                <div className="mb-6">
                  <label className={labelClass} htmlFor="leader-photo">Photo</label>
                  {editingLeader?.photo && !leaderPhoto && (
                    <img src={uploadUrl(`leaders/${editingLeader.photo}`)} alt="" className="w-20 h-20 object-cover rounded-lg mb-2" />
                  )}
                  <input id="leader-photo" type="file" accept="image/*"
                    onChange={(e) => { if (checkImage(e.target.files?.[0])) setLeaderPhoto(e.target.files![0]); }}
                    className="w-full max-w-full min-w-0 text-sm dark:text-dark-200 text-dark-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-600 file:text-white file:cursor-pointer hover:file:bg-primary-700" />
                </div>
                <button type="submit" disabled={saving} className={submitButton}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  {saving ? 'Saving...' : editingLeader ? 'Save Changes' : 'Add Leader'}
                </button>
              </form>
            </Modal>
          )}
        </section>
      ) : tab === 'albums' ? (
        /* ---------------- Photo Albums ---------------- */
        <section>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm dark:text-dark-300 text-dark-500">Albums shown in the Gallery. Open an album to add photos.</p>
            <button onClick={() => { setAlbumForm({ title: '', description: '' }); setEditingAlbum(null); setShowAlbumForm(true); }} className={primaryButton}>
              <Plus size={16} /> New Album
            </button>
          </div>
          {albums.length === 0 ? (
            <div className="text-center py-20 glass-panel rounded-xl">
              <Images size={48} className="dark:text-dark-400 text-dark-500 mx-auto mb-3" />
              <p className="dark:text-dark-200 text-dark-600">No albums yet. Create your first one!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {albums.map((album) => (
                <div key={album.id} className="glass-panel rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 p-4">
                    <button onClick={() => setExpandedAlbum(expandedAlbum === album.id ? null : album.id)}
                      className="flex-1 min-w-0 text-left">
                      <h3 className="font-semibold dark:text-white text-dark-900 truncate">{album.title}</h3>
                      <p className="text-xs dark:text-dark-300 text-dark-500 mt-0.5">
                        {album.photos.length} photo{album.photos.length === 1 ? '' : 's'}
                        {album.description ? ` · ${album.description}` : ''}
                      </p>
                    </button>
                    <label className={`${secondaryButton} cursor-pointer`}>
                      <Upload size={14} /> Add Photos
                      <input id={`photos-${album.id}`} type="file" accept="image/*" multiple className="hidden"
                        onChange={(e) => addAlbumPhotos(album, e.target.files)} />
                    </label>
                    <button aria-label={`Edit ${album.title}`} title="Edit album"
                      onClick={() => { setAlbumForm({ title: album.title, description: album.description ?? '' }); setEditingAlbum(album); setShowAlbumForm(true); }}
                      className="p-1.5 dark:text-dark-300 text-dark-500 hover:text-primary-400"><Pencil size={15} /></button>
                    {isSuperAdmin && (
                      <button aria-label={`Delete ${album.title}`} title="Delete album" onClick={() => deleteAlbum(album)}
                        className="p-1.5 dark:text-dark-300 text-dark-500 hover:text-red-400"><Trash2 size={15} /></button>
                    )}
                  </div>
                  {expandedAlbum === album.id && (
                    <div className="px-4 pb-4">
                      {album.photos.length === 0 ? (
                        <p className="text-xs dark:text-dark-300 text-dark-500 py-4 text-center">No photos yet. Use "Add Photos" to upload some.</p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                          {album.photos.map((photo) => (
                            <div key={photo.id} className="relative group rounded-lg overflow-hidden aspect-square dark:bg-dark-600 bg-light-200">
                              <img src={uploadUrl(`albums/${photo.file_name}`)} alt={photo.caption || album.title} className="w-full h-full object-cover" />
                              {isSuperAdmin && (
                                <button aria-label="Delete photo" onClick={() => deleteAlbumPhoto(album, photo)}
                                  className="absolute top-1 right-1 p-1 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {showAlbumForm && (
            <Modal title={editingAlbum ? 'Edit Album' : 'New Album'} onClose={closeAlbumForm}>
              <form onSubmit={saveAlbum}>
                <div className="mb-3">
                  <label className={labelClass} htmlFor="album-title">Title</label>
                  <input id="album-title" type="text" value={albumForm.title} required
                    onChange={(e) => setAlbumForm({ ...albumForm, title: e.target.value })} className={inputClass} />
                </div>
                <div className="mb-6">
                  <label className={labelClass} htmlFor="album-desc">Description</label>
                  <textarea id="album-desc" value={albumForm.description}
                    onChange={(e) => setAlbumForm({ ...albumForm, description: e.target.value })} className={`${inputClass} h-20 resize-none`} />
                </div>
                <button type="submit" disabled={saving} className={submitButton}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  {saving ? 'Saving...' : editingAlbum ? 'Save Changes' : 'Create Album'}
                </button>
              </form>
            </Modal>
          )}
        </section>
      ) : tab === 'announcements' ? (
        /* ---------------- Announcements ---------------- */
        <section>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm dark:text-dark-300 text-dark-500">Short messages shown on the homepage. Pinned announcements always appear first.</p>
            <button onClick={() => { setAnnForm({ title: '', body: '', pinned: false }); setEditingAnn(null); setShowAnnForm(true); }} className={primaryButton}>
              <Plus size={16} /> New Announcement
            </button>
          </div>
          {announcements.length === 0 ? (
            <div className="text-center py-20 glass-panel rounded-xl">
              <Megaphone size={48} className="dark:text-dark-400 text-dark-500 mx-auto mb-3" />
              <p className="dark:text-dark-200 text-dark-600">No announcements yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="glass-panel rounded-xl p-4 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {announcement.pinned === 1 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase bg-primary-600/20 text-primary-400 px-1.5 py-0.5 rounded">
                          <Pin size={10} /> Pinned
                        </span>
                      )}
                      <h3 className="font-semibold dark:text-white text-dark-900">{announcement.title}</h3>
                    </div>
                    {announcement.body && <p className="text-sm dark:text-dark-200 text-dark-600 mt-1 whitespace-pre-wrap">{announcement.body}</p>}
                    {announcement.created_at && (
                      <p className="text-xs dark:text-dark-400 text-dark-500 mt-1">{formatDateTime(announcement.created_at)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button aria-label={`Edit ${announcement.title}`} title="Edit"
                      onClick={() => { setAnnForm({ title: announcement.title, body: announcement.body ?? '', pinned: announcement.pinned === 1 }); setEditingAnn(announcement); setShowAnnForm(true); }}
                      className="p-1.5 dark:text-dark-300 text-dark-500 hover:text-primary-400"><Pencil size={15} /></button>
                    {isSuperAdmin && (
                      <button aria-label={`Delete ${announcement.title}`} title="Delete" onClick={() => deleteAnnouncement(announcement)}
                        className="p-1.5 dark:text-dark-300 text-dark-500 hover:text-red-400"><Trash2 size={15} /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {showAnnForm && (
            <Modal title={editingAnn ? 'Edit Announcement' : 'New Announcement'} onClose={closeAnnForm}>
              <form onSubmit={saveAnnouncement}>
                <div className="mb-3">
                  <label className={labelClass} htmlFor="ann-title">Title</label>
                  <input id="ann-title" type="text" value={annForm.title} required
                    onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })} className={inputClass} />
                </div>
                <div className="mb-3">
                  <label className={labelClass} htmlFor="ann-body">Message</label>
                  <textarea id="ann-body" value={annForm.body}
                    onChange={(e) => setAnnForm({ ...annForm, body: e.target.value })} className={`${inputClass} h-28 resize-none`} />
                </div>
                <label className="flex items-center gap-2 mb-6 text-sm dark:text-dark-200 text-dark-600">
                  <input type="checkbox" checked={annForm.pinned}
                    onChange={(e) => setAnnForm({ ...annForm, pinned: e.target.checked })}
                    className="rounded dark:border-white/10 border-dark-300" />
                  Pin to the top
                </label>
                <button type="submit" disabled={saving} className={submitButton}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  {saving ? 'Saving...' : editingAnn ? 'Save Changes' : 'Publish'}
                </button>
              </form>
            </Modal>
          )}
        </section>
      ) : (
        /* ---------------- Events ---------------- */
        <section>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm dark:text-dark-300 text-dark-500">Upcoming events shown on the homepage. The most recent dates appear first.</p>
            <button onClick={() => { setEventForm({ title: '', description: '', location: '', starts_at: '', ends_at: '' }); setEditingEvent(null); setShowEventForm(true); }} className={primaryButton}>
              <Plus size={16} /> New Event
            </button>
          </div>
          {events.length === 0 ? (
            <div className="text-center py-20 glass-panel rounded-xl">
              <CalendarDays size={48} className="dark:text-dark-400 text-dark-500 mx-auto mb-3" />
              <p className="dark:text-dark-200 text-dark-600">No events scheduled yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="glass-panel rounded-xl p-4 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold dark:text-white text-dark-900">{event.title}</h3>
                      {event.location && <span className="text-xs dark:text-dark-300 text-dark-500">· {event.location}</span>}
                    </div>
                    <p className="text-xs text-primary-400 mt-1">
                      {formatDateTime(event.starts_at)}
                      {event.ends_at ? ` – ${formatDateTime(event.ends_at)}` : ''}
                    </p>
                    {event.description && <p className="text-sm dark:text-dark-200 text-dark-600 mt-1 whitespace-pre-wrap">{event.description}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button aria-label={`Edit ${event.title}`} title="Edit"
                      onClick={() => {
                        setEventForm({
                          title: event.title, description: event.description ?? '', location: event.location ?? '',
                          starts_at: toInputValue(event.starts_at), ends_at: toInputValue(event.ends_at),
                        });
                        setEditingEvent(event);
                        setShowEventForm(true);
                      }}
                      className="p-1.5 dark:text-dark-300 text-dark-500 hover:text-primary-400"><Pencil size={15} /></button>
                    {isSuperAdmin && (
                      <button aria-label={`Delete ${event.title}`} title="Delete" onClick={() => deleteEvent(event)}
                        className="p-1.5 dark:text-dark-300 text-dark-500 hover:text-red-400"><Trash2 size={15} /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {showEventForm && (
            <Modal title={editingEvent ? 'Edit Event' : 'New Event'} onClose={closeEventForm}>
              <form onSubmit={saveEvent}>
                <div className="mb-3">
                  <label className={labelClass} htmlFor="event-title">Title</label>
                  <input id="event-title" type="text" value={eventForm.title} required
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} className={inputClass} />
                </div>
                <div className="mb-3">
                  <label className={labelClass} htmlFor="event-location">Location</label>
                  <input id="event-location" type="text" value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} className={inputClass} placeholder="e.g. Main Hall" />
                </div>
                <div className="mb-3">
                  <label className={labelClass} htmlFor="event-start">Starts</label>
                  <input id="event-start" type="datetime-local" value={eventForm.starts_at} required
                    onChange={(e) => setEventForm({ ...eventForm, starts_at: e.target.value })} className={inputClass} />
                </div>
                <div className="mb-3">
                  <label className={labelClass} htmlFor="event-end">Ends (optional)</label>
                  <input id="event-end" type="datetime-local" value={eventForm.ends_at}
                    onChange={(e) => setEventForm({ ...eventForm, ends_at: e.target.value })} className={inputClass} />
                </div>
                <div className="mb-6">
                  <label className={labelClass} htmlFor="event-desc">Description</label>
                  <textarea id="event-desc" value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} className={`${inputClass} h-24 resize-none`} />
                </div>
                <button type="submit" disabled={saving} className={submitButton}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  {saving ? 'Saving...' : editingEvent ? 'Save Changes' : 'Add Event'}
                </button>
              </form>
            </Modal>
          )}
        </section>
      )}
    </div>
  );
}
