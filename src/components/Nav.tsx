// src/components/Nav.tsx
import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logo from "../assets/Logo.png";

export function Nav(): React.ReactElement {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [deptOpen, setDeptOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false);
  const [mobileDeptOpen, setMobileDeptOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-about-dropdown]")) setAboutOpen(false);
      if (!target.closest("[data-dept-dropdown]")) setDeptOpen(false);
    };
    // Escape closes an open dropdown. It only had an outside-click handler, so a
    // keyboard user who opened one with Enter had no way to dismiss it without
    // tabbing out of the document.
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setAboutOpen(false);
      setDeptOpen(false);
      setMobileAboutOpen(false);
      setMobileDeptOpen(false);
    };
    if (aboutOpen || deptOpen) document.addEventListener("click", onClick);
    if (aboutOpen || deptOpen || mobileAboutOpen || mobileDeptOpen) {
      document.addEventListener("keydown", onKeyDown);
    }
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [aboutOpen, deptOpen, mobileAboutOpen, mobileDeptOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const transparent = isHome && !scrolled;
  const closeMobile = () => {
    setMobileOpen(false);
    setMobileAboutOpen(false);
    setMobileDeptOpen(false);
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const ABOUT_SUBMENU = [
    { to: "/about#mission-vision", label: t("nav.missionVision") },
    { to: "/about#our-history", label: t("nav.history") },
    { to: "/leadership", label: t("nav.leadershipStaff") },
  ];

  const DIVISIONS = [
    { to: "/divisions", label: t("nav.allDivisions") },
    { to: "/divisions/electronic-media", label: t("nav.electronicMedia") },
    { to: "/divisions/print-media", label: t("nav.printMedia") },
    { to: "/divisions/finance", label: t("nav.finance") },
    { to: "/divisions/resource-mobilization", label: t("nav.resource") },
  ];

  // Built as a plain element rather than a nested component: it needs this
  // component's i18n instance, and defining it at module scope would mean
  // threading that state down through props.
  // `code` stays the i18n key (locale files are am/en/om); `label` is what the
  // visitor reads — Oromo's common written form is "OR", not the ISO "om".
  const LANGUAGES = [
    { code: "en", label: "ENG" },
    { code: "am", label: "AMH" },
    { code: "om", label: "OR" },
  ];

  const languageButtons = (
    <div className="flex items-center rounded-full border border-background/15 p-0.5">
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => changeLanguage(code)}
          aria-label={`Switch language to ${label}`}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide transition ${
            i18n.language === code
              ? "bg-gold text-gold-foreground shadow-sm"
              : "text-background/70 hover:text-gold"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <header
      className={`${isHome ? "fixed" : "sticky"} top-0 left-0 right-0 z-30 transition-colors duration-300 ${
        transparent ? "bg-transparent" : "bg-primary/95 backdrop-blur shadow-[0_1px_0_0_oklch(1_0_0/0.06)]"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 lg:px-8">
        {/* Logo & Brand */}
        <Link to="/" className="flex items-center gap-2 text-background group">
          <img
            src={logo}
            alt="EECMY-YDCS Logo"
            className="h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
          />
          <div className="flex flex-col leading-tight">
            <span className="font-display text-base font-bold tracking-tight text-background transition-colors group-hover:text-gold">
              Yemisrach Dimts
            </span>
            <span className="font-display text-[10px] font-medium tracking-wide text-gold/80">
              Ethiopian Evangelical Church Mekane Yesus
            </span>
            <span className="font-mono text-[8px] font-semibold uppercase tracking-wider text-background/50">
              EECMY-YDCS
            </span>
          </div>
        </Link>

        {/* Desktop navigation */}
        <ul className="hidden items-center gap-5 text-sm font-medium text-background/80 lg:flex">
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `transition hover:text-gold ${isActive ? "text-gold" : ""}`
              }
            >
              {t("nav.home")}
            </NavLink>
          </li>
          <li className="relative" data-about-dropdown>
            <button
              onClick={() => setAboutOpen((p) => !p)}
              aria-expanded={aboutOpen}
              aria-haspopup="true"
              className={`flex items-center gap-1 transition hover:text-gold ${
                pathname === "/about" || aboutOpen ? "text-gold" : ""
              }`}
            >
              {t("nav.about")}
              <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {aboutOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 overflow-hidden rounded-xl border border-gold/20 bg-primary/95 p-2 shadow-[var(--shadow-elegant)] backdrop-blur">
                <Link
                  to="/about"
                  onClick={() => setAboutOpen(false)}
                  className="block rounded-lg px-4 py-2.5 text-sm text-background/80 transition hover:bg-gold/10 hover:text-gold"
                >
                  {t("nav.aboutYdcs")}
                </Link>
                {ABOUT_SUBMENU.map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={() => setAboutOpen(false)}
                    className="block rounded-lg px-4 py-2.5 text-sm text-background/80 transition hover:bg-gold/10 hover:text-gold"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </li>
          <li>
            <NavLink
              to="/services"
              className={({ isActive }) =>
                `transition hover:text-gold ${isActive ? "text-gold" : ""}`
              }
            >
              {t("nav.services")}
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/programs"
              className={({ isActive }) =>
                `transition hover:text-gold ${isActive ? "text-gold" : ""}`
              }
            >
              {t("nav.programs")}
            </NavLink>
          </li>
          <li className="relative" data-dept-dropdown>
            <button
              onClick={() => setDeptOpen((p) => !p)}
              aria-expanded={deptOpen}
              aria-haspopup="true"
              className={`flex items-center gap-1 transition hover:text-gold ${
                deptOpen ? "text-gold" : ""
              }`}
            >
              {t("nav.divisions")}
              <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {deptOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 overflow-hidden rounded-xl border border-gold/20 bg-primary/95 p-2 shadow-[var(--shadow-elegant)] backdrop-blur">
                {DIVISIONS.map((d) => (
                  <Link
                    key={d.label}
                    to={d.to}
                    onClick={() => setDeptOpen(false)}
                    className="block rounded-lg px-4 py-2.5 text-sm text-background/80 transition hover:bg-gold/10 hover:text-gold"
                  >
                    {d.label}
                  </Link>
                ))}
              </div>
            )}
          </li>
          <li>
            <NavLink
              to="/gallery"
              className={({ isActive }) =>
                `transition hover:text-gold ${isActive ? "text-gold" : ""}`
              }
            >
              {t("nav.gallery")}
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `transition hover:text-gold ${isActive ? "text-gold" : ""}`
              }
            >
              {t("nav.contact")}
            </NavLink>
          </li>
        </ul>

        <div className="flex items-center gap-3">
          <Link
            to="/contact"
            className="hidden rounded-full bg-gold px-4 py-1.5 text-xs font-semibold text-gold-foreground shadow-[var(--shadow-gold)] transition hover:scale-105 lg:inline-block"
          >
            {t("nav.partner")}
          </Link>

          <div className="hidden lg:block">
            {languageButtons}
          </div>

          <div className="lg:hidden">
            {languageButtons}
          </div>

          <button
            onClick={() => setMobileOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-background/90 transition hover:bg-gold/10 hover:text-gold lg:hidden"
            aria-label="Open menu"
            type="button"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeMobile}
            aria-hidden
          />

          {/* Drawer */}
          <aside
            role="dialog"
            aria-modal="true"
            className="absolute right-0 top-0 flex h-screen w-80 max-w-[85vw] flex-col border-l border-gold/20 bg-primary shadow-2xl animate-in slide-in-from-right duration-200"
          >
            {/* Header */}
            <div className="flex flex-row items-center justify-between border-b border-gold/10 px-4 py-3">
              <Link to="/" onClick={closeMobile} className="flex items-center gap-2 text-background group">
                <img src={logo} alt="EECMY-YDCS Logo" className="h-9 w-auto object-contain" />
                <div className="flex flex-col leading-tight">
                  <span className="font-display text-xs font-bold tracking-tight text-background">
                    EECMY-YDCS
                  </span>
                  <span className="font-display text-[9px] font-medium text-gold">
                    Yemisrach Dimts
                  </span>
                </div>
              </Link>
              <button
                onClick={closeMobile}
                aria-label="Close menu"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gold/30 text-gold transition hover:bg-gold hover:text-gold-foreground"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            {/* Scrollable navigation */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-0.5">
              <NavLink
                to="/"
                end
                onClick={closeMobile}
                className={({ isActive }) =>
                  `block rounded-lg px-4 py-2.5 text-sm font-medium transition hover:bg-gold/10 hover:text-gold ${
                    isActive ? "text-gold" : "text-background/80"
                  }`
                }
              >
                {t("nav.home")}
              </NavLink>

              {/* About with submenu */}
              <div className="mt-0.5">
                <button
                  onClick={() => setMobileAboutOpen((p) => !p)}
                  aria-expanded={mobileAboutOpen}
                  aria-haspopup="true"
                  className={`flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-sm font-medium transition hover:bg-gold/10 hover:text-gold ${
                    mobileAboutOpen ? "text-gold" : "text-background/80"
                  }`}
                >
                  {t("nav.about")}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className={`h-3.5 w-3.5 transition-transform ${mobileAboutOpen ? "rotate-180" : ""}`}
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {mobileAboutOpen && (
                  <div className="mt-1 flex flex-col gap-0.5 pl-4">
                    <Link
                      to="/about"
                      onClick={closeMobile}
                      className="block rounded-lg px-4 py-2 text-sm text-background/70 transition hover:bg-gold/10 hover:text-gold"
                    >
                      {t("nav.aboutYdcs")}
                    </Link>
                    {ABOUT_SUBMENU.map((item) => (
                      <Link
                        key={item.label}
                        to={item.to}
                        onClick={closeMobile}
                        className="block rounded-lg px-4 py-2 text-sm text-background/70 transition hover:bg-gold/10 hover:text-gold"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <NavLink
                to="/services"
                onClick={closeMobile}
                className={({ isActive }) =>
                  `block rounded-lg px-4 py-2.5 text-sm font-medium transition hover:bg-gold/10 hover:text-gold ${
                    isActive ? "text-gold" : "text-background/80"
                  }`
                }
              >
                {t("nav.services")}
              </NavLink>

              <NavLink
                to="/programs"
                onClick={closeMobile}
                className={({ isActive }) =>
                  `block rounded-lg px-4 py-2.5 text-sm font-medium transition hover:bg-gold/10 hover:text-gold ${
                    isActive ? "text-gold" : "text-background/80"
                  }`
                }
              >
                {t("nav.programs")}
              </NavLink>

              {/* Divisions with submenu */}
              <div className="mt-0.5">
                <button
                  onClick={() => setMobileDeptOpen((p) => !p)}
                  aria-expanded={mobileDeptOpen}
                  aria-haspopup="true"
                  className={`flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-sm font-medium transition hover:bg-gold/10 hover:text-gold ${
                    mobileDeptOpen ? "text-gold" : "text-background/80"
                  }`}
                >
                  {t("nav.divisions")}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className={`h-3.5 w-3.5 transition-transform ${mobileDeptOpen ? "rotate-180" : ""}`}
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {mobileDeptOpen && (
                  <div className="mt-1 flex flex-col gap-0.5 pl-4">
                    {DIVISIONS.map((d) => (
                      <Link
                        key={d.label}
                        to={d.to}
                        onClick={closeMobile}
                        className="block rounded-lg px-4 py-2 text-sm text-background/70 transition hover:bg-gold/10 hover:text-gold"
                      >
                        {d.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <NavLink
                to="/gallery"
                onClick={closeMobile}
                className={({ isActive }) =>
                  `block rounded-lg px-4 py-2.5 text-sm font-medium transition hover:bg-gold/10 hover:text-gold ${
                    isActive ? "text-gold" : "text-background/80"
                  }`
                }
              >
                {t("nav.gallery")}
              </NavLink>

              <NavLink
                to="/contact"
                onClick={closeMobile}
                className={({ isActive }) =>
                  `block rounded-lg px-4 py-2.5 text-sm font-medium transition hover:bg-gold/10 hover:text-gold ${
                    isActive ? "text-gold" : "text-background/80"
                  }`
                }
              >
                {t("nav.contact")}
              </NavLink>
            </nav>

            {/* Fixed footer with Partner button */}
            <div className="border-t border-gold/10 p-4">
              <Link
                to="/contact"
                onClick={closeMobile}
                className="block w-full rounded-full bg-gold px-5 py-2.5 text-center text-sm font-semibold text-gold-foreground shadow-[var(--shadow-gold)] transition hover:scale-105"
              >
                {t("nav.partner")}
              </Link>
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}