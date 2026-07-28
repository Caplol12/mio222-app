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
  const local = getLocalUsers();
  const strId = String(idOrNumericId).trim();
  const user = local.find(u => u.id === strId || String(u.numericId) === strId);
  if (user) {
    user.isPremium = makePremium;
    saveLocalUsers(local);
  }
  return fetchAllSharedUsers();
};

export const updateSharedUserStatus = async (idOrNumericId: string | number, status: 'active' | 'disabled'): Promise<UserRecord[]> => {
  const local = getLocalUsers();
  const strId = String(idOrNumericId).trim();
  const user = local.find(u => u.id === strId || String(u.numericId) === strId);
  if (user) {
    user.status = status;
    saveLocalUsers(local);
  }
  return fetchAllSharedUsers();
};
