import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';

// Generate 2FA secret
export const generate2FASecret = async (email) => {
  const secret = speakeasy.generateSecret({
    name: `EduTalk Admin (${email})`,
    length: 32,
  });

  return {
    secret: secret.base32,
    qrCode: await QRCode.toDataURL(secret.otpauth_url),
  };
};

// Verify 2FA token
export const verify2FAToken = (secret, token) => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time windows (±30 seconds)
  });
};

// Generate backup codes
export const generateBackupCodes = () => {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return codes;
};

// Verify backup code
export const verifyBackupCode = (backupCodes, code) => {
  return backupCodes.includes(code.toUpperCase());
};

// Remove used backup code
export const removeBackupCode = (backupCodes, code) => {
  return backupCodes.filter(c => c !== code.toUpperCase());
};
