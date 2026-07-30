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
    if (!user) return null;
    try {
      const match = await fetchUserStatus(user.id, token || undefined, user.email);
      if (match) {
        const updated = { ...user, ...match, isPremium: match.isPremium ?? user.isPremium };
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
        if (updated.isPremium) {
          localStorage.setItem('is_premium', 'true');
          localStorage.setItem('user_is_premium', 'true');
        } else {
          localStorage.setItem('is_premium', 'false');
          localStorage.setItem('user_is_premium', 'false');
        }
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

        // Fetch authoritative user profile from Supabase first so direct DB edits are respected
        fetchUserStatus(parsedUser.id, storedToken, parsedUser.email).then((remoteUser) => {
          if (remoteUser) {
            const mergedUser = { ...parsedUser, ...remoteUser, isPremium: remoteUser.isPremium ?? parsedUser.isPremium };
            setUser(mergedUser);
            localStorage.setItem('user', JSON.stringify(mergedUser));
            if (mergedUser.isPremium) {
              localStorage.setItem('is_premium', 'true');
              localStorage.setItem('user_is_premium', 'true');
            }
          } else {
            syncUserWithServer(parsedUser, storedToken);
          }
        }).catch(() => {
          syncUserWithServer(parsedUser, storedToken);
        });
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

    // Try fetching remote status immediately to preserve isPremium if set in DB
    let initialUser = newUser;
    try {
      const remote = await fetchUserStatus(newUser.id, newToken, newUser.email);
      if (remote) {
        initialUser = { ...newUser, ...remote, isPremium: remote.isPremium ?? newUser.isPremium };
      }
    } catch {}

    const synced = await syncUserWithServer(initialUser, newToken);
    if (synced.isPremium) {
      localStorage.setItem('is_premium', 'true');
      localStorage.setItem('user_is_premium', 'true');
    }
    return synced;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('is_premium');
    localStorage.removeItem('user_is_premium');
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
