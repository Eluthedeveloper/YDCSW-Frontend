import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { SiteShell } from "../components/site/SiteShell";

export function DivisionsPage(): React.ReactElement {
  const { t } = useTranslation();

  const divisions = [
    {
      to: "/divisions/electronic-media" as const,
      title: t("divisions.cards.electronic.title"),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
          <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      description: t("divisions.cards.electronic.desc"),
      duties: t("divisions.cards.electronic.duties", { returnObjects: true }) as string[],
    },
    {
      to: "/divisions/print-media" as const,
      title: t("divisions.cards.print.title"),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
          <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      description: t("divisions.cards.print.desc"),
      duties: t("divisions.cards.print.duties", { returnObjects: true }) as string[],
    },
    {
      to: "/divisions/vestment-bookstore" as const,
      title: t("divisions.cards.vestment.title"),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
          <path d="M4 6h16M4 12h16M4 18h16M8 6v12M16 6v12" strokeLinecap="round" />
          <path d="M12 6v12" strokeLinecap="round" />
        </svg>
      ),
      description: t("divisions.cards.vestment.desc"),
      duties: t("divisions.cards.vestment.duties", { returnObjects: true }) as string[],
      locations: [
        { name: t("divisions.cards.vestment.locations.0.name"), address: t("divisions.cards.vestment.locations.0.address") },
        { name: t("divisions.cards.vestment.locations.1.name"), address: t("divisions.cards.vestment.locations.1.address") },
        { name: t("divisions.cards.vestment.locations.2.name"), address: t("divisions.cards.vestment.locations.2.address") },
        { name: t("divisions.cards.vestment.locations.3.name"), address: t("divisions.cards.vestment.locations.3.address") },
        { name: t("divisions.cards.vestment.locations.4.name"), address: t("divisions.cards.vestment.locations.4.address") },
      ],
    },
    {
      to: "/divisions/finance" as const,
      title: t("divisions.cards.finance.title"),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
          <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      description: t("divisions.cards.finance.desc"),
      duties: t("divisions.cards.finance.duties", { returnObjects: true }) as string[],
    },
  ];

  return (
    <>
      <Helmet>
        <title>{t("divisions.metaTitle")}</title>
        <meta name="description" content={t("divisions.metaDesc")} />
        <meta property="og:title" content={t("divisions.metaTitle")} />
        <meta property="og:description" content={t("divisions.metaDesc")} />
      </Helmet>

      <SiteShell>
        <section className="bg-primary pt-32 pb-20 lg:pt-40 lg:pb-28">
          <div className="mx-auto max-w-7xl px-6 text-center lg:px-12">
            <p className="text-xs uppercase tracking-[0.3em] text-gold">{t("divisions.heroTag")}</p>
            <h1 className="mx-auto mt-4 max-w-3xl font-serif text-5xl leading-tight text-background sm:text-6xl">
              {t("divisions.title")}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-background/70">
              {t("divisions.subtitle")}
            </p>
          </div>
        </section>

        {/* Director's Bureau Section */}
        <section className="bg-background pt-24 lg:pt-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-16 text-center">
              <h2 className="font-serif text-3xl text-foreground sm:text-4xl">
                <span className="text-gold">{t("divisions.directorBureau")}</span>
              </h2>
              <div className="mx-auto mt-2 h-1 w-20 rounded-full bg-gold/60" />
            </div>
            
            <div className="mx-auto max-w-4xl">
              <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-elegant)] transition hover:-translate-y-1 lg:p-10">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gold/10 text-gold">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10">
                      <path d="M12 4v16M4 12h16M12 4l4 6M12 4l-4 6M12 20l4-6M12 20l-4-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h3 className="font-serif text-2xl text-foreground">{t("divisions.directorBureau")}</h3>
                </div>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  {t("divisions.directorDesc")}
                </p>
                <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {(t("divisions.directorDuties", { returnObjects: true }) as string[]).map((duty) => (
                    <li key={duty} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                      {duty}
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>

        {/* Divisions Section */}
        <section className="bg-background py-24 lg:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-16 text-center">
              <h2 className="font-serif text-3xl text-foreground sm:text-4xl">
                {t("divisions.title")}
              </h2>
              <div className="mx-auto mt-2 h-1 w-20 rounded-full bg-gold/60" />
              <p className="mt-4 text-muted-foreground">
                {t("divisions.divisionsSubtitle")}
              </p>
            </div>
            
            <div className="grid gap-8 lg:grid-cols-2">
              {divisions.map((div) => (
                <article
                  key={div.title}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-elegant)] transition hover:-translate-y-1"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
                      {div.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-serif text-xl text-foreground">{div.title}</h3>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{div.description}</p>
                  <ul className="mt-6 space-y-2">
                    {div.duties.map((duty) => (
                      <li key={duty} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                        {duty}
                      </li>
                    ))}
                  </ul>
                  
                  {div.locations && (
                    <div className="mt-6 border-t border-border pt-4">
                      <h4 className="mb-3 text-sm font-semibold text-foreground">{t("divisions.bookshopLocations")}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {div.locations.map((location) => (
                          <div key={location.name} className="flex items-start gap-2">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 h-4 w-4 shrink-0 text-gold">
                              <path d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z" strokeLinecap="round" strokeLinejoin="round" />
                              <circle cx="12" cy="10" r="3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-foreground">{location.name}</p>
                              <p className="text-xs text-muted-foreground">{location.address}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <Link
                    to={div.to}
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gold transition group-hover:gap-3"
                  >
                    {t("divisions.learnMore")} <span aria-hidden>→</span>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      </SiteShell>
    </>
  );
}
