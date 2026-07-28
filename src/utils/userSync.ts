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

// Memory fallback store for when Supabase or network is offline
const getLocalUsers = (): UserRecord[] => {
  try {
    return JSON.parse(localStorage.getItem('shared_users_db') || '[]');
  } catch {
    return [];
  }
};

const saveLocalUsers = (users: UserRecord[]) => {
  try {
    localStorage.setItem('shared_users_db', JSON.stringify(users));
  } catch {}
};

export const fetchAllSharedUsers = async (): Promise<UserRecord[]> => {
  if (isSupabaseConfigured()) {
    try {
      const data = await supabaseRequest('/rest/v1/profiles?select=*', { method: 'GET' });
      // Map Supabase snake_case to UserRecord camelCase
      if (Array.isArray(data)) {
        return data.map((u: any) => ({
          ...u,
          numericId: u.numeric_id,
          isPremium: u.is_premium,
          isAdmin: u.is_admin,
          createdAt: u.created_at
        }));
      }
    } catch (e) {
      console.warn('Failed to fetch from Supabase, falling back to local.', e);
    }
  }

  const local = getLocalUsers();
  
  // Assign numeric IDs if missing
  let maxId = 1000;
  local.forEach(u => {
    if (u.numericId && Number(u.numericId) > maxId) maxId = Number(u.numericId);
  });
  local.forEach(u => {
    if (!u.numericId) {
      maxId++;
      u.numericId = maxId;
    }
    if (u.isPremium === undefined) u.isPremium = false;
    if (!u.status) u.status = 'active';
  });

  return local;
};

export const syncUserToSharedDatabase = async (targetUser: UserRecord): Promise<UserRecord> => {
  if (isSupabaseConfigured() && targetUser.id && !targetUser.id.startsWith('guest_')) {
    try {
      await supabaseRequest('/rest/v1/profiles', {
        method: 'POST',
        headers: {
          'Prefer': 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify({
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          picture: targetUser.picture,
          provider: targetUser.provider,
          is_premium: targetUser.isPremium,
          is_admin: targetUser.isAdmin,
          status: targetUser.status
        })
      });
      return targetUser;
    } catch (e) {
      console.warn('Failed to sync to Supabase, falling back to local.', e);
    }
  }

  const local = getLocalUsers();
  const existingIdx = local.findIndex(u => 
    (u.id && targetUser.id && u.id === targetUser.id) ||
    (u.email && targetUser.email && u.email.toLowerCase() === targetUser.email.toLowerCase())
  );

  if (existingIdx >= 0) {
    local[existingIdx] = {
      ...local[existingIdx],
      ...targetUser,
      numericId: local[existingIdx].numericId || targetUser.numericId
    };
  } else {
    let maxId = 1000;
    local.forEach(u => {
      if (u.numericId && Number(u.numericId) > maxId) maxId = Number(u.numericId);
    });
    const newUser = {
      ...targetUser,
      numericId: targetUser.numericId || maxId + 1,
      status: targetUser.status || 'active',
      isPremium: targetUser.isPremium || false
    };
    local.push(newUser);
  }

  saveLocalUsers(local);
  return targetUser;
};

export const updateSharedUserPremiumStatus = async (idOrNumericId: string | number, makePremium: boolean): Promise<UserRecord[]> => {
  const strId = String(idOrNumericId).trim();

  if (isSupabaseConfigured() && typeof idOrNumericId === 'string' && idOrNumericId.startsWith('sb_')) {
    try {
      await supabaseRequest(`/rest/v1/profiles?id=eq.${strId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_premium: makePremium })
      });
      return fetchAllSharedUsers();
    } catch (e) {
      console.warn('Supabase PATCH failed', e);
    }
  }

  const local = getLocalUsers();
  const user = local.find(u => u.id === strId || String(u.numericId) === strId);
  if (user) {
    user.isPremium = makePremium;
    saveLocalUsers(local);
  }
  return fetchAllSharedUsers();
};

export const updateSharedUserStatus = async (idOrNumericId: string | number, status: 'active' | 'disabled'): Promise<UserRecord[]> => {
  const strId = String(idOrNumericId).trim();

  if (isSupabaseConfigured() && typeof idOrNumericId === 'string' && idOrNumericId.startsWith('sb_')) {
    try {
      await supabaseRequest(`/rest/v1/profiles?id=eq.${strId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      return fetchAllSharedUsers();
    } catch (e) {
      console.warn('Supabase PATCH failed', e);
    }
  }

  const local = getLocalUsers();
  const user = local.find(u => u.id === strId || String(u.numericId) === strId);
  if (user) {
    user.status = status;
    saveLocalUsers(local);
  }
  return fetchAllSharedUsers();
};
