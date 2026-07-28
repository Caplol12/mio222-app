import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserRecord, fetchUserStatus, syncUserToSharedDatabase } from '../utils/userSync';

export type User = UserRecord;

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
  login: async () => ({ id: '', name: '', email: '' }),
  logout: () => {},
  isLoading: true,
  refreshUserStatus: async () => null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncUserWithServer = useCallback(async (targetUser: User, authToken?: string): Promise<User> => {
    try {
      const syncedUser = await syncUserToSharedDatabase(targetUser, authToken);
      setUser(syncedUser);
      localStorage.setItem('user', JSON.stringify(syncedUser));
      return syncedUser;
    } catch (err) {
      console.warn('User sync error:', err);
    }
    setUser(targetUser);
    localStorage.setItem('user', JSON.stringify(targetUser));
    return targetUser;
  }, []);

  const refreshUserStatus = useCallback(async (): Promise<User | null> => {
    if (!user || !token) return null;
    try {
      const match = await fetchUserStatus(user.id, token);
      if (match) {
        const updated = { ...user, ...match };
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
        return updated;
      }
    } catch (err) {
      console.warn('Failed to refresh user status:', err);
    }
    return user;
  }, [user, token]);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        syncUserWithServer(parsedUser, storedToken);
      } catch {}
    } else {
      // Automatic first visit guest registration
      const guestId = 'guest_' + Math.random().toString(36).substring(2, 10);
      const guestUser: User = {
        id: guestId,
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
    const synced = await syncUserWithServer(newUser, newToken);
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
