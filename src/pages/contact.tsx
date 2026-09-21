import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { SiteShell } from "../components/site/SiteShell";
import { API_BASE } from "../lib/apiBase";

const icons: Record<string, React.ReactNode> = {
  Email: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Partnerships: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Press: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
      <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Studio: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
      <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  ኢሜይል: null,
  ሽርክናዎች: null,
  ፕሬስ: null,
  ስቱዲዮ: null,
  Iimeelii: null,
  Hojiiwwan: null,
  Laalcha: null,
  Studioo: null,
};

function getIcon(label: string): React.ReactNode {
  if (icons[label]) return icons[label];
  if (label === "ኢሜይል" || label === "Iimeelii") return icons.Email;
  if (label === "ሽርክናዎች" || label === "Hojiiwwan") return icons.Partnerships;
  if (label === "ፕሬስ" || label === "Laalcha") return icons.Press;
  if (label === "ስቱዲዮ" || label === "Studioo") return icons.Studio;
  return icons.Email;
}

export function ContactPage(): React.ReactElement {
  const { t, i18n } = useTranslation();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const contactInfo = t("contact.info", { returnObjects: true }) as Array<{ label: string; value: string; sub: string }>;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, lang: i18n.language }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setSent(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t("contact.metaTitle")}</title>
        <meta name="description" content={t("contact.metaDesc")} />
      </Helmet>

      <SiteShell>
        {/* Hero */}
        <section className="relative overflow-hidden bg-primary pt-32 pb-20 text-background lg:pt-40 lg:pb-28">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 25% 25%, var(--color-gold) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-gold/5 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
            <span className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-gold/40 bg-primary/30 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-gold backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              {t("contact.sidebar.heading")}
            </span>
            <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">{t("contact.title")}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-background/70">{t("contact.subtitle")}</p>
          </div>
        </section>

        {/* Map + Address */}
        <section className="bg-secondary py-20 lg:py-28">
          <div className="mx-auto grid max-w-7xl items-stretch gap-8 px-6 lg:grid-cols-5 lg:px-12">
            <div className="lg:col-span-3">
              <div className="h-full overflow-hidden rounded-3xl border border-border shadow-[var(--shadow-elegant)]">
                <iframe
                  title="EECMY – Yemisrach Dimts Communication Services"
                  src="https://maps.google.com/maps?q=XPCJ%2B8Q9%2C%20Guinea%20Bissau%20St%2C%20Addis%20Ababa%2C%20Ethiopia&z=16&hl=en&output=embed"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0, minHeight: 380 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="block w-full"
                />
              </div>
            </div>
            <div className="flex flex-col justify-center rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-elegant)] lg:col-span-2">
              <p className="text-xs uppercase tracking-[0.3em] text-gold">{t("contact.sidebar.heading")}</p>
              <h2 className="mt-4 font-serif text-3xl text-foreground sm:text-4xl">Yemisrach Dimts Communication Service</h2>
              <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 h-4 w-4 shrink-0 text-gold"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                  XPCJ+8Q9, Guinea Bissau St, Addis Ababa, Ethiopia
                </li>
                <li className="flex items-start gap-3">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 h-4 w-4 shrink-0 text-gold"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  info@yemisrachdimts.org
                </li>
                <li className="flex items-start gap-3">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 h-4 w-4 shrink-0 text-gold"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0122 16.92z" /></svg>
                  +251 (0) 11 123 4567
                </li>
              </ul>
              <a
                href="https://maps.google.com/maps?q=XPCJ%2B8Q9%2C%20Guinea%20Bissau%20St%2C%20Addis%20Ababa%2C%20Ethiopia"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-gold px-8 py-4 text-sm font-semibold text-gold-foreground shadow-[var(--shadow-gold)] transition hover:scale-105"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                Get Directions
              </a>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="bg-background py-20 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-5 lg:px-12">

            {/* Sidebar */}
            <aside className="lg:col-span-2">
              <h2 className="font-serif text-3xl text-foreground">{t("contact.sidebar.heading")}</h2>
              <p className="mt-3 text-muted-foreground">{t("contact.sidebar.sub")}</p>
              <div className="mt-10 space-y-4">
                {contactInfo.map((row) => (
                  <div key={row.label} className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:border-gold/40 hover:shadow-[0_8px_30px_-8px_oklch(0.72_0.13_75_/_0.15)]">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold transition-colors group-hover:bg-gold/20">
                      {getIcon(row.label)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">{row.label}</p>
                      <p className="mt-1 font-serif text-lg text-foreground">{row.value}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{row.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            {/* Form */}
            <div className="lg:col-span-3">
              <form onSubmit={handleSubmit} className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-elegant)] transition-shadow duration-500 hover:shadow-[0_30px_80px_-20px_oklch(0.22_0.06_260_/_0.18)] lg:p-12">
                {sent ? (
                  <div className="flex flex-col items-center py-16 text-center">
                    <div className="relative">
                      <div className="absolute inset-0 animate-ping rounded-full bg-gold/20" style={{ animationDuration: "2s" }} />
                      <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gold/20 to-gold/5 ring-1 ring-gold/20">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-10 w-10 text-gold"><path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>
                    </div>
                    <h3 className="mt-8 font-serif text-4xl text-foreground">{t("contact.form.successTitle")}</h3>
                    <p className="mt-4 max-w-sm text-muted-foreground">{t("contact.form.successDesc")}</p>
                    <button type="button" onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }} className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-gold px-10 py-3.5 text-sm font-semibold text-gold-foreground shadow-[var(--shadow-gold)] transition-all duration-300 hover:scale-105 hover:shadow-[0_15px_50px_-12px_oklch(0.72_0.13_75_/_0.6)]">
                      {t("contact.form.ok")}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-8">
                      <h2 className="font-serif text-3xl text-foreground">{t("contact.form.heading")}</h2>
                      <p className="mt-2 text-sm text-muted-foreground">{t("contact.form.required")}</p>
                    </div>
                    {error && (
                      <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" strokeLinecap="round" /></svg>
                        {error}
                      </div>
                    )}
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label={t("contact.form.name")} type="text" name="name" placeholder={t("contact.form.placeholders.name")} value={form.name} onChange={handleChange} />
                      <Field label={t("contact.form.email")} type="email" name="email" placeholder={t("contact.form.placeholders.email")} value={form.email} onChange={handleChange} />
                    </div>
                    <div className="mt-5">
                      <Field label={t("contact.form.subject")} type="text" name="subject" placeholder={t("contact.form.placeholders.subject")} value={form.subject} onChange={handleChange} />
                    </div>
                    <div className="mt-5">
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{t("contact.form.message")}</label>
                      <textarea required rows={5} name="message" placeholder={t("contact.form.placeholders.message")} value={form.message} onChange={handleChange} className="mt-3 w-full rounded-xl border border-border bg-background px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/50 transition-all duration-300 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 focus:shadow-[0_0_0_4px_oklch(0.72_0.13_75_/_0.08)]" />
                    </div>
                    <button type="submit" disabled={loading} className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-gold to-[oklch(0.65_0.15_60)] px-8 py-4 text-sm font-semibold text-gold-foreground shadow-[var(--shadow-gold)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_15px_50px_-12px_oklch(0.72_0.13_75_/_0.55)] disabled:opacity-50 disabled:hover:scale-100 sm:w-auto">
                      {loading ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                          {t("contact.form.sending")}
                        </>
                      ) : t("contact.form.submit")}
                    </button>
                  </>
                )}
              </form>
            </div>
          </div>
        </section>
      </SiteShell>
    </>
  );
}

function Field({ label, ...rest }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>): React.ReactElement {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      <input required {...rest} className="mt-3 w-full rounded-xl border border-border bg-background px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/50 transition-all duration-300 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 focus:shadow-[0_0_0_4px_oklch(0.72_0.13_75_/_0.08)]" />
    </label>
  );
}
