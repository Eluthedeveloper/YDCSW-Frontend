/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // The program library is the only installable part of the site. Its
    // manifest lives at /programs/manifest.webmanifest and its service worker
    // is registered with the /programs/ scope, so the marketing pages at /, /about,
    // /divisions, etc. never fall under the PWA and cannot be installed or cached
    // by it. `manifest: false` keeps the plugin from injecting a site-wide manifest
    // link; we add the scoped one ourselves from the program-library layout.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      manifest: false,
      scope: '/programs/',
      workbox: {
        // Precache the app shell and code only. The large marketing JPEG/PNG assets
        // are not part of the program library, so they stay out of the install
        // payload and are cached on demand by the runtime rule below.
        globPatterns: ['**/*.{js,css,html,svg,webmanifest,ico}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            // Covers and program artwork are either bundled or served from the API;
            // cache them the first time they are seen so the library still has
            // images offline.
            urlPattern: /\.(?:png|jpe?g|webp|gif|svg)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'program-library-images',
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      // jsmediatags requires react-native-fs at module scope; the browser build
      // never touches its React Native reader.
      'react-native-fs': fileURLToPath(new URL('./src/shims/react-native-fs.ts', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    css: false,
    // Same reason as asyncUtilTimeout in test/setup.ts: several jsdom
    // environments in parallel make the default 5 s budget miss on load,
    // which reads as a broken test rather than a slow machine.
    testTimeout: 20_000,
  },
});