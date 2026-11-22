// src/pages/GalleryPage.tsx
import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { SiteShell } from "../components/site/SiteShell";
import { useAsyncData } from "../player/hooks/useAsyncData";
import { api, uploadUrl } from "../player/utils/api";
import type { Album } from "../player/utils/types";
import heroImg from "../assets/hero-worship.jpg";
import podcastImg from "../assets/podcast.jpg";
import bibleImg from "../assets/bible.jpg";
import filmImg from "../assets/film.jpg";

type Photo = {
  src: string;
  caption?: string;
  tag?: string;
  albumTitle?: string;
  description?: string;
};

// Shown when the API is unreachable or no album has been created yet, so the
// Gallery is never an empty grid on a fresh deployment.
const PHOTOS: Photo[] = [
  { src: heroImg, caption: "Sunday worship, downtown chapel", tag: "Worship" },
  { src: filmImg, caption: "On set — 'Beyond the Veil'", tag: "Film" },
  { src: podcastImg, caption: "Studio B, late-night recording", tag: "Podcast" },
  { src: bibleImg, caption: "Open Word, open hearts", tag: "Devotional" },
  { src: filmImg, caption: "Crew prayer before the first take", tag: "Behind the scenes" },
  { src: heroImg, caption: "Congregation in song", tag: "Worship" },
  { src: bibleImg, caption: "Morning study group", tag: "Community" },
  { src: podcastImg, caption: "Guest interview", tag: "Podcast" },
];

export function GalleryPage(): React.ReactElement {
  const { t } = useTranslation();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null);
  const wheelLock = useRef(0);
  const touchStartX = useRef<number | null>(null);

  // Same fallback contract as the Leadership page: a failed request resolves
  // to an empty list, which selects the built-in photos below.
  const { data: dbAlbums } = useAsyncData<Album[]>(
    () => api.getAlbums().catch(() => [] as Album[]),
    []
  );

  // Albums a department page mounts are excluded here — they render on their
  // own page, so the general gallery stays free of department duplicates.
  const publicAlbums = dbAlbums.filter((album) => !album.department);

  const activeAlbum = publicAlbums.find((album) => album.id === activeAlbumId) ?? null;
  const albumPhotos: Photo[] = activeAlbum
    ? activeAlbum.photos.map((photo) => ({
        src: uploadUrl(`albums/${photo.file_name}`),
        caption: photo.caption?.trim() || undefined,
        albumTitle: activeAlbum.title,
        description: activeAlbum.description ?? undefined,
      }))
    : [];

  const photoList = activeAlbum ? albumPhotos : PHOTOS;

  const selectedPhoto =
    selectedIndex !== null ? photoList[selectedIndex] ?? null : null;

  const selectedTitle =
    selectedPhoto?.caption || selectedPhoto?.albumTitle || "";
  const selectedTag =
    selectedPhoto?.tag && selectedPhoto.tag !== selectedTitle
      ? selectedPhoto.tag
      : "";

  const stepPhoto = (delta: number) => {
    setSelectedIndex((current) => {
      if (current === null || photoList.length === 0) return current;
      return (current + delta + photoList.length) % photoList.length;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedIndex(null);
      else if (e.key === "ArrowLeft") {
        setSelectedIndex((current) =>
          current === null ? current : (current - 1 + photoList.length) % photoList.length
        );
      } else if (e.key === "ArrowRight") {
        setSelectedIndex((current) =>
          current === null ? current : (current + 1) % photoList.length
        );
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [photoList.length]);

  useEffect(() => {
    if (selectedIndex !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedIndex]);

  const handleWheel = (e: React.WheelEvent) => {
    if (photoList.length < 2 || Math.abs(e.deltaY) < 10) return;
    const now = Date.now();
    if (now - wheelLock.current < 350) return;
    wheelLock.current = now;
    stepPhoto(e.deltaY > 0 ? 1 : -1);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) > 50) stepPhoto(delta < 0 ? 1 : -1);
  };

  const photoCountLabel = (n: number) =>
    n === 1 ? t("gallery.photoCountOne") : t("gallery.photoCountOther", { n });

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
            {publicAlbums.length === 0 ? (
              /* --------- Built-in fallback photos --------- */
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {PHOTOS.map((p, i) => (
                  <figure
                    key={i}
                        onClick={() => setSelectedIndex(i)}
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
                    <figcaption className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 p-5">
                      {p.caption && (
                        <span className="min-w-0 flex-1 break-words font-serif text-base text-foreground">{p.caption}</span>
                      )}
                      {p.tag && p.tag !== p.caption && (
                        <span className="break-words text-[10px] uppercase tracking-[0.25em] text-gold">{p.tag}</span>
                      )}
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : !activeAlbum ? (
              /* --------- Album grid --------- */
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {publicAlbums.map((album) => {
                  const cover = album.photos[0];
                  return (
                    <button
                      key={album.id}
                      onClick={() => setActiveAlbumId(album.id)}
                      className="group overflow-hidden rounded-2xl bg-card text-left shadow-[var(--shadow-elegant)] transition hover:-translate-y-1 hover:shadow-xl"
                    >
                      <div className="aspect-[4/3] overflow-hidden bg-muted">
                        {cover ? (
                          <img
                            src={uploadUrl(`albums/${cover.file_name}`)}
                            alt={album.title}
                            loading="lazy"
                            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-serif text-4xl text-muted-foreground/40">
                            {album.title.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <h2 className="font-serif text-xl text-foreground">{album.title}</h2>
                        <p className="mt-1 text-xs uppercase tracking-[0.25em] text-gold">
                          {photoCountLabel(album.photos.length)}
                        </p>
                        {album.description && (
                          <p className="mt-2 text-sm text-muted-foreground">{album.description}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* --------- One album's photos --------- */
              <div>
                <button
                  onClick={() => setActiveAlbumId(null)}
                  className="mb-8 inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-gold hover:text-gold"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" strokeLinecap="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                  {t('gallery.backToAlbums')}
                </button>

                <p className="mb-6 text-xs uppercase tracking-[0.3em] text-gold">{activeAlbum.title}</p>

                {albumPhotos.length === 0 ? (
                  <p className="py-16 text-center text-muted-foreground">{t('gallery.emptyAlbum')}</p>
                ) : (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {albumPhotos.map((p, i) => (
                      <figure
                        key={i}
                    onClick={() => setSelectedIndex(i)}
                        className="cursor-pointer overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-elegant)] transition hover:-translate-y-1 hover:shadow-xl"
                      >
                        <div className="aspect-[4/3] overflow-hidden">
                          <img
                            src={p.src}
                            alt={p.caption || activeAlbum.title}
                            loading="lazy"
                            className="h-full w-full object-cover transition duration-700 hover:scale-105"
                          />
                        </div>
                        {p.caption && (
                          <figcaption className="p-5">
                            <p className="break-words font-serif text-base text-foreground">{p.caption}</p>
                          </figcaption>
                        )}
                      </figure>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </SiteShell>

      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setSelectedIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-y-auto rounded-2xl bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedIndex(null)}
              className="absolute right-4 top-4 z-20 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
              aria-label="Close image preview"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-6 w-6" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>

            <div
              className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-black"
              onWheel={handleWheel}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <img
                src={selectedPhoto.src}
                alt={selectedTitle || "Gallery photo"}
                className="max-h-[70vh] w-auto max-w-full object-contain"
              />

              {photoList.length > 1 && (
                <>
                  <span className="absolute left-4 top-4 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white">
                    {(selectedIndex ?? 0) + 1} / {photoList.length}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      stepPhoto(-1);
                    }}
                    className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
                    aria-label="Previous photo"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                      <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      stepPhoto(1);
                    }}
                    className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
                    aria-label="Next photo"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {(selectedTitle || selectedPhoto.description || selectedTag) && (
              <div className="flex shrink-0 flex-col gap-3 p-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  {selectedTitle && (
                    <p className="break-words font-serif text-xl text-foreground">{selectedTitle}</p>
                  )}
                  {selectedPhoto.description && (
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                      {selectedPhoto.description}
                    </p>
                  )}
                </div>
                {selectedTag && (
                  <span className="self-start break-words rounded-full bg-gold/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                    {selectedTag}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
