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

const toProfileRow = (user: Partial<UserRecord>) => {
  const row: any = {};
  if (user.id) row.id = user.id;
  if (user.name !== undefined) row.name = user.name;
  if (user.email !== undefined) row.email = user.email;
  if (user.picture !== undefined) row.picture = user.picture;
  if (user.provider !== undefined) row.provider = user.provider;
  if (user.status !== undefined) row.status = user.status;
  return row;
};

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

export const fetchUserStatusByEmail = async (email: string, authToken?: string): Promise<UserRecord | null> => {
  if (!isSupabaseConfigured() || !email) return null;
  try {
    const rows = await supabaseRequest<any[]>(
      `/rest/v1/profiles?email=eq.${encodeURIComponent(email.toLowerCase().trim())}&select=*`,
      { authToken }
    );
    return rows && rows[0] ? fromProfileRow(rows[0]) : null;
  } catch {
    return null;
  }
};

export const fetchUserStatus = async (idOrEmail: string, authToken?: string, secondaryEmail?: string): Promise<UserRecord | null> => {
  if (!isSupabaseConfigured() || !idOrEmail) return null;
  try {
    let rows = await supabaseRequest<any[]>(
      `/rest/v1/profiles?id=eq.${encodeURIComponent(idOrEmail)}&select=*`,
      { authToken }
    );
    if ((!rows || rows.length === 0) && (secondaryEmail || idOrEmail.includes('@'))) {
      const emailToSearch = secondaryEmail || idOrEmail;
      rows = await supabaseRequest<any[]>(
        `/rest/v1/profiles?email=eq.${encodeURIComponent(emailToSearch.toLowerCase().trim())}&select=*`,
        { authToken }
      );
    }
    return rows && rows[0] ? fromProfileRow(rows[0]) : null;
  } catch {
    if (secondaryEmail || idOrEmail.includes('@')) {
      const emailToSearch = secondaryEmail || idOrEmail;
      return fetchUserStatusByEmail(emailToSearch, authToken);
    }
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

    // Update local storage backup key if modifying active user
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed.id === id || (parsed.numericId && String(parsed.numericId) === id)) {
          parsed.isPremium = makePremium;
          localStorage.setItem('user', JSON.stringify(parsed));
          localStorage.setItem('is_premium', makePremium ? 'true' : 'false');
          localStorage.setItem('user_is_premium', makePremium ? 'true' : 'false');
        }
      }
    } catch {}
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
