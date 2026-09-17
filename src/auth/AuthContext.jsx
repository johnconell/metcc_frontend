import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../api/authApi';
import { tokenStorage } from './tokenStorage';
import { ADMIN_ROLES } from '../utils/constants';
import { usePreferences } from '../preferences/PreferencesContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { syncFromUser } = usePreferences();

  const fetchUser = useCallback(async () => {
    if (!tokenStorage.get()) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const { data } = await authApi.me();
      setUser(data.data);
      syncFromUser(data.data);
      return data.data;
    } catch {
      tokenStorage.remove();
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [syncFromUser]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (credentials) => {
    const { data } = await authApi.login(credentials);

    if (!ADMIN_ROLES.includes(data.data.user.role?.slug)) {
      throw new Error('Admin access only. Proctor accounts use the mobile examination application.');
    }

    tokenStorage.set(data.data.token);
    setUser(data.data.user);
    syncFromUser(data.data.user);
    setLoading(false);
    return data;
  }, [syncFromUser]);

  const register = useCallback(async (payload) => {
    const { data } = await authApi.register(payload);

    if (!ADMIN_ROLES.includes(data.data.user.role?.slug)) {
      throw new Error('Admin access only. Proctor accounts use the mobile examination application.');
    }

    tokenStorage.set(data.data.token);
    setUser(data.data.user);
    syncFromUser(data.data.user);
    setLoading(false);
    return data;
  }, [syncFromUser]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      tokenStorage.remove();
      setUser(null);
      setLoading(false);
    }
  }, []);

  const setToken = useCallback(async (token, bootstrapUser = null) => {
    tokenStorage.set(token);

    if (bootstrapUser?.role?.slug && ADMIN_ROLES.includes(bootstrapUser.role.slug)) {
      setUser(bootstrapUser);
      syncFromUser(bootstrapUser);
      setLoading(false);
      return bootstrapUser;
    }

    return fetchUser();
  }, [fetchUser, syncFromUser]);

  const isAdmin = user?.role?.slug && ADMIN_ROLES.includes(user.role.slug);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setToken, fetchUser, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
