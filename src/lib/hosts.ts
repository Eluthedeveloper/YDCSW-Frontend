// One build serves both hosts: the marketing site on the main domain and the
// streaming app on its subdomain. The route tree is picked per request host
// (see App.tsx), so this stays a plain hostname comparison with no build-time
// flag. The env override exists so a local dev server can impersonate the
// stream host by pointing VITE_STREAM_HOST at it.
export const STREAM_HOST = import.meta.env.VITE_STREAM_HOST || 'listen.yemisrachdimts.org';

/** Where the marketing site lives, for links that leave the streaming app. */
export const MAIN_SITE_URL = 'https://yemisrachdimts.org';

/**
 * Absolute URL for a marketing-site path.
 *
 * Used where the player shows site content that only the marketing app can
 * render (news items behind the "What's New" bell live at `/blog/:slug`,
 * `/events/...`). Resolved through URL so a bare `'/'` and a path with or
 * without a leading slash all come out well-formed.
 */
export function mainSiteUrl(path = '/'): string {
  return new URL(path, MAIN_SITE_URL).toString();
}

export function isStreamHost(hostname: string = window.location.hostname): boolean {
  return hostname === STREAM_HOST;
}

/**
 * URL for links into the streaming app.
 *
 * Always points at the bare subdomain, which serves the player home directly,
 * so a click leaves the marketing site with the cleanest address. The DNS
 * record and TLS for the subdomain must be live for the link to resolve; the
 * SPA's own routes stay reachable by typing the path.
 */
export function streamUrl(path = ''): string {
  return `https://${STREAM_HOST}${path}`;
}
