// src/components/admin/AdminPortal.tsx
import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  Settings2, 
  FileAudio, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Upload, 
  Globe, 
  Play, 
  Clock, 
  Lock, 
  Layers, 
  UserPlus, 
  Key, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle 
} from 'lucide-react';

// Types
interface DBUser {
  id: number;
  username: string;
  displayName: string | null;
  email: string | null;
  role: 'admin' | 'super_admin';
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Program {
  id: number;
  title: string;
  description: string | null;
  coverUrl: string | null;
  languageId: number | null;
  createdAt: string;
  updatedAt: string;
}

interface Track {
  id: number;
  programId: number;
  title: string;
  description: string | null;
  url: string;
  duration: number;
  artist: string | null;
  album: string | null;
  trackNumber: string | null;
  sequence: number;
  playCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Language {
  id: number;
  name: string;
  code: string;
  description: string | null;
}

interface AnalyticsDashboard {
  metrics: {
    totalPlays: number;
    hoursPlayed: number;
    completionRate: number;
    activeUsers: number;
  };
  hourlyDistribution: Array<{ hour: string; plays: number }>;
  dailyTrend: Array<{ dateStr: string; plays: number; completes: number }>;
  popularTracks: Array<{
    trackTitle: string;
    programTitle: string;
    playCount: number;
    avgDuration: number;
  }>;
}

interface SystemSetting {
  id: number;
  key: string;
  value: string;
  description: string | null;
  updatedAt: string;
}

const defaultAdmin: DBUser = {
  id: 1, username: 'admin', displayName: 'System Admin', email: 'admin@yemisrachdimts.org',
  role: 'super_admin', photoUrl: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
};

interface AdminPortalProps {
  dbUser?: DBUser;
  authToken?: string | null;
}

type AdminSubTab = 'analytics' | 'media' | 'users' | 'settings';

// Mock Data
const mockLanguages: Language[] = [
  { id: 1, name: 'Amharic', code: 'am', description: 'Ethiopian national language' },
  { id: 2, name: 'English', code: 'en', description: 'International language' },
  { id: 3, name: 'Oromo', code: 'om', description: 'Oromo language' },
];

const mockPrograms: Program[] = [
  { id: 1, title: 'Worship Music', description: 'Gospel worship songs and hymns', coverUrl: null, languageId: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 2, title: 'Sermons', description: 'Sunday sermons and teachings', coverUrl: null, languageId: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const mockTracks: Track[] = [
  { id: 1, programId: 1, title: 'Amazing Grace', description: 'Classic hymn', url: '/uploads/amazing-grace.mp3', duration: 245, artist: 'John Newton', album: 'Hymns', trackNumber: '1', sequence: 1, playCount: 150, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 2, programId: 1, title: 'How Great Thou Art', description: 'Worship song', url: '/uploads/how-great.mp3', duration: 320, artist: 'Carl Boberg', album: 'Worship', trackNumber: '2', sequence: 2, playCount: 120, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const mockUsers: DBUser[] = [
  { id: 1, username: 'admin', displayName: 'System Admin', email: 'admin@yemisrachdimts.org', role: 'super_admin', photoUrl: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 2, username: 'editor', displayName: 'Content Editor', email: 'editor@yemisrachdimts.org', role: 'admin', photoUrl: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const mockSettings: SystemSetting[] = [
  { id: 1, key: 'site_title', value: 'Yemisrach Dimts', description: 'Website title', updatedAt: new Date().toISOString() },
  { id: 2, key: 'streaming_url', value: 'https://stream.yemisrachdimts.org', description: 'Live streaming URL', updatedAt: new Date().toISOString() },
  { id: 3, key: 'max_upload_size', value: '50', description: 'Maximum file upload size in MB', updatedAt: new Date().toISOString() },
];

const mockAnalytics: AnalyticsDashboard = {
  metrics: {
    totalPlays: 45230,
    hoursPlayed: 1245.8,
    completionRate: 78,
    activeUsers: 342,
  },
  hourlyDistribution: [
    { hour: '00:00', plays: 120 },
    { hour: '04:00', plays: 45 },
    { hour: '08:00', plays: 890 },
    { hour: '12:00', plays: 1200 },
    { hour: '16:00', plays: 950 },
    { hour: '20:00', plays: 650 },
    { hour: '23:00', plays: 180 },
  ],
  dailyTrend: [
    { dateStr: '2024-01-01', plays: 1200, completes: 900 },
    { dateStr: '2024-01-02', plays: 1350, completes: 980 },
    { dateStr: '2024-01-03', plays: 1100, completes: 850 },
    { dateStr: '2024-01-04', plays: 1400, completes: 1050 },
    { dateStr: '2024-01-05', plays: 1250, completes: 920 },
    { dateStr: '2024-01-06', plays: 1500, completes: 1150 },
    { dateStr: '2024-01-07', plays: 1300, completes: 950 },
  ],
  popularTracks: [
    { trackTitle: 'Amazing Grace', programTitle: 'Worship Music', playCount: 450, avgDuration: 210 },
    { trackTitle: 'How Great Thou Art', programTitle: 'Worship Music', playCount: 380, avgDuration: 280 },
    { trackTitle: 'Sermon on the Mount', programTitle: 'Sermons', playCount: 320, avgDuration: 480 },
  ],
};

export default function AdminPortal({ dbUser = defaultAdmin }: AdminPortalProps = {}) {
  const [activeSubTab, setActiveSubTab] = useState<AdminSubTab>('analytics');
  
  // Lists state
  const [languages, setLanguages] = useState<Language[]>(mockLanguages);
  const [programs, setPrograms] = useState<Program[]>(mockPrograms);
  const [tracks, setTracks] = useState<Track[]>(mockTracks);
  const [usersList, setUsersList] = useState<DBUser[]>(mockUsers);
  const [settingsList, setSettingsList] = useState<SystemSetting[]>(mockSettings);
  
  // Analytics State
  const [analytics, setAnalytics] = useState<AnalyticsDashboard | null>(mockAnalytics);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Loading/Operation states
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Selections
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(1);

  // New Language Form State
  const [newLangName, setNewLangName] = useState('');
  const [newLangCode, setNewLangCode] = useState('');
  const [newLangDesc, setNewLangDesc] = useState('');

  // New Program Form State
  const [newProgTitle, setNewProgTitle] = useState('');
  const [newProgDesc, setNewProgDesc] = useState('');
  const [newProgLanguageId, setNewProgLanguageId] = useState<number | ''>('');
  const [newProgCoverUrl, setNewProgCoverUrl] = useState('');
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // New Track Form State
  const [newTrackTitle, setNewTrackTitle] = useState('');
  const [newTrackDesc, setNewTrackDesc] = useState('');
  const [newTrackUrl, setNewTrackUrl] = useState('');
  const [newTrackDuration, setNewTrackDuration] = useState('300');
  const [newTrackArtist, setNewTrackArtist] = useState('');
  const [newTrackAlbum, setNewTrackAlbum] = useState('');
  const [newTrackNumber, setNewTrackNumber] = useState('');
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [audioUploadProgress, setAudioUploadProgress] = useState(0);

  // New User Form State
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserDisplayName, setNewUserDisplayName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'super_admin'>('admin');

  // Change password modal/form state
  const [selectedUserForPasswordReset, setSelectedUserForPasswordReset] = useState<DBUser | null>(null);
  const [newPasswordForReset, setNewPasswordForReset] = useState('');

  // Setting edit states
  const [editingSettingKey, setEditingSettingKey] = useState<string | null>(null);
  const [editingSettingVal, setEditingSettingVal] = useState('');

  // File Upload Drag overlays
  const [dragOverAudio, setDragOverAudio] = useState(false);
  const [dragOverCover, setDragOverCover] = useState(false);

  const isSuperAdmin = dbUser.role === 'super_admin';

  // Flash status helper
  const showFlash = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 4500);
  };

  // Mock load functions
  const loadTracks = (programId: number) => {
    const filtered = mockTracks.filter(t => t.programId === programId);
    setTracks(filtered);
  };
  const loadAnalytics = () => {
    setAnalyticsLoading(true);
    setTimeout(() => {
      setAnalytics(mockAnalytics);
      setAnalyticsLoading(false);
    }, 500);
  };



  // Mock upload handlers
  const handleAudioUpload = (file: File) => {
    setIsUploadingAudio(true);
    setAudioUploadProgress(20);
    setTimeout(() => {
      setAudioUploadProgress(50);
      setTimeout(() => {
        const cleanName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        setNewTrackTitle(cleanName);
        setNewTrackUrl(`/uploads/${file.name}`);
        setAudioUploadProgress(100);
        setIsUploadingAudio(false);
        showFlash(`Audio file "${file.name}" uploaded successfully.`);
        setTimeout(() => setAudioUploadProgress(0), 500);
      }, 500);
    }, 500);
  };

  const handleCoverUpload = (file: File) => {
    setIsUploadingCover(true);
    setTimeout(() => {
      const url = URL.createObjectURL(file);
      setNewProgCoverUrl(url);
      setIsUploadingCover(false);
      showFlash(`Cover image "${file.name}" uploaded successfully.`);
    }, 800);
  };

  // Submit Operations
  const handleAddLanguage = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, addLang: true }));
    setTimeout(() => {
      const newLang: Language = {
        id: languages.length + 1,
        name: newLangName.trim(),
        code: newLangCode.trim().toLowerCase(),
        description: newLangDesc.trim() || null,
      };
      setLanguages([...languages, newLang]);
      setNewLangName('');
      setNewLangCode('');
      setNewLangDesc('');
      setLoading(prev => ({ ...prev, addLang: false }));
      showFlash(`Language catalog "${newLang.name}" added.`);
    }, 500);
  };

  const handleDeleteLanguage = (id: number) => {
    if (!window.confirm("Purging language option. Proceed?")) return;
    setLanguages(languages.filter(l => l.id !== id));
    showFlash("Language successfully dropped.");
  };

  const handleAddProgram = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, addProg: true }));
    setTimeout(() => {
      const newProgram: Program = {
        id: programs.length + 1,
        title: newProgTitle.trim(),
        description: newProgDesc.trim() || null,
        coverUrl: newProgCoverUrl.trim() || null,
        languageId: newProgLanguageId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setPrograms([...programs, newProgram]);
      setNewProgTitle('');
      setNewProgDesc('');
      setNewProgLanguageId('');
      setNewProgCoverUrl('');
      setLoading(prev => ({ ...prev, addProg: false }));
      showFlash(`Program series "${newProgram.title}" initialized.`);
    }, 500);
  };

  const handleDeleteProgram = (id: number) => {
    if (!window.confirm("Purging this program will delete ALL nested audio tracks permanently. Continue?")) return;
    setPrograms(programs.filter(p => p.id !== id));
    if (selectedProgramId === id) {
      setSelectedProgramId(null);
      setTracks([]);
    }
    showFlash("Program series purged.");
  };

  const handleAddTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgramId) {
      showFlash("Specify program ownership to append tracks.", "error");
      return;
    }
    setLoading(prev => ({ ...prev, addTrack: true }));
    setTimeout(() => {
      const newTrack: Track = {
        id: tracks.length + 1,
        programId: selectedProgramId,
        title: newTrackTitle.trim(),
        description: newTrackDesc.trim() || null,
        url: newTrackUrl.trim(),
        duration: parseInt(newTrackDuration) || 0,
        artist: newTrackArtist.trim() || null,
        album: newTrackAlbum.trim() || null,
        trackNumber: newTrackNumber.trim() || null,
        sequence: tracks.length + 1,
        playCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTracks([...tracks, newTrack]);
      setNewTrackTitle('');
      setNewTrackDesc('');
      setNewTrackUrl('');
      setNewTrackDuration('300');
      setNewTrackArtist('');
      setNewTrackAlbum('');
      setNewTrackNumber('');
      setLoading(prev => ({ ...prev, addTrack: false }));
      showFlash(`Audio track "${newTrack.title}" successfully indexed.`);
    }, 500);
  };

  const handleDeleteTrack = (id: number) => {
    if (!window.confirm("Remove this audio track? Information will be unrecoverable.")) return;
    setTracks(tracks.filter(t => t.id !== id));
    showFlash("Track entry deleted from registry.");
  };

  const handleMoveTrackSequence = (id: number, direction: 'up' | 'down') => {
    const index = tracks.findIndex(t => t.id === id);
    if (index === -1) return;
    const newTracks = [...tracks];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newTracks.length) return;
    [newTracks[index], newTracks[swapIndex]] = [newTracks[swapIndex], newTracks[index]];
    setTracks(newTracks);
  };

  // User Management
  const handleRegisterUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) return;
    setLoading(prev => ({ ...prev, addUser: true }));
    setTimeout(() => {
      const newUser: DBUser = {
        id: usersList.length + 1,
        username: newUserUsername.trim(),
        displayName: newUserDisplayName.trim() || null,
        email: newUserEmail.trim() || null,
        role: newUserRole,
        photoUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUsersList([...usersList, newUser]);
      setNewUserUsername('');
      setNewUserPassword('');
      setNewUserDisplayName('');
      setNewUserEmail('');
      setNewUserRole('admin');
      setLoading(prev => ({ ...prev, addUser: false }));
      showFlash(`Administrator profile @${newUser.username} successfully onboarded.`);
    }, 500);
  };

  const handleForcePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPasswordReset) return;
    setLoading(prev => ({ ...prev, resetPass: true }));
    setTimeout(() => {
      setNewPasswordForReset('');
      setSelectedUserForPasswordReset(null);
      setLoading(prev => ({ ...prev, resetPass: false }));
      showFlash(`Credential hash overwritten for @${selectedUserForPasswordReset.username}.`);
    }, 500);
  };

  const handleUpdateUserRole = (targetUserId: number, role: 'admin' | 'super_admin') => {
    setUsersList(usersList.map(u => 
      u.id === targetUserId ? { ...u, role } : u
    ));
    showFlash(`Permission level updated successfully.`);
  };

  const handleDeleteUserAccount = (targetUserId: number) => {
    if (targetUserId === dbUser.id) {
      showFlash("Self-destruction of session accounts prohibited.", "error");
      return;
    }
    if (!window.confirm("Revoking admin role and deleting user profile. Confirm termination?")) return;
    setUsersList(usersList.filter(u => u.id !== targetUserId));
    showFlash("Administrator credentials dropped.");
  };

  // Settings modification
  const handleSaveSetting = (key: string, value: string) => {
    setSettingsList(settingsList.map(s => 
      s.key === key ? { ...s, value } : s
    ));
    setEditingSettingKey(null);
    showFlash(`System configuration parameter "${key}" modified.`);
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Load data on tab change
  useEffect(() => {
    if (activeSubTab === 'analytics') loadAnalytics();
  }, [activeSubTab]);

  useEffect(() => {
    if (selectedProgramId) loadTracks(selectedProgramId);
  }, [selectedProgramId]);

  // Return the same UI but with mock data
  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Toast Notification Box */}
      {statusMsg && (
        <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-2xl flex items-center gap-3 border ${
          statusMsg.type === 'success' 
            ? 'bg-slate-900 border-indigo-500/50 text-indigo-200' 
            : 'bg-red-950 border-red-800 text-red-200'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle className="w-5 h-5 text-indigo-400" /> : <AlertTriangle className="w-5 h-5 text-red-400" />}
          <span className="text-xs font-mono tracking-wide">{statusMsg.text}</span>
        </div>
      )}

      {/* Admin Module Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-indigo-950/60 pb-1.5 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold font-sans transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'analytics' 
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' 
              : 'text-slate-400 hover:text-slate-100 border border-transparent hover:bg-slate-900/40'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> System Telemetry
        </button>
        <button
          onClick={() => setActiveSubTab('media')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold font-sans transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'media' 
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' 
              : 'text-slate-400 hover:text-slate-100 border border-transparent hover:bg-slate-900/40'
          }`}
        >
          <FileAudio className="w-4 h-4" /> Programming & Tracks
        </button>
        <button
          onClick={() => setActiveSubTab('users')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold font-sans transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'users' 
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' 
              : 'text-slate-400 hover:text-slate-100 border border-transparent hover:bg-slate-900/40'
          }`}
        >
          <Users className="w-4 h-4" /> Access Control List
          {!isSuperAdmin && <Lock className="w-3 h-3 text-slate-500" />}
        </button>
        <button
          onClick={() => setActiveSubTab('settings')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold font-sans transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'settings' 
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' 
              : 'text-slate-400 hover:text-slate-100 border border-transparent hover:bg-slate-900/40'
          }`}
        >
          <Settings2 className="w-4 h-4" /> System Parameters
          {!isSuperAdmin && <Lock className="w-3 h-3 text-slate-500" />}
        </button>
      </div>

      {/* RENDER ANALYTICS HUB */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-8">
          {/* Key Metrics Widgets */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#090d1f] border border-indigo-950/50 rounded-2xl p-4 shadow-xl relative overflow-hidden">
              <div className="absolute top-3 right-3 text-indigo-600 shrink-0">
                <Play className="w-5 h-5 opacity-40" />
              </div>
              <p className="text-[10px] font-mono tracking-widest text-slate-500 font-bold uppercase">Total Plays</p>
              <h3 className="text-3xl font-black font-sans text-cyan-400 mt-2">
                {analyticsLoading ? '...' : (analytics?.metrics.totalPlays ?? 0).toLocaleString()}
              </h3>
              <p className="text-[10px] text-slate-400 font-sans mt-1">Aggregated platform stream clicks</p>
            </div>

            <div className="bg-[#090d1f] border border-indigo-950/50 rounded-2xl p-4 shadow-xl relative overflow-hidden">
              <div className="absolute top-3 right-3 text-emerald-600 shrink-0">
                <Clock className="w-5 h-5 opacity-40" />
              </div>
              <p className="text-[10px] font-mono tracking-widest text-slate-500 font-bold uppercase">Hours Streamed</p>
              <h3 className="text-3xl font-black font-sans text-emerald-400 mt-2">
                {analyticsLoading ? '...' : (analytics?.metrics.hoursPlayed ?? 0).toFixed(1)}
              </h3>
              <p className="text-[10px] text-slate-400 font-sans mt-1">Accumulated playback minutes</p>
            </div>

            <div className="bg-[#090d1f] border border-indigo-950/50 rounded-2xl p-4 shadow-xl relative overflow-hidden">
              <div className="absolute top-3 right-3 text-indigo-600 shrink-0">
                <Layers className="w-5 h-5 opacity-40" />
              </div>
              <p className="text-[10px] font-mono tracking-widest text-slate-500 font-bold uppercase">Completion Rate</p>
              <h3 className="text-3xl font-black font-sans text-indigo-400 mt-2">
                {analyticsLoading ? '...' : `${analytics?.metrics.completionRate ?? 0}%`}
              </h3>
              <p className="text-[10px] text-slate-400 font-sans mt-1">Ratio of complete track hearings</p>
            </div>

            <div className="bg-[#090d1f] border border-indigo-950/50 rounded-2xl p-4 shadow-xl relative overflow-hidden">
              <div className="absolute top-3 right-3 text-purple-600 shrink-0">
                <Users className="w-5 h-5 opacity-40" />
              </div>
              <p className="text-[10px] font-mono tracking-widest text-slate-500 font-bold uppercase">Active Listeners</p>
              <h3 className="text-3xl font-black font-sans text-purple-400 mt-2">
                {analyticsLoading ? '...' : (analytics?.metrics.activeUsers ?? 0).toLocaleString()}
              </h3>
              <p className="text-[10px] text-slate-400 font-sans mt-1">Registered unique accounts in reach</p>
            </div>
          </div>

          {/* Charts - Same as original but with mock data */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-[#070b19] border border-slate-900 rounded-3xl p-5 md:p-6 lg:col-span-2 space-y-6 shadow-xl">
              <div className="border-b border-indigo-950/50 pb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-white uppercase tracking-wider font-sans">Active Listening Distribution</h4>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">Staggered engagement hours telemetry</p>
                </div>
                <button 
                  onClick={loadAnalytics} 
                  disabled={analyticsLoading}
                  className="p-1.5 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${analyticsLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="h-64 flex flex-col justify-between pr-4 select-none">
                {analyticsLoading ? (
                  <div className="w-full h-full flex items-center justify-center text-xs ml-4 text-slate-500 font-mono">Querying network events logs...</div>
                ) : analytics && analytics.hourlyDistribution && analytics.hourlyDistribution.length > 0 ? (
                  <div className="w-full h-full flex flex-col justify-end">
                    <div className="flex items-end justify-between h-48 px-2 gap-2">
                      {analytics.hourlyDistribution.map((item, idx) => {
                        const maxPlays = Math.max(...analytics.hourlyDistribution.map(h => h.plays), 1);
                        const heightPct = (item.plays / maxPlays) * 100;
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center group relative cursor-help">
                            <div className="absolute bottom-full mb-1 bg-slate-900 border border-indigo-900/60 text-[9px] font-mono rounded px-1.5 py-0.5 pointer-events-none opacity-0 group-hover:opacity-100 transition duration-150 whitespace-nowrap z-10 text-indigo-300">
                              {item.plays} streamings
                            </div>
                            <div 
                              style={{ height: `${Math.max(heightPct, 4)}%` }}
                              className="w-full bg-gradient-to-t from-indigo-600/70 via-indigo-500/90 to-cyan-400 rounded-t-sm transition-all duration-500" 
                            />
                            <span className="text-[9px] font-mono text-slate-500 mt-2 hidden sm:inline">{item.hour}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="border-t border-slate-900/80 mt-4 flex justify-between px-2 text-[10px] text-slate-500 font-mono pt-2">
                      <span>00:00 (Midnight)</span>
                      <span>12:00 (Noon)</span>
                      <span>23:00 (Night)</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 text-center space-y-2 p-6">
                    <Play className="w-8 h-8 text-indigo-800 rotate-90" />
                    <p className="text-xs font-mono">No active telemetry events recorded yet.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#070b19] border border-slate-900 rounded-3xl p-5 md:p-6 space-y-6 shadow-xl flex flex-col">
              <div>
                <h4 className="text-sm font-extrabold text-white uppercase tracking-wider font-sans">Global Popular Tracks</h4>
                <p className="text-xs text-slate-400 font-sans mt-0.5">Most selected streaming assets</p>
              </div>
              <div className="flex-1 overflow-y-auto max-h-64 pr-2 space-y-3">
                {analyticsLoading ? (
                  <p className="text-xs font-mono text-slate-500 text-center py-12">Checking database registers...</p>
                ) : analytics && analytics.popularTracks && analytics.popularTracks.length > 0 ? (
                  analytics.popularTracks.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-center justify-between border-b border-indigo-950/20 pb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-mono text-slate-500 text-right w-4 shrink-0 font-bold">#{idx + 1}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-200 truncate">{item.trackTitle}</p>
                          <p className="text-[10px] text-slate-500 truncate">{item.programTitle}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-mono text-cyan-400 font-black">{item.playCount} plays</p>
                        <p className="text-[9px] font-mono text-slate-500">avg {formatSeconds(Math.round(item.avgDuration))}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs font-mono text-slate-600 text-center py-12">No media metrics compiled.</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-[#070b19] border border-slate-900 rounded-3xl p-5 md:p-6 shadow-xl">
            <div className="border-b border-indigo-950/50 pb-3 flex items-center justify-between mb-6">
              <div>
                <h4 className="text-sm font-extrabold text-white uppercase tracking-wider font-sans">Engagement Historical Trend</h4>
                <p className="text-xs text-slate-400 font-sans mt-0.5">Daily playings and track completions metrics</p>
              </div>
            </div>
            <div className="h-44 flex flex-col justify-end select-none">
              {analyticsLoading ? (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 font-mono">Querying historical logs...</div>
              ) : analytics && analytics.dailyTrend && analytics.dailyTrend.length > 0 ? (
                <div className="w-full h-full flex items-end justify-between px-4 gap-4">
                  {analytics.dailyTrend.map((item, idx) => {
                    const maxActs = Math.max(...analytics.dailyTrend.map(d => d.plays), 1);
                    const playHeight = (item.plays / maxActs) * 100;
                    const completeHeight = (item.completes / maxActs) * 100;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center group relative cursor-help">
                        <div className="absolute bottom-full mb-1 bg-slate-900 border border-indigo-900/60 text-[9px] font-mono rounded p-2 pointer-events-none opacity-0 group-hover:opacity-100 transition duration-150 whitespace-nowrap z-10 text-indigo-200">
                          <p className="font-bold">{item.dateStr}</p>
                          <p className="text-cyan-400">Plays: {item.plays}</p>
                          <p className="text-emerald-400">Completions: {item.completes}</p>
                        </div>
                        <div className="w-full flex items-end justify-center gap-1.5 h-32">
                          <div style={{ height: `${Math.max(playHeight, 4)}%` }} className="w-1.5 sm:w-2.5 bg-cyan-500/80 rounded-t-sm" />
                          <div style={{ height: `${Math.max(completeHeight, 4)}%` }} className="w-1.5 sm:w-2.5 bg-emerald-500/80 rounded-t-sm" />
                        </div>
                        <span className="text-[9px] font-mono text-slate-500 mt-2 truncate max-w-[50px]">{item.dateStr.split('-').slice(1).join('/')}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs font-mono text-slate-600 text-center py-8">Initial setup in progress. No trend registers found.</p>
              )}
            </div>
            <div className="mt-4 border-t border-indigo-950/30 pt-3 flex gap-6 text-[10px] justify-center sm:justify-start font-mono text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-cyan-500" /> Plays</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Completions</span>
            </div>
          </div>
        </div>
      )}

      {/* MEDIA & PROGRAMMING MANAGER */}
      {activeSubTab === 'media' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-1 space-y-8">
            {/* Languages */}
            <div className="bg-[#070b19] border border-slate-900 rounded-3xl p-5 space-y-5 shadow-xl">
              <div className="border-b border-indigo-950/40 pb-2">
                <h4 className="text-xs font-extrabold text-white tracking-widest font-mono uppercase flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-400" /> Languages Config
                </h4>
              </div>
              <form onSubmit={handleAddLanguage} className="bg-slate-950/60 border border-slate-900/80 p-4 rounded-2xl space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Name</label>
                    <input type="text" required placeholder="e.g. English" value={newLangName} onChange={e => setNewLangName(e.target.value)} className="w-full px-2.5 py-1.5 text-xs bg-slate-950 rounded border border-slate-800 text-white outline-none focus:border-indigo-500 font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">ISO Code</label>
                    <input type="text" required maxLength={5} placeholder="e.g. en" value={newLangCode} onChange={e => setNewLangCode(e.target.value)} className="w-full px-2.5 py-1.5 text-xs bg-slate-950 rounded border border-slate-800 text-white outline-none focus:border-indigo-500 font-mono" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Short Description</label>
                  <input type="text" placeholder="Brief note..." value={newLangDesc} onChange={e => setNewLangDesc(e.target.value)} className="w-full px-2.5 py-1.5 text-xs bg-slate-950 rounded border border-slate-800 text-white outline-none focus:border-indigo-500 font-mono" />
                </div>
                <button type="submit" disabled={loading.addLang} className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50">
                  <Plus className="w-3.5 h-3.5" /> {loading.addLang ? 'Saving...' : 'Add Language'}
                </button>
              </form>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {languages.map(lang => (
                  <div key={lang.id} className="flex items-center justify-between bg-slate-950/40 p-2.5 rounded-xl border border-indigo-950/30">
                    <div>
                      <p className="text-xs font-bold text-slate-200">{lang.name} <span className="text-[10px] font-mono text-emerald-400 bg-slate-900 px-1 py-0.5 rounded ml-1 border border-emerald-950">({lang.code})</span></p>
                      {lang.description && <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[150px]">{lang.description}</p>}
                    </div>
                    <button onClick={() => handleDeleteLanguage(lang.id)} className="p-1 rounded text-red-400 hover:bg-red-950/40 cursor-pointer transition border border-transparent hover:border-red-900/40">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Programs */}
            <div className="bg-[#070b19] border border-slate-900 rounded-3xl p-5 space-y-5 shadow-xl">
              <div className="border-b border-indigo-950/40 pb-2">
                <h4 className="text-xs font-extrabold text-white tracking-widest font-mono uppercase flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" /> New Program Series
                </h4>
              </div>
              <form onSubmit={handleAddProgram} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Series Title</label>
                  <input type="text" required placeholder="e.g. Worship Music" value={newProgTitle} onChange={e => setNewProgTitle(e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-950 rounded border border-slate-800 text-white outline-none focus:border-indigo-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase flex items-center justify-between">
                    <span>Language Assignment</span>
                    <span className="text-[9px] text-slate-500 font-mono">(Optional)</span>
                  </label>
                  <select value={newProgLanguageId} onChange={e => setNewProgLanguageId(e.target.value ? parseInt(e.target.value) : '')} className="w-full px-3 py-2 text-xs bg-slate-950 rounded border border-slate-800 text-slate-400 focus:text-white outline-none focus:border-indigo-500 cursor-pointer">
                    <option value="">Global Program (No restriction)</option>
                    {languages.map(lang => <option key={lang.id} value={lang.id}>{lang.name} ({lang.code})</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Series Description</label>
                  <textarea rows={2} placeholder="Describe program audio contents..." value={newProgDesc} onChange={e => setNewProgDesc(e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-950 rounded border border-slate-800 text-white outline-none focus:border-indigo-500 resize-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Cover Image Graphic</label>
                  <div onDragOver={e => { e.preventDefault(); setDragOverCover(true); }} onDragLeave={() => setDragOverCover(false)} onDrop={e => { e.preventDefault(); setDragOverCover(false); if (e.dataTransfer.files[0]) handleCoverUpload(e.dataTransfer.files[0]); }} className={`border border-dashed rounded-xl p-4 text-center cursor-pointer transition ${dragOverCover ? 'border-cyan-500 bg-cyan-950/20' : newProgCoverUrl ? 'border-emerald-800/80 bg-emerald-950/5' : 'border-slate-800 hover:border-slate-700 bg-slate-900/50'}`}>
                    <input type="file" accept="image/*" id="cover-upload-file" className="hidden" onChange={e => { if (e.target.files?.[0]) handleCoverUpload(e.target.files[0]); }} />
                    <label htmlFor="cover-upload-file" className="block cursor-pointer space-y-1 select-none">
                      <div className="flex justify-center"><Upload className={`w-5 h-5 ${isUploadingCover ? 'animate-bounce text-cyan-400' : 'text-slate-500'}`} /></div>
                      <p className="text-[10px] text-slate-300 font-bold">{isUploadingCover ? 'INGESTING GRAPHIC...' : newProgCoverUrl ? 'COVER IMAGE LINKED' : 'DRAG COVER IMAGE HERE'}</p>
                      <p className="text-[9px] text-slate-500 font-mono">PNG, JPG, SVG are accepted</p>
                    </label>
                  </div>
                  {newProgCoverUrl && (
                    <div className="space-y-1.5 mt-2">
                      <input type="text" value={newProgCoverUrl} onChange={e => setNewProgCoverUrl(e.target.value)} className="w-full px-2.5 py-1 text-[10px] bg-slate-950 rounded border border-slate-900 text-slate-400 font-mono" />
                      <div className="flex gap-2 items-center bg-slate-950 p-1.5 rounded-lg border border-slate-900 w-fit">
                        <img src={newProgCoverUrl} className="w-10 h-10 object-cover rounded border border-slate-800" alt="" referrerPolicy="no-referrer" />
                        <span className="text-[9px] font-mono text-slate-500">Render preview</span>
                      </div>
                    </div>
                  )}
                </div>
                <button type="submit" disabled={loading.addProg} className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50">
                  <Plus className="w-4 h-4 text-slate-950" /> {loading.addProg ? 'Compiling...' : 'Create Program Series'}
                </button>
              </form>
            </div>
          </div>

          {/* Tracks */}
          <div className="xl:col-span-2 space-y-8">
            <div className="bg-[#070b19] border border-slate-900 rounded-3xl p-5 md:p-6 space-y-6 shadow-xl">
              <div className="border-b border-indigo-950/40 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-extrabold text-white uppercase tracking-wider font-sans">Tracks Management Registry</h4>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">Edit, reorder sequence and orchestrate program audio tracks</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase font-black">Active Cohort:</span>
                  <select value={selectedProgramId ?? ''} onChange={e => setSelectedProgramId(e.target.value ? parseInt(e.target.value) : null)} className="px-3 py-1.5 text-xs bg-slate-950 rounded-xl border border-slate-800 text-slate-200 focus:text-white outline-none focus:border-indigo-500 max-w-[200px] cursor-pointer">
                    <option value="" disabled>-- Select Series program --</option>
                    {programs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                  {selectedProgramId && (
                    <button onClick={() => handleDeleteProgram(selectedProgramId)} className="p-1.5 border border-red-950 bg-red-950/10 rounded-xl text-red-400 hover:bg-red-950/30 cursor-pointer transition text-xs flex items-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5" /> Purge Series
                    </button>
                  )}
                </div>
              </div>

              {selectedProgramId ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 uppercase tracking-wider pb-1 ml-1 border-b border-indigo-950/10">
                      <span>Tracks Listing ({tracks.length})</span>
                      <span>Sequence Ordering</span>
                    </div>
                    <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-2">
                      {tracks.length === 0 ? (
                        <div className="text-center py-12 text-slate-600 space-y-2">
                          <FileAudio className="w-8 h-8 text-slate-700 mx-auto" />
                          <p className="text-xs font-mono">No audio tracks configured in this series yet.</p>
                          <p className="text-[10px] text-slate-500">Inject raw files on the right side panel to instantiate.</p>
                        </div>
                      ) : (
                        tracks.map((track, index) => (
                          <div key={track.id} className="bg-slate-900/50 border border-indigo-950/30 p-3 rounded-2xl flex items-center justify-between gap-3 group hover:border-indigo-900/40 transition duration-150">
                            <div className="min-w-0 flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-indigo-950 text-indigo-400 flex items-center justify-center font-mono text-[10px] font-bold shrink-0">{track.sequence}</div>
                              <div className="min-w-0">
                                <p className="text-xs font-extrabold text-slate-200 truncate">{track.title}</p>
                                <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                                  <span>{formatSeconds(track.duration)}</span>
                                  <span>•</span>
                                  <span className="truncate max-w-[124px]" title={track.url}>{track.url.replace('/uploads/', '')}</span>
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <div className="flex flex-col gap-0.5">
                                <button onClick={() => handleMoveTrackSequence(track.id, 'up')} disabled={index === 0} className="p-1 rounded text-slate-500 hover:text-cyan-400 bg-slate-950 border border-slate-800 disabled:opacity-30 cursor-pointer text-[9px]">
                                  <ChevronUp className="w-3 h-3" />
                                </button>
                                <button onClick={() => handleMoveTrackSequence(track.id, 'down')} disabled={index === tracks.length - 1} className="p-1 rounded text-slate-500 hover:text-cyan-400 bg-slate-950 border border-slate-800 disabled:opacity-30 cursor-pointer text-[9px]">
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                              </div>
                              <button onClick={() => handleDeleteTrack(track.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-900/30 rounded-xl cursor-pointer transition">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="bg-[#090d1f]/40 border border-indigo-950/30 p-4 font-sans rounded-3xl space-y-4">
                    <p className="text-xs font-extrabold text-indigo-300 font-mono uppercase tracking-wider">Configure New Audio Registries</p>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Acoustic Asset File Uploading</label>
                      <div onDragOver={e => { e.preventDefault(); setDragOverAudio(true); }} onDragLeave={() => setDragOverAudio(false)} onDrop={e => { e.preventDefault(); setDragOverAudio(false); if (e.dataTransfer.files[0]) handleAudioUpload(e.dataTransfer.files[0]); }} className={`border border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${dragOverAudio ? 'border-indigo-500 bg-indigo-950/20' : newTrackUrl ? 'border-emerald-800/80 bg-emerald-950/5' : 'border-slate-800 hover:border-slate-700 bg-slate-900/50'}`}>
                        <input type="file" accept="audio/*" id="audio-upload-file" className="hidden" onChange={e => { if (e.target.files?.[0]) handleAudioUpload(e.target.files[0]); }} />
                        <label htmlFor="audio-upload-file" className="block cursor-pointer space-y-2 select-none">
                          <div className="flex justify-center"><FileAudio className={`w-8 h-8 ${isUploadingAudio ? 'animate-pulse text-indigo-400' : 'text-indigo-500'}`} /></div>
                          <div>
                            <p className="text-xs text-slate-300 font-bold block">{isUploadingAudio ? `STREAM PIPING RAW FILE (${audioUploadProgress}%)` : newTrackUrl ? 'AUDIO RECORD SECURED' : 'DRAG AUDIO FILE HERE'}</p>
                            <span className="text-[9px] text-slate-500 font-mono block mt-1">High bitrates MP3 / WAV audio are supported</span>
                          </div>
                        </label>
                      </div>
                      {isUploadingAudio && <div className="w-full bg-slate-900 rounded-full h-1 mt-2 overflow-hidden border border-slate-800"><div style={{ width: `${audioUploadProgress}%` }} className="bg-indigo-500 h-full transition-all duration-300" /></div>}
                    </div>
                    <form onSubmit={handleAddTrack} className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Audio Title *</label>
                        <input type="text" required placeholder="e.g. Amazing Grace" value={newTrackTitle} onChange={e => setNewTrackTitle(e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-950 rounded border border-slate-800 text-white outline-none focus:border-indigo-500" />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2 space-y-1">
                          <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Target Stream URL *</label>
                          <input type="text" required placeholder="e.g. /uploads/amazing.mp3" value={newTrackUrl} onChange={e => setNewTrackUrl(e.target.value)} className="w-full px-2.5 py-1.5 text-xs bg-slate-950 rounded border border-slate-800 text-slate-300 font-mono outline-none focus:border-indigo-500" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Duration (sec) *</label>
                          <input type="number" required min={1} value={newTrackDuration} onChange={e => setNewTrackDuration(e.target.value)} className="w-full px-2.5 py-1.5 text-xs bg-slate-950 rounded border border-slate-800 text-white font-mono outline-none focus:border-indigo-500" />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1"><label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Artist Name</label><input type="text" placeholder="Artist" value={newTrackArtist} onChange={e => setNewTrackArtist(e.target.value)} className="w-full px-2.5 py-1.5 text-xs bg-slate-950 rounded border border-slate-800 text-white outline-none focus:border-indigo-500" /></div>
                        <div className="space-y-1"><label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Album Name</label><input type="text" placeholder="Album" value={newTrackAlbum} onChange={e => setNewTrackAlbum(e.target.value)} className="w-full px-2.5 py-1.5 text-xs bg-slate-950 rounded border border-slate-800 text-white outline-none focus:border-indigo-500" /></div>
                        <div className="space-y-1"><label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Track #</label><input type="text" placeholder="1" value={newTrackNumber} onChange={e => setNewTrackNumber(e.target.value)} className="w-full px-2.5 py-1.5 text-xs bg-slate-950 rounded border border-slate-800 text-white outline-none focus:border-indigo-500" /></div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase flex items-center justify-between"><span>Track Short Description</span><span className="text-[9px] text-slate-600 font-mono">(Optional)</span></label>
                        <input type="text" placeholder="Narratives, instructions or cues..." value={newTrackDesc} onChange={e => setNewTrackDesc(e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-950 rounded border border-slate-800 text-white outline-none focus:border-indigo-500" />
                      </div>
                      <button type="submit" disabled={loading.addTrack || !newTrackUrl} className="w-full py-2 bg-indigo-600 hover:bg-slate-100 hover:text-slate-950 font-bold text-xs text-white rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40">
                        <Plus className="w-3.5 h-3.5" /> {loading.addTrack ? 'Ingesting...' : 'Ingest Audio Track Record'}
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="text-center py-24 text-slate-600 p-6 bg-slate-900/50 rounded-3xl border border-indigo-950/10">
                  <FileAudio className="w-12 h-12 text-slate-700 mx-auto opacity-70 animate-bounce" />
                  <p className="text-sm font-extrabold text-slate-300 tracking-wide mt-4">No Series Selected</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Please choose a program series from the cohort selector above to pull tracks listings and access audio controls.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* USERS - Super Admin Only */}
      {activeSubTab === 'users' && (
        <div className="space-y-8">
          {!isSuperAdmin ? (
            <div className="bg-[#0e0a13] border border-red-950/50 p-8 rounded-3xl text-center space-y-4 max-w-lg mx-auto shadow-2xl">
              <div className="inline-flex p-3 rounded-2xl bg-red-950/50 border border-red-900 text-red-500"><Lock className="w-6 h-6" /></div>
              <h3 className="text-[15px] font-black tracking-wide text-white font-sans uppercase">Supervisory Restrictions Applied</h3>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">The security roster dashboard is allocated exclusively to the <span className="font-bold text-indigo-400 font-mono">super_admin</span> role. Your current role is <span className="font-mono bg-slate-950 px-1.5 py-0.5 rounded text-red-400 border border-red-900/60 uppercase">{dbUser.role}</span>.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 bg-[#070b19] border border-slate-900 rounded-3xl p-5 space-y-5 shadow-xl">
                <div className="border-b border-indigo-950/40 pb-2"><h4 className="text-xs font-extrabold text-white tracking-widest font-mono uppercase flex items-center gap-2"><UserPlus className="w-4 h-4 text-indigo-400" /> Onboard Administrator</h4></div>
                <form onSubmit={handleRegisterUser} className="space-y-3.5">
                  <div className="space-y-1"><label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Username *</label><input type="text" required placeholder="system_admin" value={newUserUsername} onChange={e => setNewUserUsername(e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-950 rounded border border-slate-800 text-white outline-none focus:border-indigo-500 font-mono" /></div>
                  <div className="space-y-1"><label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Initial Password *</label><input type="password" required minLength={5} placeholder="Must be >= 5 chars" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-950 rounded border border-slate-800 text-white outline-none focus:border-indigo-500 font-mono" /></div>
                  <div className="space-y-1"><label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Display Name</label><input type="text" placeholder="Eliyas Daba" value={newUserDisplayName} onChange={e => setNewUserDisplayName(e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-950 rounded border border-slate-800 text-white outline-none focus:border-indigo-500" /></div>
                  <div className="space-y-1"><label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Email Address</label><input type="email" placeholder="admin@portal.com" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-950 rounded border border-slate-800 text-white outline-none focus:border-indigo-500 font-mono" /></div>
                  <div className="space-y-1"><label className="text-[10px] font-mono font-bold text-slate-500 uppercase">System Role Permission</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button type="button" onClick={() => setNewUserRole('admin')} className={`py-1.5 text-xs font-bold rounded-xl transition cursor-pointer border ${newUserRole === 'admin' ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40' : 'bg-slate-950 text-slate-500 border-slate-800 hover:border-slate-700'}`}>Admin</button>
                      <button type="button" onClick={() => setNewUserRole('super_admin')} className={`py-1.5 text-xs font-bold rounded-xl transition cursor-pointer border ${newUserRole === 'super_admin' ? 'bg-red-950/35 text-red-400 border-red-900/60' : 'bg-slate-950 text-slate-500 border-slate-800 hover:border-slate-700'}`}>Super Admin</button>
                    </div>
                  </div>
                  <button type="submit" disabled={loading.addUser} className="w-full py-2 bg-indigo-600 hover:bg-slate-100 hover:text-slate-950 font-bold text-xs text-white rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"><Plus className="w-4 h-4" /> {loading.addUser ? 'Creating...' : 'Register New Manager'}</button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-[#070b19] border border-slate-900 rounded-3xl p-5 md:p-6 space-y-6 shadow-xl">
                <div><h4 className="text-sm font-extrabold text-white uppercase tracking-wider font-sans">Administrators Accounts Security List</h4><p className="text-xs text-slate-400 font-sans mt-0.5">List authorized session logs, reset credentials, or terminate accounts</p></div>
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-2">
                  {usersList.map(user => {
                    const isSelf = user.id === dbUser.id;
                    return (
                      <div key={user.id} className="bg-slate-900/50 border border-indigo-950/20 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex gap-3.5 items-center min-w-0">
                          <img src={user.photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`} className="w-10 h-10 rounded-full bg-slate-900 border border-indigo-950 shrink-0" alt="" referrerPolicy="no-referrer" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2"><p className="text-xs font-bold text-slate-200">{user.displayName || 'Unnamed User'}</p><span className="text-[10px] font-mono text-slate-500">@{user.username}</span>{isSelf && <span className="bg-slate-950 px-1.5 py-0.5 rounded text-[8px] tracking-wider font-mono text-indigo-400 font-extrabold uppercase border border-indigo-950">Current Session</span>}</div>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5"><span>Email: {user.email || 'N/A'}</span><span>•</span><span>Created: {new Date(user.createdAt).toLocaleDateString()}</span></p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-indigo-950/15 pt-2 sm:pt-0 shrink-0">
                          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-indigo-950/10">
                            <button onClick={() => handleUpdateUserRole(user.id, 'admin')} className={`px-2 py-0.5 text-[9px] font-mono rounded font-bold transition cursor-pointer ${user.role === 'admin' ? 'bg-indigo-950 text-indigo-400 border border-indigo-900/40' : 'text-slate-500 hover:text-slate-300'}`}>Admin</button>
                            <button onClick={() => handleUpdateUserRole(user.id, 'super_admin')} className={`px-2 py-0.5 text-[9px] font-mono rounded font-bold transition cursor-pointer ${user.role === 'super_admin' ? 'bg-red-950 text-red-400 border border-red-900/40' : 'text-slate-500 hover:text-slate-300'}`}>Super</button>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => { setNewPasswordForReset(''); setSelectedUserForPasswordReset(user); }} className="p-1.5 rounded-xl border border-slate-800 text-slate-400 hover:text-indigo-400 hover:border-indigo-900/60 hover:bg-indigo-950/10 cursor-pointer text-[10px] flex items-center gap-1 font-mono transition"><Key className="w-3 h-3" /> Password</button>
                            <button onClick={() => handleDeleteUserAccount(user.id)} disabled={isSelf} className="p-1.5 rounded-xl border border-slate-800 text-slate-500 hover:text-red-400 hover:border-red-900/60 hover:bg-red-950/10 cursor-pointer transition disabled:opacity-20"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedUserForPasswordReset && (
                <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 relative shadow-2xl space-y-4">
                    <div className="text-center space-y-1.5"><div className="inline-flex p-2.5 rounded-2xl bg-indigo-950 border border-indigo-900 text-indigo-400"><Key className="w-5 h-5" /></div><h3 className="text-sm font-black text-slate-100 uppercase tracking-wide">Force Overwrite Password</h3><p className="text-xs text-slate-400">Apply a root override of password for <span className="font-bold text-slate-200">@{selectedUserForPasswordReset.username}</span>.</p></div>
                    <form onSubmit={handleForcePasswordReset} className="space-y-4 pt-1">
                      <div className="space-y-1"><label className="text-[10px] font-mono font-bold text-slate-500 uppercase">New Secure Password</label><input type="password" required minLength={5} placeholder="system_over_2026" value={newPasswordForReset} onChange={e => setNewPasswordForReset(e.target.value)} className="w-full px-3 py-2 text-xs rounded bg-slate-950 border border-slate-800 focus:border-indigo-500 outline-none text-slate-100 placeholder:text-slate-700 font-mono" /></div>
                      <div className="grid grid-cols-2 gap-2 pt-2"><button type="button" onClick={() => setSelectedUserForPasswordReset(null)} className="py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer text-xs font-bold font-sans">Cancel</button><button type="submit" disabled={loading.resetPass} className="py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs font-sans cursor-pointer disabled:opacity-50">{loading.resetPass ? 'Proceeding...' : 'Override Key'}</button></div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SETTINGS - Super Admin Only */}
      {activeSubTab === 'settings' && (
        <div className="space-y-8">
          {!isSuperAdmin ? (
            <div className="bg-[#0e0a13] border border-red-950/50 p-8 rounded-3xl text-center space-y-4 max-w-lg mx-auto shadow-2xl">
              <div className="inline-flex p-3 rounded-2xl bg-red-950/50 border border-red-900 text-red-500"><Lock className="w-6 h-6" /></div>
              <h3 className="text-[15px] font-black tracking-wide text-white font-sans uppercase">Supervisory Restrictions Applied</h3>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">The global parameters dashboard is allocated exclusively to the <span className="font-bold text-indigo-400 font-mono">super_admin</span> role. Your current role is <span className="font-mono bg-slate-950 px-1.5 py-0.5 rounded text-red-400 border border-red-900/60 uppercase">{dbUser.role}</span>.</p>
            </div>
          ) : (
            <div className="bg-[#070b19] border border-slate-900 rounded-3xl p-5 md:p-6 space-y-6 shadow-xl max-w-4xl mx-auto">
              <div><h4 className="text-sm font-extrabold text-white uppercase tracking-wider font-sans">Global System Parameters (K/V Store)</h4><p className="text-xs text-slate-400 font-sans mt-0.5">Control active service profiles, streaming layouts, thresholds, and operational limits</p></div>
              <div className="border border-indigo-950/20 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead><tr className="bg-slate-950 border-b border-indigo-950/45 text-[10px] font-mono text-slate-400 uppercase tracking-widest"><th className="p-4">Key Directory</th><th className="p-4">Active Value</th><th className="p-4">Utility Description</th><th className="p-4 text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-indigo-950/15 text-xs">
                    {settingsList.length === 0 ? (
                      <tr><td colSpan={4} className="p-8 text-center text-slate-500 font-mono">No parameters indexed yet.</td></tr>
                    ) : (
                      settingsList.map((param) => {
                        const isEditing = editingSettingKey === param.key;
                        return (
                          <tr key={param.id} className="hover:bg-slate-950/25 transition">
                            <td className="p-4 font-mono font-bold text-slate-300">{param.key}</td>
                            <td className="p-4">{isEditing ? <input type="text" value={editingSettingVal} onChange={e => setEditingSettingVal(e.target.value)} className="px-2.5 py-1 text-xs bg-slate-950 rounded border border-indigo-800 text-white font-mono focus:outline-none w-full max-w-[200px]" /> : <span className="bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-cyan-400 font-mono font-bold truncate max-w-[180px] inline-block">{param.value}</span>}</td>
                            <td className="p-4 text-slate-400 max-w-[250px] truncate" title={param.description || ''}>{param.description || 'N/A'}</td>
                            <td className="p-4 text-right">{isEditing ? <div className="flex gap-2 justify-end"><button onClick={() => setEditingSettingKey(null)} className="px-2.5 py-1 text-[10px] font-sans font-bold text-slate-400 hover:text-white transition">Cancel</button><button onClick={() => handleSaveSetting(param.key, editingSettingVal)} className="px-2.5 py-1 text-[10px] font-sans font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded transition cursor-pointer">Save</button></div> : <button onClick={() => { setEditingSettingKey(param.key); setEditingSettingVal(param.value); }} className="px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-950 transition cursor-pointer text-[10px]">Modify</button>}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}