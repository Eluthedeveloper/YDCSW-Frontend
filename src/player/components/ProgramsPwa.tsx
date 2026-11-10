import { useEffect } from 'react';

// Paths are deliberately absolute and confined to /programs/. The manifest has
// scope /programs/ and the service worker is registered with the same scope, so
// the marketing site is never installable and never served from the PWA cache.
const MANIFEST_HREF = '/programs/manifest.webmanifest';
const SERVICE_WORKER_URL = '/sw.js';
const SERVICE_WORKER_SCOPE = '/programs/';

/**
 * Turns the program library into an installable, offline-capable PWA without
 * touching the rest of the site. Rendered only by PublicLayout, which wraps the
 * /programs routes, so the manifest link and service worker exist only while a
 * visitor is inside the program library.
 */
type HeadElement = { tag: 'link' | 'meta'; attrs: Record<string, string> };

// Added only while the program-library layout is mounted and removed when it
// unmounts, so the marketing site never advertises the app.
const HEAD_ELEMENTS: HeadElement[] = [
  { tag: 'link', attrs: { rel: 'manifest', href: MANIFEST_HREF } },
  { tag: 'meta', attrs: { name: 'theme-color', content: '#0d0d12' } },
  // iOS reads these instead of (or in addition to) the web manifest.
  { tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/logo.png' } },
  { tag: 'meta', attrs: { name: 'apple-mobile-web-app-capable', content: 'yes' } },
  { tag: 'meta', attrs: { name: 'apple-mobile-web-app-title', content: 'Program Library' } },
  { tag: 'meta', attrs: { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' } },
];

export default function ProgramsPwa() {
  useEffect(() => {
    const elements = HEAD_ELEMENTS.map(({ tag, attrs }) => {
      const element = document.createElement(tag);
      for (const [name, value] of Object.entries(attrs)) {
        element.setAttribute(name, value);
      }
      document.head.appendChild(element);
      return element;
    });

    // The service worker is produced by vite-plugin-pwa only in production
    // builds, so registering it during `vite dev` would just log a 404.
    if (import.meta.env.PROD && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register(SERVICE_WORKER_URL, { scope: SERVICE_WORKER_SCOPE })
        .catch((error) => {
          console.error('Program library service worker registration failed:', error);
        });
    }

    return () => {
      for (const element of elements) element.remove();
    };
  }, []);

  return null;
}
