// src/pages/AdminPage.tsx
import { Nav as Header } from "../components/Nav";
import { Footer } from "../components/Footer";
import AdminPortal from "../components/AdminPortal";
import { usePlayerAuth } from "../player/context/AuthContext";

export default function AdminPage() {
  const { user } = usePlayerAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950">
        <Header />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="bg-[#0e0a13] border border-red-950/50 p-8 rounded-3xl text-center max-w-lg mx-auto shadow-2xl">
            <div className="inline-flex p-3 rounded-2xl bg-red-950/50 border border-red-900 text-red-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-6a4 4 0 00-8 0v4a4 4 0 008 0V9z" />
              </svg>
            </div>
            <h3 className="text-[15px] font-black tracking-wide text-white font-sans uppercase mt-4">Access Denied</h3>
            <p className="text-xs text-slate-400 font-sans leading-relaxed mt-2">
              You need to be logged in to access the admin portal.
            </p>
            <a
              href="/admin/player"
              className="mt-4 inline-block px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition"
            >
              Go to Login
            </a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto p-8">
        <AdminPortal />
      </main>

      <Footer />
    </div>
  );
}
