import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../api/authApi';
import { tokenStorage } from './tokenStorage';
import { ADMIN_ROLES } from '../utils/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    if (!tokenStorage.get()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await authApi.me();
      setUser(data.data);
    } catch {
      tokenStorage.remove();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (credentials) => {
    const { data } = await authApi.login(credentials);

    if (!ADMIN_ROLES.includes(data.data.user.role?.slug)) {
      throw new Error('Admin access only. Proctor accounts use the mobile examination application.');
    }

    tokenStorage.set(data.data.token);
    setUser(data.data.user);
    return data;
  };

  const register = async (payload) => {
    const { data } = await authApi.register(payload);

    if (!ADMIN_ROLES.includes(data.data.user.role?.slug)) {
      throw new Error('Admin access only. Proctor accounts use the mobile examination application.');
    }

    tokenStorage.set(data.data.token);
    setUser(data.data.user);
    return data;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      tokenStorage.remove();
      setUser(null);
    }
  };

  const setToken = (token) => {
    tokenStorage.set(token);
    return fetchUser();
  };

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
