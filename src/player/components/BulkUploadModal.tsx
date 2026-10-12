import { useState } from 'react';
import { toast } from 'sonner';
import { ListMusic, Loader2, X, Upload } from 'lucide-react';
import { api, ApiError } from '../utils/api';
import { readAudioMetadata } from '../utils/metadata';
import { errorMessage } from '../utils/errors';
import type { Track } from '../utils/types';

/** The backend's multer array limit for a single bulk request (kept in sync
 *  with the sequential client cap so the UI and API agree). */
const MAX_BULK_FILES = 50;
const PER_FILE_RETRIES = 2;

interface BulkItem {
  file: File;
  meta: { title: string; artist: string; album: string };
}

interface Props {
  programId: string;
  /** Called after a successful upload so the caller can reload tracks. */
  onUploaded: () => void;
}

function fileKey(item: BulkItem): string {
  return `${item.file.name}:${item.file.size}:${item.file.lastModified}`;
}

/**
 * Bulk track upload dialog.
 *
 * Files go out one at a time through the chunked, resumable endpoint. The old
 * design packed up to 50 files into a single multipart POST: any network blip
 * (common on a slow uplink) lost the whole batch, and there was no way to
 * resume. Sequential per-file upload means a failure only costs the current
 * file, already-finished files stay committed on the server, and a retry
 * re-sends only what is left.
 */
export default function BulkUploadModal({ programId, onUploaded }: Props) {
  const [files, setFiles] = useState<BulkItem[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [trackType, setTrackType] = useState('episode');
  const [uploading, setUploading] = useState(false);
  // Overall byte progress across the whole batch, 0-100.
  const [percent, setPercent] = useState(0);
  const [currentLabel, setCurrentLabel] = useState<string | null>(null);

  const reset = () => {
    setFiles([]);
    setPercent(0);
    setCurrentLabel(null);
  };

  const close = () => {
    if (uploading) return;
    reset();
    onUploaded();
  };

  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;

    const capped = Array.from(selected).slice(0, MAX_BULK_FILES);
    if (selected.length > MAX_BULK_FILES) {
      toast.error(`Maximum ${MAX_BULK_FILES} files per bulk upload. Only the first ${MAX_BULK_FILES} were added.`);
    }

    setDetecting(true);
    const items: BulkItem[] = [];
    for (const file of capped) {
      items.push({ file, meta: await readAudioMetadata(file) });
    }
    setFiles(items);
    setDetecting(false);
  };

  const updateMeta = (index: number, field: keyof BulkItem['meta'], value: string) => {
    setFiles((prev) =>
      prev.map((item, i) => (i === index ? { ...item, meta: { ...item.meta, [field]: value } } : item))
    );
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const upload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setPercent(0);

    const totalBytes = files.reduce((sum, item) => sum + item.file.size, 0);
    const done = new Set<string>();
    let completedBytes = 0;
    let failedItem: BulkItem | null = null;
    let failedError: unknown = null;

    for (let i = 0; i < files.length; i++) {
      const item = files[i]!;
      setCurrentLabel(item.file.name);

      let attempt = 0;
      let succeeded = false;
      for (;;) {
        try {
          await api.uploadTrackResumable(
            item.file,
            {
              title: item.meta.title || item.file.name.replace(/\.[^.]+$/, ''),
              artist: item.meta.artist,
              album: item.meta.album,
              program_id: programId,
              track_type: trackType,
            },
            (filePercent) => {
              const fileBytes = item.file.size * (filePercent / 100);
              const overall =
                totalBytes > 0
                  ? Math.round(((completedBytes + fileBytes) / totalBytes) * 100)
                  : 0;
              setPercent(Math.min(overall, 99));
            }
          );
          succeeded = true;
          break;
        } catch (err) {
          // The chunked helper already retried transient failures. A remaining
          // ApiError (4xx) will not improve by resending the same request.
          const retryable = !(err instanceof ApiError) || err.status >= 500 || err.status === 429;
          attempt++;
          if (!retryable || attempt > PER_FILE_RETRIES) {
            failedItem = item;
            failedError = err;
            break;
          }
          setCurrentLabel(`${item.file.name} (retry ${attempt}/${PER_FILE_RETRIES})…`);
          await new Promise((r) => setTimeout(r, 1500 * attempt));
        }
      }

      if (!succeeded) break;
      done.add(fileKey(item));
      completedBytes += item.file.size;
      setPercent(totalBytes > 0 ? Math.round((completedBytes / totalBytes) * 100) : 100);
    }

    setCurrentLabel(null);
    setUploading(false);

    // Drop finished files from the list so a retry only sends the remainder.
    const remaining = files.filter((item) => !done.has(fileKey(item)));
    if (done.size > 0) {
      setFiles(remaining);
      onUploaded();
    }

    if (failedItem && failedError) {
      toast.error(
        errorMessage(failedError, `Failed to upload "${failedItem.file.name}"`) +
          (done.size > 0 ? ` ${done.size} earlier track${done.size === 1 ? '' : 's'} were saved.` : '')
      );
      setPercent(0);
      return;
    }

    reset();
    toast.success(`Uploaded ${files.length} track${files.length === 1 ? '' : 's'}`);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Bulk upload tracks"
    >
      <div
        className="glass-panel rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-lg font-bold dark:text-white text-dark-900 flex items-center gap-2">
            <ListMusic size={18} /> Bulk Upload Tracks
          </h2>
          {!uploading && (
            <button
              type="button"
              onClick={close}
              className="p-1 rounded dark:hover:bg-dark-500 hover:bg-light-300 dark:text-dark-200 text-dark-600"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="px-6 flex-1 overflow-y-auto">
          <div className="mb-4">
            <label className="block text-xs font-medium dark:text-dark-100 text-dark-700 mb-1.5">
              Select Audio Files
            </label>
            <input
              type="file"
              accept="audio/*"
              multiple
              onChange={handleFilesChange}
              className="w-full text-sm dark:text-dark-200 text-dark-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-600 file:text-white file:cursor-pointer hover:file:bg-primary-700"
            />
            {detecting && (
              <p className="text-xs text-primary-400 mt-2 flex items-center gap-1">
                <Loader2 size={12} className="animate-spin" /> Reading metadata from files...
              </p>
            )}
          </div>

          {files.length > 0 && (
            <>
              <div className="mb-4">
                <select
                  value={trackType}
                  onChange={(e) => setTrackType(e.target.value)}
                  className="w-full px-4 py-2.5 dark:bg-dark-600 bg-white border dark:border-white/5 border-dark-300 rounded-lg dark:text-white text-dark-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                  aria-label="Track type"
                >
                  <option value="episode">Episode</option>
                  <option value="sermon">Sermon</option>
                  <option value="music">Music</option>
                </select>
              </div>

              <p className="text-xs dark:text-dark-200 text-dark-600 mb-2">
                {files.length} files ready - edit metadata below
              </p>

              <div className="space-y-2 mb-4">
                {files.map((item, i) => (
                  <div key={`${item.file.name}-${i}`} className="glass-panel rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs dark:text-dark-200 text-dark-600 truncate">{item.file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        disabled={uploading}
                        className="p-1 rounded dark:hover:bg-dark-500 dark:text-dark-400 hover:text-red-400"
                        aria-label={`Remove ${item.file.name}`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {(['title', 'artist', 'album'] as const).map((field) => (
                        <input
                          key={field}
                          type="text"
                          value={item.meta[field]}
                          placeholder={field}
                          disabled={uploading}
                          onChange={(e) => updateMeta(i, field, e.target.value)}
                          className="px-3 py-2 dark:bg-dark-600 bg-white border dark:border-white/5 border-dark-300 rounded-lg dark:text-white text-dark-900 text-xs focus:outline-none focus:ring-2 focus:ring-primary-600"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="p-6 pt-4">
          {uploading && (
            <div className="mb-4">
              <div className="flex justify-between text-xs dark:text-dark-200 text-dark-600 mb-1">
                <span className="truncate mr-2">{currentLabel || 'Uploading…'}</span>
                <span>{percent}%</span>
              </div>
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                aria-label="Upload progress"
                className="h-1.5 dark:bg-dark-600 bg-light-200 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-primary-600 rounded-full transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={upload}
            disabled={files.length === 0 || uploading}
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {uploading
              ? 'Uploading...'
              : `Upload ${files.length} Track${files.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export type { BulkItem, Track };
