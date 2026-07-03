/**
 * React Native Secure Token Storage
 * Manages JWT tokens with Expo Secure Store
 */

import * as SecureStore from 'expo-secure-store';

export const secureStorage = {
  /**
   * Save auth token securely
   */
  async saveToken(token) {
    try {
      await SecureStore.setItemAsync('authToken', token);
      console.log('✓ Token saved securely');
      return true;
    } catch (error) {
      console.error('Failed to save token:', error);
      return false;
    }
  },

  /**
   * Retrieve auth token
   */
  async getToken() {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      return token || null;
    } catch (error) {
      console.error('Failed to retrieve token:', error);
      return null;
    }
  },

  /**
   * Delete auth token
   */
  async deleteToken() {
    try {
      await SecureStore.deleteItemAsync('authToken');
      console.log('✓ Token deleted');
      return true;
    } catch (error) {
      console.error('Failed to delete token:', error);
      return false;
    }
  },

  /**
   * Save user data (non-sensitive)
   */
  async saveUserData(userData) {
    try {
      await SecureStore.setItemAsync('userData', JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Failed to save user data:', error);
      return false;
    }
  },

  /**
   * Retrieve user data
   */
  async getUserData() {
    try {
      const data = await SecureStore.getItemAsync('userData');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to retrieve user data:', error);
      return null;
    }
  },

  /**
   * Save refresh token
   */
  async saveRefreshToken(refreshToken) {
    try {
      await SecureStore.setItemAsync('refreshToken', refreshToken);
      return true;
    } catch (error) {
      console.error('Failed to save refresh token:', error);
      return false;
    }
  },

  /**
   * Get refresh token
   */
  async getRefreshToken() {
    try {
      return await SecureStore.getItemAsync('refreshToken');
    } catch (error) {
      console.error('Failed to retrieve refresh token:', error);
      return null;
    }
  },

  /**
   * Clear all secure storage
   */
  async clearAll() {
    try {
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('userData');
      console.log('✓ Secure storage cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear storage:', error);
      return false;
    }
  },

  /**
   * Check if token exists and is valid
   */
  async isTokenValid() {
    try {
      const token = await this.getToken();
      if (!token) return false;

      // Basic JWT validation (not cryptographic, just structure check)
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      // Check expiration
      try {
        const payload = JSON.parse(atob(parts[1]));
        const exp = payload.exp;
        if (!exp) return false;

        // Token expires in 5 minutes or less
        const now = Math.floor(Date.now() / 1000);
        return exp > now + 300;
      } catch (e) {
        return false;
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  },
};
