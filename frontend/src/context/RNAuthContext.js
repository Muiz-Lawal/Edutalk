/**
 * React Native Auth Context
 * Global authentication state management using Context API
 */

import React, { createContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore token on app launch
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const savedToken = await SecureStore.getItemAsync('authToken');
        if (savedToken) {
          setToken(savedToken);
          api.setAuthToken(savedToken);
          
          // Fetch user data
          const response = await api.get('/auth/profile');
          setUser(response.data);
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/auth/login', {
        email,
        password,
      });

      const { token: newToken, user: userData } = response.data;

      // Save token securely
      await SecureStore.setItemAsync('authToken', newToken);
      
      setToken(newToken);
      setUser(userData);
      api.setAuthToken(newToken);

      return userData;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/auth/register', {
        name,
        email,
        password,
      });

      const { token: newToken, user: userData } = response.data;

      // Save token securely
      await SecureStore.setItemAsync('authToken', newToken);
      
      setToken(newToken);
      setUser(userData);
      api.setAuthToken(newToken);

      return userData;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      
      // Call logout endpoint
      try {
        await api.post('/auth/logout');
      } catch (err) {
        console.error('Logout request failed:', err);
      }

      // Clear local state
      await SecureStore.deleteItemAsync('authToken');
      setToken(null);
      setUser(null);
      api.setAuthToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates) => {
    try {
      setLoading(true);
      
      const response = await api.put('/auth/profile', updates);
      setUser(response.data);
      
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Update failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      const response = await api.post('/auth/refresh-token');
      const { token: newToken } = response.data;

      await SecureStore.setItemAsync('authToken', newToken);
      setToken(newToken);
      api.setAuthToken(newToken);

      return newToken;
    } catch (err) {
      console.error('Token refresh failed:', err);
      // If refresh fails, logout user
      await logout();
      throw err;
    }
  }, [logout]);

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    refreshToken,
    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
