export interface DBUser {
  id: string;
  username: string;
  displayName: string | null;
  email: string | null;
  role: 'admin' | 'super_admin';
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
