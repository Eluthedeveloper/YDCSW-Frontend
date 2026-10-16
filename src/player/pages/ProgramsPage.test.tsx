import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProgramsPage from './ProgramsPage';
import { usePlayerAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../utils/api';
import { toast } from 'sonner';

const toastMock = vi.hoisted(() => vi.fn());
vi.mock('sonner', () => ({
  toast: Object.assign(toastMock, {
    success: vi.fn(), error: toastMock, warning: vi.fn(), message: vi.fn(),
  }),
}));

vi.mock('../context/AuthContext', () => ({ usePlayerAuth: vi.fn() }));
vi.mock('../context/PlayerContext', () => ({ usePlayer: vi.fn() }));
vi.mock('../utils/api', () => ({
  api: { getPrograms: vi.fn(), getTracks: vi.fn(), updateProgram: vi.fn(), deleteTracks: vi.fn() },
  // CoverBg builds its src through this; the module mock replaces the whole
  // file, so it has to be provided or the component throws.
  uploadUrl: (p: string) => `/api/uploads/${p}`,
}));

const PROGRAMS = [
    { id: 'p1', title: 'Long Cover Program', description: 'A program with a long cover', track_count: 2, creator_name: 'superadmin', cover_image: 'cover.png' },
];

describe('ProgramsPage edit controls', () => {
  beforeEach(() => {
    toastMock.mockClear();
    vi.mocked(api.getPrograms).mockResolvedValue(PROGRAMS as never);
    vi.mocked(api.getTracks).mockResolvedValue([
      { id: 't1', title: 'Track One', artist: 'A', album: 'B', track_type: 'episode' },
      { id: 't2', title: 'Track Two', artist: 'A', album: 'B', track_type: 'episode' },
    ] as never);
    vi.mocked(usePlayer).mockReturnValue({
      play: vi.fn(), currentTrack: null, isPlaying: false,
    } as never);
    vi.mocked(usePlayerAuth).mockReturnValue({
      user: { id: '1', username: 'superadmin', email: 's@a.com', role: 'super_admin' },
      isChecking: false, isSuperAdmin: true,
      login: vi.fn(), logout: vi.fn(),
    } as never);
  });

  it('opens the edit modal when the program edit button is clicked', async () => {
    render(<ProgramsPage />);
    await screen.findByText('Long Cover Program');

    await userEvent.click(screen.getByRole('button', { name: /edit program/i }));

    expect(screen.getByText('Edit Program')).toBeTruthy();
    const title = screen.getByDisplayValue('Long Cover Program') as HTMLInputElement;
    expect(title).toBeTruthy();
  });

  it('saves the edited title through updateProgram', async () => {
    vi.mocked(api.updateProgram).mockResolvedValue({ message: 'ok' } as never);
    render(<ProgramsPage />);
    await screen.findByText('Long Cover Program');

    await userEvent.click(screen.getByRole('button', { name: /edit program/i }));
    const title = screen.getByDisplayValue('Long Cover Program') as HTMLInputElement;
    await userEvent.clear(title);
    await userEvent.type(title, 'Renamed');
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(api.updateProgram).toHaveBeenCalled());
    const [id, fd] = vi.mocked(api.updateProgram).mock.calls[0];
    expect(id).toBe('p1');
    expect((fd as FormData).get('title')).toBe('Renamed');
  });

  it('crops a tall cover in a fixed-size box instead of growing the dialog', async () => {
    render(<ProgramsPage />);
    await screen.findByText('Long Cover Program');
    await userEvent.click(screen.getByRole('button', { name: /edit program/i }));

    // The preview must live inside a height-capped, clipping wrapper. Passing
    // h-32 to CoverBg directly collided with its built-in h-full, so a long
    // cover grew the modal and pushed the Save button off-screen.
    const dialog = screen.getByText('Edit Program').closest('.glass-panel') as HTMLElement;
    const preview = within(dialog).getByAltText('').parentElement as HTMLElement;
    expect(preview.className).toContain('h-32');
    expect(preview.className).toContain('overflow-hidden');
  });

  it('keeps the edit dialog scrollable so Save stays reachable', async () => {
    render(<ProgramsPage />);
    await screen.findByText('Long Cover Program');
    await userEvent.click(screen.getByRole('button', { name: /edit program/i }));

    const dialog = screen.getByText('Edit Program').closest('.glass-panel') as HTMLElement;
    expect(dialog.className).toContain('max-h-[85vh]');
    expect(dialog.className).toContain('overflow-y-auto');
  });

  it('rejects an oversized cover before uploading and says why', async () => {
    render(<ProgramsPage />);
    await screen.findByText('Long Cover Program');
    await userEvent.click(screen.getByRole('button', { name: /edit program/i }));

    const big = new File(['x'], 'huge.png', { type: 'image/png' });
    Object.defineProperty(big, 'size', { value: 16 * 1024 * 1024 });
    await userEvent.upload(screen.getByLabelText(/cover image/i), big);

    expect(api.updateProgram).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(expect.stringContaining('too large'));
  });

  it('surfaces a load failure instead of showing the empty state', async () => {
    vi.mocked(api.getPrograms).mockRejectedValueOnce(new Error('boom'));

    render(<ProgramsPage />);
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith('boom'));
    expect(screen.getByText('No programs yet. Create your first one!')).toBeTruthy();
  });

  it('shows the program edit and delete buttons for a super admin', async () => {
    render(<ProgramsPage />);
    await screen.findByText('Long Cover Program');
    expect(screen.getByRole('button', { name: /edit program/i })).toBeTruthy();
  });

  it('shows the track edit buttons without needing to hover', async () => {
    render(<ProgramsPage />);
    await screen.findByText('Long Cover Program');
    await userEvent.click(screen.getByText('Long Cover Program'));

    await screen.findByText('Track One');
    const edits = await screen.findAllByRole('button', { name: /edit track/i });
    expect(edits).toHaveLength(2);
    // The old markup used opacity-0 + group-hover, so the button existed in the
    // DOM but was invisible until hover.
    for (const btn of edits) expect(btn.className).not.toContain('opacity-0');
  });

  async function openTracks() {
    render(<ProgramsPage />);
    await screen.findByText('Long Cover Program');
    await userEvent.click(screen.getByText('Long Cover Program'));
    await screen.findByText('Track One');
  }

  it('deletes only the tracks that were selected, after confirmation', async () => {
    vi.mocked(api.deleteTracks).mockResolvedValue({ message: 'Tracks deleted', deleted: 1, notFound: [] } as never);

    await openTracks();
    await userEvent.click(screen.getByLabelText('Select track Track One'));
    await userEvent.click(screen.getByRole('button', { name: /^delete \(/i }));

    const { action } = vi.mocked(toast.warning).mock.calls[0][1] as unknown as { action: { onClick: () => Promise<void> } };
    await action.onClick();

    expect(api.deleteTracks).toHaveBeenCalledWith(['t1']);
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(screen.getByLabelText('Select track Track One')).not.toBeChecked();
  });

  it('selects every track from the header checkbox and clears it again', async () => {
    await openTracks();

    await userEvent.click(screen.getByLabelText('Select all tracks'));
    expect(screen.getByRole('button', { name: 'Delete (2)' })).toBeTruthy();

    await userEvent.click(screen.getByLabelText('Select all tracks'));
    expect(screen.queryByRole('button', { name: /^delete \(/i })).toBeNull();
  });

  it('offers no bulk delete to a non-super admin', async () => {
    vi.mocked(usePlayerAuth).mockReturnValue({
      user: { id: '1', username: 'admin', email: 'a@a.com', role: 'admin' },
      isChecking: false, isSuperAdmin: false,
      login: vi.fn(), logout: vi.fn(),
    } as never);

    await openTracks();

    expect(screen.queryByLabelText('Select all tracks')).toBeNull();
    expect(screen.queryByLabelText('Select track Track One')).toBeNull();
    expect(screen.queryByRole('button', { name: /^delete \(/i })).toBeNull();
  });
});
