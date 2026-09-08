import { PERMISSIONS, canAccessAdminRole } from './middleware/adminAuth.js';

function assert(condition, message) {
  if (!condition) {
    console.error('ASSERTION FAILED:', message);
    process.exitCode = 1;
    throw new Error(message);
  }
}

(async function runChecks() {
  try {
    console.log('Loaded permissions keys:', Object.keys(PERMISSIONS).join(', '));

    // Check: finance_admin is allowed to view_payments
    const viewPaymentsRoles = PERMISSIONS['view_payments'] || [];
    assert(viewPaymentsRoles.includes('finance_admin'), 'finance_admin must be included in view_payments');
    console.log('OK: finance_admin is present in view_payments mapping');

    // Simulate user objects
    const financeUser = { isAdmin: true, adminRole: 'finance_admin' };
    const supportUser = { isAdmin: true, adminRole: 'support' };
    const adminUser = { isAdmin: true, adminRole: 'admin' };
    const superUser = { isAdmin: true, adminRole: 'superadmin' };

    // Check canAccessAdminRole behavior by resolving allowed roles for each permission
    const viewPaymentsAllowed = PERMISSIONS['view_payments'] || [];
    assert(canAccessAdminRole(financeUser, ...viewPaymentsAllowed) === true, 'finance_admin should be able to access view_payments');
    assert(canAccessAdminRole(supportUser, ...viewPaymentsAllowed) === false, 'support should NOT be able to access view_payments');
    assert(canAccessAdminRole(adminUser, ...viewPaymentsAllowed) === true, 'admin should be able to access view_payments');

    const exportAllowed = PERMISSIONS['export_financial_reports'] || [];
    assert(canAccessAdminRole(superUser, ...exportAllowed) === true, 'superadmin should be able to export financial reports');

    console.log('OK: permission resolution checks passed');

    // Check a high-value refund permission
    const hvRoles = PERMISSIONS['approve_high_value_refund'] || [];
    assert(hvRoles.length > 0 && hvRoles.includes('superadmin'), 'approve_high_value_refund must require superadmin');
    console.log('OK: high-value refund permission is restricted to superadmin');

    console.log('All checks passed');
    process.exit(0);
  } catch (err) {
    console.error('Permission checks encountered an error:', err.message || err);
    process.exit(1);
  }
})();
