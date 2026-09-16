const PLACEHOLDER_VALUES = new Set([
  'your_super_secret_jwt_key_here_use_strong_random_32_chars_minimum',
  'your_jwt_secret_key_here',
  'sk_test_example',
  'sk_test_YOUR_TEST_SECRET_KEY_HERE',
  'whsec_YOUR_WEBHOOK_SECRET_HERE',
]);

export function validateProductionEnvironment(env = process.env) {
  if (env.NODE_ENV !== 'production') return;

  const required = ['MONGODB_URI', 'JWT_SECRET', 'FRONTEND_URL', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'RECORDING_SIGNING_SECRET'];
  const missing = required.filter((key) => !env[key] || PLACEHOLDER_VALUES.has(env[key]));
  if (missing.length) {
    throw new Error(`Missing production environment configuration: ${missing.join(', ')}`);
  }

  if (env.FRONTEND_URL.includes('localhost') || env.FRONTEND_URL.includes('127.0.0.1')) {
    throw new Error('FRONTEND_URL must not point to localhost in production');
  }

  if (env.JWT_SECRET.length < 32 || env.RECORDING_SIGNING_SECRET.length < 32) {
    throw new Error('JWT_SECRET and RECORDING_SIGNING_SECRET must be at least 32 characters in production');
  }
}
