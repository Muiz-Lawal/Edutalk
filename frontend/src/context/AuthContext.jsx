import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

// 1. Create the Context
export const AuthContext = createContext();

// 2. Create the Provider Component
const normalizeUser = (userData) => {
  if (!userData || typeof userData !== 'object') return userData;

  const normalized = { ...userData };
  if (!normalized.id && normalized._id) normalized.id = normalized._id;
  if (!normalized._id && normalized.id) normalized._id = normalized.id;
  if (!normalized.userId && normalized.id) normalized.userId = normalized.id;
  return normalized;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? normalizeUser(JSON.parse(storedUser)) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const setAuthSession = (userData, authToken) => {
    const normalizedUser = normalizeUser(userData);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    setToken(authToken);
    setUser(normalizedUser);
  };

  useEffect(() => {
    // Check if user is already logged in
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      const normalizedUser = normalizeUser(response.data);
      setUser(normalizedUser);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token: receivedToken, user: userData } = response.data;
    const normalizedUser = normalizeUser(userData);
    localStorage.setItem('token', receivedToken);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    setToken(receivedToken);
    setUser(normalizedUser);
    return normalizedUser;
  };

  const register = async (email, password, firstName, lastName, isHost) => {
    const response = await api.post('/auth/register', {
      email,
      password,
      firstName,
      lastName,
      isHost,
    });
    const { token: receivedToken, user: userData } = response.data;
    const normalizedUser = normalizeUser(userData);
    localStorage.setItem('token', receivedToken);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    setToken(receivedToken);
    setUser(normalizedUser);
    return normalizedUser;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    const normalizedUser = normalizeUser(response.data);
    setUser(normalizedUser);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    return normalizedUser;
  };

  // Safe context object configurations
  const value = {
    user: user && typeof user === 'object' ? normalizeUser(user) : null,
    token: token || null,
    loading: !!loading,
    login,
    setAuthSession,
    register,
    logout,
    updateProfile,
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