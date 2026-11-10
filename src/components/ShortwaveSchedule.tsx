import React from "react";
import { useTranslation } from "react-i18next";
import { Radio, Signal } from "lucide-react";
import { useAsyncData } from "../player/hooks/useAsyncData";
import { api } from "../player/utils/api";
import type { ShortwaveEntry } from "../player/utils/types";

/** MySQL `HH:MM:SS` → `HH:MM` for display. */
function shortTime(time: string | null | undefined): string {
  return time ? time.slice(0, 5) : "";
}

/** kHz → MHz for display; whole or one decimal. */
function toMhz(khz: number): string {
  const mhz = khz / 1000;
  return Number.isInteger(mhz) ? String(mhz) : mhz.toFixed(1);
}

export function ShortwaveSchedule(): React.ReactElement {
  const { t } = useTranslation();

  // Same degradation contract as RadioSchedule: an unreachable backend resolves
  // to an empty list and the section simply notes it is updating.
  const { data: entries, loading, error, reload } = useAsyncData<ShortwaveEntry[]>(
    () => api.getShortwaveSchedule().catch(() => []),
    []
  );
  const active = entries.filter((e) => e.active === 1);

  const frequencyCell = (entry: ShortwaveEntry): React.ReactElement => (
    <div className="flex items-baseline gap-2">
      <span className="text-lg font-semibold tabular-nums text-foreground">{toMhz(entry.frequency_khz)}</span>
      <span className="text-xs uppercase tracking-widest text-muted-foreground">MHz</span>
      <span className="text-xs text-muted-foreground/70">{entry.frequency_khz.toLocaleString()} kHz</span>
    </div>
  );

  return (
    <section className="bg-secondary pb-24 lg:pb-32">
      <div className="mx-auto max-w-6xl px-6 lg:px-12">
        <div className="text-center">
          <p className="flex inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-gold">
            <Signal size={12} /> {t("home.schedule.tag")}
          </p>
          <h2 className="mt-4 flex items-center justify-center gap-3 font-serif text-4xl text-foreground sm:text-5xl">
            <Radio size={28} className="text-gold" /> {t("home.shortwave.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            {t("home.shortwave.desc")}
          </p>
        </div>

        <div className="mt-14">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-elegant)]">
            <div className="grid grid-cols-4 gap-3 border-b border-border bg-muted/40 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:px-8">
              <span>{t("home.shortwave.time")}</span>
              <span>{t("home.shortwave.frequency")}</span>
              <span>{t("home.shortwave.language")}</span>
              <span>{t("home.shortwave.program")}</span>
            </div>

            {loading ? (
              <div className="px-8 py-10 text-sm text-muted-foreground">{t("home.shortwave.loading")}</div>
            ) : active.length === 0 ? (
              <div className="px-8 py-10 text-sm text-muted-foreground">{t("home.shortwave.empty")}</div>
            ) : (
              <div className="divide-y divide-border max-h-[420px] overflow-y-auto">
                {active.map((entry) => (
                  <div key={entry.id} className="grid grid-cols-4 gap-3 px-6 py-3 transition hover:bg-muted/40 sm:px-8">
                    <span className="font-medium tabular-nums text-foreground">
                      {shortTime(entry.start_time)}
                      {entry.end_time ? ` – ${shortTime(entry.end_time)}` : ""}
                    </span>
                    {frequencyCell(entry)}
                    <span className="text-sm text-muted-foreground">
                      {entry.language ?? ""}
                      {entry.target ? ` · ${entry.target}` : ""}
                    </span>
                    <span className="text-sm text-foreground truncate">{entry.program ?? ""}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {(error || loading) && (
            <p className="mt-3 text-center text-xs text-muted-foreground/70">
              {error ? (
                <button type="button" onClick={reload} className="underline transition hover:text-gold">
                  {t("home.shortwave.reload")}
                </button>
              ) : (
                t("home.shortwave.loading")
              )}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
