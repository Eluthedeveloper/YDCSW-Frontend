import { errorMessage } from '../utils/errors';
import { useState } from 'react';
import { usePlayerAuth } from '../context/AuthContext';
import { api, uploadUrl } from '../utils/api';
import { compressImage } from '../../lib/compressImage';
import { useAsyncData } from '../hooks/useAsyncData';
import { toast } from 'sonner';
import { Newspaper, Plus, Trash2, X, Loader2, Pencil, Check, Eye, EyeOff } from 'lucide-react';
import type { BlogPost } from '../utils/types';

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_IMAGE_MB = MAX_IMAGE_BYTES / (1024 * 1024);
// Mirrors the server's MAX_BLOG_IMAGES; the form refuses the seventh photo
// before an upload that would be rejected anyway.
const MAX_PHOTOS = 6;

function formatDate(mysql?: string): string {
  if (!mysql) return '';
  const parsed = new Date(mysql.replace(' ', 'T'));
  return Number.isNaN(parsed.getTime()) ? mysql : parsed.toLocaleString();
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass-panel rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
const submitButton =
  'w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2';

const EMPTY_FORM = { title: '', category: '', excerpt: '', body: '', published: true };

export default function BlogAdminPage() {
  const { isSuperAdmin } = usePlayerAuth();
  const { data: posts, loading, error, reload } = useAsyncData<BlogPost[]>(
    () => api.getAdminBlogPosts(),
    []
  );
  const [saving, setSaving] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [cover, setCover] = useState<File | null>(null);
  // Photos already on the post that the admin has not removed, and photos
  // picked for this save. On save the first list becomes `keepImages` and the
  // second is uploaded, so an edit replaces the gallery instead of appending.
  const [keepImages, setKeepImages] = useState<string[]>([]);
  const [gallery, setGallery] = useState<File[]>([]);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [showForm, setShowForm] = useState(false);

  const checkImage = (file: File | null | undefined): file is File => {
    if (!file) return false;
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error(`Image is too large even after compression. Max is ${MAX_IMAGE_MB} MB.`);
      return false;
    }
    return true;
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setCover(null);
    setKeepImages([]);
    setGallery([]);
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setCover(null);
    setKeepImages([]);
    setGallery([]);
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (post: BlogPost) => {
    setForm({
      title: post.title,
      category: post.category ?? '',
      excerpt: post.excerpt ?? '',
      body: post.body ?? '',
      published: post.published === 1,
    });
    setCover(null);
    setKeepImages(post.images ?? []);
    setGallery([]);
    setEditing(post);
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setUploadPercent(cover || gallery.length > 0 ? 0 : null);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('category', form.category);
      fd.append('excerpt', form.excerpt);
      fd.append('body', form.body);
      fd.append('published', String(form.published));
      if (cover) fd.append('cover', await compressImage(cover));
      for (const photo of gallery) fd.append('images', await compressImage(photo));
      if (editing) fd.append('keepImages', JSON.stringify(keepImages));
      if (editing) {
        await api.updateBlogPost(editing.id, fd, cover || gallery.length > 0 ? setUploadPercent : undefined);
        toast.success('Post updated');
      } else {
        await api.createBlogPost(fd, cover || gallery.length > 0 ? setUploadPercent : undefined);
        toast.success('Post published');
      }
      closeForm();
      reload();
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Failed to save post'));
    } finally {
      setSaving(false);
      setUploadPercent(null);
    }
  };

  const remove = (post: BlogPost) => {
    toast.warning(`Delete "${post.title}"?`, {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await api.deleteBlogPost(post.id);
            reload();
            toast.success('Post deleted');
          } catch (err: unknown) {
            toast.error(errorMessage(err, 'Failed to delete post'));
          }
        },
      },
      cancel: { label: 'Cancel', onClick: () => {} },
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold dark:text-white text-dark-900">Blog</h1>
          <p className="text-sm dark:text-dark-200 text-dark-600 mt-1">
            Articles shown on the public News &amp; Blog page. Drafts stay hidden from visitors.
          </p>
        </div>
        <button onClick={openCreate} className={primaryButton}><Plus size={16} /> New Post</button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-primary-400" /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-xl">
          <Newspaper size={48} className="dark:text-dark-400 text-dark-500 mx-auto mb-3" />
          <p className="dark:text-dark-200 text-dark-600">No posts yet. Write the first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {posts.map((post) => (
            <article key={post.id} className="glass-panel rounded-xl overflow-hidden flex flex-col">
              <div className="h-40 dark:bg-dark-600 bg-light-200 overflow-hidden">
                {post.cover_image ? (
                  <img src={uploadUrl(`blogs/${post.cover_image}`)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-600/30 to-purple-400/20">
                    <Newspaper size={34} className="dark:text-dark-400 text-dark-500" />
                  </div>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                        post.published === 1 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                      }`}>
                        {post.published === 1 ? <Eye size={10} /> : <EyeOff size={10} />}
                        {post.published === 1 ? 'Published' : 'Draft'}
                      </span>
                      {post.category && (
                        <span className="text-[10px] font-semibold uppercase text-primary-400">{post.category}</span>
                      )}
                    </div>
                    <h3 className="font-semibold dark:text-white text-dark-900 mt-1.5 line-clamp-2">{post.title}</h3>
                    <p className="text-xs dark:text-dark-400 text-dark-500 mt-1">{formatDate(post.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button aria-label={`Edit ${post.title}`} title="Edit" onClick={() => openEdit(post)}
                      className="p-1.5 dark:text-dark-300 text-dark-500 hover:text-primary-400"><Pencil size={15} /></button>
                    {isSuperAdmin && (
                      <button aria-label={`Delete ${post.title}`} title="Delete" onClick={() => remove(post)}
                        className="p-1.5 dark:text-dark-300 text-dark-500 hover:text-red-400"><Trash2 size={15} /></button>
                    )}
                  </div>
                </div>
                {post.excerpt && <p className="text-sm dark:text-dark-200 text-dark-600 mt-2 line-clamp-3">{post.excerpt}</p>}
              </div>
            </article>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title={editing ? 'Edit Post' : 'New Post'} onClose={closeForm}>
          <form onSubmit={save}>
            <div className="mb-3">
              <label className={labelClass} htmlFor="post-title">Title</label>
              <input id="post-title" type="text" value={form.title} required
                onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className={labelClass} htmlFor="post-category">Category</label>
                <input id="post-category" type="text" value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}
                  placeholder="e.g. Radio, Events, Ministry" />
              </div>
              <div>
                <label className={labelClass} htmlFor="post-cover">Cover image</label>
                <input id="post-cover" type="file" accept="image/*"
                  onChange={(e) => { if (checkImage(e.target.files?.[0])) setCover(e.target.files![0]); }}
                  className="w-full max-w-full min-w-0 text-sm dark:text-dark-200 text-dark-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-600 file:text-white file:cursor-pointer hover:file:bg-primary-700" />
              </div>
            </div>
            {(cover || editing?.cover_image) && (
              <div className="mb-3 h-40 rounded-lg overflow-hidden dark:bg-dark-600 bg-light-200">
                <img
                  src={cover ? URL.createObjectURL(cover) : uploadUrl(`blogs/${editing!.cover_image}`)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="mb-3">
              <label className={labelClass} htmlFor="post-photos">Photos (optional)</label>
              <input id="post-photos" type="file" accept="image/*" multiple
                onChange={(e) => {
                  const picked = Array.from(e.target.files ?? []).filter(checkImage);
                  setGallery((prev) => [...prev, ...picked].slice(0, Math.max(0, MAX_PHOTOS - keepImages.length)));
                  e.target.value = '';
                }}
                className="w-full max-w-full min-w-0 text-sm dark:text-dark-200 text-dark-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-600 file:text-white file:cursor-pointer hover:file:bg-primary-700" />
              <p className="mt-1 text-xs dark:text-dark-400 text-dark-500">
                Shown in a grid inside the article. Up to {MAX_PHOTOS} photos.
              </p>
            </div>
            {(keepImages.length > 0 || gallery.length > 0) && (
              <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {keepImages.map((name) => (
                  <div key={name} className="group relative aspect-square overflow-hidden rounded-lg dark:bg-dark-600 bg-light-200">
                    <img src={uploadUrl(`blogs/${name}`)} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      aria-label={`Remove photo ${name}`}
                      onClick={() => setKeepImages((prev) => prev.filter((n) => n !== name))}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {gallery.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="group relative aspect-square overflow-hidden rounded-lg dark:bg-dark-600 bg-light-200">
                    <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
                    <span className="absolute left-1 top-1 rounded bg-primary-600/80 px-1 py-0.5 text-[9px] font-semibold uppercase text-white">
                      New
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove new photo ${index + 1}`}
                      onClick={() => setGallery((prev) => prev.filter((_, i) => i !== index))}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="mb-3">
              <label className={labelClass} htmlFor="post-excerpt">Excerpt</label>
              <textarea id="post-excerpt" value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                className={`${inputClass} h-20 resize-none`} placeholder="Short summary shown on cards. Leave blank to derive it from the article." />
            </div>
            <div className="mb-3">
              <label className={labelClass} htmlFor="post-body">Article</label>
              <textarea id="post-body" value={form.body} required
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                className={`${inputClass} h-56 resize-y leading-relaxed`} />
            </div>
            <label className="flex items-center gap-2 mb-6 text-sm dark:text-dark-200 text-dark-600">
              <input type="checkbox" checked={form.published}
                onChange={(e) => setForm({ ...form, published: e.target.checked })}
                className="rounded dark:border-white/10 border-dark-300" />
              Published (visible to visitors)
            </label>
            <button type="submit" disabled={saving} className={submitButton}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {saving
                ? (uploadPercent !== null && uploadPercent < 100 ? `Uploading… ${uploadPercent}%` : 'Saving...')
                : editing ? 'Save Changes' : 'Publish'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
