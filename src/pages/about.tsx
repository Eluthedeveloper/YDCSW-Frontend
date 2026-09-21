// src/pages/AboutPage.tsx
import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { SiteShell } from "../components/site/SiteShell";
import bibleImg from "../assets/bible.jpg";

// Define the type for history items
interface HistoryItem {
  year: string;
  title: string;
  desc: string;
}

interface PrincipleItem {
  num: string;
  title: string;
  desc: string;
}

export function AboutPage(): React.ReactElement {
  const { t } = useTranslation();
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const elementId = hash.slice(1);
      const el = document.getElementById(elementId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [hash]);

  // Type assertion to tell TypeScript these are arrays
  const historyItems = t('about.history', { returnObjects: true }) as HistoryItem[];
  const principleItems = t('about.principles.items', { returnObjects: true }) as PrincipleItem[];

  return (
    <>
      <Helmet>
        <title>{t('about.metaTitle')}</title>
        <meta name="description" content={t('about.metaDesc')} />
        <meta property="og:title" content={t('about.metaTitle')} />
        <meta property="og:description" content={t('about.metaDesc')} />
        <meta property="og:image" content={bibleImg} />
      </Helmet>

      <SiteShell>
        <section className="bg-primary pt-32 pb-20 text-background lg:pt-40 lg:pb-28">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <p className="text-xs uppercase tracking-[0.3em] text-gold">{t('nav.aboutYdcs')}</p>
            <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
              {t('about.title')}
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-background/75">
              {t('about.subtitle')}
            </p>
          </div>
        </section>

        <section id="mission-vision" className="bg-background py-24 lg:py-32">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-2 lg:px-12">
            <article className="rounded-3xl border border-border bg-card p-10 shadow-[var(--shadow-elegant)] lg:p-12">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 text-gold">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z" strokeLinejoin="round" /></svg>
                </span>
                <p className="text-xs uppercase tracking-[0.3em] text-gold">{t('about.missionTitle')}</p>
              </div>
              <h2 className="mt-6 font-serif text-4xl text-foreground">{t('about.missionTitle')}</h2>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                {t('about.missionDesc')}
              </p>
            </article>

            <article className="rounded-3xl bg-[image:var(--gradient-divine)] p-10 text-background shadow-[var(--shadow-elegant)] lg:p-12">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gold/20 text-gold">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
                </span>
                <p className="text-xs uppercase tracking-[0.3em] text-gold">{t('about.visionTitle')}</p>
              </div>
              <h2 className="mt-6 font-serif text-4xl">{t('about.visionTitle')}</h2>
              <p className="mt-6 text-lg leading-relaxed text-background/80">
                {t('about.visionDesc')}
              </p>
            </article>
          </div>
        </section>

        <section id="our-history" className="bg-secondary py-24 lg:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <p className="text-xs uppercase tracking-[0.3em] text-gold">{t('about.historyTitle')}</p>
            <h2 className="mt-4 max-w-2xl font-serif text-4xl text-foreground sm:text-5xl">{t('about.historyTitle')}</h2>
            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {historyItems.map((item) => (
                <div key={item.year} className="rounded-2xl border border-border bg-card p-8">
                  <span className="font-serif text-3xl text-gold">{item.year}</span>
                  <h3 className="mt-4 font-serif text-2xl text-foreground">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-background py-24 lg:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <p className="text-xs uppercase tracking-[0.3em] text-gold">{t('about.principles.title')}</p>
            <h2 className="mt-4 max-w-2xl font-serif text-4xl text-foreground sm:text-5xl">{t('about.principles.title')}</h2>
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {principleItems.map((item) => (
                <div key={item.num} className="rounded-2xl border border-border bg-card p-8">
                  <span className="font-serif text-3xl text-gold">{item.num}</span>
                  <h3 className="mt-4 font-serif text-2xl text-foreground">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </SiteShell>
    </>
  );
}