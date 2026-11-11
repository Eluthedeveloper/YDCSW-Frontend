// src/components/Nav.tsx
import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logo from "../assets/Logo.png";
import NotificationBell from "./NotificationBell";

export function Nav(): React.ReactElement {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  // The Oromo "Nu Waliin Hojjedhaa" CTA is long enough to crowd the desktop
  // bar, so the gold partner button only renders for en/am.
  const isOromo = (i18n.resolvedLanguage ?? i18n.language ?? "").startsWith("om");
  const [scrolled, setScrolled] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [deptOpen, setDeptOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false);
  const [mobileDeptOpen, setMobileDeptOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);

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
      if (!target.closest("[data-more-dropdown]")) setMoreOpen(false);
    };
    // Escape closes an open dropdown. It only had an outside-click handler, so a
    // keyboard user who opened one with Enter had no way to dismiss it without
    // tabbing out of the document.
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setAboutOpen(false);
      setDeptOpen(false);
      setMoreOpen(false);
      setMobileAboutOpen(false);
      setMobileDeptOpen(false);
    };
    if (aboutOpen || deptOpen || moreOpen) document.addEventListener("click", onClick);
    if (aboutOpen || deptOpen || moreOpen || mobileAboutOpen || mobileDeptOpen) {
      document.addEventListener("keydown", onKeyDown);
    }
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [aboutOpen, deptOpen, moreOpen, mobileAboutOpen, mobileDeptOpen]);

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

  // The link handlers close the drawer on a click, but a browser Back/forward
  // navigation would otherwise leave it open on top of the new page. Listening
  // for popstate rather than reacting to `pathname` keeps this out of the
  // render cycle and covers exactly the history-nav case links don't.
  useEffect(() => {
    const onPopState = () => {
      setMobileOpen(false);
      setMobileAboutOpen(false);
      setMobileDeptOpen(false);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Treat the mobile drawer as a real dialog: move focus inside when it opens,
  // keep Tab within it, and hand focus back to the control that opened it.
  useEffect(() => {
    if (!mobileOpen) return;
    const drawer = drawerRef.current;
    if (!drawer) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusable = () =>
      Array.from(
        drawer.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null);

    (focusable()[0] ?? drawer).focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusable();
      if (items.length === 0) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [mobileOpen]);

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

  // Shared visual treatments. Keeping them here rather than repeating a long
  // class string on every link makes the active/hover states stay in sync.
  // `min-w-0` on the links plus a truncating inner span lets the row shrink
  // gracefully: long locale labels (e.g. Oromo) ellipsize instead of
  // overflowing the nav list and overlapping the partner/language controls.
  // The li must itself be a flex container — an inline-flex child of a block
  // li always sizes to its content and overflows, so truncation never engaged.
  const desktopLink = ({ isActive }: { isActive: boolean }) =>
    `relative flex min-w-0 items-center whitespace-nowrap rounded-full px-2.5 py-2 transition-colors duration-200 after:absolute after:inset-x-2.5 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-gold after:transition-transform after:duration-300 after:content-[''] hover:text-gold hover:after:scale-x-100 ${
      isActive ? "text-gold after:scale-x-100" : "text-background/80"
    }`;
  const desktopTrigger = (active: boolean) =>
    `flex min-w-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-2 transition-colors duration-200 hover:text-gold ${
      active ? "text-gold" : "text-background/80"
    }`;
  const dropdownItem =
    "block rounded-xl px-4 py-2.5 text-sm text-background/80 transition hover:bg-gold/10 hover:text-gold";
  const mobileLink = ({ isActive }: { isActive: boolean }) =>
    `block rounded-xl px-4 py-3 text-sm font-medium transition ${
      isActive
        ? "bg-gold/10 text-gold"
        : "text-background/80 hover:bg-white/5 hover:text-gold"
    }`;
  const mobileTrigger = (active: boolean) =>
    `flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-white/5 hover:text-gold ${
      active ? "bg-gold/10 text-gold" : "text-background/80"
    }`;
  const mobileSubLink =
    "block rounded-lg px-4 py-2 text-sm text-background/70 transition hover:bg-white/5 hover:text-gold";

  // A compact select rather than a row of three buttons: the header was
  // getting crowded, and a native select also opens the language menu from
  // the mobile drawer without extra state.
  const languageSelect = (
    <>
      <label htmlFor="site-language" className="sr-only">
        {t("nav.language")}
      </label>
      <select
        id="site-language"
        value={i18n.resolvedLanguage || "en"}
        onChange={(e) => changeLanguage(e.target.value)}
        className="shrink-0 cursor-pointer rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold tracking-wide text-background/80 transition hover:border-gold/40 hover:text-gold focus:border-gold focus:outline-none"
      >
        {LANGUAGES.map(({ code, label }) => (
          <option key={code} value={code} className="bg-primary text-background">
            {label}
          </option>
        ))}
      </select>
    </>
  );

  return (
    <header
      className={`${isHome ? "fixed" : "sticky"} top-0 left-0 right-0 z-30 transition-all duration-300 ${
        transparent
          ? "bg-transparent"
          : "bg-primary/95 shadow-[0_10px_40px_-18px_oklch(0.18_0.04_260/0.65)] backdrop-blur-xl"
      }`}
    >
      {/* Hairline accent that fades in once the bar becomes solid. */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent transition-opacity duration-300 ${
          transparent ? "opacity-0" : "opacity-100"
        }`}
      />
      <nav className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between gap-2 px-4 lg:h-20 lg:px-8">
        {/* Logo & Brand */}
        <Link to="/" className="group flex shrink-0 items-center gap-3 text-background">
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-gold/15 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100" />
            <img
              src={logo}
              alt="EECMY-YDCS Logo"
              className="relative h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="whitespace-nowrap font-display text-base font-semibold leading-none tracking-tight text-background transition-colors group-hover:text-gold sm:text-lg">
              {t("nav.brand")}
            </span>
            <span className="hidden whitespace-nowrap font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-gold/80 sm:block">
              {t("nav.communicationService")} · EECMY
            </span>
          </span>
        </Link>

        {/* Desktop navigation */}
        <ul className="hidden min-w-0 flex-1 items-center justify-start gap-0 text-[13px] font-medium lg:flex">
          <li className="flex min-w-0">
            <NavLink to="/" end className={desktopLink}>
              <span className="truncate">{t("nav.home")}</span>
            </NavLink>
          </li>
          <li className="relative flex min-w-0" data-about-dropdown>
            <button
              onClick={() => setAboutOpen((p) => !p)}
              aria-expanded={aboutOpen}
              aria-haspopup="true"
              className={desktopTrigger(
                pathname === "/about" || pathname === "/leadership" || aboutOpen
              )}
            >
              <span className="truncate">{t("nav.about")}</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className={`h-3 w-3 shrink-0 transition-transform duration-200 ${aboutOpen ? "rotate-180" : ""}`}
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {aboutOpen && (
              <div className="absolute top-full left-0 mt-3 w-60 origin-top-left overflow-hidden rounded-2xl border border-white/10 bg-primary/95 p-2 shadow-[var(--shadow-elegant)] ring-1 ring-gold/10 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
                <Link
                  to="/about"
                  onClick={() => setAboutOpen(false)}
                  className={dropdownItem}
                >
                  {t("nav.aboutYdcs")}
                </Link>
                {ABOUT_SUBMENU.map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={() => setAboutOpen(false)}
                    className={dropdownItem}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </li>
          {/* Services/Programs/Blog/Gallery are collapsed into "More" below xl,
              where long locale labels would otherwise overflow the bar. */}
          <li className="hidden min-w-0 xl:flex">
            <NavLink to="/services" className={desktopLink}>
              <span className="truncate">{t("nav.services")}</span>
            </NavLink>
          </li>
          <li className="hidden min-w-0 xl:flex">
            <NavLink to="/programs" className={desktopLink}>
              <span className="truncate">{t("nav.programs")}</span>
            </NavLink>
          </li>
          <li className="hidden min-w-0 xl:flex">
            <NavLink to="/blog" className={desktopLink}>
              <span className="truncate">{t("nav.blog")}</span>
            </NavLink>
          </li>
          <li className="relative flex min-w-0" data-dept-dropdown>
            <button
              onClick={() => setDeptOpen((p) => !p)}
              aria-expanded={deptOpen}
              aria-haspopup="true"
              className={desktopTrigger(pathname.startsWith("/divisions") || deptOpen)}
            >
              <span className="truncate">{t("nav.divisions")}</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className={`h-3 w-3 shrink-0 transition-transform duration-200 ${deptOpen ? "rotate-180" : ""}`}
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {deptOpen && (
              <div className="absolute top-full left-0 mt-3 w-72 origin-top-left overflow-hidden rounded-2xl border border-white/10 bg-primary/95 p-2 shadow-[var(--shadow-elegant)] ring-1 ring-gold/10 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
                {DIVISIONS.map((d) => (
                  <Link
                    key={d.label}
                    to={d.to}
                    onClick={() => setDeptOpen(false)}
                    className={dropdownItem}
                  >
                    {d.label}
                  </Link>
                ))}
              </div>
            )}
          </li>
          <li className="relative flex min-w-0 xl:hidden" data-more-dropdown>
            <button
              onClick={() => setMoreOpen((p) => !p)}
              aria-expanded={moreOpen}
              aria-haspopup="true"
              className={desktopTrigger(
                ["/services", "/programs", "/blog", "/gallery"].some((p) => pathname.startsWith(p)) ||
                moreOpen
              )}
            >
              <span className="truncate">{t("nav.more")}</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className={`h-3 w-3 shrink-0 transition-transform duration-200 ${moreOpen ? "rotate-180" : ""}`}
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {moreOpen && (
              <div className="absolute top-full left-0 mt-3 w-60 origin-top-left overflow-hidden rounded-2xl border border-white/10 bg-primary/95 p-2 shadow-[var(--shadow-elegant)] ring-1 ring-gold/10 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
                {[
                  { to: "/services", label: t("nav.services") },
                  { to: "/programs", label: t("nav.programs") },
                  { to: "/blog", label: t("nav.blog") },
                  // Gallery sits in the bar itself for en/am, so only Oromo —
                  // whose labels need the room — keeps it collapsed here.
                  ...(!isOromo ? [] : [{ to: "/gallery", label: t("nav.gallery") }]),
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMoreOpen(false)}
                    className={dropdownItem}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </li>
          {/* Gallery is a visible bar item for en/am; Oromo keeps it in More. */}
          {!isOromo && (
            <li className="flex min-w-0">
              <NavLink to="/gallery" className={desktopLink}>
                <span className="truncate">{t("nav.gallery")}</span>
              </NavLink>
            </li>
          )}
          <li className="flex min-w-0">
            <NavLink to="/contact" className={desktopLink}>
              <span className="truncate">{t("nav.contact")}</span>
            </NavLink>
          </li>
          {/* Partner CTA sits after Contact, at the far right end of the links;
              its long Oromo label crowds the bar, so it only shows for en/am. */}
          {!isOromo && (
            <li className="shrink-0">
              <Link
                to="/contact"
                className="group inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[image:var(--gradient-gold)] px-5 py-2 text-xs font-semibold text-gold-foreground shadow-[var(--shadow-gold)] ring-1 ring-white/20 transition hover:brightness-105 hover:shadow-[0_14px_40px_-10px_oklch(0.72_0.13_75/0.75)]"
              >
                {t("nav.partner")}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </li>
          )}
        </ul>

        <div className="flex shrink-0 items-center gap-2">
          <NotificationBell />

          {/* One compact select serves both desktop and the mobile bar. */}
          {languageSelect}

          <button
            onClick={() => setMobileOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-background/90 transition hover:border-gold/40 hover:text-gold lg:hidden"
            aria-label={t("nav.openMenu")}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
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
            id="mobile-menu"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            className="absolute right-0 top-0 flex h-dvh w-80 max-w-[85vw] animate-in flex-col rounded-l-3xl border-l border-white/10 bg-primary shadow-2xl ring-1 ring-gold/10 slide-in-from-right duration-200"
          >
            {/* Gold accent along the top edge */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent"
            />
            {/* Header */}
            <div className="flex flex-row items-center justify-between border-b border-white/10 px-4 py-3">
              <Link to="/" onClick={closeMobile} className="group flex items-center gap-2.5 text-background">
                <img src={logo} alt="EECMY-YDCS Logo" className="h-9 w-auto object-contain" />
                <div className="flex flex-col leading-tight">
                  <span className="font-display text-sm font-semibold leading-none tracking-tight text-background">
                    {t("nav.brand")}
                  </span>
                  <span className="font-mono text-[8px] font-medium uppercase tracking-[0.18em] text-gold/80">
                    EECMY-YDCS
                  </span>
                </div>
              </Link>
              <div className="flex items-center gap-2">
                <NotificationBell className="border border-gold/25" />
                <button
                  onClick={closeMobile}
                  aria-label={t("nav.closeMenu")}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gold/30 text-gold transition hover:bg-gold hover:text-gold-foreground"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Scrollable navigation */}
            <nav className="flex-1 space-y-1 overflow-y-auto p-4">
              <NavLink
                to="/"
                end
                onClick={closeMobile}
                className={mobileLink}
              >
                {t("nav.home")}
              </NavLink>

              {/* About with submenu */}
              <div className="mt-0.5">
                <button
                  onClick={() => setMobileAboutOpen((p) => !p)}
                  aria-expanded={mobileAboutOpen}
                  aria-haspopup="true"
                  className={mobileTrigger(
                    mobileAboutOpen || pathname === "/about" || pathname === "/leadership"
                  )}
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
                      className={mobileSubLink}
                    >
                      {t("nav.aboutYdcs")}
                    </Link>
                    {ABOUT_SUBMENU.map((item) => (
                      <Link
                        key={item.label}
                        to={item.to}
                        onClick={closeMobile}
                        className={mobileSubLink}
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
                className={mobileLink}
              >
                {t("nav.services")}
              </NavLink>

              <NavLink
                to="/programs"
                onClick={closeMobile}
                className={mobileLink}
              >
                {t("nav.programs")}
              </NavLink>

              <NavLink
                to="/blog"
                onClick={closeMobile}
                className={mobileLink}
              >
                {t("nav.blog")}
              </NavLink>

              {/* Divisions with submenu */}
              <div className="mt-0.5">
                <button
                  onClick={() => setMobileDeptOpen((p) => !p)}
                  aria-expanded={mobileDeptOpen}
                  aria-haspopup="true"
                  className={mobileTrigger(
                    mobileDeptOpen || pathname.startsWith("/divisions")
                  )}
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
                        className={mobileSubLink}
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
                className={mobileLink}
              >
                {t("nav.gallery")}
              </NavLink>

              <NavLink
                to="/contact"
                onClick={closeMobile}
                className={mobileLink}
              >
                {t("nav.contact")}
              </NavLink>
            </nav>

            {/* Fixed footer with Partner button */}
            <div className="border-t border-white/10 p-4">
              <Link
                to="/contact"
                onClick={closeMobile}
                className="group flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-[image:var(--gradient-gold)] px-5 py-3 text-center text-sm font-semibold text-gold-foreground shadow-[var(--shadow-gold)] ring-1 ring-white/20 transition hover:brightness-105"
              >
                {t("nav.partner")}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}