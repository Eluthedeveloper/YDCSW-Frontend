import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
type Day = (typeof DAYS)[number];

type Program = {
  title: string;
  host: string;
  category: "Worship" | "Teaching" | "Talk" | "Music" | "Live";
};

const SCHEDULE: Record<Day, Record<number, Program>> = {
  Mon: {
    0:  { title: "Midnight Prayer & Worship", host: "Prayer Team", category: "Worship" },
    1:  { title: "GAZ_TTB – Oromo Bible Study", host: "Oromo Team", category: "Teaching" },
    2:  { title: "Morning Devotion (AMH_TTB)", host: "Amharic Team", category: "Teaching" },
    3:  { title: "SOM_TTB – Somali Bible Study", host: "Somali Team", category: "Teaching" },
    4:  { title: "TIR_TW – Tigrinya Worship", host: "Tigrinya Team", category: "Worship" },
    5:  { title: "Children's Bible Hour", host: "Sis. Helen", category: "Talk" },
    6:  { title: "Evening Gospel Music", host: "DJ Mark", category: "Music" },
    7:  { title: "Night Intercession", host: "Prayer Team", category: "Live" },
  },
  Tue: {
    0:  { title: "Midnight Prayer & Worship", host: "Prayer Team", category: "Worship" },
    1:  { title: "GAZ_TTB – Oromo Bible Study", host: "Oromo Team", category: "Teaching" },
    2:  { title: "Morning Devotion (AMH_TTB)", host: "Amharic Team", category: "Teaching" },
    3:  { title: "SOM_TTB – Somali Bible Study", host: "Somali Team", category: "Teaching" },
    4:  { title: "TIR_TW – Tigrinya Worship", host: "Tigrinya Team", category: "Worship" },
    5:  { title: "Youth Talk", host: "Bro. Yonas", category: "Talk" },
    6:  { title: "Live Worship Hour", host: "Worship Team", category: "Live" },
    7:  { title: "Scripture Reflections", host: "Pastor Daniel", category: "Teaching" },
  },
  Wed: {
    0:  { title: "Midnight Prayer & Worship", host: "Prayer Team", category: "Worship" },
    1:  { title: "GAZ_TTB – Oromo Bible Study", host: "Oromo Team", category: "Teaching" },
    2:  { title: "Morning Devotion (AMH_TTB)", host: "Amharic Team", category: "Teaching" },
    3:  { title: "SOM_TTB – Somali Bible Study", host: "Somali Team", category: "Teaching" },
    4:  { title: "TIR_TW – Tigrinya Worship", host: "Tigrinya Team", category: "Worship" },
    5:  { title: "Women of Faith", host: "Mrs. Esther", category: "Talk" },
    6:  { title: "Testimony Time", host: "Mr. Samuel", category: "Talk" },
    7:  { title: "Midweek Revival", host: "Pastor Daniel", category: "Live" },
  },
  Thu: {
    0:  { title: "Midnight Prayer & Worship", host: "Prayer Team", category: "Worship" },
    1:  { title: "GAZ_TTB – Oromo Bible Study", host: "Oromo Team", category: "Teaching" },
    2:  { title: "Morning Devotion (AMH_TTB)", host: "Amharic Team", category: "Teaching" },
    3:  { title: "SOM_TTB – Somali Bible Study", host: "Somali Team", category: "Teaching" },
    4:  { title: "TIR_TW – Tigrinya Worship", host: "Tigrinya Team", category: "Worship" },
    5:  { title: "Community Matters", host: "Mr. Samuel", category: "Talk" },
    6:  { title: "Acoustic Worship", host: "Worship Team", category: "Live" },
    7:  { title: "Evening Scriptures", host: "Bro. John", category: "Teaching" },
  },
  Fri: {
    0:  { title: "Midnight Prayer & Worship", host: "Prayer Team", category: "Worship" },
    1:  { title: "GAZ_TTB – Oromo Bible Study", host: "Oromo Team", category: "Teaching" },
    2:  { title: "Morning Devotion (AMH_TTB)", host: "Amharic Team", category: "Teaching" },
    3:  { title: "SOM_TTB – Somali Bible Study", host: "Somali Team", category: "Teaching" },
    4:  { title: "TIR_TW – Tigrinya Worship", host: "Tigrinya Team", category: "Worship" },
    5:  { title: "Men of Valor", host: "Mr. Samuel", category: "Talk" },
    6:  { title: "Live Friday Revival", host: "Worship Team", category: "Live" },
    7:  { title: "Night Vigil Broadcast", host: "Pastor Daniel", category: "Worship" },
    8:  { title: "Night Vigil Broadcast", host: "Pastor Daniel", category: "Worship" },
  },
  Sat: {
    0:  { title: "Midnight Prayer & Worship", host: "Prayer Team", category: "Worship" },
    1:  { title: "GAZ_TTB – Oromo Bible Study", host: "Oromo Team", category: "Teaching" },
    2:  { title: "Morning Devotion (AMH_TTB)", host: "Amharic Team", category: "Teaching" },
    3:  { title: "SOM_TTB – Somali Bible Study", host: "Somali Team", category: "Teaching" },
    4:  { title: "TIR_TW – Tigrinya Worship", host: "Tigrinya Team", category: "Worship" },
    5:  { title: "Saturday School", host: "Mrs. Esther", category: "Teaching" },
    6:  { title: "Worship Night Preview", host: "Worship Team", category: "Live" },
    7:  { title: "Late Night Gospel", host: "DJ Mark", category: "Music" },
  },
  Sun: {
    0:  { title: "Midnight Prayer & Worship", host: "Prayer Team", category: "Worship" },
    1:  { title: "GAZ_TTB – Oromo Bible Study", host: "Oromo Team", category: "Teaching" },
    2:  { title: "Pre-Service Worship", host: "Worship Team", category: "Worship" },
    3:  { title: "Sunday Main Service", host: "Pastor Daniel", category: "Live" },
    4:  { title: "Sunday School Replay", host: "Mrs. Esther", category: "Teaching" },
    5:  { title: "Afternoon Praise", host: "Sis. Grace", category: "Worship" },
    6:  { title: "Evening Thanksgiving", host: "Pastor Daniel", category: "Live" },
    7:  { title: "Close of Day Prayers", host: "Mr. Samuel", category: "Worship" },
  },
};

const DAY_KEY_MAP: Record<Day, string> = {
  Mon: "mon", Tue: "tue", Wed: "wed", Thu: "thu",
  Fri: "fri", Sat: "sat", Sun: "sun",
};

function getToday(): Day {
  const idx = new Date().getDay();
  const map: Record<number, Day> = { 0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat" };
  return map[idx] ?? "Mon";
}

function categoryBadge(category: string): string {
  const map: Record<string, string> = {
    Worship: "bg-gold/15 text-gold",
    Teaching: "bg-accent text-accent-foreground",
    Talk: "bg-muted text-muted-foreground",
    Music: "bg-primary/10 text-primary",
    Live: "bg-red-500/15 text-red-500",
  };
  return map[category] ?? "bg-muted text-muted-foreground";
}

export function RadioSchedule(): React.ReactElement {
  const { t } = useTranslation();
  const today = getToday();
  const [activeDay, setActiveDay] = useState<Day>(today);

  const fullSchedule = Array.from({ length: 24 }, (_, hour) => {
    const program = SCHEDULE[activeDay]?.[hour];
    return {
      hour,
      time: `${String(hour).padStart(2, "0")}:00`,
      title: program?.title ?? t("home.schedule.offAir"),
      host: program?.host ?? "",
      category: program?.category ?? "Talk",
      isOffAir: !program,
    };
  });

  return (
    <section className="bg-secondary py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-6 lg:px-12">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">{t("home.schedule.tag")}</p>
          <h2 className="mt-4 font-serif text-4xl text-foreground sm:text-5xl">{t("home.schedule.title")}</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            {t("home.schedule.desc")}
          </p>
        </div>

        <div className="mt-14">
          <div
            role="tablist"
            aria-label={t("home.schedule.daySelector")}
            className="mx-auto flex w-full max-w-xl flex-wrap justify-center gap-2"
          >
            {DAYS.map((day) => {
              const isActive = day === activeDay;
              const isToday = day === today;
              return (
                <button
                  key={day}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveDay(day)}
                  className={`rounded-full border px-5 py-2 text-sm font-medium transition ${
                    isActive
                      ? "border-gold bg-gold text-gold-foreground shadow-[var(--shadow-gold)]"
                      : "border-border text-foreground hover:border-gold/40"
                  } ${isToday && !isActive ? "ring-1 ring-gold/40" : ""}`}
                >
                  {t(`home.schedule.days.${DAY_KEY_MAP[day]}`)}
                  {isToday && <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-green-500" />}
                </button>
              );
            })}
          </div>

          <div className="mt-10">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-elegant)]">
              <div className="flex items-center justify-between border-b border-border px-6 py-4 sm:px-8">
                <h3 className="font-serif text-xl text-foreground">
                  {activeDay === today
                    ? t("home.schedule.todayLineup")
                    : t("home.schedule.dayLineup", { day: t(`home.schedule.days.${DAY_KEY_MAP[activeDay]}`) })}
                </h3>
                {activeDay === today && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-600">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                    {t("home.schedule.onAir")}
                  </span>
                )}
              </div>
              <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                {fullSchedule.map((item) => (
                  <div
                    key={item.hour}
                    className={`flex flex-col gap-3 px-6 py-3 transition sm:flex-row sm:items-center sm:gap-6 sm:px-8 ${
                      item.isOffAir ? "opacity-50" : "hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-4 sm:w-32 sm:flex-col sm:items-start sm:gap-1">
                      <span className="text-lg font-semibold tabular-nums text-foreground">{item.time}</span>
                      {!item.isOffAir && (
                        <span
                          className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${categoryBadge(item.category)}`}
                        >
                          {t(`home.schedule.categories.${item.category.toLowerCase()}`)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-base font-medium ${item.isOffAir ? "text-muted-foreground" : "text-foreground"}`}>
                        {item.title}
                      </p>
                      {!item.isOffAir && (
                        <p className="mt-0.5 text-sm text-muted-foreground">{t("home.schedule.hostedBy", { host: item.host })}</p>
                      )}
                    </div>
                    {activeDay === today && item.hour === 0 && !item.isOffAir && (
                      <div className="hidden items-center gap-2 rounded-full bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold sm:flex">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-gold" />
                        {t("home.schedule.nowPlaying")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
