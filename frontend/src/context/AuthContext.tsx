"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  email: string;
  name: string;
  tenantId?: string;
}

export interface Tenant {
  id: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  token: string | null;
  permissions: string[];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, tenantId?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'telecom_access_token';
const REFRESH_KEY = 'telecom_refresh_token';
const USER_KEY = 'telecom_user';
const TENANT_KEY = 'telecom_tenant';
const PERMS_KEY = 'telecom_permissions';

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage and verify with backend
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
      const storedTenant = localStorage.getItem(TENANT_KEY);
      const storedPerms = localStorage.getItem(PERMS_KEY);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        if (storedTenant) setTenant(JSON.parse(storedTenant));
        if (storedPerms) setPermissions(JSON.parse(storedPerms));

        // Background session verification
        fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${storedToken}` }
        })
          .then((res) => {
            if (res.ok) {
              return res.json();
            } else if (res.status === 401) {
              // Token expired, clear invalid session
              clearStorage();
              setUser(null);
              setTenant(null);
              setToken(null);
              setPermissions([]);
              if (typeof window !== 'undefined' && window.location.pathname.startsWith('/dashboard')) {
                window.location.href = '/login';
              }
            }
          })
          .then((data) => {
            if (data?.data) {
              if (data.data.user) {
                setUser(data.data.user);
                localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));
              }
              if (data.data.tenant) {
                setTenant(data.data.tenant);
                localStorage.setItem(TENANT_KEY, JSON.stringify(data.data.tenant));
              }
              if (data.data.permissions) {
                setPermissions(data.data.permissions);
                localStorage.setItem(PERMS_KEY, JSON.stringify(data.data.permissions));
              }
            }
          })
          .catch(() => {
            // Keep stored state if network fails
          });
      }
    } catch {
      // Ignore JSON parse errors
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearStorage = () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TENANT_KEY);
      localStorage.removeItem(PERMS_KEY);
      document.cookie = 'telecom_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax';
    } catch {}
  };

  const login = async (email: string, password: string, tenantId?: string) => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, tenantId }),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        return {
          success: false,
          error: result.error || 'Login failed. Please check your credentials.',
        };
      }

      const { accessToken, refreshToken, user: loggedUser, tenant: loggedTenant, permissions: loggedPerms } = result.data || {};

      if (!accessToken || !loggedUser) {
        return { success: false, error: 'Invalid response from server.' };
      }

      setToken(accessToken);
      setUser(loggedUser);
      setTenant(loggedTenant || null);
      setPermissions(loggedPerms || []);

      localStorage.setItem(TOKEN_KEY, accessToken);
      if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(loggedUser));
      if (loggedTenant) localStorage.setItem(TENANT_KEY, JSON.stringify(loggedTenant));
      if (loggedPerms) localStorage.setItem(PERMS_KEY, JSON.stringify(loggedPerms));
      document.cookie = `telecom_auth_token=${accessToken}; path=/; max-age=604800; SameSite=Lax`;

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error during login';
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null);
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem(REFRESH_KEY) : null;

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
        },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {}

    clearStorage();
    setToken(null);
    setUser(null);
    setTenant(null);
    setPermissions([]);

    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        token,
        permissions,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
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
