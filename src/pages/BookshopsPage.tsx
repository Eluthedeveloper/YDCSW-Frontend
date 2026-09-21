// src/pages/BookshopsPage.tsx
import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { SiteShell } from "../components/site/SiteShell";
import printshops from "../assets/printshops.png";
import { bookshops } from "../data/bookshops";

export function BookshopsPage(): React.ReactElement {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{t("bookshops.metaTitle")}</title>
        <meta name="description" content={t("bookshops.metaDesc")} />
      </Helmet>

      <SiteShell>
        {/* Hero Section */}
        <section className="bg-primary pt-32 pb-20 lg:pt-40 lg:pb-28">
          <div className="mx-auto max-w-5xl px-6 text-center lg:px-12">
            <p className="text-xs uppercase tracking-[0.3em] text-gold">{t("resource.bookshopLabel")}</p>
            <h1 className="mx-auto mt-4 max-w-3xl font-serif text-5xl leading-tight text-background sm:text-6xl">
              {t("nav.bookshops")}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-background/70">
              {t("resource.bookshopSub")}
            </p>
            <Link
              to="/divisions"
              className="mt-8 inline-flex items-center gap-2 text-sm text-gold transition hover:gap-3"
            >
              <span aria-hidden>←</span> {t("nav.allDivisions")}
            </Link>
          </div>
        </section>

        {/* Bookshop Locations Section */}
        <section className="bg-secondary py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-12 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-gold">{t("resource.bookshopLabel")}</p>
              <h2 className="mt-4 font-serif text-4xl text-foreground sm:text-5xl">
                {t("resource.bookshopTitle")}
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                {t("resource.bookshopSub")}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {bookshops.map((shop) => (
                <div
                  key={shop.id}
                  className="group overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-elegant)] transition hover:shadow-xl"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-muted">
                    <img
                      src={printshops}
                      alt={shop.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="font-serif text-xl font-bold text-foreground">{shop.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{shop.address}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{shop.description}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <a
                        href={`tel:${shop.phone}`}
                        className="inline-flex items-center gap-2 text-sm text-gold hover:underline"
                      >
                        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
                          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0122 16.92z" />
                        </svg>
                        {shop.phone}
                      </a>
                      <a
                        href={shop.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-gold hover:underline"
                      >
                        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        {t("resource.viewOnMap")}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </SiteShell>
    </>
  );
}

export default BookshopsPage;