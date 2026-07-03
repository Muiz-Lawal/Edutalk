import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../utils/api'; // Normalized to match your AuthContext default import structure

// 1. Create the Context
const AdminContext = createContext();

// 3. Create and Export the Custom Hook
export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
};

// 2. Create the Provider Component
export const AdminProvider = ({ children }) => {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [adminLogs, setAdminLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Dashboard stats
  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/dashboard/stats');
      setDashboardStats(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch users
  const fetchUsers = useCallback(async (page = 1, limit = 20, filters = {}) => {
    try {
      setLoading(true);
      const params = { page, limit, ...filters };
      const response = await api.get('/admin/users', { params });
      setUsers(response.data.users);
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch users');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get user details
  const getUserDetails = useCallback(async (userId) => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/users/${userId}`);
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch user');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Suspend user
  const suspendUser = useCallback(async (userId, reason) => {
    try {
      setLoading(true);
      const response = await api.post(`/admin/users/${userId}/suspend`, { reason });
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to suspend user');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Unsuspend user
  const unsuspendUser = useCallback(async (userId) => {
    try {
      setLoading(true);
      const response = await api.post(`/admin/users/${userId}/unsuspend`);
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to unsuspend user');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete user
  const deleteUser = useCallback(async (userId, reason) => {
    try {
      setLoading(true);
      const response = await api.delete(`/admin/users/${userId}`, { data: { reason } });
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch admin logs
  const fetchAdminLogs = useCallback(async (page = 1, limit = 50, filters = {}) => {
    try {
      setLoading(true);
      const params = { page, limit, ...filters };
      const response = await api.get('/admin/logs', { params });
      setAdminLogs(response.data.logs);
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch logs');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get admin settings
  const getAdminSettings = useCallback(async () => {
    try {
      const response = await api.get('/admin/settings');
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch settings');
      return null;
    }
  }, []);

  // Update admin setting
  const updateAdminSetting = useCallback(async (key, value) => {
    try {
      setLoading(true);
      const response = await api.put(`/admin/settings/${key}`, { value });
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update setting');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Analytics - User Growth
  const fetchUserGrowth = useCallback(async () => {
    try {
      const response = await api.get('/admin/analytics/user-growth');
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch user growth');
      return null;
    }
  }, []);

  // Analytics - Revenue Trend
  const fetchRevenueTrend = useCallback(async () => {
    try {
      const response = await api.get('/admin/analytics/revenue-trend');
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch revenue trend');
      return null;
    }
  }, []);

  // Analytics - Top Hosts
  const fetchTopHosts = useCallback(async () => {
    try {
      const response = await api.get('/admin/analytics/top-hosts');
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch top hosts');
      return null;
    }
  }, []);

  // Analytics - Top Classes
  const fetchTopClasses = useCallback(async () => {
    try {
      const response = await api.get('/admin/analytics/top-classes');
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch top classes');
      return null;
    }
  }, []);

  // Analytics - Engagement Metrics
  const fetchEngagementMetrics = useCallback(async () => {
    try {
      const response = await api.get('/admin/analytics/engagement');
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch engagement metrics');
      return null;
    }
  }, []);

  // Analytics - Platform Stats
  const fetchPlatformStats = useCallback(async () => {
    try {
      const response = await api.get('/admin/analytics/platform-stats');
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch platform stats');
      return null;
    }
  }, []);

  // Phase 5C: User Activity & Messaging
  const fetchUserActivity = useCallback(async (userId) => {
    try {
      const response = await api.get(`/admin/users/${userId}/activity`);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch user activity');
      return null;
    }
  }, []);

  const sendAdminMessage = useCallback(async (userId, subject, content, type = 'notification') => {
    try {
      setLoading(true);
      const response = await api.post(`/admin/users/${userId}/message`, {
        subject,
        content,
        type
      });
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAdminMessages = useCallback(async (userId, page = 1) => {
    try {
      const response = await api.get(`/admin/users/${userId}/messages`, {
        params: { page, limit: 20 }
      });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch messages');
      return null;
    }
  }, []);

  // ============================================
  // PHASE 5D: CONTENT MODERATION METHODS
  // ============================================

  const fetchModerationQueue = useCallback(async (filters = {}) => {
    try {
      const response = await api.get('/admin/moderation/queue', { params: filters });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch moderation queue');
      return null;
    }
  }, []);

  const fetchModerationDetails = useCallback(async (contentId) => {
    try {
      const response = await api.get(`/admin/moderation/queue/${contentId}`);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch moderation details');
      return null;
    }
  }, []);

  const approveModerationItem = useCallback(async (contentId, data = {}) => {
    try {
      setLoading(true);
      const response = await api.post(`/admin/moderation/approve/${contentId}`, data);
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to approve content';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const rejectModerationItem = useCallback(async (contentId, data = {}) => {
    try {
      setLoading(true);
      const response = await api.post(`/admin/moderation/reject/${contentId}`, data);
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to reject content';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const removeClass = useCallback(async (contentId, data = {}) => {
    try {
      setLoading(true);
      const response = await api.post(`/admin/moderation/remove-class/${contentId}`, data);
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to remove class';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const suspendClass = useCallback(async (contentId, data = {}) => {
    try {
      setLoading(true);
      const response = await api.post(`/admin/moderation/suspend-class/${contentId}`, data);
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to suspend class';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchModerationHistory = useCallback(async (filters = {}) => {
    try {
      const response = await api.get('/admin/moderation/history', { params: filters });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch moderation history');
      return null;
    }
  }, []);

  const fetchModerationStats = useCallback(async () => {
    try {
      const response = await api.get('/admin/moderation/stats');
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch moderation stats');
      return null;
    }
  }, []);

  // ============================================
  // PHASE 5E: PAYMENT & PAYOUTS METHODS
  // ============================================

  const fetchTransactions = useCallback(async (page = 1, filters = {}) => {
    try {
      const response = await api.get('/admin/payments/transactions', {
        params: { page, limit: 20, ...filters }
      });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch transactions');
      return null;
    }
  }, []);

  const fetchTransactionDetails = useCallback(async (transactionId) => {
    try {
      const response = await api.get(`/admin/payments/transactions/${transactionId}`);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch transaction details');
      return null;
    }
  }, []);

  const fetchRevenueByHost = useCallback(async () => {
    try {
      const response = await api.get('/admin/payments/revenue-by-host');
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch revenue by host');
      return null;
    }
  }, []);

  const fetchRevenueTrends = useCallback(async () => {
    try {
      const response = await api.get('/admin/payments/revenue-trends');
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch revenue trends');
      return null;
    }
  }, []);

  const fetchPaymentSummary = useCallback(async () => {
    try {
      const response = await api.get('/admin/payments/summary');
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch payment summary');
      return null;
    }
  }, []);

  const fetchCommissionSettings = useCallback(async () => {
    try {
      const response = await api.get('/admin/payments/commission-settings');
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch commission settings');
      return null;
    }
  }, []);

  const updateCommissionSettings = useCallback(async (settings) => {
    try {
      setLoading(true);
      const response = await api.put('/admin/payments/commission-settings', settings);
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to update commission settings';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const exportTransactions = useCallback(async (filters = {}) => {
    try {
      const response = await api.get('/admin/payments/export', { 
        params: filters,
        responseType: 'blob'
      });
      return response;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to export transactions');
      return null;
    }
  }, []);

  // Phase 5F: Host Management
  const fetchAllHosts = useCallback(async (page = 1, filters = {}) => {
    try {
      setLoading(true);
      const params = { page, limit: 20, ...filters };
      const response = await api.get('/admin/hosts', { params });
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to fetch hosts';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPendingHosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/hosts/pending');
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to fetch pending hosts';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHostDetails = useCallback(async (hostId) => {
    try {
      const response = await api.get(`/admin/hosts/${hostId}`);
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to fetch host details';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  const fetchHostPerformance = useCallback(async (hostId) => {
    try {
      const response = await api.get(`/admin/hosts/${hostId}/performance`);
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to fetch host performance';
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, []);

  const fetchTopPerformers = useCallback(async (limit = 20) => {
    try {
      setLoading(true);
      const response = await api.get('/admin/hosts/top-performers', { params: { limit } });
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to fetch top performers';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAtRiskHosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/hosts/at-risk');
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to fetch at-risk hosts';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const approveHost = useCallback(async (hostId, reason) => {
    try {
      setLoading(true);
      const response = await api.post(`/admin/hosts/${hostId}/approve`, { reason });
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to approve host';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const rejectHost = useCallback(async (hostId, reason) => {
    try {
      setLoading(true);
      const response = await api.post(`/admin/hosts/${hostId}/reject`, { reason });
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to reject host';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const suspendHost = useCallback(async (hostId, data) => {
    try {
      setLoading(true);
      const response = await api.post(`/admin/hosts/${hostId}/suspend`, data);
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to suspend host';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const unsuspendHost = useCallback(async (hostId, reason) => {
    try {
      setLoading(true);
      const response = await api.post(`/admin/hosts/${hostId}/unsuspend`, { reason });
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to unsuspend host';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSuspensionHistory = useCallback(async (hostId) => {
    try {
      const response = await api.get(`/admin/hosts/${hostId}/suspension-history`);
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to fetch suspension history';
      setError(errorMsg);
      return null;
    }
  }, []);

  // Phase 5G: Settings & Configuration
  const fetchCommissionSettingsPhase5G = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/settings/commission');
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to fetch commission settings';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCommissionRatePhase5G = useCallback(async (tier, rate) => {
    try {
      setLoading(true);
      const response = await api.put('/admin/settings/commission', { tier, rate });
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to update commission rate';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEmailTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/settings/email-templates');
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to fetch email templates';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateEmailTemplate = useCallback(async (templateId, { subject, body, variables }) => {
    try {
      setLoading(true);
      const response = await api.put(`/admin/settings/email-templates/${templateId}`, {
        subject,
        body,
        variables
      });
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to update email template';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFeatureFlags = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/settings/feature-flags');
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to fetch feature flags';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleFeatureFlagPhase5G = useCallback(async (featureId, enabled, rolloutPercentage = 100) => {
    try {
      setLoading(true);
      const response = await api.put(`/admin/settings/feature-flags/${featureId}`, {
        enabled,
        rolloutPercentage
      });
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to toggle feature flag';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAuditLogs = useCallback(async (page = 1, limit = 50, filters = {}) => {
    try {
      setLoading(true);
      const params = { page, limit, ...filters };
      const response = await api.get('/admin/settings/audit-logs', { params });
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to fetch audit logs';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const exportAuditLogsPhase5G = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const response = await api.post('/admin/settings/audit-logs/export', filters, {
        responseType: 'blob'
      });
      setError(null);
      
      // Trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'audit-logs.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to export audit logs';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    // State (Guarded to prevent passing down primitive reference errors)
    dashboardStats: dashboardStats || null,
    users: Array.isArray(users) ? users : [],
    adminLogs: Array.isArray(adminLogs) ? adminLogs : [],
    loading: !!loading,
    error: error || null,

    // Actions
    fetchDashboardStats,
    fetchUsers,
    getUserDetails,
    suspendUser,
    unsuspendUser,
    deleteUser,
    fetchAdminLogs,
    getAdminSettings,
    updateAdminSetting,
    
    // Analytics
    fetchUserGrowth,
    fetchRevenueTrend,
    fetchTopHosts,
    fetchTopClasses,
    fetchEngagementMetrics,
    fetchPlatformStats,

    // Phase 5C: User Management
    fetchUserActivity,
    sendAdminMessage,
    fetchAdminMessages,

    // Phase 5D: Content Moderation
    fetchModerationQueue,
    fetchModerationDetails,
    approveModerationItem,
    rejectModerationItem,
    removeClass,
    suspendClass,
    fetchModerationHistory,
    fetchModerationStats,

    // Phase 5E: Payment & Payouts
    fetchTransactions,
    fetchTransactionDetails,
    fetchRevenueByHost,
    fetchRevenueTrends,
    fetchPaymentSummary,
    updateCommissionSettings,
    exportTransactions,

    // Phase 5F: Host Management
    fetchAllHosts,
    fetchPendingHosts,
    fetchHostDetails,
    fetchHostPerformance,
    fetchTopPerformers,
    fetchAtRiskHosts,
    approveHost,
    rejectHost,
    suspendHost,
    unsuspendHost,
    fetchSuspensionHistory,

    // Phase 5G: Settings & Configuration (Safely bound references to avoid implicit resolution issues)
    fetchCommissionSettings: fetchCommissionSettingsPhase5G,
    updateCommissionRatePhase5G,
    fetchEmailTemplates,
    updateEmailTemplate,
    fetchFeatureFlags,
    toggleFeatureFlagPhase5G,
    fetchAuditLogs,
    exportAuditLogsPhase5G,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};