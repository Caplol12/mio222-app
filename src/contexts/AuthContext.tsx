import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface User {
  id: string;
  numericId?: number;
  name: string;
  email: string;
  picture: string;
  isPremium?: boolean;
  provider?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => Promise<User>;
  logout: () => void;
  isLoading: boolean;
  refreshUserStatus: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => ({ id: '', name: '', email: '', picture: '' }),
  logout: () => {},
  isLoading: true,
  refreshUserStatus: async () => null,
});

const getLocalNextNumericId = (): number => {
  try {
    const adminUsers = JSON.parse(localStorage.getItem('admin_users') || '[]');
    const mockUsers = JSON.parse(localStorage.getItem('mock_users_db') || '[]');
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    const all = [...adminUsers, ...mockUsers];
    if (currentUser) all.push(currentUser);

    let maxId = 1000;
    all.forEach(u => {
      if (u && typeof u.numericId === 'number' && u.numericId > maxId) {
        maxId = u.numericId;
      }
    });
    return maxId + 1;
  } catch {
    return 1001;
  }
};

const syncUserToLocalStorageAdmin = (userToSave: User) => {
  try {
    const adminUsers: User[] = JSON.parse(localStorage.getItem('admin_users') || '[]');
    const idx = adminUsers.findIndex(u => u.id === userToSave.id || (u.numericId && u.numericId === userToSave.numericId));
    if (idx >= 0) {
      adminUsers[idx] = { ...adminUsers[idx], ...userToSave };
    } else {
      adminUsers.push(userToSave);
    }
    localStorage.setItem('admin_users', JSON.stringify(adminUsers));
  } catch {}
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncUserWithServer = useCallback(async (targetUser: User): Promise<User> => {
    // Ensure user has local numericId and isPremium default
    const preparedUser: User = {
      ...targetUser,
      numericId: targetUser.numericId || getLocalNextNumericId(),
      isPremium: targetUser.isPremium || false
    };

    // Save locally immediately to guarantee state & storage update on Vercel / offline
    localStorage.setItem('user', JSON.stringify(preparedUser));
    setUser(preparedUser);
    syncUserToLocalStorageAdmin(preparedUser);

    try {
      const res = await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: preparedUser.id,
          name: preparedUser.name,
          email: preparedUser.email,
          provider: preparedUser.provider || 'local'
        })
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.user) {
          const updatedUser: User = {
            ...preparedUser,
            ...data.user,
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
          syncUserToLocalStorageAdmin(updatedUser);
          return updatedUser;
        }
      }
    } catch (err) {
      console.warn('Backend server sync not available (running in local/Vercel SPA mode):', err);
    }
    return preparedUser;
  }, []);

  const refreshUserStatus = useCallback(async (): Promise<User | null> => {
    if (!user) return null;
    const searchId = user.numericId || user.id;
    try {
      const res = await fetch(`/api/users/status/${searchId}`);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.user) {
          const updatedUser: User = {
            ...user,
            ...data.user,
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
          syncUserToLocalStorageAdmin(updatedUser);
          return updatedUser;
        }
      }
    } catch (err) {
      console.warn('Failed to refresh user status from server:', err);
    }
    return user;
  }, [user]);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        syncUserWithServer(parsedUser);
      } catch {}
    } else {
      // Automatic first visit guest registration
      const guestId = 'guest_' + Math.random().toString(36).substring(2, 10);
      const guestUser: User = {
        id: guestId,
        numericId: getLocalNextNumericId(),
        name: 'کاربر مهمان',
        email: `guest_${guestId.substring(6, 12)}@local.app`,
        picture: '',
        provider: 'guest',
        isPremium: false
      };
      localStorage.setItem('token', 'guest-token');
      setToken('guest-token');
      syncUserWithServer(guestUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (newToken: string, newUser: User): Promise<User> => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    const synced = await syncUserWithServer(newUser);
    return synced;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, refreshUserStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);


