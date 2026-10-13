// src/components/NotificationBell.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Bell, Newspaper, Megaphone, CalendarDays, CheckCheck, Sparkles } from "lucide-react";
import { api, uploadUrl } from "../player/utils/api";
import type { WhatsNewItem } from "../player/utils/types";

/**
 * "What's new" bell: blogs, announcements and events in one feed.
 *
 * The blink is driven entirely by the client — a timestamp of the last time
 * the visitor acknowledged the feed is kept in localStorage, and anything
 * published after it counts as unseen. That keeps the server stateless (no
 * accounts, no per-visitor rows) while still meaning "new since you last
 * looked" rather than "new since the page loaded".
 */
const SEEN_KEY = "yd_whats_new_seen";
const POLL_MS = 60_000;
const MAX_SHOWN = 8;

/** MySQL `YYYY-MM-DD HH:MM:SS` is parsed as local time, matching the pages. */
function parseTime(value: string | undefined): number {
  if (!value) return 0;
  const parsed = new Date(value.replace(" ", "T")).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function timeAgo(value: string | undefined, locale: string): string {
  const time = parseTime(value);
  if (!time) return "";
  const elapsed = Date.now() - time;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return rtf.format(0, "minute");
  if (minutes < 60) return rtf.format(-minutes, "minute");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  const days = Math.floor(hours / 24);
  if (days < 30) return rtf.format(-days, "day");
  return new Date(time).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });
}

const TYPE_META = {
  blog: { icon: Newspaper, labelKey: "notify.types.blog" },
  announcement: { icon: Megaphone, labelKey: "notify.types.announcement" },
  event: { icon: CalendarDays, labelKey: "notify.types.event" },
} as const;

interface Props {
  /**
   * `navy` sits on the marketing header's dark bar; `panel` sits on the
   * player's glass header, which is light or dark with the theme. Keeping the
   * idle colour per variant avoids two competing text-* utilities in one
   * class list, where the winner depends on stylesheet order rather than the
   * attribute.
   */
  variant?: 'navy' | 'panel';
  /** Extra classes for the trigger (a border, spacing); colours live in `variant`. */
  className?: string;
}

export default function NotificationBell({ variant = 'navy', className = '' }: Props) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState<WhatsNewItem[]>([]);
  const [open, setOpen] = useState(false);
  const [seenAt, setSeenAt] = useState<number>(() => {
    const stored = Number(localStorage.getItem(SEEN_KEY));
    // First visit: start from "now" so a brand-new visitor is not greeted by
    // a bell blinking over content that predates their arrival. The stored
    // value is written immediately so a reload keeps the same baseline.
    const baseline = Number.isFinite(stored) && stored > 0 ? stored : Date.now();
    localStorage.setItem(SEEN_KEY, String(baseline));
    return baseline;
  });
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      api
        .getWhatsNew()
        .then((rows) => {
          if (!cancelled) setItems(rows);
        })
        // A polling bell must never surface an error to the visitor; the
        // next tick retries, and the site works normally without it.
        .catch(() => {});
    };
    load();
    const timer = window.setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const markAllRead = useCallback(() => {
    const now = Date.now();
    localStorage.setItem(SEEN_KEY, String(now));
    setSeenAt(now);
  }, []);

  const unseen = items.filter((item) => parseTime(item.published_at) > seenAt);
  const shown = items.slice(0, MAX_SHOWN);

  const idleClasses =
    variant === 'panel'
      ? 'text-dark-600 dark:text-dark-200 hover:bg-light-300/60 dark:hover:bg-dark-500/50 hover:text-primary-500 dark:hover:text-white'
      : 'text-background/80 hover:bg-gold/10 hover:text-gold';
  const activeClasses =
    variant === 'panel'
      ? 'text-primary-600 dark:text-gold hover:bg-primary-600/10'
      : 'text-gold hover:bg-gold/15';

  const openItem = (item: WhatsNewItem) => {
    // Acknowledge everything on the way out: the visitor has just been shown
    // the list, so re-blinking the same rows after a navigation is noise.
    markAllRead();
    setOpen(false);
    navigate(item.url);
  };

  const unreadLabel = unseen.length === 1 ? t("notify.unreadOne") : t("notify.unreadMany", { count: unseen.length });

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={unseen.length > 0 ? `${t("notify.title")} — ${unreadLabel}` : t("notify.title")}
        aria-expanded={open}
        className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full transition ${
          unseen.length > 0 ? `${activeClasses} animate-bell-blink` : idleClasses
        } ${className}`}
      >
        <Bell size={18} />
        {unseen.length > 0 && (
          <>
            {/* Ping halo: the movement is what catches the eye from across the page. */}
            <span className="pointer-events-none absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-red-500 animate-ping" aria-hidden />
            <span className="absolute -top-0.5 -right-0.5 min-w-[1.05rem] rounded-full bg-red-500 px-1 text-[10px] font-bold leading-[1.05rem] text-white text-center shadow">
              {unseen.length > 9 ? "9+" : unseen.length}
            </span>
          </>
        )}
      </button>

      {open && (
        <div className="fixed left-1/2 top-20 z-50 w-80 max-w-[calc(100vw-2rem)] -translate-x-1/2 overflow-hidden rounded-2xl border border-gold/25 bg-primary/95 text-background shadow-[var(--shadow-elegant)] backdrop-blur sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 sm:max-w-[90vw] sm:translate-x-0">
          <div className="flex items-center justify-between border-b border-gold/15 px-4 py-3">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles size={14} className="text-gold" />
              {t("notify.title")}
            </span>
            {unseen.length > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="flex items-center gap-1 text-[11px] font-medium text-gold/90 transition hover:text-gold"
              >
                <CheckCheck size={13} />
                {t("notify.markAllRead")}
              </button>
            )}
          </div>

          {shown.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-background/60">{t("notify.empty")}</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {shown.map((item) => {
                const meta = TYPE_META[item.type];
                const Icon = meta.icon;
                const isUnseen = parseTime(item.published_at) > seenAt;
                return (
                  <li key={`${item.type}-${item.id}`}>
                    <button
                      type="button"
                      onClick={() => openItem(item)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-gold/10 ${
                        isUnseen ? "bg-gold/5" : ""
                      }`}
                    >
                      <span className="relative mt-0.5 shrink-0">
                        {item.image ? (
                          <img
                            src={uploadUrl(`blogs/${item.image}`)}
                            alt=""
                            className="h-9 w-9 rounded-lg object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/15 text-gold">
                            <Icon size={15} />
                          </span>
                        )}
                        {isUnseen && (
                          <span className="absolute -left-1.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-red-500" aria-hidden />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-gold/80">
                            {t(meta.labelKey)}
                          </span>
                          <span className="text-[10px] text-background/50">{timeAgo(item.published_at, i18n.language)}</span>
                        </span>
                        <span className={`block truncate text-sm ${isUnseen ? "font-semibold text-background" : "font-medium text-background/85"}`}>
                          {item.title}
                        </span>
                        {item.summary && (
                          <span className="mt-0.5 block line-clamp-2 text-xs leading-relaxed text-background/60">
                            {item.summary}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
