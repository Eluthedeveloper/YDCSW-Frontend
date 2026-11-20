export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: 'super_admin' | 'admin' | 'editor';
}

export interface UserRow extends AuthUser {
  created_at?: string;
}

export interface Program {
  id: string;
  title: string;
  description?: string | null;
  cover_image?: string | null;
  created_by: string;
  creator_name?: string;
  /** Always returned by the API for programs; optional only for optimistic UI. */
  created_at: string;
  /** Admin-controlled position in the library; lower comes first. */
  sort_order?: number;
  track_count?: number;
  comment_count?: number;
  like_count?: number;
  tracks?: Track[];
  comments?: Comment[];
}

export interface Track {
  id: string;
  title: string;
  artist?: string | null;
  album?: string | null;
  duration: number;
  file_path: string;
  program_id: string;
  track_type?: string | null;
  sort_order?: number;
  /** Optional section inside a program ("Matthew", "Genesis", …). */
  group_name?: string | null;
  /** Display position of the section; ungrouped tracks use 0. */
  group_order?: number;
  created_by?: string;
  creator_name?: string;
  created_at?: string;
  like_count?: number;
  program_cover?: string | null;
  program_title?: string;
}

export interface Comment {
  id: string;
  program_id?: string;
  guest_name: string;
  content: string;
  created_at: string;
  program_title?: string;
}

export interface SearchResults {
  programs: Program[];
  tracks: Track[];
}

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  role: AuthUser['role'];
}

export interface MeUpdateInput {
  username?: string;
  email?: string;
  password?: string;
  current_password?: string;
}

export interface TrackUpdateInput {
  title?: string;
  artist?: string | null;
  album?: string | null;
  track_type?: string;
  duration?: number;
  /** An empty string clears the section; omit to leave it unchanged. */
  group_name?: string | null;
}

export interface Leader {
  id: string;
  name: string;
  title: string;
  quote?: string | null;
  role_label?: string | null;
  photo?: string | null;
  sort_order: number;
  created_at?: string;
}

export interface AlbumPhoto {
  id: string;
  album_id: string;
  caption?: string | null;
  file_name: string;
  sort_order?: number;
  created_at?: string;
}

export interface Album {
  id: string;
  title: string;
  description?: string | null;
  /** Gallery-only when null; otherwise the department page the album mounts on. */
  department?: string | null;
  created_by?: string;
  created_at?: string;
  photos: AlbumPhoto[];
}

/** Departments an album can be attached to; keep in step with routes/site.ts. */
export const ALBUM_DEPARTMENTS = ['electronic', 'print', 'finance', 'resource'] as const;

export interface Announcement {
  id: string;
  title: string;
  body?: string | null;
  pinned: number;
  /** User id of the author; only they (or a super admin) may delete it. */
  created_by?: string;
  created_at?: string;
}

export interface SiteEvent {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  starts_at: string;
  ends_at?: string | null;
  /** User id of the author; only they (or a super admin) may delete it. */
  created_by?: string;
  created_at?: string;
}

/** One hour slot of the weekly radio grid; unique per (day, hour). */
export interface RadioSlot {
  id: string;
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  hour: number;
  title: string;
  host?: string | null;
  category: 'worship' | 'teaching' | 'talk' | 'music' | 'live';
}

/** One transmission of the shortwave schedule; independent rows, not slots. */
export interface ShortwaveEntry {
  id: string;
  start_time: string;
  end_time?: string | null;
  frequency_khz: number;
  language?: string | null;
  target?: string | null;
  program?: string | null;
  active: number;
  sort_order: number;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  body?: string | null;
  category?: string | null;
  cover_image?: string | null;
  /** Extra photos shown inside the article, filenames under uploads/blogs. */
  images?: string[];
  published: number;
  /** User id of the author; only they (or a super admin) may delete it. */
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

/** One entry of the merged "what's new" feed behind the notification bell. */
export interface WhatsNewItem {
  id: string;
  type: 'blog' | 'announcement' | 'event';
  title: string;
  summary?: string | null;
  /** Cover filename under uploads/blogs; null for announcements and events. */
  image?: string | null;
  url: string;
  published_at: string;
}

export type ChatLang = 'en' | 'am' | 'om';

export interface ChatbotReply {
  reply: string;
  matched: boolean;
  intent?: string | null;
  confidence: number;
  language: ChatLang;
  conversationId: string;
  restarted?: boolean;
}

export interface ChatbotSettings {
  confidence_threshold: number;
  fuzzy_threshold: number;
  welcome_messages: Record<ChatLang, string>;
  fallback_messages: Record<ChatLang, string>;
  enabled_languages: ChatLang[];
  auto_approve_content: boolean;
  sync_interval_minutes: number;
  max_history_turns: number;
}

export interface ChatbotMessage {
  id: string;
  sender: 'visitor' | 'bot';
  message: string;
  matched_knowledge_id?: string | null;
  confidence_score?: number | null;
  created_at: string;
}

export interface ChatbotKnowledge {
  id: string;
  intent_id: string | null;
  intent_name: string | null;
  language: ChatLang;
  question: string;
  alternative_questions: string | null;
  keywords: string | null;
  answer: string;
  priority: number;
  is_active: number;
  source_type: 'manual' | 'content_sync';
  source_url: string | null;
  sync_status: 'approved' | 'pending' | 'rejected';
  updated_at: string;
}

export interface ChatbotInput {
  intent_id: string | null;
  language: ChatLang;
  question: string;
  alternative_questions: string[];
  keywords: string[];
  answer: string;
  priority: number;
  is_active: boolean;
  sync_status: 'approved' | 'pending' | 'rejected';
}

export interface ChatbotIntent {
  id: string;
  name: string;
  description: string | null;
  is_active: number;
}

export interface ChatbotAnalytics {
  totals: {
    conversations: number;
    questions: number;
    answered: number;
    unanswered: number;
    successRate: number;
  };
  topQuestions: Array<{ question: string; count: number }>;
  topIntents: Array<{ intent: string; count: number }>;
}

export interface ChatbotConversation {
  id: string;
  session_id: string;
  language: ChatLang;
  started_at: string;
  last_activity: string;
  message_count: number;
  unanswered: number;
}

export interface ChatbotSyncSource {
  source_table: string;
  source_id: string;
  language: string;
  content_version: string;
  status: string;
  last_error: string | null;
  last_synced_at: string;
}
