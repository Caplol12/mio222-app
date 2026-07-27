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

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const fetchAllSharedUsers = async (): Promise<UserRecord[]> => {
  const mergedList: UserRecord[] = [];

  const addOrMergeUser = (u: UserRecord) => {
    if (!u || (!u.id && !u.numericId && !u.email)) return;
    
    const existingIdx = mergedList.findIndex(existing => 
      (existing.id && u.id && existing.id === u.id) ||
      (existing.numericId && u.numericId && Number(existing.numericId) === Number(u.numericId)) ||
      (existing.email && u.email && existing.email.toLowerCase() === u.email.toLowerCase())
    );

    if (existingIdx >= 0) {
      mergedList[existingIdx] = {
        ...mergedList[existingIdx],
        ...u,
        numericId: mergedList[existingIdx].numericId || u.numericId,
        id: mergedList[existingIdx].id || u.id,
        name: (u.name && u.name !== 'کاربر مهمان') ? u.name : (mergedList[existingIdx].name || u.name),
        email: (u.email && !u.email.includes('@local.app')) ? u.email : (mergedList[existingIdx].email || u.email),
        isPremium: u.isPremium !== undefined ? u.isPremium : mergedList[existingIdx].isPremium,
        status: u.status || mergedList[existingIdx].status || 'active'
      };
    } else {
      mergedList.push({ ...u, status: u.status || 'active' });
    }
  };

  // 1. Try local server Admin API (authenticated)
  try {
    const res = await fetch('/api/admin/users', {
      headers: getAuthHeaders()
    });
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data && Array.isArray(data.users)) {
        data.users.forEach(addOrMergeUser);
      }
    }
  } catch (err) {
    console.warn('Failed to fetch users from server admin API:', err);
  }

  // 2. Merge from localStorage fallback (admin_users, mock_users_db, current user)
  try {
    const adminUsers: UserRecord[] = JSON.parse(localStorage.getItem('admin_users') || '[]');
    const mockUsers: UserRecord[] = JSON.parse(localStorage.getItem('mock_users_db') || '[]');
    const currentUser: UserRecord | null = JSON.parse(localStorage.getItem('user') || 'null');

    [...adminUsers, ...mockUsers, currentUser].forEach(u => {
      if (u) addOrMergeUser(u);
    });
  } catch {}

  // Assign numeric IDs to any users missing one
  let maxId = 1000;
  mergedList.forEach(u => {
    if (u.numericId && Number(u.numericId) > maxId) maxId = Number(u.numericId);
  });
  mergedList.forEach(u => {
    if (!u.numericId) {
      maxId++;
      u.numericId = maxId;
    }
    if (u.isPremium === undefined) u.isPremium = false;
    if (!u.status) u.status = 'active';
  });

  return mergedList;
};

export const syncUserToSharedDatabase = async (targetUser: UserRecord): Promise<UserRecord> => {
  // Sync to local Node Express server
  const res = await fetch('/api/users/sync', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(targetUser)
  });

  if (res.status === 409) {
    throw new Error('کاربری با این ایمیل از قبل وجود دارد');
  }

  if (res.ok) {
    const data = await res.json();
    if (data && data.user) {
      return data.user;
    }
  }

  return targetUser;
};

export const updateSharedUserPremiumStatus = async (idOrNumericId: string | number, makePremium: boolean): Promise<UserRecord[]> => {
  const strId = String(idOrNumericId).trim();

  try {
    await fetch(`/api/admin/users/${strId}/premium`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ isPremium: makePremium })
    });
  } catch (err) {
    console.warn('Failed to update premium status on server:', err);
  }

  return fetchAllSharedUsers();
};

export const updateSharedUserStatus = async (idOrNumericId: string | number, status: 'active' | 'disabled'): Promise<UserRecord[]> => {
  const strId = String(idOrNumericId).trim();

  try {
    await fetch(`/api/admin/users/${strId}/status`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
  } catch (err) {
    console.warn('Failed to update status on server:', err);
  }

  return fetchAllSharedUsers();
};

