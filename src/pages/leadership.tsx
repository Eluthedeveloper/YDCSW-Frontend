// src/pages/LeadershipPage.tsx
import React from "react";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { SiteShell } from "../components/site/SiteShell";

// Import existing head photos – adjust paths as needed
import headElectronic from "../assets/head-electronic.png";
import headPrint from "../assets/hero-worship.jpg";
import headFinance from "../assets/head-finance.png";
import directorPhoto from "../assets/gemechis.png";

// For Vestment we have no photo yet – use a placeholder
const vestmentPhoto = "/images/head-vestment-placeholder.jpg"; // replace

const photosById: Record<string, string> = {
  director: directorPhoto,
  electronic: headElectronic,
  finance: headFinance,
  print: headPrint,
  vestment: vestmentPhoto,
};

interface LeaderMember {
  id: string;
  name: string;
  title: string;
  quote: string;
}

export function LeadershipPage(): React.ReactElement {
  const { t } = useTranslation();

  const members = t("leadership.members", { returnObjects: true }) as LeaderMember[];

  return (
    <>
      <Helmet>
        <title>{t("leadership.metaTitle")}</title>
        <meta name="description" content={t("leadership.metaDesc")} />
        <meta property="og:title" content={t("leadership.metaTitle")} />
        <meta property="og:description" content={t("leadership.metaDesc")} />
      </Helmet>

      <SiteShell>
        <section className="bg-primary pt-32 pb-16 text-background lg:pt-40 lg:pb-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <p className="text-xs uppercase tracking-[0.3em] text-gold">{t("leadership.team")}</p>
            <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
              {t("leadership.titleLead")}{" "}
              <em className="text-gold not-italic">{t("leadership.titleAccent")}</em>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-background/75">
              {t("leadership.subtitle")}
            </p>
          </div>
        </section>

        <section className="bg-background py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {members.map((leader) => (
                <div
                  key={leader.id}
                  className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-elegant)] transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="aspect-[4/5] overflow-hidden bg-muted">
                    <img
                      src={photosById[leader.id]}
                      alt={leader.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="font-display text-2xl font-bold text-foreground">
                      {leader.name}
                    </h3>
                    <p className="mt-1 text-sm font-medium uppercase tracking-wider text-gold">
                      {leader.title}
                    </p>
                    <p className="mt-3 text-sm italic text-muted-foreground">
                      “{leader.quote}”
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground/70">
                      {t(`leadership.${leader.id}`)}
                    </p>
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