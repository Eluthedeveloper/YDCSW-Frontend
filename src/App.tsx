import { useState, useEffect } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { PlayerProvider } from "./player/context/PlayerContext";
import { PlayerAuthProvider, usePlayerAuth } from "./player/context/AuthContext";
import { PlayerThemeProvider } from "./player/context/ThemeContext";
import AudioPlayer from "./player/components/AudioPlayer";
import PublicLayout from "./player/components/PublicLayout";
import Sidebar from "./player/components/Sidebar";
import Footer from "./player/components/Footer";
import { Toaster } from "sonner";

import { HomePage } from "./pages/home";
import { AboutPage } from "./pages/about";
import { ContactPage } from "./pages/contact";
import { GalleryPage } from "./pages/gallery";
import { DivisionsPage } from "./pages/divisions";
import { ElectronicMediaDivisionPage } from "./pages/electronic";
import { PrintMediaDivisionPage } from "./pages/printmedia";
import { FinanceDivisionPage } from "./pages/finance";
import { LeadershipPage } from "./pages/leadership";
import { ServicesPage } from "./pages/services";
import { ResourceMobilizationPage } from "./pages/ResourceMobilizationPage";
import { BookshopsPage } from "./pages/BookshopsPage";

import PublicHomePage from "./player/pages/PublicHomePage";
import PublicProgramsPage from "./player/pages/PublicProgramsPage";
import PublicLatestTracksPage from "./player/pages/PublicLatestTracksPage";
import PublicSearchPage from "./player/pages/PublicSearchPage";
import PublicProgramDetailPage from "./player/pages/PublicProgramDetailPage";
import PlayerLoginPage from "./player/pages/LoginPage";
import PlayerAdminPage from "./player/pages/PlayerPage";
import PlayerProgramsPage from "./player/pages/ProgramsPage";
import PlayerAnalyticsPage from "./player/pages/AnalyticsPage";
import PlayerCommentsPage from "./player/pages/CommentsPage";
import PlayerUsersPage from "./player/pages/UsersPage";
import PlayerAccountSettingsPage from "./player/pages/AccountSettingsPage";

function PlayerAdminSite() {
  const { user } = usePlayerAuth();
  const [activePage, setActivePage] = useState('programs');

  if (!user) return <PlayerLoginPage />;

  const renderPage = () => {
    switch (activePage) {
      case 'programs': return <PlayerProgramsPage />;
      case 'player': return <PlayerAdminPage />;
      case 'analytics': return <PlayerAnalyticsPage />;
      case 'comments': return <PlayerCommentsPage />;
      case 'users': return <PlayerUsersPage />;
      case 'account': return <PlayerAccountSettingsPage />;
      default: return <PlayerProgramsPage />;
    }
  };

  return (
    <div className="min-h-screen">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="pt-14 md:pt-0 md:ml-64 p-4 md:p-8 pb-28">
        {renderPage()}
      </main>
      <Footer />
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function PlayerShell() {
  return (
    <PlayerThemeProvider>
      <PlayerAuthProvider>
        <PlayerProvider>
          <AppRoutes />
          <AudioPlayer />
        </PlayerProvider>
      </PlayerAuthProvider>
    </PlayerThemeProvider>
  );
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
      <Route path="/programs" element={<PublicLayout><PublicHomePage /></PublicLayout>} />
      <Route path="/programs/all" element={<PublicLayout><PublicProgramsPage /></PublicLayout>} />
      <Route path="/programs/latest" element={<PublicLayout><PublicLatestTracksPage /></PublicLayout>} />
      <Route path="/programs/search" element={<PublicLayout><PublicSearchPage /></PublicLayout>} />
      <Route path="/programs/:id" element={<PublicLayout><PublicProgramDetailPage /></PublicLayout>} />

      {/* Player Admin Routes */}
      <Route path="/admin/player" element={<PlayerAdminSite />} />
      <Route path="/admin/player/dashboard" element={<PlayerAdminSite />} />
      <Route path="/admin/player/programs" element={<PlayerAdminSite />} />
      <Route path="/admin/player/analytics" element={<PlayerAdminSite />} />
      <Route path="/admin/player/comments" element={<PlayerAdminSite />} />
      <Route path="/admin/player/users" element={<PlayerAdminSite />} />
      <Route path="/admin/player/account" element={<PlayerAdminSite />} />
    </Routes>
  );
}

function App() {
  return (
    <>
      <Toaster position="top-center" richColors closeButton />
      <ScrollToTop />
      <PlayerShell />
    </>
  );
}

export default App;
