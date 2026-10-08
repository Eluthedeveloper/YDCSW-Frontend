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
