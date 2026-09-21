// src/pages/GalleryPage.tsx
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { SiteShell } from "../components/site/SiteShell";
import heroImg from "../assets/hero-worship.jpg";
import podcastImg from "../assets/podcast.jpg";
import bibleImg from "../assets/bible.jpg";
import filmImg from "../assets/film.jpg";

type Photo = {
  src: string;
  caption: string;
  tag: string;
};

const PHOTOS: Photo[] = [
  { src: heroImg, caption: "Sunday worship, downtown chapel", tag: "Worship" },
  { src: filmImg, caption: "On set — 'Beyond the Veil'", tag: "Film" },
  { src: podcastImg, caption: "Studio B, late-night recording", tag: "Podcast" },
  { src: bibleImg, caption: "Open Word, open hearts", tag: "Devotional" },
  { src: filmImg, caption: "Crew prayer before the first take", tag: "Behind the scenes" },
  { src: heroImg, caption: "Congregation in song", tag: "Worship" },
  { src: bibleImg, caption: "Morning study group", tag: "Community" },
  { src: podcastImg, caption: "Guest interview, Episode 47", tag: "Podcast" },
];

export function GalleryPage(): React.ReactElement {
  const { t } = useTranslation();
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedPhoto(null);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (selectedPhoto) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedPhoto]);

  return (
    <>
      <Helmet>
        <title>{t('gallery.metaTitle')}</title>
        <meta name="description" content={t('gallery.metaDesc')} />
        <meta property="og:title" content={t('gallery.metaTitle')} />
        <meta property="og:description" content={t('gallery.metaDesc')} />
        <meta property="og:image" content={heroImg} />
      </Helmet>

      <SiteShell>
        <section className="bg-primary pt-32 pb-16 text-background lg:pt-40 lg:pb-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <p className="text-xs uppercase tracking-[0.3em] text-gold">{t('gallery.albumTag')}</p>
            <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
              {t('gallery.title')}
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-background/75">
              {t('gallery.subtitle')}
            </p>
          </div>
        </section>

        <section className="bg-background py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {PHOTOS.map((p, i) => (
                <figure
                  key={i}
                  onClick={() => setSelectedPhoto(p)}
                  className="cursor-pointer overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-elegant)] transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={p.src}
                      alt={p.caption}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-700 hover:scale-105"
                    />
                  </div>
                  <figcaption className="flex items-center justify-between gap-4 p-5">
                    <span className="font-serif text-base text-foreground">{p.caption}</span>
                    <span className="shrink-0 text-[10px] uppercase tracking-[0.25em] text-gold">{p.tag}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      </SiteShell>

      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setSelectedPhoto(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw] overflow-auto rounded-2xl bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
              aria-label="Close image preview"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-6 w-6" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>

            <img
              src={selectedPhoto.src}
              alt={selectedPhoto.caption}
              className="max-h-[75vh] w-full object-contain"
            />

            <div className="flex items-center justify-between gap-6 p-6">
              <span className="font-serif text-xl text-foreground">{selectedPhoto.caption}</span>
              <span className="shrink-0 rounded-full bg-gold/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                {selectedPhoto.tag}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}