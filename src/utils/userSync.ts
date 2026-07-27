export interface UserRecord {
  id: string;
  numericId?: number;
  name: string;
  email: string;
  picture?: string;
  provider?: string;
  isPremium?: boolean;
  createdAt?: string;
  status?: 'active' | 'disabled';
}

const CLOUD_DB_URL = 'https://jsonblob.com/api/jsonBlob/019fa48c-8aad-751b-9b24-bc8e4461195e';

export const fetchAllSharedUsers = async (): Promise<UserRecord[]> => {
  const userMap = new Map<string, UserRecord>();

  // 1. Try local server API first if available
  try {
    const res = await fetch('/api/admin/users');
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data && Array.isArray(data.users)) {
        data.users.forEach((u: UserRecord) => {
          if (u && u.id) userMap.set(u.id, u);
        });
      }
    }
  } catch {}

  // 2. Fetch from shared Cloud Database (works on Vercel across all devices & browsers)
  try {
    const res = await fetch(CLOUD_DB_URL);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.users)) {
        data.users.forEach((u: UserRecord) => {
          if (u && u.id) {
            const existing = userMap.get(u.id);
            userMap.set(u.id, { ...existing, ...u });
          }
        });
      }
    }
  } catch (err) {
    console.warn('Failed to fetch from shared cloud user database:', err);
  }

  // 3. Merge from localStorage (admin_users, mock_users_db, current user)
  try {
    const adminUsers: UserRecord[] = JSON.parse(localStorage.getItem('admin_users') || '[]');
    const mockUsers: UserRecord[] = JSON.parse(localStorage.getItem('mock_users_db') || '[]');
    const currentUser: UserRecord | null = JSON.parse(localStorage.getItem('user') || 'null');

    [...adminUsers, ...mockUsers, currentUser].forEach(u => {
      if (u && u.id) {
        const existing = userMap.get(u.id);
        userMap.set(u.id, { ...existing, ...u });
      }
    });
  } catch {}

  const merged = Array.from(userMap.values());

  // Assign numeric IDs to any users missing one
  let maxId = 1000;
  merged.forEach(u => {
    if (u.numericId && u.numericId > maxId) maxId = u.numericId;
  });
  merged.forEach(u => {
    if (!u.numericId) {
      maxId++;
      u.numericId = maxId;
    }
    if (u.isPremium === undefined) u.isPremium = false;
  });

  return merged;
};

export const syncUserToSharedDatabase = async (targetUser: UserRecord): Promise<UserRecord> => {
  const currentUsers = await fetchAllSharedUsers();
  
  const existingIdx = currentUsers.findIndex(u => 
    u.id === targetUser.id || 
    (u.numericId && targetUser.numericId && u.numericId === targetUser.numericId) ||
    (u.email && targetUser.email && u.email.toLowerCase() === targetUser.email.toLowerCase())
  );

  let finalUser: UserRecord;

  if (existingIdx >= 0) {
    const existing = currentUsers[existingIdx];
    currentUsers[existingIdx] = {
      ...existing,
      ...targetUser,
      numericId: existing.numericId || targetUser.numericId,
      id: existing.id || targetUser.id,
      name: targetUser.name || existing.name,
      email: targetUser.email || existing.email,
      provider: targetUser.provider || existing.provider,
      isPremium: targetUser.isPremium !== undefined ? targetUser.isPremium : existing.isPremium
    };
    finalUser = currentUsers[existingIdx];
  } else {
    let maxId = 1000;
    currentUsers.forEach(u => {
      if (u.numericId && u.numericId > maxId) maxId = u.numericId;
    });
    finalUser = {
      ...targetUser,
      numericId: targetUser.numericId || (maxId + 1),
      isPremium: targetUser.isPremium || false,
      createdAt: targetUser.createdAt || new Date().toISOString()
    };
    currentUsers.push(finalUser);
  }

  // Update localStorage
  try {
    localStorage.setItem('admin_users', JSON.stringify(currentUsers));
    const currentUser: UserRecord | null = JSON.parse(localStorage.getItem('user') || 'null');
    if (currentUser && (currentUser.id === finalUser.id || currentUser.email === finalUser.email)) {
      localStorage.setItem('user', JSON.stringify({ ...currentUser, ...finalUser }));
    }
  } catch {}

  // Update Shared Cloud DB (Vercel & multi-device sync)
  try {
    await fetch(CLOUD_DB_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users: currentUsers })
    });
  } catch (err) {
    console.warn('Failed to update shared cloud user DB:', err);
  }

  // Also sync to local Node Express server if available
  try {
    await fetch('/api/users/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalUser)
    });
  } catch {}

  return finalUser;
};

export const updateSharedUserPremiumStatus = async (idOrNumericId: string | number, makePremium: boolean): Promise<UserRecord[]> => {
  const currentUsers = await fetchAllSharedUsers();
  const strId = String(idOrNumericId).trim();

  const updatedUsers = currentUsers.map(u => {
    if (u.id === strId || String(u.numericId) === strId) {
      return { ...u, isPremium: makePremium };
    }
    return u;
  });

  // Update localStorage
  try {
    localStorage.setItem('admin_users', JSON.stringify(updatedUsers));
    const currentUser: UserRecord | null = JSON.parse(localStorage.getItem('user') || 'null');
    if (currentUser && (currentUser.id === strId || String(currentUser.numericId) === strId)) {
      currentUser.isPremium = makePremium;
      localStorage.setItem('user', JSON.stringify(currentUser));
    }
  } catch {}

  // Update Shared Cloud DB
  try {
    await fetch(CLOUD_DB_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users: updatedUsers })
    });
  } catch (err) {
    console.warn('Failed to update shared cloud user DB:', err);
  }

  // Update local Node server if available
  try {
    await fetch(`/api/admin/users/${strId}/premium`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPremium: makePremium })
    });
  } catch {}

  return updatedUsers;
};
