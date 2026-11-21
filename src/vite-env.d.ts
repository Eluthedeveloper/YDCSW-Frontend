/// <reference types="vite/client" />

declare module 'jsmediatags';

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_HLS_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
