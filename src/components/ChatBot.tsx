import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { MessageCircle, X, Send, RotateCcw } from 'lucide-react';
import { API_BASE } from '../lib/apiBase';

/**
 * Floating visitor assistant.
 *
 * The component never talks to Gemini directly: it posts the conversation to
 * `/api/chat`, which holds the API key and the organisation knowledge. Mounted
 * once in the app shell so a conversation survives page navigation, and hidden
 * on the admin screens where it would only get in the way.
 */

type Role = 'user' | 'assistant';

interface ChatMessage {
  id: string;
  role: Role;
  text: string;
}

// Mirrors the server's limits. Trimming here too means an over-long paste is
// caught instantly instead of after a round trip.
const MAX_MESSAGE_CHARS = 1500;
const MAX_HISTORY = 12;

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Renders the assistant's plain-text answer.
 *
 * The model is asked for plain text with "-" bullets and occasional bold. This
 * builds React elements from that text; nothing is ever passed to
 * dangerouslySetInnerHTML, so a prompt-injected reply cannot inject markup.
 */
function MessageBody({ text }: { text: string }) {
  const lines = text.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];

  const inline = (value: string, keyPrefix: string): ReactNode[] => {
    // Bold first, then links inside the remaining text.
    return value.split(/(\*\*[^*]+\*\*)/g).flatMap((piece, index) => {
      const key = `${keyPrefix}-${index}`;
      if (/^\*\*[^*]+\*\*$/.test(piece)) {
        return [<strong key={key}>{piece.slice(2, -2)}</strong>];
      }
      return piece.split(/(https?:\/\/[^\s<>()]+|[\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g).map((part, partIndex) => {
        const partKey = `${key}-${partIndex}`;
        if (/^https?:\/\//.test(part)) {
          return (
            <a
              key={partKey}
              href={part}
              target="_blank"
              rel="noreferrer noopener"
              className="underline underline-offset-2 hover:text-gold"
            >
              {part}
            </a>
          );
        }
        if (/^[\w.+-]+@[\w-]+(?:\.[\w-]+)+$/.test(part)) {
          return (
            <a key={partKey} href={`mailto:${part}`} className="underline underline-offset-2 hover:text-gold">
              {part}
            </a>
          );
        }
        return <span key={partKey}>{part}</span>;
      });
    });
  };

  const flushBullets = () => {
    if (bullets.length === 0) return;
    const items = bullets;
    bullets = [];
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="my-1 list-disc space-y-0.5 pl-4">
        {items.map((item, index) => (
          <li key={index}>{inline(item, `li-${blocks.length}-${index}`)}</li>
        ))}
      </ul>
    );
  };

  lines.forEach((line, index) => {
    const bullet = /^\s*[-•*]\s+(.*)$/.exec(line);
    if (bullet) {
      bullets.push(bullet[1]);
      return;
    }
    flushBullets();
    if (line.trim() === '') return;
    blocks.push(
      <p key={`p-${index}`} className="whitespace-pre-wrap">
        {inline(line, `p-${index}`)}
      </p>
    );
  });
  flushBullets();

  return <div className="space-y-1.5">{blocks}</div>;
}

export default function ChatBot() {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  // `sending` drives the UI; the ref blocks a second submit in the same tick,
  // before React has rendered the disabled button.
  const sendingRef = useRef(false);

  const suggestions = t('chat.suggestions', { returnObjects: true }) as unknown as string[];

  useEffect(() => {
    if (!open) return;
    // Wait for the panel to be laid out before focusing, otherwise the mobile
    // keyboard opens while the panel is still animating in and the view shifts.
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, sending, error, open]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const send = useCallback(
    async (raw?: string) => {
      const text = (raw ?? input).trim();
      if (!text || sendingRef.current) return;

      if (text.length > MAX_MESSAGE_CHARS) {
        setError(t('chat.tooLong', { max: MAX_MESSAGE_CHARS }));
        return;
      }

      const userMessage: ChatMessage = { id: newId(), role: 'user', text };
      const history = [...messages, userMessage].slice(-MAX_HISTORY);

      setMessages(history);
      setInput('');
      setError('');
      setSending(true);
      sendingRef.current = true;

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(`${API_BASE}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: history.map((m) => ({ role: m.role, text: m.text })),
            // The server understands "en", "am" and "om"; a regional tag from
            // a stored preference ("am-ET") is reduced to its base language.
            lang: i18n.language.split('-')[0],
          }),
          signal: controller.signal,
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || typeof data.reply !== 'string' || !data.reply.trim()) {
          setError(res.status === 429 ? t('chat.errorRate') : t('chat.errorGeneric'));
          return;
        }

        setMessages((prev) => [
          ...prev,
          { id: newId(), role: 'assistant', text: String(data.reply) },
        ]);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof TypeError ? t('chat.errorOffline') : t('chat.errorGeneric'));
      } finally {
        // A reset or a newer send may already own the state; only the request
        // that is still current may clear it.
        if (abortRef.current === controller) {
          abortRef.current = null;
          sendingRef.current = false;
          setSending(false);
        }
      }
    },
    [i18n.language, input, messages, t]
  );

  const reset = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    sendingRef.current = false;
    setMessages([]);
    setInput('');
    setError('');
    setSending(false);
    inputRef.current?.focus();
  };

  // Admin screens have their own workflows and no reason to offer visitor Q&A.
  if (pathname.startsWith('/admin')) return null;

  return (
    <div className="chat-widget">
      {open && (
        <section
          className="chat-panel flex flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-[var(--shadow-elegant)] dark:border-white/10 dark:bg-dark-700"
          role="dialog"
          aria-label={t('chat.title')}
        >
          <header className="relative flex items-start gap-3 bg-[image:var(--gradient-divine)] px-4 py-3.5 text-background">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold">
              <MessageCircle size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate font-serif text-lg leading-tight">{t('chat.title')}</h2>
                <span className="flex shrink-0 items-center gap-1 text-[10px] uppercase tracking-wider text-background/70">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                  {t('chat.online')}
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs text-background/70">{t('chat.subtitle')}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={reset}
                  title={t('chat.reset')}
                  aria-label={t('chat.reset')}
                  className="rounded-full p-1.5 text-background/70 transition hover:bg-white/10 hover:text-background"
                >
                  <RotateCcw size={15} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                title={t('chat.close')}
                aria-label={t('chat.close')}
                className="rounded-full p-1.5 text-background/70 transition hover:bg-white/10 hover:text-background"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto bg-secondary/40 px-3.5 py-4 dark:bg-dark-800/60"
            role="log"
            aria-live="polite"
            aria-relevant="additions"
          >
            {messages.length === 0 && (
              <>
                <div className="flex items-start gap-2">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-gold">
                    <MessageCircle size={12} />
                  </span>
                  <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-border bg-card px-3.5 py-2.5 text-sm leading-relaxed text-card-foreground dark:border-white/10 dark:bg-dark-600 dark:text-dark-50">
                    {t('chat.greeting')}
                  </div>
                </div>

                <div className="pt-1">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground dark:text-dark-200">
                    {t('chat.suggestionsLabel')}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(Array.isArray(suggestions) ? suggestions : []).map((question) => (
                      <button
                        key={question}
                        type="button"
                        onClick={() => send(question)}
                        className="rounded-full border border-border bg-card px-3 py-1.5 text-left text-xs text-foreground transition hover:border-gold hover:bg-accent dark:border-white/10 dark:bg-dark-600 dark:text-dark-50 dark:hover:bg-dark-500"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === 'user'
                    ? 'flex justify-end'
                    : 'flex items-start gap-2'
                }
              >
                {message.role === 'assistant' && (
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-gold">
                    <MessageCircle size={12} />
                  </span>
                )}
                <div
                  className={
                    message.role === 'user'
                      ? 'max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2.5 text-sm leading-relaxed text-primary-foreground'
                      : 'max-w-[85%] rounded-2xl rounded-tl-sm border border-border bg-card px-3.5 py-2.5 text-sm leading-relaxed text-card-foreground dark:border-white/10 dark:bg-dark-600 dark:text-dark-50'
                  }
                >
                  <span className="sr-only">
                    {message.role === 'user' ? t('chat.you') : t('chat.assistant')}:
                  </span>
                  <MessageBody text={message.text} />
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex items-start gap-2" aria-label={t('chat.thinking')}>
                <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-gold">
                  <MessageCircle size={12} />
                </span>
                <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-border bg-card px-3.5 py-3 dark:border-white/10 dark:bg-dark-600">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
                  <span className="sr-only">{t('chat.thinking')}</span>
                </div>
              </div>
            )}

            {error && (
              <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            )}
          </div>

          <div className="border-t border-border bg-background px-3 pb-2.5 pt-2 dark:border-white/10 dark:bg-dark-700">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void send();
              }}
              className="flex items-end gap-2"
            >
              <label htmlFor="site-chat-input" className="sr-only">
                {t('chat.placeholder')}
              </label>
              <textarea
                id="site-chat-input"
                ref={inputRef}
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  if (error) setError('');
                }}
                onKeyDown={(event) => {
                  // Respect IME composition: Enter confirms an Amharic input
                  // candidate and must not send the message.
                  if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    void send();
                  }
                }}
                rows={1}
                maxLength={MAX_MESSAGE_CHARS}
                placeholder={t('chat.placeholder')}
                className="max-h-24 min-h-[2.5rem] flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-gold focus:ring-2 focus:ring-ring/30 dark:border-white/10 dark:bg-dark-800 dark:text-white dark:placeholder:text-dark-200"
              />
              <button
                type="submit"
                disabled={sending || input.trim().length === 0}
                aria-label={t('chat.send')}
                title={t('chat.send')}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send size={17} />
              </button>
            </form>
            <p className="mt-1.5 text-center text-[10px] leading-snug text-muted-foreground dark:text-dark-200">
              {t('chat.disclaimer')}
            </p>
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? t('chat.close') : t('chat.open')}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-[var(--shadow-gold)] ring-1 ring-gold/40 transition hover:scale-[1.03] active:scale-95"
      >
        {open ? <X size={19} /> : <MessageCircle size={20} className="text-gold" />}
        <span className="text-sm font-medium">{open ? t('chat.close') : t('chat.launcher')}</span>
      </button>
    </div>
  );
}
