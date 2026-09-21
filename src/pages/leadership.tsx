// src/pages/LeadershipPage.tsx
import React from "react";
import { Helmet } from "react-helmet-async";
import { SiteShell } from "../components/site/SiteShell";

// Import existing head photos – adjust paths as needed
import headElectronic from "../assets/head-electronic.png";
import headPrint from "../assets/hero-worship.jpg";
import headFinance from "../assets/head-finance.png";

// For Vestment and Director, we may not have photos – use placeholders
// You can replace these with actual image imports or public URLs
const directorPhoto = "/images/director-placeholder.jpg"; // replace
const vestmentPhoto = "/images/head-vestment-placeholder.jpg"; // replace

const leaders = [
  // Director
  {
    name: "Rev. Gemechis Didi",
    title: "Director of Media Ministry",
    photo: directorPhoto,
    quote: "Yemisrach Dimts exists to be the voice of hope for the Ethiopian people. Every broadcast is an opportunity to present Christ.",
    division: "Director",
  },
  // Division Heads
  {
    name: "Wakshuma Terefe",
    title: "Head of Digital and Electronic Media",
    photo: headElectronic,
    quote: "Radio and media are lifelines to millions. Every broadcast is an act of worship.",
    division: "Digital and Electronic Media",
  },
  {
    name: "Fraol Benti",
    title: "Head of Finance",
    photo: headFinance,
    quote: "Stewardship is worship. We handle every gift with gratitude and integrity.",
    division: "Finance",
  },
  {
    name: "Demelash Guti",
    title: "Head of Print Media",
    photo: headPrint,
    quote: "A printed page can travel where a preacher cannot. We labour to make every page faithful.",
    division: "Print Media",
  },
  {
    name: "Bethelhem",
    title: "Head Resource Mobalization and Economic Development",
    photo: vestmentPhoto,
    quote: "Vestment is not just cloth – it is a symbol of the calling we carry. We honour God with every stitch and every service.",
    division: "Vestment",
  },
];

export function LeadershipPage(): React.ReactElement {
  return (
    <>
      <Helmet>
        <title>Our Leadership Staff — Yemisrach Dimts</title>
        <meta
          name="description"
          content="Meet the leadership team behind Yemisrach Dimts Communication Service – serving the Gospel through media."
        />
      </Helmet>

      <SiteShell>
        <section className="bg-primary pt-32 pb-16 text-background lg:pt-40 lg:pb-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <p className="text-xs uppercase tracking-[0.3em] text-gold">Our Team</p>
            <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
              Leadership <em className="text-gold not-italic">Staff</em>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-background/75">
              Meet the dedicated leaders who oversee our media ministry – broadcasting the Gospel to Ethiopia and beyond.
            </p>
          </div>
        </section>

        <section className="bg-background py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {leaders.map((leader) => (
                <div
                  key={leader.name}
                  className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-elegant)] transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="aspect-[4/5] overflow-hidden bg-muted">
                    <img
                      src={leader.photo}
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
                      {leader.division}
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