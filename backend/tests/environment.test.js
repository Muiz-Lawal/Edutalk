import { describe, expect, test } from 'vitest';
import { validateProductionEnvironment } from '../src/config/environment.js';

describe('production environment validation', () => {
  test('rejects placeholder or missing production secrets', () => {
    expect(() => validateProductionEnvironment({
      NODE_ENV: 'production',
      MONGODB_URI: 'mongodb://db/edutalk',
      JWT_SECRET: 'your_jwt_secret_key_here',
      FRONTEND_URL: 'https://edutalk.example',
      STRIPE_SECRET_KEY: 'sk_live_real',
      STRIPE_WEBHOOK_SECRET: 'whsec_real',
      RECORDING_SIGNING_SECRET: 'recording-secret-that-is-long-enough-1234',
    })).toThrow(/JWT_SECRET/);
  });

  test('accepts complete non-local production configuration', () => {
    expect(() => validateProductionEnvironment({
      NODE_ENV: 'production',
      MONGODB_URI: 'mongodb://db/edutalk',
      JWT_SECRET: 'jwt-secret-that-is-long-enough-for-production-1234',
      FRONTEND_URL: 'https://edutalk.example',
      STRIPE_SECRET_KEY: 'sk_live_real',
      STRIPE_WEBHOOK_SECRET: 'whsec_real',
      RECORDING_SIGNING_SECRET: 'recording-secret-that-is-long-enough-1234',
    })).not.toThrow();
  });
});
