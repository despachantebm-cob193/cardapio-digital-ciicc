export type UserRole = 'customer' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'blocked';

export interface AuthProfile {
  id: string;
  authUserId: string;
  displayName: string | null;
  email: string | null;
  role: UserRole;
  status: UserStatus;
}
