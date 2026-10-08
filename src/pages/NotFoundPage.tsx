import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { SiteShell } from "../components/site/SiteShell";

/**
 * Catch-all route.
 *
 * Without it an unmatched URL matches no <Route>, <Routes> renders nothing, and
 * the user gets a bare white page with no header, no footer and no way out but
 * browser-back. That is not hypothetical: a nav link pointed at
 * /divisions/vestment-bookstore, which was never registered.
 */
export function NotFoundPage(): React.ReactElement {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{`404 — ${t("nav.home")}`}</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <SiteShell>
        <section className="bg-primary pt-32 pb-20 lg:pt-40 lg:pb-28">
          <div className="mx-auto max-w-3xl px-6 text-center lg:px-12">
            <p className="text-xs uppercase tracking-[0.3em] text-gold">404</p>
            <h1 className="mx-auto mt-4 max-w-2xl font-serif text-4xl leading-tight text-background sm:text-5xl">
              {t("notFound.title")}
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-background/70">
              {t("notFound.body")}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-primary transition hover:opacity-90"
              >
                {t("notFound.backHome")}
              </Link>
              <Link
                to="/programs"
                className="inline-flex items-center gap-2 text-sm text-background/80 underline underline-offset-4 transition hover:text-background"
              >
                {t("nav.programs")}
              </Link>
            </div>
          </div>
        </section>
      </SiteShell>
    </>
  );
}

export default NotFoundPage;