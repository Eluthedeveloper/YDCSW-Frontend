// src/components/Footer.tsx
import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const SOCIAL_LINKS = [
  {
    name: "YouTube",
    href: "https://youtube.com/@yemisrachdimts",
    color: "#FF0000",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    name: "TikTok",
    href: "https://tiktok.com/@yemisrachdimtsradio",
    color: "#000000",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78 2.92 2.92 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.57 6.33 6.33 0 0 0 9.37 22a6.33 6.33 0 0 0 6.38-6.22V9.4a8.16 8.16 0 0 0 4.84 1.58V7.53a4.85 4.85 0 0 1-1-.84z" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    href: "https://facebook.com/yemisrachdimtsradio",
    color: "#1877F2",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    name: "Telegram",
    href: "https:/https:/t.me/YDRadio",
    color: "#0088CC",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
  },
  {
    name: "WhatsApp",
    href: "https://wa.me/251911000000",
    color: "#25D366",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
      </svg>
    ),
  },
  {
    name: "X",
    href: "https://x.com/yemisrachdimts",
    color: "#000000",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
];

export function Footer(): React.ReactElement {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border bg-background py-14">
      <style>{`
        .social-link { transition: transform 0.3s ease, opacity 0.3s ease !important; }
        .social-link:hover { transform: scale(1.2); opacity: 0.8; }
      `}</style>
      <div className="mx-auto grid max-w-7xl gap-10 px-6 md:grid-cols-4 lg:px-12">
        <div>
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-gold" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M2 12h20M12 2l4 6M12 2l-4 6" strokeLinecap="round" />
            </svg>
            <span className="font-serif text-xl text-foreground">Yemisrach Dimts</span>
          </div>
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            EECMY – Yemisrach Dimts Communication Service
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Broadcasting the Gospel to Ethiopia and beyond.
          </p>
          <div className="mt-5 flex items-center gap-3">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.name}
                className="social-link transition-colors duration-300"
                style={{ color: social.color } as React.CSSProperties}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-serif text-sm uppercase tracking-widest text-foreground">Explore</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="transition hover:text-gold">{t("nav.home")}</Link></li>
            <li><Link to="/about" className="transition hover:text-gold">{t("nav.about")}</Link></li>
            <li><Link to="/divisions" className="transition hover:text-gold">{t("nav.divisions")}</Link></li>
            <li><Link to="/bookshops" className="transition hover:text-gold">{t("nav.bookshops")}</Link></li>
            <li><Link to="/gallery" className="transition hover:text-gold">{t("nav.gallery")}</Link></li>
            <li><Link to="/contact" className="transition hover:text-gold">{t("nav.contact")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-serif text-sm uppercase tracking-widest text-foreground">Ministries</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>Radio Broadcasting</li>
            <li>Internet Radio</li>
            <li>Film & Video</li>
            <li>Podcast</li>
            <li>Devotionals</li>
          </ul>
        </div>
        <div>
          <h4 className="font-serif text-sm uppercase tracking-widest text-foreground">Contact</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>Yemisrach Dimts Communication Service</li>
            <li>XPCJ+8Q9, Guinea Bissau St, Addis Ababa, Ethiopia</li>
            <li>info@yemisrachdimts.org</li>
            <li>+251 (0) 11 123 4567</li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-7xl border-t border-border px-6 pt-6 text-xs text-muted-foreground lg:px-12">
        © {new Date().getFullYear()} Yemisrach Dimts Communication Service (EECMY‑YDCS). All rights reserved.
      </div>
    </footer>
  );
}
