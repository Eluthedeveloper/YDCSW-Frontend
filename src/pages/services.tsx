// src/pages/ServicesPage.tsx
import React from "react";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { SiteShell } from "../components/site/SiteShell";

// Service data with icons
const serviceIcons = {
  video: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-12 w-12">
      <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  audio: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-12 w-12">
      <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  translation: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-12 w-12">
      <path d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 19h4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  radio: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-12 w-12">
      <path d="M4 13h16M4 13a2 2 0 00-2 2v4a2 2 0 002 2h16a2 2 0 002-2v-4a2 2 0 00-2-2m-16 0V9a2 2 0 012-2h12a2 2 0 012 2v4M8 21v-4m8 4v-4m-4 4v-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export function ServicesPage(): React.ReactElement {
  const { t } = useTranslation();

  // Helper to get array from translation
  const getFeatures = (key: string): string[] => {
    const result = t(key, { returnObjects: true });
    return Array.isArray(result) ? (result as string[]) : [];
  };

  return (
    <>
      <Helmet>
        <title>{t('services.metaTitle')}</title>
        <meta name="description" content={t('services.metaDesc')} />
        <meta property="og:title" content={t('services.metaTitle')} />
        <meta property="og:description" content={t('services.metaDesc')} />
      </Helmet>

      <SiteShell>
        {/* Hero Section */}
        <section className="bg-primary pt-32 pb-20 text-background lg:pt-40 lg:pb-28">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <p className="text-xs uppercase tracking-[0.3em] text-gold">{t('nav.divisions')}</p>
            <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
              {t('services.heroTitle')}
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-background/75">
              {t('services.heroSub')}
            </p>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-secondary py-12 border-y border-gold/10">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {[
                { key: 'projects', value: '500+', label: 'Projects' },
                { key: 'clients', value: '100+', label: 'Partners' },
                { key: 'languages', value: '12+', label: 'Languages' },
                { key: 'years', value: '40+', label: 'Years' },
              ].map((stat) => (
                <div key={stat.key} className="text-center">
                  <div className="font-serif text-3xl font-bold text-gold sm:text-4xl">{stat.value}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{t(`services.stats.${stat.key}`)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="bg-background py-24 lg:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-16 text-center">
              <h2 className="font-serif text-3xl text-foreground sm:text-4xl">
                {t('services.title')}
              </h2>
              <div className="mx-auto mt-2 h-1 w-20 rounded-full bg-gold/60" />
              <p className="mt-4 text-muted-foreground">
                {t('services.subtitle')}
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              {/* Video Production */}
              <div className="group rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-elegant)] transition hover:-translate-y-1 hover:shadow-xl">
                <div className="text-gold">{serviceIcons.video}</div>
                <h3 className="mt-4 font-serif text-2xl text-foreground">{t('services.video.title')}</h3>
                <p className="mt-3 text-muted-foreground">{t('services.video.desc')}</p>
                <ul className="mt-6 space-y-2">
                  {getFeatures('services.video.features').map((feature: string, index: number) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/contact"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gold transition group-hover:gap-3"
                >
                  {t('services.video.cta')} <span aria-hidden>→</span>
                </Link>
              </div>

              {/* Audio Production */}
              <div className="group rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-elegant)] transition hover:-translate-y-1 hover:shadow-xl">
                <div className="text-gold">{serviceIcons.audio}</div>
                <h3 className="mt-4 font-serif text-2xl text-foreground">{t('services.audio.title')}</h3>
                <p className="mt-3 text-muted-foreground">{t('services.audio.desc')}</p>
                <ul className="mt-6 space-y-2">
                  {getFeatures('services.audio.features').map((feature: string, index: number) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/contact"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gold transition group-hover:gap-3"
                >
                  {t('services.audio.cta')} <span aria-hidden>→</span>
                </Link>
              </div>

              {/* Film Translation */}
              <div className="group rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-elegant)] transition hover:-translate-y-1 hover:shadow-xl">
                <div className="text-gold">{serviceIcons.translation}</div>
                <h3 className="mt-4 font-serif text-2xl text-foreground">{t('services.translation.title')}</h3>
                <p className="mt-3 text-muted-foreground">{t('services.translation.desc')}</p>
                <ul className="mt-6 space-y-2">
                  {getFeatures('services.translation.features').map((feature: string, index: number) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/contact"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gold transition group-hover:gap-3"
                >
                  {t('services.translation.cta')} <span aria-hidden>→</span>
                </Link>
              </div>

              {/* Radio Production */}
              <div className="group rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-elegant)] transition hover:-translate-y-1 hover:shadow-xl">
                <div className="text-gold">{serviceIcons.radio}</div>
                <h3 className="mt-4 font-serif text-2xl text-foreground">{t('services.radio.title')}</h3>
                <p className="mt-3 text-muted-foreground">{t('services.radio.desc')}</p>
                <ul className="mt-6 space-y-2">
                  {getFeatures('services.radio.features').map((feature: string, index: number) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/contact"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gold transition group-hover:gap-3"
                >
                  {t('services.radio.cta')} <span aria-hidden>→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary/95 py-20 border-t border-gold/10">
          <div className="mx-auto max-w-4xl px-6 text-center lg:px-12">
            <h2 className="font-serif text-3xl text-background sm:text-4xl">
              {t('home.cta.title')}
            </h2>
            <p className="mt-4 text-background/70">
              {t('home.cta.desc')}
            </p>
            <Link
              to="/contact"
              className="mt-8 inline-block rounded-full bg-gold px-8 py-3.5 text-sm font-semibold text-gold-foreground shadow-[var(--shadow-gold)] transition hover:scale-105"
            >
              {t('home.cta.button')}
            </Link>
          </div>
        </section>
      </SiteShell>
    </>
  );
}