export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: 'super_admin' | 'admin';
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
}

export interface TrackUpdateInput {
  title?: string;
  artist?: string | null;
  album?: string | null;
  track_type?: string;
  duration?: number;
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
  created_by?: string;
  created_at?: string;
  photos: AlbumPhoto[];
}

export interface Announcement {
  id: string;
  title: string;
  body?: string | null;
  pinned: number;
  created_at?: string;
}

export interface SiteEvent {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  starts_at: string;
  ends_at?: string | null;
  created_at?: string;
}
