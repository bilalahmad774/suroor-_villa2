'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  name?: string;
  phone?: string;
  role: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';
  isVerified?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'suroor_auth_token';
const USER_KEY = 'suroor_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync user with backend
  const checkSession = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/auth/me', {
        headers,
        credentials: 'include',
      });

      if (!res.ok) {
        if (res.status === 401 && token) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
          }
          setUser(null);
        }
        return;
      }

      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        }
      } else {
        // If explicitly unauthenticated
        setUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        }
      }
    } catch {
      // In case of offline or server down, preserve cached user if available
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    // 1. Immediately read cached user from localStorage to eliminate flicker
    if (typeof window !== 'undefined') {
      try {
        const cachedUserStr = localStorage.getItem(USER_KEY);
        const cachedToken = localStorage.getItem(TOKEN_KEY);
        if (cachedUserStr && cachedToken) {
          const parsed = JSON.parse(cachedUserStr);
          if (parsed && typeof parsed === 'object') {
            setUser(parsed);
          }
        }
      } catch {
        // ignore parse error
      }
    }

    // 2. Validate session with the server
    checkSession();
  }, [checkSession]);

  // Listen to cross-tab and custom events
  useEffect(() => {
    const handleAuthEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ user: AuthUser | null }>;
      if (customEvent.detail && 'user' in customEvent.detail) {
        setUser(customEvent.detail.user);
        setIsLoading(false);
      } else {
        checkSession();
      }
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY || e.key === USER_KEY) {
        checkSession();
      }
    };

    window.addEventListener('suroor-auth-changed', handleAuthEvent);
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener('suroor-auth-changed', handleAuthEvent);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [checkSession]);

  const login = useCallback((token: string, newUser: AuthUser) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    }
    setUser(newUser);
    setIsLoading(false);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('suroor-auth-changed', {
          detail: { user: newUser },
        })
      );
    }
  }, []);

  const logout = useCallback(async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    setUser(null);
    setIsLoading(false);

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // ignore
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('suroor-auth-changed', {
          detail: { user: null },
        })
      );
    }
  }, []);

  const refreshUser = useCallback(async () => {
    await checkSession();
  }, [checkSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
