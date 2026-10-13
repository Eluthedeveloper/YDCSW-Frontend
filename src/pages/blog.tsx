// src/pages/blog.tsx
import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Loader2, Newspaper, ArrowRight, ArrowLeft, CalendarDays, Clock, X, ChevronLeft, ChevronRight } from "lucide-react";
import { SiteShell } from "../components/site/SiteShell";
import { useAsyncData } from "../player/hooks/useAsyncData";
import { api, uploadUrl } from "../player/utils/api";
import type { BlogPost } from "../player/utils/types";

function parseDate(value?: string | null): Date {
  return new Date((value ?? "").replace(" ", "T"));
}

function formatDate(value: string | undefined, locale: string): string {
  const parsed = parseDate(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toLocaleDateString(locale, { dateStyle: "long" });
}

function readingMinutes(post: BlogPost): number {
  const words = (post.body ?? post.excerpt ?? "").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function coverOf(post: BlogPost): string | null {
  return post.cover_image ? uploadUrl(`blogs/${post.cover_image}`) : null;
}

function Cover({ post, className = "" }: { post: BlogPost; className?: string }) {
  const cover = coverOf(post);
  if (cover) {
    return <img src={cover} alt="" loading="lazy" className={`h-full w-full object-cover transition duration-700 group-hover:scale-105 ${className}`} />;
  }
  return (
    <div className={`flex h-full w-full items-center justify-center bg-[image:var(--gradient-divine)] ${className}`}>
      <Newspaper size={40} className="text-gold/70" />
    </div>
  );
}

function MetaRow({ post, locale, className = "" }: { post: BlogPost; locale: string; className?: string }) {
  const { t } = useTranslation();
  return (
    <div className={`flex flex-wrap items-center gap-3 text-xs uppercase tracking-widest ${className}`}>
      {post.category && <span className="rounded-full bg-gold/15 px-3 py-1 font-semibold text-gold">{post.category}</span>}
      <span className="inline-flex items-center gap-1.5">
        <CalendarDays size={13} />
        {formatDate(post.created_at, locale)}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Clock size={13} />
        {readingMinutes(post)} {t("blog.minRead")}
      </span>
    </div>
  );
}

function PageHero({ tag, title, sub }: { tag: string; title: string; sub: string }) {
  return (
    <section className="relative overflow-hidden bg-primary pb-16 pt-32 lg:pb-20 lg:pt-40">
      <div className="absolute -right-32 -top-24 h-80 w-80 rounded-full bg-gold/20 blur-3xl" />
      <div className="absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-purple-400/10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-gold/40 bg-primary/40 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-gold backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-gold" />
          {tag}
        </span>
        <h1 className="mt-6 max-w-3xl font-serif text-5xl leading-[1.05] text-background sm:text-6xl lg:text-7xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-background/70">{sub}</p>
      </div>
    </section>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center py-24" role="status" aria-live="polite">
      <Loader2 size={32} className="animate-spin text-gold" />
    </div>
  );
}

/** The article's extra photos, with a lightbox that steps through them. */
function Gallery({ images }: { images: string[] }) {
  const { t } = useTranslation();
  const [active, setActive] = useState<number | null>(null);

  return (
    <section className="mt-12">
      <p className="text-xs uppercase tracking-[0.3em] text-gold">{t("blog.gallery")}</p>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((name, index) => (
          <button
            key={name}
            type="button"
            onClick={() => setActive(index)}
            className="group block aspect-[4/3] overflow-hidden rounded-2xl"
            aria-label={`${t("blog.gallery")} ${index + 1}`}
          >
            <img
              src={uploadUrl(`blogs/${name}`)}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {active !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("blog.gallery")}
          onClick={() => setActive(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-primary/95 p-4 backdrop-blur"
        >
          <button
            type="button"
            aria-label={t("blog.close")}
            onClick={() => setActive(null)}
            className="absolute right-5 top-5 text-background/80 transition hover:text-gold"
          >
            <X size={24} />
          </button>
          {images.length > 1 && (
            <>
              <button
                type="button"
                aria-label={t("blog.previous")}
                onClick={(event) => {
                  event.stopPropagation();
                  setActive((index) => ((index ?? 0) - 1 + images.length) % images.length);
                }}
                className="absolute left-4 text-background/80 transition hover:text-gold"
              >
                <ChevronLeft size={32} />
              </button>
              <button
                type="button"
                aria-label={t("blog.next")}
                onClick={(event) => {
                  event.stopPropagation();
                  setActive((index) => ((index ?? 0) + 1) % images.length);
                }}
                className="absolute right-4 text-background/80 transition hover:text-gold"
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}
          <img
            src={uploadUrl(`blogs/${images[active]}`)}
            alt=""
            onClick={(event) => event.stopPropagation()}
            className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-[var(--shadow-elegant)]"
          />
        </div>
      )}
    </section>
  );
}

export function BlogPage(): React.ReactElement {
  const { t, i18n } = useTranslation();
  const [category, setCategory] = useState<string | null>(null);

  const { data: posts, loading } = useAsyncData<BlogPost[]>(
    () => api.getBlogPosts().catch(() => [] as BlogPost[]),
    []
  );

  const categories = useMemo(
    () => Array.from(new Set(posts.map((post) => post.category).filter((value): value is string => Boolean(value)))),
    [posts]
  );

  const filtered = useMemo(
    () => (category ? posts.filter((post) => post.category === category) : posts),
    [posts, category]
  );
  const [featured, ...rest] = filtered;

  return (
    <>
      <Helmet>
        <title>{t("blog.metaTitle")}</title>
        <meta name="description" content={t("blog.metaDesc")} />
      </Helmet>
      <SiteShell>
        <PageHero tag={t("blog.heroTag")} title={t("blog.heroTitle")} sub={t("blog.heroSub")} />

        <section className="bg-background py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCategory(null)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest transition ${
                    category === null ? "bg-gold text-gold-foreground shadow-[var(--shadow-gold)]" : "border border-border text-muted-foreground hover:border-gold hover:text-gold"
                  }`}
                >
                  {t("blog.all")}
                </button>
                {categories.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCategory(value)}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest transition ${
                      category === value ? "bg-gold text-gold-foreground shadow-[var(--shadow-gold)]" : "border border-border text-muted-foreground hover:border-gold hover:text-gold"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            )}

            {loading ? (
              <Loading />
            ) : !featured ? (
              <div className="mt-10 rounded-3xl border border-dashed border-border py-24 text-center">
                <Newspaper size={44} className="mx-auto text-gold" />
                <p className="mt-4 font-serif text-2xl text-foreground">{t("blog.empty")}</p>
              </div>
            ) : (
              <>
                <article className="group mt-10 grid items-center gap-8 rounded-3xl bg-card p-6 shadow-[var(--shadow-elegant)] sm:p-8 lg:grid-cols-2 lg:gap-12 lg:p-10">
                  <Link to={`/blog/${featured.slug}`} className="block aspect-[4/3] overflow-hidden rounded-2xl">
                    <Cover post={featured} />
                  </Link>
                  <div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-gold/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
                      {t("blog.featured")}
                    </span>
                    <MetaRow post={featured} locale={i18n.language} className="mt-5 text-muted-foreground" />
                    <h2 className="mt-4 font-serif text-3xl leading-tight text-foreground sm:text-4xl">
                      <Link to={`/blog/${featured.slug}`} className="transition group-hover:text-gold">
                        {featured.title}
                      </Link>
                    </h2>
                    {featured.excerpt && (
                      <p className="mt-4 leading-relaxed text-muted-foreground">{featured.excerpt}</p>
                    )}
                    <Link
                      to={`/blog/${featured.slug}`}
                      className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gold transition group-hover:gap-3"
                    >
                      {t("blog.readMore")}
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </article>

                <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((post) => (
                    <article key={post.id} className="group flex flex-col overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-elegant)] transition hover:-translate-y-1">
                      <Link to={`/blog/${post.slug}`} className="relative block aspect-[16/10] overflow-hidden">
                        <Cover post={post} />
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-transparent to-transparent" />
                        {post.category && (
                          <span className="absolute left-4 top-4 rounded-full bg-primary/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-gold backdrop-blur">
                            {post.category}
                          </span>
                        )}
                      </Link>
                      <div className="flex flex-1 flex-col p-6">
                        <MetaRow post={post} locale={i18n.language} className="text-muted-foreground/80" />
                        <h3 className="mt-3 font-serif text-2xl leading-snug text-foreground">
                          <Link to={`/blog/${post.slug}`} className="transition group-hover:text-gold">
                            {post.title}
                          </Link>
                        </h3>
                        {post.excerpt && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>}
                        <Link
                          to={`/blog/${post.slug}`}
                          className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-gold transition group-hover:gap-3"
                        >
                          {t("blog.readMore")}
                          <ArrowRight size={15} />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </SiteShell>
    </>
  );
}

export function BlogPostPage(): React.ReactElement {
  const { t, i18n } = useTranslation();
  const { slug } = useParams<{ slug: string }>();

  const { data: post, loading } = useAsyncData<BlogPost | null>(
    () => (slug ? api.getBlogPost(slug).catch(() => null) : Promise.resolve(null)),
    null,
    [slug]
  );

  const { data: others } = useAsyncData<BlogPost[]>(
    () => api.getBlogPosts().catch(() => [] as BlogPost[]),
    []
  );
  const related = others.filter((item) => item.slug !== slug).slice(0, 3);

  return (
    <>
      <Helmet>
        <title>{post ? `${post.title} | ${t("blog.metaTitle")}` : t("blog.metaTitle")}</title>
        <meta name="description" content={post?.excerpt ?? t("blog.metaDesc")} />
      </Helmet>
      <SiteShell>
        {loading ? (
          <div className="pt-40">
            <Loading />
          </div>
        ) : !post ? (
          <section className="mx-auto max-w-3xl px-6 pb-32 pt-40 text-center">
            <Newspaper size={44} className="mx-auto text-gold" />
            <h1 className="mt-5 font-serif text-4xl text-foreground">{t("blog.notFound")}</h1>
            <Link
              to="/blog"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3 text-sm font-semibold text-gold-foreground shadow-[var(--shadow-gold)] transition hover:scale-105"
            >
              <ArrowLeft size={16} />
              {t("blog.backToBlog")}
            </Link>
          </section>
        ) : (
          <>
            <section className="relative overflow-hidden bg-primary pb-20 pt-32 lg:pb-24 lg:pt-40">
              <div className="absolute inset-0 opacity-25">
                {coverOf(post) && <img src={coverOf(post)!} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/80 to-primary/60" />
              <div className="relative mx-auto max-w-4xl px-6 lg:px-8">
                <MetaRow post={post} locale={i18n.language} className="text-gold" />
                <h1 className="mt-5 font-serif text-4xl leading-[1.1] text-background sm:text-5xl lg:text-6xl">{post.title}</h1>
                {post.excerpt && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-background/75">{post.excerpt}</p>}
              </div>
            </section>

            <article className="bg-background py-14 lg:py-20">
              <div className="mx-auto max-w-3xl px-6 lg:px-8">
                <Link
                  to="/blog"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gold transition hover:gap-3"
                >
                  <ArrowLeft size={15} />
                  {t("blog.backToBlog")}
                </Link>
                {post.cover_image && (
                  <div className="mt-8 overflow-hidden rounded-3xl shadow-[var(--shadow-elegant)]">
                    <img src={coverOf(post)!} alt={post.title} className="w-full object-cover" />
                  </div>
                )}
                <div className="mt-10 whitespace-pre-wrap text-lg leading-8 text-foreground/90">{post.body ?? post.excerpt ?? ""}</div>
                {post.images && post.images.length > 0 && <Gallery images={post.images} />}
              </div>
            </article>

            {related.length > 0 && (
              <section className="bg-secondary py-16 lg:py-20">
                <div className="mx-auto max-w-7xl px-6 lg:px-12">
                  <p className="text-xs uppercase tracking-[0.3em] text-gold">{t("blog.related")}</p>
                  <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {related.map((item) => (
                      <article key={item.id} className="group overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-elegant)] transition hover:-translate-y-1">
                        <Link to={`/blog/${item.slug}`} className="block aspect-[16/10] overflow-hidden">
                          <Cover post={item} />
                        </Link>
                        <div className="p-6">
                          <MetaRow post={item} locale={i18n.language} className="text-muted-foreground/80" />
                          <h3 className="mt-3 font-serif text-xl leading-snug text-foreground">
                            <Link to={`/blog/${item.slug}`} className="transition group-hover:text-gold">
                              {item.title}
                            </Link>
                          </h3>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </SiteShell>
    </>
  );
}

export default BlogPage;
