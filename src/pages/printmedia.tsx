// src/pages/PrintMediaDivisionPage.tsx
import React from "react";
import { useGalleryModal } from '../hooks/useGalleryModal';
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { SiteShell } from "../components/site/SiteShell";
import a1 from "../assets/bible.jpg";
import a2 from "../assets/podcast.jpg";
import a3 from "../assets/hero-worship.jpg";
import a4 from "../assets/film.jpg";

interface GalleryImage {
  id: number;
  src: string;
  caption: string;
  details: string;
  category: string;
}

const galleryImages: GalleryImage[] = [
  {
    id: 1,
    src: a1,
    caption: "Fresh devotionals off the press",
    details: "Newly printed devotionals ready for distribution to churches and individuals.",
    category: "Publication",
  },
  {
    id: 2,
    src: a2,
    caption: "Editorial meeting",
    details: "The editorial team reviewing content and ensuring theological accuracy.",
    category: "Meeting",
  },
  {
    id: 3,
    src: a3,
    caption: "Cover design proofs",
    details: "Reviewing cover design proofs for upcoming publications and study guides.",
    category: "Design",
  },
  {
    id: 4,
    src: a4,
    caption: "Field distribution day",
    details: "Distributing printed materials to remote communities across Ethiopia.",
    category: "Distribution",
  },
];

export function PrintMediaDivisionPage(): React.ReactElement {
  const { t } = useTranslation();
  const { selectedImage, selectedIndex, open, close, goToNext, goToPrevious } =
    useGalleryModal(galleryImages);

  const currentIndex = selectedIndex ?? 0;

  const duties = t("print.duties", { returnObjects: true }) as string[];

  return (
    <>
      <Helmet>
        <title>{t("print.metaTitle")}</title>
        <meta name="description" content={t("print.metaDesc")} />
      </Helmet>

      <SiteShell>
        {/* Hero Section */}
        <section className="bg-primary pt-32 pb-20 lg:pt-40 lg:pb-28">
          <div className="mx-auto max-w-5xl px-6 text-center lg:px-12">
            <p className="text-xs uppercase tracking-[0.3em] text-gold">{t("print.divisionLabel")}</p>
            <h1 className="mx-auto mt-4 max-w-3xl font-serif text-5xl leading-tight text-background sm:text-6xl">
              {t("print.title")}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-background/70">
              {t("print.subtitle")}
            </p>
            <Link
              to="/divisions"
              className="mt-8 inline-flex items-center gap-2 text-sm text-gold transition hover:gap-3"
            >
              <span aria-hidden>←</span> {t("print.backLink")}
            </Link>
          </div>
        </section>

        {/* About Section */}
        <section className="bg-background py-20 lg:py-28">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[1.5fr_1fr] lg:px-12">
            <div>
              <h2 className="font-serif text-3xl text-foreground sm:text-4xl">{t("print.aboutTitle")}</h2>
              <p
                className="mt-5 text-base leading-relaxed text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: t("print.aboutP1") }}
              />
            </div>
            <div className="rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-elegant)]">
              <h3 className="font-serif text-xl text-foreground">{t("print.dutiesTitle")}</h3>
              <ul className="mt-5 space-y-3">
                {duties.map((d: string) => (
                  <li key={d} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Gallery Section */}
        <section className="bg-background py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-12 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-gold">{t("print.albumSub")}</p>
              <h2 className="mt-4 font-serif text-4xl text-foreground sm:text-5xl">{t("print.albumTitle")}</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {galleryImages.map((image) => (
                <figure
                  key={image.id}
                  className="group cursor-pointer overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-elegant)] transition hover:shadow-xl"
                  onClick={() => open(image)}
                >
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    <img
                      src={image.src}
                      alt={image.caption}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <figcaption className="px-5 py-4 text-sm text-muted-foreground">{image.caption}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* Modal */}
        {selectedImage && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={close}
          >
            <button
              onClick={close}
              className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
              aria-label={t("print.gallery.close")}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
              className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
              aria-label={t("print.gallery.prev")}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="2">
                <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
              aria-label={t("print.gallery.next")}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="2">
                <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div
              className="max-h-[85vh] max-w-[90vw] w-auto h-auto overflow-hidden rounded-2xl bg-black shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative bg-black flex items-center justify-center">
                <img
                  src={selectedImage.src}
                  alt={selectedImage.caption}
                  className="max-h-[65vh] max-w-full w-auto h-auto object-contain"
                />
              </div>
              <div className="bg-primary/95 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-background">{selectedImage.caption}</h3>
                    <p className="mt-1 text-xs text-gold">{selectedImage.category}</p>
                  </div>
                  <span className="text-xs text-background/50">
                    {currentIndex + 1} {t("print.gallery.of")} {galleryImages.length}
                  </span>
                </div>
                <p className="mt-2 text-sm text-background/80">{selectedImage.details}</p>
              </div>
            </div>
          </div>
        )}
      </SiteShell>
    </>
  );
}

export default PrintMediaDivisionPage;