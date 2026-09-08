import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { useCartStore } from '../stores/cartStore';

const resolveActiveRole = (userData) => {
  if (!userData) return 'student';
  if (userData.isAdmin || userData.adminRole) return 'admin';

  const persistedRole = localStorage.getItem('activeRole');
  if (userData.isHost && userData.isStudent) {
    return persistedRole === 'host' || persistedRole === 'student' ? persistedRole : 'host';
  }

  if (userData.isHost) return 'host';
  return 'student';
};

// 1. Create the Context
export const AuthContext = createContext();

// 2. Create the Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [activeRole, setActiveRoleState] = useState('student');

  const setAuthSession = (userData, authToken) => {
    const nextRole = resolveActiveRole(userData);
    const safeUser = userData && typeof userData === 'object' ? userData : null;
    localStorage.setItem('token', authToken);
    if (safeUser) {
      localStorage.setItem('user', JSON.stringify(safeUser));
    }
    localStorage.setItem('activeRole', nextRole);
    setToken(authToken);
    setUser(safeUser);
    setActiveRoleState(nextRole);
  };

  useEffect(() => {
    // Check if user is already logged in
    if (token) {
      fetchProfile();
    } else {
      setActiveRoleState('student');
      localStorage.removeItem('activeRole');
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!user) {
      setActiveRoleState('student');
      return;
    }

    const nextRole = resolveActiveRole(user);
    const persistedRole = localStorage.getItem('activeRole');
    const safeRole = user.isAdmin || user.adminRole ? 'admin' : user.isHost && (persistedRole === 'host' || persistedRole === 'student') ? persistedRole : nextRole;
    localStorage.setItem('activeRole', safeRole);
    setActiveRoleState(safeRole);
  }, [user]);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('activeRole');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: receivedToken, user: userData } = response.data;
      const nextRole = resolveActiveRole(userData);

      localStorage.setItem('token', receivedToken);
      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
      }
      localStorage.setItem('activeRole', nextRole);
      setToken(receivedToken);
      setUser(userData || null);
      setActiveRoleState(nextRole);
      try {
        const merged = await api.post('/payments/cart/merge', { lines: useCartStore.getState().lines });
        useCartStore.getState().replaceLines(merged.data.lines);
      } catch (mergeError) {
        console.warn('Cart merge unavailable:', mergeError.message);
      }

      return userData;
    } catch (error) {
      throw error;
    }
  };

  const register = async (email, password, firstName, lastName, isHost, dateOfBirth, referralCode) => {
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        firstName,
        lastName,
        isHost,
        dateOfBirth,
        referralCode,
      });

      const { token: receivedToken, user: userData } = response.data;
      const nextRole = resolveActiveRole(userData);

      localStorage.setItem('token', receivedToken);
      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
      }
      localStorage.setItem('activeRole', nextRole);
      setToken(receivedToken);
      setUser(userData || null);
      setActiveRoleState(nextRole);

      return userData;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('activeRole');
    setToken(null);
    setUser(null);
    setActiveRoleState('student');
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      setUser(response.data);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const setActiveRole = (nextRole) => {
    const isAdminUser = Boolean(user?.isAdmin || user?.adminRole);
    const permittedRole = isAdminUser ? 'admin' : user?.isHost ? (nextRole === 'host' || nextRole === 'student' ? nextRole : 'student') : 'student';
    localStorage.setItem('activeRole', permittedRole);
    setActiveRoleState(permittedRole);
  };

  const value = {
    user: user && typeof user === 'object' ? user : null,
    token: token || null,
    loading: !!loading,
    login,
    setAuthSession,
    register,
    logout,
    updateProfile,
    setActiveRole,
    activeRole: user && typeof user === 'object' ? (user.isAdmin || user.adminRole ? 'admin' : user.isHost ? activeRole : 'student') : 'student',
    isAuthenticated: Boolean(token),
    isHost: user && typeof user === 'object' ? Boolean(user.isHost) : false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 3. Create and Export the Custom Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};