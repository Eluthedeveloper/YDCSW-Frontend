/** Shape of the subset of ID3 tags this app reads. */
interface MediaTag {
  tags?: {
    title?: string;
    artist?: string;
    album?: string;
  };
}

export interface AudioMetadata {
  title: string;
  artist: string;
  album: string;
}

export async function readAudioMetadata(file: File): Promise<AudioMetadata> {
  const fallback: AudioMetadata = {
    title: file.name.replace(/\.[^.]+$/, ''),
    artist: '',
    album: '',
  };

  try {
    const jsmediatags = await import('jsmediatags').catch(() => null);
    if (!jsmediatags) return fallback;

    return new Promise((resolve) => {
      jsmediatags.read(file, {
        onSuccess: (tag: MediaTag) => {
          const tags = tag.tags ?? {};
          resolve({
            title: tags.title || fallback.title,
            artist: tags.artist || '',
            album: tags.album || '',
          });
        },
        onError: () => resolve(fallback),
      });
    });
  } catch {
    return fallback;
  }
}
