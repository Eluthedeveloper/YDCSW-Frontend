interface MediaTag {
  tags?: Record<string, unknown>;
}

interface ReadCallbacks {
  onSuccess: (tag: MediaTag) => void;
  onError: () => void;
}

interface JsMediaTags {
  read: (file: File, callbacks: ReadCallbacks) => void;
}

export interface AudioMetadata {
  title: string;
  artist: string;
  album: string;
}

function firstText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) {
    for (const entry of value) {
      const text = firstText(entry);
      if (text) return text;
    }
  }
  return '';
}

function safeGet(source: unknown, key: string): unknown {
  try {
    return (source as Record<string, unknown> | undefined)?.[key];
  } catch {
    return undefined;
  }
}

function isReader(candidate: unknown): candidate is JsMediaTags {
  return !!candidate && typeof safeGet(candidate, 'read') === 'function';
}

export async function readAudioMetadata(file: File): Promise<AudioMetadata> {
  const stem = file.name.replace(/\.[^.]+$/, '');
  const fallback: AudioMetadata = { title: stem, artist: '', album: '' };

  try {
    const mod: unknown = await import('jsmediatags');
    const fromDefault = safeGet(mod, 'default');
    const reader = isReader(fromDefault) ? fromDefault : isReader(mod) ? mod : undefined;
    if (!reader) return fallback;

    return await new Promise<AudioMetadata>((resolve) => {
      try {
        reader.read(file, {
          onSuccess: (tag) => {
            const tags = tag?.tags ?? {};
            resolve({
              title: firstText(tags.title) || fallback.title,
              artist: firstText(tags.artist),
              album: firstText(tags.album),
            });
          },
          onError: () => resolve(fallback),
        });
      } catch {
        resolve(fallback);
      }
    });
  } catch {
    return fallback;
  }
}
