import { logger } from './logger';

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
  logger.info('UserSync', 'درخواست دریافت لیست کامل کاربران سیستم...');

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
        logger.success('UserSync', `تعداد ${data.users.length} کاربر از سرور دیتابیس دریافت شد`, { count: data.users.length });
        data.users.forEach(addOrMergeUser);
      }
    } else {
      logger.warn('UserSync', `خطا در دریافت لیست کاربران از API سرور (${res.status})`, { status: res.status, statusText: res.statusText });
    }
  } catch (err: any) {
    logger.error('UserSync', 'خطای شبکه یا سرور در دریافت لیست کاربران', { error: err.message });
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
  } catch (err: any) {
    logger.warn('UserSync', 'خطا در خواندن کاربران محلی localStorage', { error: err.message });
  }

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
  logger.info('UserSync', `شروع انطباق کاربر با دیتابیس: ${targetUser.email || targetUser.name}`, { targetUser });
  // Sync to local Node Express server
  try {
    const res = await fetch('/api/users/sync', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(targetUser)
    });

    if (res.status === 409) {
      const msg = 'کاربری با این ایمیل از قبل وجود دارد';
      logger.error('UserSync', `خطای تداخل (409) در دیتابیس: ${msg}`, { email: targetUser.email });
      throw new Error(msg);
    }

    if (res.ok) {
      const data = await res.json();
      if (data && data.user) {
        logger.success('UserSync', `کاربر با موفقیت در دیتابیس همگام‌سازی شد`, { syncedUser: data.user });
        return data.user;
      }
    } else {
      logger.error('UserSync', `پاسخ ناموفق سرور در همگام‌سازی کاربر (${res.status})`, { status: res.status });
    }
  } catch (err: any) {
    logger.error('UserSync', `خطا در فرایند sync کاربر در دیتابیس: ${err.message}`, { errorStack: err.stack });
    throw err;
  }

  return targetUser;
};

export const updateSharedUserPremiumStatus = async (idOrNumericId: string | number, makePremium: boolean): Promise<UserRecord[]> => {
  const strId = String(idOrNumericId).trim();
  logger.info('UserSync', `تغییر وضعیت پریمیوم کاربر شناسه ${strId} به ${makePremium}`);

  try {
    const res = await fetch(`/api/admin/users/${strId}/premium`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ isPremium: makePremium })
    });
    if (res.ok) {
      logger.success('UserSync', `وضعیت پریمیوم کاربر شناسه ${strId} با موفقیت در دیتابیس به‌روزرسانی شد`);
    } else {
      logger.error('UserSync', `خطای سرور در آپدیت پریمیوم (${res.status})`, { status: res.status });
    }
  } catch (err: any) {
    logger.error('UserSync', `خطای شبکه در بروزرسانی وضعیت پریمیوم: ${err.message}`);
    console.warn('Failed to update premium status on server:', err);
  }

  return fetchAllSharedUsers();
};

export const updateSharedUserStatus = async (idOrNumericId: string | number, status: 'active' | 'disabled'): Promise<UserRecord[]> => {
  const strId = String(idOrNumericId).trim();
  logger.info('UserSync', `تغییر وضعیت فعال/غیرفعال کاربر شناسه ${strId} به ${status}`);

  try {
    const res = await fetch(`/api/admin/users/${strId}/status`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      logger.success('UserSync', `وضعیت کاربر شناسه ${strId} در دیتابیس تغییر کرد به ${status}`);
    } else {
      logger.error('UserSync', `خطای سرور در آپدیت وضعیت کاربر (${res.status})`, { status: res.status });
    }
  } catch (err: any) {
    logger.error('UserSync', `خطای شبکه در بروزرسانی وضعیت کاربر: ${err.message}`);
    console.warn('Failed to update status on server:', err);
  }

  return fetchAllSharedUsers();
};

