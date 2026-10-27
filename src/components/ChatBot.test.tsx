import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import '../i18n';
import i18n from '../i18n';
import ChatBot from './ChatBot';

const fetchMock = vi.fn();

function renderBot(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ChatBot />
    </MemoryRouter>
  );
}

describe('ChatBot', () => {
  beforeEach(async () => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    await i18n.changeLanguage('en');
  });

  it('opens the panel with the greeting and suggested questions', async () => {
    const user = userEvent.setup();
    renderBot();

    await user.click(screen.getByRole('button', { name: 'Open chat' }));

    expect(screen.getByRole('dialog', { name: /Yemisrach Dimts Assistant/ })).toBeInTheDocument();
    expect(screen.getByText(/Hello! I'm the Yemisrach Dimts assistant/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'What does Yemisrach Dimts do?' })).toBeInTheDocument();
  });

  it('posts the question and shows the assistant reply', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ reply: 'We are a Christian media ministry based in Addis Ababa.' }),
    });

    const user = userEvent.setup();
    renderBot();

    await user.click(screen.getByRole('button', { name: 'Open chat' }));
    await user.type(screen.getByRole('textbox'), 'What do you do?');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(
      await screen.findByText('We are a Christian media ministry based in Addis Ababa.')
    ).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/api/chat');
    const body = JSON.parse(String(init.body));
    expect(body.messages).toEqual([{ role: 'user', text: 'What do you do?' }]);
    expect(body.lang).toBe('en');
    // The API key belongs on the server; the browser payload must never carry it.
    expect(String(init.body)).not.toContain('GEMINI');
  });

  it('keeps the conversation when a request fails and lets the visitor retry', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({ error: 'unavailable' }),
    });

    const user = userEvent.setup();
    renderBot();

    await user.click(screen.getByRole('button', { name: 'Open chat' }));
    await user.type(screen.getByRole('textbox'), 'Where are your bookshops?');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't answer that just now/i);
    // The visitor's question stays on screen so it does not have to be retyped.
    expect(screen.getByText('Where are your bookshops?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });

  it('starts a fresh conversation on request', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ reply: 'Yes, all programmes are free to listen to.' }),
    });

    const user = userEvent.setup();
    renderBot();

    await user.click(screen.getByRole('button', { name: 'Open chat' }));
    await user.type(screen.getByRole('textbox'), 'Is it free?');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    await screen.findByText('Yes, all programmes are free to listen to.');

    await user.click(screen.getByRole('button', { name: 'Start a new chat' }));

    expect(screen.queryByText('Yes, all programmes are free to listen to.')).not.toBeInTheDocument();
    expect(screen.getByText(/Hello! I'm the Yemisrach Dimts assistant/)).toBeInTheDocument();
  });

  it('stays out of the admin screens', () => {
    renderBot('/admin/player/programs');
    expect(screen.queryByRole('button', { name: 'Open chat' })).not.toBeInTheDocument();
  });
});
