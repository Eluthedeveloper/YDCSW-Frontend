import { describe, it, expect, vi, beforeEach } from 'vitest';

type ReadMetadata = typeof import('./metadata')['readAudioMetadata'];

function file(name = 'song.mp3'): File {
  return new File([], name, { type: 'audio/mpeg' });
}

async function loadWith(moduleFactory: () => Record<string, unknown>): Promise<ReadMetadata> {
  vi.doMock('jsmediatags', moduleFactory);
  const mod = await import('./metadata');
  return mod.readAudioMetadata;
}

beforeEach(() => {
  vi.resetModules();
  vi.doUnmock('jsmediatags');
});

describe('readAudioMetadata module shapes', () => {
  it('reads tags when the package only exposes its default export', async () => {
    const readAudioMetadata = await loadWith(() => ({
      default: {
        read: (_file: File, callbacks: { onSuccess: (tag: unknown) => void }) =>
          callbacks.onSuccess({ tags: { title: 'Dev Title', artist: 'Dev Artist', album: 'Dev Album' } }),
      },
    }));

    await expect(readAudioMetadata(file())).resolves.toEqual({
      title: 'Dev Title',
      artist: 'Dev Artist',
      album: 'Dev Album',
    });
  });

  it('falls back when the package exposes no reader', async () => {
    const readAudioMetadata = await loadWith(() => ({}));

    await expect(readAudioMetadata(file('my show.mp3'))).resolves.toEqual({
      title: 'my show',
      artist: '',
      album: '',
    });
  });

  it('falls back when the reader throws instead of rejecting the selection', async () => {
    const readAudioMetadata = await loadWith(() => ({
      read: () => {
        throw new Error('reader exploded');
      },
    }));

    await expect(readAudioMetadata(file())).resolves.toEqual({
      title: 'song',
      artist: '',
      album: '',
    });
  });

  it('falls back when the package cannot be imported at all', async () => {
    const readAudioMetadata = await loadWith(() => {
      throw new Error('package missing');
    });

    await expect(readAudioMetadata(file())).resolves.toEqual({
      title: 'song',
      artist: '',
      album: '',
    });
  });
});
