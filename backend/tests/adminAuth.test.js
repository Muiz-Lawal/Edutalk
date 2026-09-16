import jwt from 'jsonwebtoken';
import { describe, expect, test } from 'vitest';
import { hasVerifiedAdminTwoFactor } from '../src/middleware/adminAuth.js';

const secret = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
const user = { _id: '507f1f77bcf86cd799439011' };

describe('admin two-factor request proof', () => {
  test('accepts only a matching short-lived admin 2FA token', () => {
    const token = jwt.sign(
      { userId: user._id, purpose: 'admin-2fa' },
      `${secret}:admin-2fa`,
      { expiresIn: '10m' },
    );

    expect(hasVerifiedAdminTwoFactor({
      headers: { 'x-admin-2fa-token': token },
    }, user)).toBe(true);
  });

  test('rejects body-style bypasses and tokens for another purpose or user', () => {
    const wrongPurpose = jwt.sign(
      { userId: user._id, purpose: 'session' },
      `${secret}:admin-2fa`,
      { expiresIn: '10m' },
    );
    const wrongUser = jwt.sign(
      { userId: '507f1f77bcf86cd799439012', purpose: 'admin-2fa' },
      `${secret}:admin-2fa`,
      { expiresIn: '10m' },
    );

    expect(hasVerifiedAdminTwoFactor({
      body: { verifying2FA: true },
      headers: {},
    }, user)).toBe(false);
    expect(hasVerifiedAdminTwoFactor({
      headers: { 'x-admin-2fa-token': wrongPurpose },
    }, user)).toBe(false);
    expect(hasVerifiedAdminTwoFactor({
      headers: { 'x-admin-2fa-token': wrongUser },
    }, user)).toBe(false);
  });
});
