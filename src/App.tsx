import { Suspense, lazy, useEffect, useState } from "react";
import { Routes, Route, useLocation, useParams, Navigate, BrowserRouter } from "react-router-dom";
import { PlayerProvider } from "./player/context/PlayerContext";
import { PlayerAuthProvider, usePlayerAuth } from "./player/context/AuthContext";
import { PlayerThemeProvider } from "./player/context/ThemeContext";
import PublicLayout from "./player/components/PublicLayout";
import Sidebar from "./player/components/Sidebar";
import Footer from "./player/components/Footer";
import { Toaster } from "sonner";

import HomePage from "./pages/home";

// The portfolio pages and the whole admin app are split out of the entry
// bundle. Every route below is behind a Suspense boundary, so a public visitor
// downloads the marketing pages and the player's own shell and none of the
// admin screens they can never reach.
const AudioPlayer = lazy(() => import("./player/components/AudioPlayer"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

const AboutPage = lazy(() => import("./pages/about").then((m) => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import("./pages/contact").then((m) => ({ default: m.ContactPage })));
const GalleryPage = lazy(() => import("./pages/gallery").then((m) => ({ default: m.GalleryPage })));
const DivisionsPage = lazy(() => import("./pages/divisions").then((m) => ({ default: m.DivisionsPage })));
const ElectronicMediaDivisionPage = lazy(() => import("./pages/electronic").then((m) => ({ default: m.ElectronicMediaDivisionPage })));
const PrintMediaDivisionPage = lazy(() => import("./pages/printmedia").then((m) => ({ default: m.PrintMediaDivisionPage })));
const FinanceDivisionPage = lazy(() => import("./pages/finance").then((m) => ({ default: m.FinanceDivisionPage })));
const LeadershipPage = lazy(() => import("./pages/leadership").then((m) => ({ default: m.LeadershipPage })));
const ServicesPage = lazy(() => import("./pages/services").then((m) => ({ default: m.ServicesPage })));
const ResourceMobilizationPage = lazy(() => import("./pages/ResourceMobilizationPage").then((m) => ({ default: m.ResourceMobilizationPage })));
const BookshopsPage = lazy(() => import("./pages/BookshopsPage").then((m) => ({ default: m.BookshopsPage })));

const PublicHomePage = lazy(() => import("./player/pages/PublicHomePage"));
const PublicProgramsPage = lazy(() => import("./player/pages/PublicProgramsPage"));
const PublicLatestTracksPage = lazy(() => import("./player/pages/PublicLatestTracksPage"));
const PublicSearchPage = lazy(() => import("./player/pages/PublicSearchPage"));
const PublicProgramDetailPage = lazy(() => import("./player/pages/PublicProgramDetailPage"));

const PlayerLoginPage = lazy(() => import("./player/pages/LoginPage"));
const PlayerAdminPage = lazy(() => import("./player/pages/PlayerPage"));
const PlayerProgramsPage = lazy(() => import("./player/pages/ProgramsPage"));
const PlayerAnalyticsPage = lazy(() => import("./player/pages/AnalyticsPage"));
const PlayerCommentsPage = lazy(() => import("./player/pages/CommentsPage"));
const PlayerUsersPage = lazy(() => import("./player/pages/UsersPage"));
const PlayerAccountSettingsPage = lazy(() => import("./player/pages/AccountSettingsPage"));
const PlayerSiteContentPage = lazy(() => import("./player/pages/SiteContentPage"));

/**
 * Shell shown while a split chunk loads. Styled to sit inside both the admin
 * sidebar layout and the public pages so the swap is not a visible jump.
 */
function RouteFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center" role="status" aria-live="polite">
      <span className="text-sm dark:text-white text-dark-900">Loading…</span>
    </div>
  );
}

// Which admin sections a plain `admin` may open. The server enforces the same
// split with requireSuperAdmin; mirroring it here keeps a non-super-admin from
// navigating straight to a page that would only ever render 403s.
const SUPER_ADMIN_PAGES: readonly string[] = ['users'];

// Built as elements rather than components so each one is only instantiated
// when its route actually matches.
const ADMIN_PAGES: Record<string, React.ReactNode> = {
  programs: <PlayerProgramsPage />,
  player: <PlayerAdminPage />,
  site: <PlayerSiteContentPage />,
  analytics: <PlayerAnalyticsPage />,
  comments: <PlayerCommentsPage />,
  users: <PlayerUsersPage />,
  account: <PlayerAccountSettingsPage />,
};

function PlayerAdminSite() {
  const { user, isChecking, isSuperAdmin } = usePlayerAuth();
  const { page } = useParams();
  // Lives here rather than inside Sidebar: the main content's left margin has
  // to track the sidebar width, and two components holding copies of the same
  // flag would drift apart.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Hold a neutral shell until the session check resolves. Rendering the login
  // form first would flash it at an admin who is in fact still signed in.
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-sm dark:text-white text-dark-900">Loading…</span>
      </div>
    );
  }

  if (!user) return <PlayerLoginPage />;

  // Unknown segments fall back to programs rather than a blank screen. An
  // empty segment is the bare /admin/player, handled by a redirect below.
  const activePage = page && page in ADMIN_PAGES ? page : 'programs';

  if (SUPER_ADMIN_PAGES.includes(activePage) && !isSuperAdmin) {
    return <Navigate to="/admin/player/programs" replace />;
  }

  return (
    <div className="min-h-screen">
      <Sidebar
        activePage={activePage}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />
      <main
        className={`pt-14 md:pt-0 p-4 md:p-8 pb-28 transition-[margin] duration-300 ${
          sidebarCollapsed ? "md:ml-16" : "md:ml-64"
        }`}
      >
        <Suspense fallback={<RouteFallback />}>
          {ADMIN_PAGES[activePage]}
        </Suspense>
      </main>
      {/* The sidebar is fixed and full-height, so the footer needs the same
          tracking margin or its left edge sits underneath the menu. */}
      <div
        className={`transition-[margin] duration-300 ${sidebarCollapsed ? "md:ml-16" : "md:ml-64"}`}
      >
        <Footer />
      </div>
    </div>
  );
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Nav links point at in-page anchors such as /about#mission-vision. React
    // Router does not scroll to a fragment on a pushState navigation, so
    // scrolling to the top on those left the user at the top of the page they
    // asked to be scrolled down.
    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}

function PlayerShell() {
  return (
    <PlayerThemeProvider>
      <PlayerAuthProvider>
        <PlayerProvider>
          <Suspense fallback={null}>
            <AppRoutes />
          </Suspense>
          {/* The player is global chrome, so it stays mounted across route
              changes rather than remounting on every navigation. */}
          <Suspense fallback={null}>
            <AudioPlayer />
          </Suspense>
        </PlayerProvider>
      </PlayerAuthProvider>
    </PlayerThemeProvider>
  );
}

function withLayout(node: React.ReactNode) {
  return <PublicLayout>{node}</PublicLayout>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Portfolio Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/gallery" element={<GalleryPage />} />
      <Route path="/divisions" element={<DivisionsPage />} />
      <Route path="/divisions/electronic-media" element={<ElectronicMediaDivisionPage />} />
      <Route path="/divisions/print-media" element={<PrintMediaDivisionPage />} />
      <Route path="/divisions/finance" element={<FinanceDivisionPage />} />
      <Route path="/divisions/resource-mobilization" element={<ResourceMobilizationPage />} />
      <Route path="/leadership" element={<LeadershipPage />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/bookshops" element={<BookshopsPage />} />
      <Route path="/admin" element={<Navigate to="/admin/player" replace />} />

      {/* Player Public Routes */}
      <Route path="/programs" element={withLayout(<PublicHomePage />)} />
      <Route path="/programs/all" element={withLayout(<PublicProgramsPage />)} />
      <Route path="/programs/latest" element={withLayout(<PublicLatestTracksPage />)} />
      <Route path="/programs/search" element={withLayout(<PublicSearchPage />)} />
      <Route path="/programs/:id" element={withLayout(<PublicProgramDetailPage />)} />

      {/* Player Admin Routes. One dynamic segment drives the section, so the URL
          is the source of truth: deep links and back/forward both work. */}
      <Route path="/admin/player" element={<Navigate to="/admin/player/programs" replace />} />
      <Route path="/admin/player/dashboard" element={<Navigate to="/admin/player/programs" replace />} />
      <Route path="/admin/player/:page" element={<PlayerAdminSite />} />

      {/* Anything unmatched. Without this, <Routes> renders nothing and the
          visitor gets a bare white page with no way back. */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function App() {
  // BrowserRouter lives here rather than in main.tsx: App renders <Routes> and
  // calls useLocation(), so the router is a hard requirement of this component.
  // Keeping it in the same file means a smoke test can mount App directly and
  // catch a missing provider.
  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors closeButton />
      <ScrollToTop />
      <PlayerShell />
    </BrowserRouter>
  );
}

export default App;