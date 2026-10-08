import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlayerProvider, usePlayer } from './PlayerContext';
import { api } from '../utils/api';
import type { Track } from '../utils/types';

vi.mock('../utils/api', () => ({
  api: { recordListen: vi.fn().mockResolvedValue({ success: true }) },
  trackStreamUrl: (filePath: string) => `/uploads/tracks/${filePath.replace(/\.[^./\\]+$/, '')}.stream`,
}));

const trackA: Track = {
  id: 'a',
  title: 'Track A',
  duration: 200,
  file_path: 'a.mp3',
  program_id: 'p1',
};

const trackB: Track = { ...trackA, id: 'b', title: 'Track B', file_path: 'b.mp3' };

/** The <audio> the provider builds with `new Audio()`; it is never in the DOM. */
let audioEl: HTMLAudioElement | null = null;

let audioConstructor: HTMLAudioElement | null = null;

/**
 * Drives the provider through the rendered UI so no test holds a reference to
 * context state that would go stale on re-render.
 */
function Harness() {
  const {
    currentTrack,
    isPlaying,
    isBuffering,
    progress,
    analyserNode,
    shuffle,
    repeatMode,
    playbackError,
    play,
    close,
    seek,
    skipForward,
    skipBack,
    next,
    prev,
    toggleShuffle,
    cycleRepeat,
    dismissPlaybackError,
  } = usePlayer();

  return (
    <div>
      <span data-testid="track">{currentTrack?.id ?? 'none'}</span>
      <span data-testid="playing">{String(isPlaying)}</span>
      <span data-testid="buffering">{String(isBuffering)}</span>
      <span data-testid="progress">{progress}</span>
      <span data-testid="analyser">{analyserNode ? 'ready' : 'null'}</span>
      <span data-testid="shuffle">{String(shuffle)}</span>
      <span data-testid="repeat">{repeatMode}</span>
      <span data-testid="error">{playbackError ?? 'none'}</span>
      <button onClick={() => play(trackA, [trackA, trackB])}>playA</button>
      <button onClick={() => play(trackB, [trackA, trackB])}>playB</button>
      <button onClick={close}>close</button>
      <button onClick={() => seek(42)}>seek</button>
      <button onClick={() => skipForward()}>skipForward</button>
      <button onClick={() => skipBack()}>skipBack</button>
      <button onClick={next}>next</button>
      <button onClick={prev}>prev</button>
      <button onClick={toggleShuffle}>toggleShuffle</button>
      <button onClick={cycleRepeat}>cycleRepeat</button>
      <button onClick={dismissPlaybackError}>dismissError</button>
    </div>
  );
}

beforeEach(() => {
  audioEl = null;

  const RealAudio = window.Audio;
  class TrackedAudio extends RealAudio {
    constructor(...args: [string?]) {
      super(...args);
      audioEl = this as unknown as HTMLAudioElement;
      audioConstructor = this as unknown as HTMLAudioElement;
    }
  }
  vi.stubGlobal('Audio', TrackedAudio);

  // The browser fires `playing` when a play() promise resolves; jsdom's stubbed
  // media element does not, and the provider records listens from that event.
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function play(
    this: HTMLMediaElement
  ) {
    queueMicrotask(() => this.dispatchEvent(new Event('playing')));
    return Promise.resolve();
  });
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
});

function mount() {
  render(
    <PlayerProvider>
      <Harness />
    </PlayerProvider>
  );
}

const read = (id: string) => screen.getByTestId(id).textContent;

describe('PlayerProvider', () => {
  it('exposes the analyser once playback starts, not only on first render', async () => {
    mount();
    expect(read('analyser')).toBe('null');

    await userEvent.click(screen.getByText('playA'));

    // This is what the visualiser depends on. Before the fix this stayed null
    // because it was held in a ref, which never triggers a re-render.
    expect(read('analyser')).toBe('ready');
  });

  it('sets a track source and marks the player playing', async () => {
    mount();
    await userEvent.click(screen.getByText('playA'));

    expect(read('track')).toBe('a');
    expect(read('playing')).toBe('true');
  });

  it('advances to the next track on ended', async () => {
    mount();
    await userEvent.click(screen.getByText('playA'));

    act(() => {
      audioEl?.dispatchEvent(new Event('ended'));
    });

    expect(read('track')).toBe('b');
  });

  it('stops at the end of the playlist instead of wrapping around', async () => {
    mount();
    await userEvent.click(screen.getByText('playB'));

    act(() => {
      audioEl?.dispatchEvent(new Event('ended'));
    });

    expect(read('track')).toBe('b');
    expect(read('playing')).toBe('false');
  });

  it('records a listen only after playback actually begins', async () => {
    mount();
    await userEvent.click(screen.getByText('playA'));

    expect(api.recordListen).toHaveBeenCalledWith('a');
  });

  it('does not double-count a listen when the same track is replayed within a minute', async () => {
    mount();
    await userEvent.click(screen.getByText('playA'));
    await userEvent.click(screen.getByText('playA'));

    expect(api.recordListen).toHaveBeenCalledTimes(1);
  });

  it('clears the current track on close', async () => {
    mount();
    await userEvent.click(screen.getByText('playA'));
    expect(read('track')).toBe('a');

    await userEvent.click(screen.getByText('close'));

    expect(read('track')).toBe('none');
    expect(read('playing')).toBe('false');
  });

  it('seeks to the requested time', async () => {
    mount();
    await userEvent.click(screen.getByText('playA'));

    await userEvent.click(screen.getByText('seek'));

    expect(read('progress')).toBe('42');
  });

  it('skips forward and back relative to where playback already is', async () => {
    mount();
    await userEvent.click(screen.getByText('playA'));
    await userEvent.click(screen.getByText('seek'));

    await userEvent.click(screen.getByText('skipForward'));
    expect(audioEl?.currentTime).toBe(52);

    await userEvent.click(screen.getByText('skipBack'));
    expect(audioEl?.currentTime).toBe(42);
  });

  it('does not let a backward skip run off the start of the track', async () => {
    mount();
    await userEvent.click(screen.getByText('playA'));

    await userEvent.click(screen.getByText('skipBack'));

    expect(audioEl?.currentTime).toBe(0);
  });

  it('stops a forward skip at the end of the track once duration is known', async () => {
    mount();
    await userEvent.click(screen.getByText('playA'));

    // duration is unknown until metadata arrives; `NaN` must not be read as 0,
    // which would rewind instead of skipping.
    expect(Number.isNaN(audioEl?.duration)).toBe(true);
    await userEvent.click(screen.getByText('skipForward'));
    expect(audioEl?.currentTime).toBe(10);

    Object.defineProperty(audioEl, 'duration', { configurable: true, value: 60 });
    audioEl!.currentTime = 55;

    await userEvent.click(screen.getByText('skipForward'));
    expect(audioEl?.currentTime).toBe(60);

    // Already at the end: the clamp must not push past it.
    await userEvent.click(screen.getByText('skipForward'));
    expect(audioEl?.currentTime).toBe(60);
  });

  it('reports buffering while the media stalls and clears it when it can play', async () => {
    mount();
    await userEvent.click(screen.getByText('playA'));

    act(() => {
      audioEl?.dispatchEvent(new Event('waiting'));
    });
    expect(read('buffering')).toBe('true');

    act(() => {
      audioEl?.dispatchEvent(new Event('canplay'));
    });
    expect(read('buffering')).toBe('false');
  });

  it('steps to the previous track', async () => {
    mount();
    await userEvent.click(screen.getByText('playB'));

    await userEvent.click(screen.getByText('prev'));

    expect(read('track')).toBe('a');
  });

  it('does nothing on next at the end of the playlist', async () => {
    mount();
    await userEvent.click(screen.getByText('playB'));

    await userEvent.click(screen.getByText('next'));

    expect(read('track')).toBe('b');
  });

  it('keeps a single audio element for the life of the provider', async () => {
    mount();
    await userEvent.click(screen.getByText('playA'));
    const first = audioConstructor;

    await userEvent.click(screen.getByText('playB'));

    expect(audioConstructor).toBe(first);
  });
});

describe('shuffle and repeat', () => {
  const endCurrent = () =>
    act(() => {
      audioEl?.dispatchEvent(new Event('ended'));
    });

  it('wraps to the first track at the end when repeat is all', async () => {
    mount();
    await userEvent.click(screen.getByText('cycleRepeat'));
    expect(read('repeat')).toBe('all');

    await userEvent.click(screen.getByText('playB'));
    endCurrent();

    expect(read('track')).toBe('a');
  });

  it('replays the same track when repeat is one', async () => {
    mount();
    await userEvent.click(screen.getByText('cycleRepeat'));
    await userEvent.click(screen.getByText('cycleRepeat'));
    expect(read('repeat')).toBe('one');

    await userEvent.click(screen.getByText('playA'));
    endCurrent();

    // Repeat-one must not advance to track B, and it must not stop either.
    expect(read('track')).toBe('a');
    expect(read('playing')).toBe('true');
  });

  it('lets next step forward even with repeat one, so the button is not a trap', async () => {
    mount();
    await userEvent.click(screen.getByText('cycleRepeat'));
    await userEvent.click(screen.getByText('cycleRepeat'));
    await userEvent.click(screen.getByText('playA'));

    await userEvent.click(screen.getByText('next'));

    expect(read('track')).toBe('b');
  });

  it('keeps next sequential while shuffle is on', async () => {
    mount();
    await userEvent.click(screen.getByText('toggleShuffle'));
    await userEvent.click(screen.getByText('playA'));

    await userEvent.click(screen.getByText('next'));

    expect(read('track')).toBe('b');
  });

  it('auto-advances to a different track when shuffle is on', async () => {
    // Force the draw to the only other track.
    vi.spyOn(Math, 'random').mockReturnValue(0.75);
    mount();
    await userEvent.click(screen.getByText('toggleShuffle'));
    await userEvent.click(screen.getByText('playB'));

    endCurrent();

    expect(read('track')).toBe('a');
    vi.restoreAllMocks();
  });

  it('never repeats the current track when shuffle draws it again', async () => {
    // Drawing index 0 while track A is playing must be nudged off A.
    vi.spyOn(Math, 'random').mockReturnValue(0);
    mount();
    await userEvent.click(screen.getByText('toggleShuffle'));
    await userEvent.click(screen.getByText('playA'));

    endCurrent();

    expect(read('track')).toBe('b');
    vi.restoreAllMocks();
  });

  it('cycles repeat through off, all, one and back', async () => {
    mount();
    expect(read('repeat')).toBe('off');

    await userEvent.click(screen.getByText('cycleRepeat'));
    expect(read('repeat')).toBe('all');
    await userEvent.click(screen.getByText('cycleRepeat'));
    expect(read('repeat')).toBe('one');
    await userEvent.click(screen.getByText('cycleRepeat'));
    expect(read('repeat')).toBe('off');
  });

  it('toggles shuffle on and off', async () => {
    mount();
    expect(read('shuffle')).toBe('false');

    await userEvent.click(screen.getByText('toggleShuffle'));
    expect(read('shuffle')).toBe('true');
    await userEvent.click(screen.getByText('toggleShuffle'));
    expect(read('shuffle')).toBe('false');
  });
});

describe('playback errors', () => {
  it('reports a media error instead of leaving the play button inert', async () => {
    mount();
    await userEvent.click(screen.getByText('playA'));

    act(() => {
      audioEl?.dispatchEvent(new Event('error'));
    });

    expect(read('error')).not.toBe('none');
    expect(read('playing')).toBe('false');
  });

  it('does not report an aborted load, which track changes trigger', async () => {
    mount();
    await userEvent.click(screen.getByText('playA'));

    // MediaError code 1 is MEDIA_ERR_ABORTED: what `close()` and reassigning
    // `src` cause. Surfacing it would flash an error on every track change.
    Object.defineProperty(audioEl, 'error', {
      configurable: true,
      value: { code: 1 },
    });
    act(() => {
      audioEl?.dispatchEvent(new Event('error'));
    });

    expect(read('error')).toBe('none');
  });

  it('clears a previous error when a new track starts', async () => {
    mount();
    await userEvent.click(screen.getByText('playA'));

    Object.defineProperty(audioEl, 'error', {
      configurable: true,
      value: { code: 2 },
    });
    act(() => {
      audioEl?.dispatchEvent(new Event('error'));
    });
    expect(read('error')).not.toBe('none');

    await userEvent.click(screen.getByText('playB'));

    expect(read('error')).toBe('none');
  });

  it('clears the error on request so the player can be dismissed', async () => {
    mount();
    await userEvent.click(screen.getByText('playA'));
    act(() => {
      audioEl?.dispatchEvent(new Event('error'));
    });

    await userEvent.click(screen.getByText('dismissError'));

    expect(read('error')).toBe('none');
  });
});