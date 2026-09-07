import crypto from 'crypto';
import VerificationCode from '../models/VerificationCode.js';

export const CODE_PURPOSES = {
  EMAIL_VERIFICATION: 'email_verification',
  PASSWORD_RESET: 'password_reset',
};

const settings = {
  email_verification: { ttlMs: 10 * 60 * 1000, maxAttempts: 5 },
  password_reset: { ttlMs: 15 * 60 * 1000, maxAttempts: 5 },
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const hashCode = (code) => crypto.createHash('sha256').update(code).digest('hex');

export const issueVerificationCode = async ({ email, purpose }) => {
  const normalizedEmail = normalizeEmail(email);
  const config = settings[purpose];
  if (!normalizedEmail || !config) throw new Error('Invalid verification code request');

  const since = new Date(Date.now() - 10 * 60 * 1000);
  const sentCount = await VerificationCode.countDocuments({
    email: normalizedEmail,
    purpose,
    createdAt: { $gte: since },
  });
  if (sentCount >= 3) {
    const error = new Error('Verification code rate limit reached');
    error.code = 'RATE_LIMITED';
    throw error;
  }

  await VerificationCode.updateMany(
    { email: normalizedEmail, purpose, consumedAt: null },
    { $set: { consumedAt: new Date() } },
  );

  const code = String(crypto.randomInt(100000, 1000000));
  const record = await VerificationCode.create({
    email: normalizedEmail,
    codeHash: hashCode(code),
    purpose,
    expiresAt: new Date(Date.now() + config.ttlMs),
  });
  return { record, code, expiresInMinutes: config.ttlMs / 60000 };
};

export const consumeVerificationCode = async ({ email, code, purpose }) => {
  const normalizedEmail = normalizeEmail(email);
  const record = await VerificationCode.findOne({
    email: normalizedEmail,
    purpose,
    consumedAt: null,
  }).sort({ createdAt: -1 });

  if (!record) return { status: 'invalid_code' };
  if (record.expiresAt.getTime() <= Date.now()) return { status: 'expired_code' };
  if (record.attempts >= settings[purpose].maxAttempts) return { status: 'too_many_attempts' };

  const actual = Buffer.from(hashCode(String(code || '')), 'hex');
  const expected = Buffer.from(record.codeHash, 'hex');
  const matches = actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  if (!matches) {
    record.attempts += 1;
    if (record.attempts >= settings[purpose].maxAttempts) record.consumedAt = new Date();
    await record.save();
    return { status: record.attempts >= settings[purpose].maxAttempts ? 'too_many_attempts' : 'invalid_code' };
  }

  record.consumedAt = new Date();
  await record.save();
  return { status: 'valid', record };
};
