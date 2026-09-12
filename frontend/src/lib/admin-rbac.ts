export const ADMIN_ROLES = [
  'support',
  'moderator',
  'admin',
  'finance_admin',
  'super_admin',
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_SECTIONS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/admin/dashboard', allowedRoles: ADMIN_ROLES },
  { key: 'support', label: 'Support', icon: 'Headphones', path: '/admin/support', allowedRoles: ['support', 'super_admin'] },
  { key: 'moderation', label: 'Moderation', icon: 'Shield', path: '/admin/moderation', allowedRoles: ['moderator', 'super_admin'] },
  { key: 'users', label: 'Users', icon: 'Users', path: '/admin/users', allowedRoles: ['admin', 'super_admin'] },
  { key: 'hosts', label: 'Hosts', icon: 'GraduationCap', path: '/admin/hosts', allowedRoles: ['admin', 'super_admin'] },
  { key: 'payments', label: 'Payments', icon: 'DollarSign', path: '/admin/payments', allowedRoles: ['finance_admin', 'super_admin'] },
  { key: 'analytics', label: 'Analytics', icon: 'BarChart3', path: '/admin/analytics', allowedRoles: ['super_admin'] },
  { key: 'audit-logs', label: 'Audit Logs', icon: 'ClipboardList', path: '/admin/logs', allowedRoles: ['super_admin'] },
  { key: 'email-jobs', label: 'Email Jobs', icon: 'Mail', path: '/admin/email-jobs', allowedRoles: ['super_admin'] },
  { key: 'security', label: 'Security', icon: 'ShieldCheck', path: '/admin/security/dashboard', allowedRoles: ['super_admin'] },
  { key: 'settings', label: 'Settings', icon: 'Settings', path: '/admin/settings', allowedRoles: ['super_admin'] },
  { key: 'admins', label: 'Admins', icon: 'KeyRound', path: '/admin/management', allowedRoles: ['super_admin'] },
] as const;

export const normalizeAdminRole = (role: string | null | undefined): AdminRole | null => {
  if (role === 'superadmin') return 'super_admin';
  return ADMIN_ROLES.includes(role as AdminRole) ? role as AdminRole : null;
};

export const canAccess = (role: string | null | undefined, sectionKey: string) => {
  const normalizedRole = normalizeAdminRole(role);
  if (!normalizedRole) return false;
  const section = ADMIN_SECTIONS.find(({ key }) => key === sectionKey);
  return section ? (section.allowedRoles as readonly string[]).includes(normalizedRole) : normalizedRole === 'super_admin';
};

export const firstAllowedSection = (role: string | null | undefined) =>
  ADMIN_SECTIONS.find(({ allowedRoles }) => (allowedRoles as readonly string[]).includes(normalizeAdminRole(role) || '')) || ADMIN_SECTIONS[0];

export const sectionForPath = (path: string) =>
  ADMIN_SECTIONS.find(({ path: sectionPath }) => path === sectionPath || path.startsWith(`${sectionPath}/`)) || ADMIN_SECTIONS[0];

export const roleLabel = (role: string | null | undefined) => {
  const normalized = normalizeAdminRole(role);
  if (normalized === 'super_admin') return 'Super Admin';
  if (normalized === 'finance_admin') return 'Finance Admin';
  return normalized ? normalized.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'Admin';
};
