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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncUserWithServer = useCallback(async (targetUser: User): Promise<User> => {
    try {
      const res = await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          provider: targetUser.provider || 'local'
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          const updatedUser: User = {
            ...targetUser,
            ...data.user,
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
          return updatedUser;
        }
      }
    } catch (err) {
      console.warn('Failed to sync user with server:', err);
    }
    return targetUser;
  }, []);

  const refreshUserStatus = useCallback(async (): Promise<User | null> => {
    if (!user) return null;
    const searchId = user.numericId || user.id;
    try {
      const res = await fetch(`/api/users/status/${searchId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          const updatedUser: User = {
            ...user,
            ...data.user,
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
          return updatedUser;
        }
      }
    } catch (err) {
      console.warn('Failed to refresh user status:', err);
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
        // Async background sync with server
        syncUserWithServer(parsedUser);
      } catch {}
    } else {
      // Automatic first visit guest registration if no user exists
      const guestId = 'guest_' + Math.random().toString(36).substring(2, 10);
      const guestUser: User = {
        id: guestId,
        name: 'کاربر مهمان',
        email: `guest_${guestId.substring(6, 12)}@local.app`,
        picture: '',
        provider: 'guest'
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

