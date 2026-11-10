import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

/**
 * Mounting the real route tree is the only reliable guard against the router
 * being dropped: App renders <Routes> and calls useLocation(), both of which
 * throw "useLocation() may be used only in the context of a <Router>" when the
 * provider is missing. This regressed once and blanked every page, so it is
 * worth asserting on directly rather than trusting a manual smoke check.
 */

const fetchMock = vi.fn();

const SUPER_ADMIN = { id: 'u1', username: 'superadmin', role: 'super_admin', email: 's@a.com' };
const EDITOR = { id: 'u2', username: 'editor', role: 'editor', email: 'e@a.com' };

/**
 * One mock has to answer every call the app makes: `/auth/me` with a user and
 * the list endpoints with arrays. Returning a single canned body made list
 * pages crash on `programs.map`, so responses are keyed by URL instead.
 */
function mockApi({ signedIn = false, user = SUPER_ADMIN }: { signedIn?: boolean; user?: typeof SUPER_ADMIN } = {}) {
  fetchMock.mockImplementation((input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    if (url.includes('/auth/me')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => (signedIn ? user : null),
        text: async () => '',
      });
    }

    // Every other endpoint in these tests is a list endpoint.
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => [],
      text: async () => '',
    });
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  mockApi();
  vi.stubGlobal('fetch', fetchMock);
});

async function loadApp() {
  const { default: App } = await import('./App');
  return App;
}

describe('App router wiring', () => {
  it('mounts the home route without a router error', async () => {
    const App = await loadApp();
    expect(() => render(<App />)).not.toThrow();
    // Importing the whole route tree dominates this test, and the budget has
    // to absorb that cost competing with the other files in the suite.
  }, 15_000);

  it('renders route content rather than only the shell', async () => {
    const App = await loadApp();
    render(<App />);
    // The site header is present on the home route.
    expect(screen.getAllByRole('link').length).toBeGreaterThan(0);
  });

  // /admin bounces through the two redirects and settles on a real section.
  it('redirects /admin to the programs section', async () => {
    const App = await loadApp();
    window.history.pushState({}, '', '/admin');
    render(<App />);
    expect(window.location.pathname).toBe('/admin/player/programs');
  });

  // Every /admin/player/* path used to render the same component with local
  // state defaulted to 'programs', so a deep link to any other section landed
  // on Programs. The section now comes from the URL.
  it('honours a deep link to a specific admin section', async () => {
    mockApi({ signedIn: true });
    const App = await loadApp();
    window.history.pushState({}, '', '/admin/player/comments');
    render(<App />);
    // Role=heading, because the sidebar carries a button with the same label.
    // The 5 s wait absorbs the lazy admin chunk competing with the rest of the
    // suite for CPU; the 1 s default times out there but never locally.
    expect(await screen.findByRole('heading', { name: 'Comments' }, { timeout: 5_000 })).toBeTruthy();
  });

  it('redirects a bare /admin/player to the programs section', async () => {
    const App = await loadApp();
    window.history.pushState({}, '', '/admin/player');
    render(<App />);
    expect(window.location.pathname).toBe('/admin/player/programs');
  });

  it('falls back to programs for an unknown admin section', async () => {
    mockApi({ signedIn: true });
    const App = await loadApp();
    window.history.pushState({}, '', '/admin/player/not-a-section');
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Programs' }, { timeout: 5_000 })).toBeTruthy();
  });

  // Editors publish content only; the other console sections are off-limits.
  it('sends an editor from a non-content section to site content', async () => {
    mockApi({ signedIn: true, user: EDITOR });
    const App = await loadApp();
    window.history.pushState({}, '', '/admin/player/programs');
    render(<App />);
    await waitFor(() => expect(window.location.pathname).toBe('/admin/player/site'));
    expect(await screen.findByRole('heading', { name: 'Site Content' }, { timeout: 5_000 })).toBeTruthy();
  });

  it('lets an editor open the blog section', async () => {
    mockApi({ signedIn: true, user: EDITOR });
    const App = await loadApp();
    window.history.pushState({}, '', '/admin/player/blog');
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Blog' }, { timeout: 5_000 })).toBeTruthy();
  });
});