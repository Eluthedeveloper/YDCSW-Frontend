import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AudioPlayer from './AudioPlayer';
import { usePlayer } from '../context/PlayerContext';
import { useTrackLike } from '../hooks/useTrackLike';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }) }));

vi.mock('../context/PlayerContext', () => ({ usePlayer: vi.fn() }));
vi.mock('../hooks/useTrackLike', () => ({ useTrackLike: vi.fn() }));

// Pulls in a canvas and the Web Audio graph; neither is what this file checks.
vi.mock('./WaveSpectrum', () => ({ default: () => null }));

vi.mock('../utils/api', () => ({
  uploadUrl: (p: string) => `/api/uploads/${p}`,
}));

const TRACK = {
  id: 't1',
  title: 'Track One',
  artist: 'Artist',
  program_cover: null,
};

const player = {
  currentTrack: null as typeof TRACK | null,
  isPlaying: false,
  isBuffering: false,
  volume: 0.8,
  progress: 0,
  duration: 200,
  isSeeking: false,
  shuffle: false,
  repeatMode: 'off' as const,
  playbackError: null,
  analyserNode: null,
  play: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  seek: vi.fn(),
  startSeeking: vi.fn(),
  endSeeking: vi.fn(),
  setVolume: vi.fn(),
  next: vi.fn(),
  prev: vi.fn(),
  skipForward: vi.fn(),
  skipBack: vi.fn(),
  close: vi.fn(),
  toggleShuffle: vi.fn(),
  cycleRepeat: vi.fn(),
  dismissPlaybackError: vi.fn(),
};

/** The document-level flag the CSS reserves footer space from. */
const playerFlag = () => document.documentElement.dataset.player;

describe('AudioPlayer layout reservation', () => {
  beforeEach(() => {
    vi.mocked(usePlayer).mockReturnValue(player as never);
    vi.mocked(useTrackLike).mockReturnValue({ liked: false, count: 0, toggle: vi.fn() } as never);
  });

  afterEach(() => {
    delete document.documentElement.dataset.player;
  });

  it('reserves no space while no track is loaded', () => {
    render(<AudioPlayer />);
    expect(playerFlag()).toBeUndefined();
  });

  it('reserves space for the fixed bar once a track is playing', () => {
    // The bar is `position: fixed`, so without this flag the document ends
    // exactly where the footer ends and the bar covers its last rows.
    player.currentTrack = TRACK;
    render(<AudioPlayer />);
    expect(playerFlag()).toBe('open');
  });

  it('releases the space when the player is closed', async () => {
    player.currentTrack = TRACK;
    const { unmount } = render(<AudioPlayer />);
    expect(playerFlag()).toBe('open');

    // Closing clears currentTrack, which is what runs the effect's cleanup.
    player.currentTrack = null;
    unmount();
    expect(playerFlag()).toBeUndefined();
  });

  it('closes without leaving the reservation behind', async () => {
    player.currentTrack = TRACK;
    render(<AudioPlayer />);
    expect(playerFlag()).toBe('open');

    await userEvent.click(screen.getAllByRole('button', { name: /close/i })[0]);
    expect(player.close).toHaveBeenCalled();
  });
});
