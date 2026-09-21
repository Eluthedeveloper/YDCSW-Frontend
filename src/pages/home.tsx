// src/pages/home.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import heroImg from "../assets/hero-worship.jpg";
import podcastImg from "../assets/podcast.jpg";
import bibleImg from "../assets/bible.jpg";
import filmImg from "../assets/film.jpg";
import radioImg from "../assets/radio.jpg";
import { SiteShell } from "../components/site/SiteShell";
import { RadioSchedule } from "../components/RadioSchedule";

function Hero() {
  const { t } = useTranslation();
  return (
    <section className="relative min-h-screen overflow-hidden bg-primary">
      <img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/70 via-primary/40 to-primary" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 pt-32 pb-20 lg:px-12">
        <span className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-gold/40 bg-primary/30 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-gold backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-gold" />
          A Christian Media Ministry
        </span>
        <h1 className="max-w-4xl font-serif text-5xl font-medium leading-[1.05] text-background sm:text-7xl lg:text-8xl">
          {t("home.heroTitle")}
        </h1>
        <p className="mt-8 max-w-xl text-lg leading-relaxed text-background/75">
          {t("home.heroSub")}
        </p>
        <div className="mt-12 flex flex-wrap gap-4">
          <Link to="/gallery" className="group inline-flex items-center gap-3 rounded-full bg-background px-7 py-4 text-sm font-semibold text-foreground transition hover:bg-gold">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M8 5v14l11-7z" /></svg>
            {t("nav.gallery")}
          </Link>
          <Link to="/about" className="inline-flex items-center gap-2 rounded-full border border-background/30 px-7 py-4 text-sm font-semibold text-background transition hover:border-gold hover:text-gold">
            {t("nav.about")}
          </Link>
        </div>
        <div className="mt-24 grid max-w-3xl grid-cols-2 gap-8 border-t border-background/15 pt-8 sm:grid-cols-4">
          {[
            [t("home.stats.lives")],
            [t("home.stats.countries")],
            [t("home.stats.years")],
            [t("home.stats.radio")],
          ].map(([label]) => (
            <div key={label}>
              <div className="font-serif text-3xl text-gold sm:text-4xl">{label.split(" ")[0]}</div>
              <div className="mt-1 text-xs uppercase tracking-widest text-background/60">{label.split(" ").slice(1).join(" ")}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Verse() {
  const { t } = useTranslation();
  return (
    <section className="bg-background py-24 lg:py-32">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto h-10 w-10 text-gold">
          <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
          <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
        </svg>
        <p className="mt-8 font-serif text-3xl leading-snug text-foreground sm:text-5xl">
          {t("home.verse.text")}
        </p>
        <p className="mt-6 text-sm uppercase tracking-[0.3em] text-muted-foreground">{t("home.verse.ref")}</p>
      </div>
    </section>
  );
}

function Ministries() {
  const { t } = useTranslation();
  const items = [
    { img: filmImg, tag: "Film", title: t("home.ministries.film"), desc: t("home.ministries.filmDesc") },
    { img: podcastImg, tag: "Audio", title: t("home.ministries.podcast"), desc: t("home.ministries.podcastDesc") },
    { img: bibleImg, tag: "Teaching", title: t("home.ministries.devotional"), desc: t("home.ministries.devotionalDesc") },
    { img: radioImg, tag: "Radio", title: t("home.ministries.radio"), desc: t("home.ministries.radioDesc") },
  ];
  return (
    <section className="bg-secondary py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gold">{t("home.ministries.tag")}</p>
            <h2 className="mt-4 max-w-2xl font-serif text-4xl text-foreground sm:text-5xl">{t("home.ministries.title")}</h2>
            <p className="mt-4 max-w-md text-muted-foreground">{t("home.ministries.sub")}</p>
          </div>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it) => (
            <article key={it.title} className="group overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-elegant)] transition hover:-translate-y-1">
              <div className="aspect-[4/5] overflow-hidden">
                <img src={it.img} alt={it.title} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              </div>
              <div className="p-7">
                <span className="text-xs uppercase tracking-[0.25em] text-gold">{it.tag}</span>
                <h3 className="mt-3 font-serif text-2xl text-foreground">{it.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{it.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProgramsCTA() {
  const { t } = useTranslation();
  return (
    <section className="bg-background py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="relative overflow-hidden rounded-3xl bg-[image:var(--gradient-divine)] p-12 text-background sm:p-20">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold/30 blur-3xl" />
          <div className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
          <div className="relative text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-gold">{t("home.programsCTA.tag")}</p>
            <h2 className="mt-4 max-w-2xl mx-auto font-serif text-4xl leading-tight sm:text-6xl">
              {t("home.programsCTA.title")}
            </h2>
            <p className="mt-6 max-w-xl mx-auto text-background/80">
              {t("home.programsCTA.desc")}
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link to="/programs" className="inline-flex items-center gap-3 rounded-full bg-gold px-8 py-4 text-sm font-semibold text-gold-foreground shadow-[var(--shadow-gold)] transition hover:scale-105">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M8 5v14l11-7z" /></svg>
                {t("home.programsCTA.listenNow")}
              </Link>
              <Link to="/programs" className="inline-flex items-center gap-2 rounded-full border border-background/30 px-8 py-4 text-sm font-semibold transition hover:border-gold hover:text-gold">
                {t("home.programsCTA.explorePrograms")}
              </Link>
              <Link to="/bookshops" className="inline-flex items-center gap-2 rounded-full border border-background/30 px-8 py-4 text-sm font-semibold transition hover:border-gold hover:text-gold">
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {t("nav.bookshops")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RadioHighlight() {
  const { t } = useTranslation();
  const [iframeVisible, setIframeVisible] = useState(false);

  const openPopup = () => {
    const w = 320;
    const h = 502;
    const l = (screen.width - w) / 2;
    const t = (screen.height - h) / 2;
    window.open(
      'https://embed.clrd.net/player/01a0b3b8-5bce-72ff-a90a-59d2d5011c0c?bg=filled',
      'radio_player',
      `width=${w},height=${h},left=${l},top=${t},scrollbars=no,resizable=yes,noopener,noreferrer`
    );
  };

  return (
    <section className="bg-primary py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-3xl">
            <img src={radioImg} alt="" className="h-full w-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent" />
            <div className="absolute bottom-6 left-6 flex items-center gap-3">
              <span className="flex h-3 w-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-widest text-background">Live Now</span>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gold">{t("home.radio.title")}</p>
            <h2 className="mt-4 font-serif text-4xl leading-tight text-background sm:text-5xl">
              {t("home.radio.heading")}
            </h2>
            <p className="mt-6 max-w-lg leading-relaxed text-background/75">{t("home.radio.desc")}</p>

            <div className="mt-10 flex flex-wrap gap-4">
              <button onClick={() => setIframeVisible((prev) => !prev)} className="inline-flex items-center gap-3 rounded-full bg-gold px-7 py-4 text-sm font-semibold text-gold-foreground shadow-[var(--shadow-gold)] transition hover:scale-105">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M8 5v14l11-7z" /></svg>
                {iframeVisible ? t("home.radio.hide") : t("home.radio.listen")}
              </button>
              <button className="inline-flex items-center gap-2 rounded-full border border-background/30 px-7 py-4 text-sm font-semibold text-background transition hover:border-gold hover:text-gold">
                {t("home.radio.schedule")}
              </button>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-6 border-t border-background/15 pt-8">
              {[
                [t("home.radio.scheduleBlocks.worship"), t("home.radio.scheduleBlocks.worshipTime")],
                [t("home.radio.scheduleBlocks.teaching"), t("home.radio.scheduleBlocks.teachingTime")],
                [t("home.radio.scheduleBlocks.testimonies"), t("home.radio.scheduleBlocks.testimoniesTime")],
              ].map(([t, time]) => (
                <div key={t}>
                  <div className="font-serif text-lg text-gold">{t}</div>
                  <div className="mt-1 text-xs text-background/60">{time}</div>
                </div>
              ))}
            </div>

            <div className="mt-10 border-t border-background/15 pt-8">
              {iframeVisible && (
                <div className="flex justify-center">
                  <iframe src="https://embed.clrd.net/player/01a0b3b8-5bce-72ff-a90a-59d2d5011c0c" width="320" height="502" frameBorder="0" allow="autoplay; encrypted-media" title="Radio Player" className="rounded-xl shadow-lg" />
                </div>
              )}
              <div className="mt-4 text-center">
                <button onClick={openPopup} className="inline-flex items-center gap-2 rounded-full border border-background/30 px-7 py-4 text-sm font-semibold text-background transition hover:border-gold hover:text-gold">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M8 5v14l11-7z" /></svg>
                  {t("home.radio.listen")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  const { t } = useTranslation();
  return (
    <section className="bg-background py-24 lg:py-32">
      <div className="mx-auto max-w-5xl px-6 lg:px-12">
        <div className="relative overflow-hidden rounded-3xl bg-[image:var(--gradient-divine)] p-12 text-background sm:p-20">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold/30 blur-3xl" />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.3em] text-gold">{t("home.cta.tag")}</p>
            <h2 className="mt-4 max-w-2xl font-serif text-4xl leading-tight sm:text-6xl">{t("home.cta.title")}</h2>
            <p className="mt-6 max-w-xl text-background/80">{t("home.cta.desc")}</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/contact" className="rounded-full bg-gold px-8 py-4 text-sm font-semibold text-gold-foreground shadow-[var(--shadow-gold)] transition hover:scale-105">
                {t("home.cta.button")}
              </Link>
              <Link to="/about" className="rounded-full border border-background/30 px-8 py-4 text-sm font-semibold transition hover:border-gold hover:text-gold">
                {t("home.cta.learn")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomePage(): React.ReactElement {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{t("home.metaTitle") || "Yemisrach Dimts"}</title>
        <meta name="description" content={t("home.metaDesc") || ""} />
      </Helmet>
      <SiteShell>
        <Hero />
        <Verse />
        <RadioHighlight />
        <ProgramsCTA />
        <Ministries />
        <RadioSchedule />
        <CTA />
      </SiteShell>
    </>
  );
}

export default HomePage;