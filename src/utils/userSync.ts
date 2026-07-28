import { supabaseRequest, isSupabaseConfigured } from './supabaseClient';

export interface UserRecord {
  id: string;
  numericId?: number;
  name: string;
  email: string;
  picture?: string;
  provider?: string;
  isPremium?: boolean;
  isAdmin?: boolean;
  createdAt?: string;
  status?: 'active' | 'disabled';
}

const fromProfileRow = (row: any): UserRecord => ({
  id: row.id,
  numericId: row.numeric_id ?? undefined,
  name: row.name,
  email: row.email,
  picture: row.picture || '',
  provider: row.provider || 'email',
  isPremium: !!row.is_premium,
  isAdmin: !!row.is_admin,
  status: row.status || 'active',
  createdAt: row.created_at,
});

const toProfileRow = (user: Partial<UserRecord>) => ({
  ...(user.id ? { id: user.id } : {}),
  ...(user.name !== undefined ? { name: user.name } : {}),
  ...(user.email !== undefined ? { email: user.email } : {}),
  ...(user.picture !== undefined ? { picture: user.picture } : {}),
  ...(user.provider !== undefined ? { provider: user.provider } : {}),
  ...(user.isPremium !== undefined ? { is_premium: user.isPremium } : {}),
  ...(user.status !== undefined ? { status: user.status } : {}),
});

const GUEST_KEY = 'guest_user_local';
const isGuest = (user: Partial<UserRecord>) => !user.provider || user.provider === 'guest';

export const syncUserToSharedDatabase = async (
  targetUser: UserRecord,
  authToken?: string
): Promise<UserRecord> => {
  if (isGuest(targetUser) || !isSupabaseConfigured()) {
    localStorage.setItem(GUEST_KEY, JSON.stringify(targetUser));
    return targetUser;
  }

  try {
    const rows = await supabaseRequest<any[]>('/rest/v1/profiles?on_conflict=id', {
      method: 'POST',
      authToken,
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(toProfileRow(targetUser)),
    });
    const row = Array.isArray(rows) ? rows[0] : rows;
    return row ? fromProfileRow(row) : targetUser;
  } catch (e) {
    console.warn('syncUserToSharedDatabase: Supabase sync failed', e);
    return targetUser;
  }
};

export const fetchUserStatus = async (id: string, authToken?: string): Promise<UserRecord | null> => {
  if (!isSupabaseConfigured()) return null;
  try {
    const rows = await supabaseRequest<any[]>(
      `/rest/v1/profiles?id=eq.${encodeURIComponent(id)}&select=*`,
      { authToken }
    );
    return rows && rows[0] ? fromProfileRow(rows[0]) : null;
  } catch {
    return null;
  }
};

export const fetchAllSharedUsers = async (authToken?: string): Promise<UserRecord[]> => {
  if (!isSupabaseConfigured()) return [];
  try {
    const rows = await supabaseRequest<any[]>(
      '/rest/v1/profiles?select=*&order=created_at.desc',
      { authToken }
    );
    return (rows || []).map(fromProfileRow);
  } catch (e) {
    console.warn('fetchAllSharedUsers: Supabase fetch failed (check admin RLS policy)', e);
    return [];
  }
};

export const updateSharedUserPremiumStatus = async (
  id: string,
  makePremium: boolean,
  authToken?: string
): Promise<UserRecord[]> => {
  try {
    await supabaseRequest(`/rest/v1/profiles?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      authToken,
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ is_premium: makePremium }),
    });
  } catch (e) {
    console.warn('updateSharedUserPremiumStatus: Supabase update failed', e);
  }
  return fetchAllSharedUsers(authToken);
};

export const updateSharedUserStatus = async (
  id: string,
  status: 'active' | 'disabled',
  authToken?: string
): Promise<UserRecord[]> => {
  try {
    await supabaseRequest(`/rest/v1/profiles?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      authToken,
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ status }),
    });
  } catch (e) {
    console.warn('updateSharedUserStatus: Supabase update failed', e);
  }
  return fetchAllSharedUsers(authToken);
};
