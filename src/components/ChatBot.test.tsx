import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import '../i18n';
import i18n from '../i18n';
import ChatBot from './ChatBot';

const fetchMock = vi.fn();
let messageResponse: { ok: boolean; status: number; json: () => Promise<unknown> };

function renderBot(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ChatBot />
    </MemoryRouter>
  );
}

describe('ChatBot', () => {
  beforeEach(async () => {
    messageResponse = { ok: true, status: 200, json: async () => ({}) };
    fetchMock.mockReset();
    fetchMock.mockImplementation((url: string) => {
      if (String(url).includes('/chatbot/suggestions')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ suggestions: ['What does Yemisrach Dimts do?'] }),
        });
      }
      return Promise.resolve(messageResponse);
    });
    vi.stubGlobal('fetch', fetchMock);
    await i18n.changeLanguage('en');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('opens the panel with the greeting and database-provided suggestions', async () => {
    const user = userEvent.setup();
    renderBot();

    await user.click(screen.getByRole('button', { name: 'Open chat' }));

    expect(screen.getByRole('dialog', { name: /Yemisrach Dimts Assistant/ })).toBeInTheDocument();
    expect(screen.getByText(/Hello! I'm the Yemisrach Dimts assistant/)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'What does Yemisrach Dimts do?' })).toBeInTheDocument();
  });

  it('posts the question to the local chatbot API and shows the reply', async () => {
    messageResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        reply: 'We are a Christian media ministry based in Addis Ababa.',
        matched: true,
        confidence: 0.9,
        language: 'en',
        conversationId: 'conv-1',
      }),
    };

    const user = userEvent.setup();
    renderBot();

    await user.click(screen.getByRole('button', { name: 'Open chat' }));
    await user.type(screen.getByRole('textbox'), 'What do you do?');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByText('We are a Christian media ministry based in Addis Ababa.')).toBeInTheDocument();

    const messageCall = fetchMock.mock.calls.find(([url]) => String(url).includes('/chatbot/message'));
    expect(messageCall).toBeDefined();
    const init = messageCall?.[1] as RequestInit;
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body.message).toBe('What do you do?');
    expect(body.lang).toBe('en');
    expect(typeof body.sessionId).toBe('string');
    expect(body.messages).toBeUndefined();
    expect(body.apiKey).toBeUndefined();
  });

  it('sends the selected language with the question', async () => {
    messageResponse = {
      ok: true,
      status: 200,
      json: async () => ({ reply: 'እኛ የክርስቲያን ሚዲያ አገልግሎት ነን።', matched: true, language: 'am' }),
    };

    const user = userEvent.setup();
    renderBot();

    await user.click(screen.getByRole('button', { name: 'Open chat' }));
    await user.selectOptions(screen.getByLabelText('Chat language'), 'am');
    await user.type(screen.getByRole('textbox'), 'ስለእናንተ ንገሩኝ');
    await user.click(screen.getByRole('button', { name: /Send|ላክ/ }));

    await screen.findByText('እኛ የክርስቲያን ሚዲያ አገልግሎት ነን።');
    const call = fetchMock.mock.calls.find(([url]) => String(url).includes('/chatbot/message'));
    expect(JSON.parse(String((call?.[1] as RequestInit).body))).toMatchObject({ lang: 'am' });
  });

  it('keeps the conversation when a request fails and lets the visitor retry', async () => {
    messageResponse = { ok: false, status: 502, json: async () => ({ error: 'unavailable' }) };

    const user = userEvent.setup();
    renderBot();

    await user.click(screen.getByRole('button', { name: 'Open chat' }));
    await user.type(screen.getByRole('textbox'), 'Where are your bookshops?');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't answer that just now/i);
    expect(screen.getByText('Where are your bookshops?')).toBeInTheDocument();
  });

  it('shows the usage-limit message when the assistant is rate limited', async () => {
    messageResponse = { ok: false, status: 429, json: async () => ({ error: 'limited' }) };

    const user = userEvent.setup();
    renderBot();

    await user.click(screen.getByRole('button', { name: 'Open chat' }));
    await user.type(screen.getByRole('textbox'), 'Hello');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/reached its limit/i);
  });

  it('starts a fresh conversation on request', async () => {
    messageResponse = {
      ok: true,
      status: 200,
      json: async () => ({ reply: 'Yes, all programmes are free to listen to.', matched: true }),
    };

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

  it('stays off the streaming subdomain', () => {
    vi.stubGlobal('location', { hostname: 'listen.yemisrachdimts.org' });
    renderBot();
    expect(screen.queryByRole('button', { name: 'Open chat' })).not.toBeInTheDocument();
  });
});
