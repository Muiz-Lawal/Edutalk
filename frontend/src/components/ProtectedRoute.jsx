import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAdminPermissions } from '../hooks/useAdminPermissions';

export default function ProtectedRoute({
  children,
  requireHost = false,
  requireStudent = false,
  requireAdmin = false,
  requirePermission = null,
  requireSuperAdmin = false,
}) {
  const { isAuthenticated, loading, isHost, activeRole, user } = useAuth();
  const { isAdmin, hasPermission } = useAdminPermissions();
  const location = useLocation();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.isAdmin && !location.pathname.startsWith('/admin')) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (requireHost && !isHost) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireStudent && activeRole !== 'student') {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireSuperAdmin && !(user?.isSuperAdmin || user?.adminRole === 'superadmin')) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (requirePermission && !hasPermission(requirePermission)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}