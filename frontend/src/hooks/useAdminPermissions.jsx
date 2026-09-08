import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

// Mirror of backend PERMISSIONS and role hierarchy for client-side gating
const ADMIN_ROLE_HIERARCHY = {
  support: ['support'],
  moderator: ['moderator'],
  admin: ['admin'],
  finance_admin: ['finance_admin'],
  superadmin: ['support', 'moderator', 'admin', 'finance_admin', 'superadmin'],
};

const PERMISSIONS = {
  view_support_dashboard: ['support', 'admin', 'superadmin'],
  view_user_profiles: ['support', 'admin', 'superadmin'],
  view_user_profiles_readonly: ['support', 'admin', 'superadmin'],
  respond_support_ticket: ['support', 'admin', 'superadmin'],
  process_limited_refund: ['support', 'admin', 'superadmin'],
  issue_goodwill_credits: ['support', 'admin', 'superadmin'],

  manage_users: ['admin', 'superadmin'],
  manage_hosts: ['admin', 'superadmin'],
  approve_host_verification: ['admin', 'superadmin'],
  suspend_user: ['admin', 'superadmin'],
  ban_user: ['admin', 'superadmin'],

  view_payments: ['admin', 'finance_admin', 'superadmin'],
  export_financial_reports: ['admin', 'finance_admin', 'superadmin'],
  process_refund: ['admin', 'finance_admin', 'superadmin'],
  approve_high_value_refund: ['superadmin'],
  change_commission: ['superadmin'],

  moderate_content: ['moderator', 'admin', 'superadmin'],
  hide_class: ['moderator', 'admin', 'superadmin'],
  review_content_reports: ['moderator', 'admin', 'superadmin'],

  view_audit_logs: ['admin', 'finance_admin', 'superadmin'],
  export_audit_logs: ['superadmin'],
  manage_admins: ['superadmin'],
  view_security_alerts: ['admin', 'superadmin'],
};

export function useAdminPermissions() {
  const { user } = useAuth();

  const adminRole = user?.adminRole || null;
  const isAdmin = Boolean(user?.isAdmin || user?.adminRole);

  const hasAdminRole = (role) => {
    if (!isAdmin || !adminRole) return false;
    if (adminRole === 'superadmin') return true;
    const allowed = ADMIN_ROLE_HIERARCHY[adminRole] || [];
    return allowed.includes(role);
  };

  const hasPermission = (permKey) => {
    if (!isAdmin || !adminRole) return false;
    if (adminRole === 'superadmin') return true;
    const allowedRoles = PERMISSIONS[permKey] || [];
    const allowed = ADMIN_ROLE_HIERARCHY[adminRole] || [];
    return allowedRoles.some((r) => allowed.includes(r));
  };

  const value = useMemo(() => ({
    isAdmin,
    adminRole,
    hasAdminRole,
    hasPermission,
  }), [isAdmin, adminRole]);

  return value;
}
