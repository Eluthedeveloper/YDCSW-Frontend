// src/pages/ResourceMobilizationPage.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { SiteShell } from "../components/site/SiteShell";
import a1 from "../assets/podcast.jpg";
import a2 from "../assets/film.jpg";
import a3 from "../assets/radio.jpg";
import a4 from "../assets/bible.jpg";
import printshops from "../assets/printshops.png";
import { bookshops } from "../data/bookshops";

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
    caption: "Resource mobilization workshop",
    details: "Training session on effective resource mobilization strategies for ministry sustainability.",
    category: "Workshop",
  },
  {
    id: 2,
    src: a2,
    caption: "Economic development forum",
    details: "Economic development forum discussing income-generating projects for the community.",
    category: "Forum",
  },
  {
    id: 3,
    src: a3,
    caption: "Community outreach program",
    details: "Community outreach program focused on economic empowerment and self-sustainability.",
    category: "Outreach",
  },
  {
    id: 4,
    src: a4,
    caption: "Project planning session",
    details: "Strategic planning session for resource mobilization and development projects.",
    category: "Planning",
  },
];

export function ResourceMobilizationPage(): React.ReactElement {
  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const openModal = (image: GalleryImage, index: number) => {
    setSelectedImage(image);
    setCurrentIndex(index);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setSelectedImage(null);
    document.body.style.overflow = "";
  };

  const goToPrevious = () => {
    const newIndex = currentIndex === 0 ? galleryImages.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
    setSelectedImage(galleryImages[newIndex]);
  };

  const goToNext = () => {
    const newIndex = currentIndex === galleryImages.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
    setSelectedImage(galleryImages[newIndex]);
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedImage) return;
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowLeft") goToPrevious();
      if (e.key === "ArrowRight") goToNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage, currentIndex]);

  const duties = t("resource.duties", { returnObjects: true }) as string[];

  return (
    <>
      <Helmet>
        <title>{t("resource.metaTitle")}</title>
        <meta name="description" content={t("resource.metaDesc")} />
      </Helmet>

      <SiteShell>
        {/* Hero Section */}
        <section className="bg-primary pt-32 pb-20 lg:pt-40 lg:pb-28">
          <div className="mx-auto max-w-5xl px-6 text-center lg:px-12">
            <p className="text-xs uppercase tracking-[0.3em] text-gold">{t("resource.divisionLabel")}</p>
            <h1 className="mx-auto mt-4 max-w-3xl font-serif text-5xl leading-tight text-background sm:text-6xl">
              {t("resource.title")}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-background/70">
              {t("resource.subtitle")}
            </p>
            <Link
              to="/divisions"
              className="mt-8 inline-flex items-center gap-2 text-sm text-gold transition hover:gap-3"
            >
              <span aria-hidden>←</span> {t("resource.backLink")}
            </Link>
          </div>
        </section>

        {/* About Section */}
        <section className="bg-background py-20 lg:py-28">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[1.5fr_1fr] lg:px-12">
            <div>
              <h2 className="font-serif text-3xl text-foreground sm:text-4xl">{t("resource.aboutTitle")}</h2>
              <p
                className="mt-5 text-base leading-relaxed text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: t("resource.aboutP1") }}
              />
              <p
                className="mt-4 text-base leading-relaxed text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: t("resource.aboutP2") }}
              />
            </div>
            <div className="rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-elegant)]">
              <h3 className="font-serif text-xl text-foreground">{t("resource.dutiesTitle")}</h3>
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

        {/* Gallery Section */}
        <section className="bg-background py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-12 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-gold">{t("resource.albumSub")}</p>
              <h2 className="mt-4 font-serif text-4xl text-foreground sm:text-5xl">{t("resource.albumTitle")}</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {galleryImages.map((image, index) => (
                <figure
                  key={image.id}
                  className="group cursor-pointer overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-elegant)] transition hover:shadow-xl"
                  onClick={() => openModal(image, index)}
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
            onClick={closeModal}
          >
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
              aria-label={t("resource.gallery.close")}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
              className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
              aria-label={t("resource.gallery.prev")}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="2">
                <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
              aria-label={t("resource.gallery.next")}
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
                    {currentIndex + 1} {t("resource.gallery.of")} {galleryImages.length}
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

export default ResourceMobilizationPage;