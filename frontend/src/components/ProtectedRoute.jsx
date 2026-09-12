import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAdminPermissions } from '../hooks/useAdminPermissions';
import { Skeleton } from './AsyncBoundary';
import { canAccess, firstAllowedSection, sectionForPath } from '../lib/admin-rbac';
import { showToast } from '../utils/toastManager';

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
    return <Skeleton variant="block" />;
  }

  if (!isAuthenticated) {
    if (location.pathname.startsWith('/admin/')) {
      return <Navigate to="/admin/login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && location.pathname.startsWith('/admin/')) {
    const section = sectionForPath(location.pathname);
    if (!canAccess(user?.adminRole, section.key)) {
      showToast({ title: 'Access denied', message: "You don't have access to that area.", type: 'error' });
      return <Navigate to={firstAllowedSection(user?.adminRole).path} replace />;
    }
  }

  if (location.pathname.startsWith('/moderation') && !isAdmin) {
    return <div className="access-denied"><h1>403</h1><p>You don't have access to this area.</p></div>;
  }

  if ((user?.isAdmin || user?.adminRole) && !location.pathname.startsWith('/admin')) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (requireHost && (!isHost || activeRole !== 'host')) {
    return <Navigate to="/dashboard" replace />;
  }


  if (requireStudent && (!user?.isStudent || activeRole !== 'student')) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  if (requireAdmin && location.pathname.startsWith('/admin') && !(user?.isAdmin || user?.adminRole)) {
    return <Navigate to="/login" replace />;
  }

  if (requireSuperAdmin && !(user?.isSuperAdmin || user?.adminRole === 'superadmin')) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (requirePermission) {
    const permissionKeys = Array.isArray(requirePermission) ? requirePermission : [requirePermission];
    const allowedByPermission = permissionKeys.some((permission) => hasPermission(permission));
    if (!allowedByPermission) {
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  return children;
}