import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import '../i18n';
import NotificationBell from './NotificationBell';
import { api } from '../player/utils/api';
import type { WhatsNewItem } from '../player/utils/types';

vi.mock('../player/utils/api', () => ({
  api: { getWhatsNew: vi.fn() },
  uploadUrl: (path: string) => `/api/uploads/${path}`,
}));

const getWhatsNew = api.getWhatsNew as ReturnType<typeof vi.fn>;

const SEEN_KEY = 'yd_whats_new_seen';

function feed(minutesAgo: number): WhatsNewItem[] {
  return [
    {
      id: 'a1',
      type: 'announcement',
      title: 'New building dedicated',
      summary: 'The new worship centre opened on Sunday.',
      image: null,
      url: '/',
      published_at: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
    },
  ];
}

function renderBell() {
  return render(
    <MemoryRouter>
      <NotificationBell />
    </MemoryRouter>
  );
}

describe('NotificationBell', () => {
  beforeEach(() => {
    getWhatsNew.mockReset();
    localStorage.clear();
  });

  it('stays quiet for content the visitor has already seen', async () => {
    // The baseline is "now", so a feed that is older than the visit blinks
    // at nothing.
    localStorage.setItem(SEEN_KEY, String(Date.now()));
    getWhatsNew.mockResolvedValue(feed(30));

    renderBell();

    expect(await screen.findByRole('button', { name: "What's New" })).toBeInTheDocument();
  });

  it('blinks on a first visit for content inside the grace window', async () => {
    // No stored timestamp: this browser has never picked the feed, so a
    // two-day-old post must still count as unseen.
    getWhatsNew.mockResolvedValue(feed(2 * 24 * 60));

    renderBell();

    const trigger = await screen.findByRole('button', { name: /new update/ });
    expect(trigger).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('stays quiet on a first visit for content older than the grace window', async () => {
    getWhatsNew.mockResolvedValue(feed(8 * 24 * 60));

    renderBell();

    expect(await screen.findByRole('button', { name: "What's New" })).toBeInTheDocument();
  });

  it('blinks with a count for an update posted after the last visit', async () => {
    localStorage.setItem(SEEN_KEY, String(Date.now() - 60 * 60_000));
    getWhatsNew.mockResolvedValue(feed(5));

    renderBell();

    const trigger = await screen.findByRole('button', { name: /new update/ });
    expect(trigger).toBeInTheDocument();
    // The count badge is what the visitor actually reads.
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(trigger.className).toContain('animate-bell-blink');
  });

  it('lists the unseen item and clears the badge once acknowledged', async () => {
    localStorage.setItem(SEEN_KEY, String(Date.now() - 60 * 60_000));
    getWhatsNew.mockResolvedValue(feed(5));

    const user = userEvent.setup();
    renderBell();

    const trigger = await screen.findByRole('button', { name: /new update/ });
    await user.click(trigger);

    expect(await screen.findByText('New building dedicated')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /mark all as read/i }));

    expect(screen.getByRole('button', { name: "What's New" })).toBeInTheDocument();
    expect(localStorage.getItem(SEEN_KEY)).toBeTruthy();
  });
});
