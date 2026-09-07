// Characters allowed in access code (30 unambiguous characters)
const ALLOWED_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // Excluding O, I, L, 0, 1

const normalizeAccessCode = (value = '') => String(value || '').trim().toUpperCase();

export const generateAccessCode = (seed = '') => {
  const baseSeed = String(seed || '').trim();
  let code = 'ET-';
  const source = baseSeed ? `${baseSeed}${Date.now()}` : `${Date.now()}${Math.random()}`;

  for (let i = 0; i < 12; i++) {
    if (i % 4 === 0 && i !== 0) {
      code += '-';
    }
    const index = Math.abs([...source].reduce((acc, char) => acc + char.charCodeAt(0), 0) + i) % ALLOWED_CHARS.length;
    code += ALLOWED_CHARS[index];
  }

  return code;
};

export const formatAccessCode = (codeWithoutPrefix) => {
  const value = normalizeAccessCode(codeWithoutPrefix).replace(/[^A-Z2-9]/g, '');
  let formatted = 'ET-';
  for (let i = 0; i < value.length; i++) {
    if (i > 0 && i % 4 === 0) {
      formatted += '-';
    }
    formatted += value[i];
  }
  return formatted;
};

export const validateAccessCode = (code) => {
  const normalized = normalizeAccessCode(code);
  const etPattern = /^ET-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/;
  const legacyPattern = /^PC-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/;
  return etPattern.test(normalized) || legacyPattern.test(normalized);
};

export const generateTrustedDeviceFingerprint = (userAgent = '', ipAddress = '') => {
  const fallbackUserAgent = userAgent || 'unknown-agent';
  const fallbackIp = ipAddress || 'unknown-ip';
  const hashSource = `${fallbackUserAgent}:${fallbackIp}`;

  let hash = 0;
  for (let i = 0; i < hashSource.length; i += 1) {
    hash = (hash * 31 + hashSource.charCodeAt(i)) >>> 0;
  }

  return `tdf-${hash.toString(16).padStart(12, '0')}`;
};

export const validateTrustedDevice = (fingerprint) => {
  if (!fingerprint) return false;
  return /^tdf-[a-f0-9]{12}$/i.test(String(fingerprint).trim());
};

export const normalizeDeviceFingerprintList = (fingerprints = []) => {
  const items = Array.isArray(fingerprints) ? fingerprints : [fingerprints].filter(Boolean);
  return items
    .map((fingerprint) => String(fingerprint).trim())
    .filter((fingerprint) => validateTrustedDevice(fingerprint));
};

export const isTrustedDeviceAllowed = ({
  trustedFingerprints = [],
  providedFingerprint,
  maxDevices = 3,
}) => {
  const normalizedTrusted = normalizeDeviceFingerprintList(trustedFingerprints);
  const normalizedProvided = String(providedFingerprint || '').trim();

  if (!normalizedProvided) return false;
  if (!validateTrustedDevice(normalizedProvided)) return false;

  return normalizedTrusted.length < maxDevices
    ? normalizedTrusted.includes(normalizedProvided) || normalizedTrusted.length < maxDevices
    : normalizedTrusted.includes(normalizedProvided);
};

export const bindAccessCodeContext = ({
  email = '',
  classId = '',
  validFrom,
  validUntil,
  deviceFingerprint,
  trustedDeviceFingerprints = [],
}) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedClassId = String(classId || '').trim();
  const basePayload = `${normalizedEmail}|${normalizedClassId}|${new Date(validFrom || Date.now()).toISOString()}|${new Date(validUntil || Date.now()).toISOString()}`;
  const code = generateAccessCode(basePayload);

  return {
    accessCode: code,
    email: normalizedEmail,
    classId: normalizedClassId,
    validFrom: validFrom ? new Date(validFrom) : new Date(),
    validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    trustedDeviceFingerprints: normalizeDeviceFingerprintList(trustedDeviceFingerprints),
    deviceFingerprint: validateTrustedDevice(deviceFingerprint) ? String(deviceFingerprint).trim() : null,
  };
};

export const validateAccessCodeContext = ({
  code,
  email,
  classId,
  now = new Date(),
  validFrom,
  validUntil,
  deviceFingerprint,
  trustedDeviceFingerprints = [],
}) => {
  if (!validateAccessCode(code)) {
    return { valid: false, reason: 'invalid_code_format' };
  }

  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedClassId = String(classId || '').trim();
  const normalizedTrusted = normalizeDeviceFingerprintList(trustedDeviceFingerprints);

  if (normalizedEmail && normalizedEmail.length > 0 && !String(code).toUpperCase().includes('ET')) {
    return { valid: false, reason: 'missing_code_prefix' };
  }

  if (validFrom && new Date(validFrom) > now) {
    return { valid: false, reason: 'code_not_active_yet' };
  }

  if (validUntil && now > new Date(validUntil)) {
    return { valid: false, reason: 'code_expired' };
  }

  if (deviceFingerprint && !validateTrustedDevice(deviceFingerprint)) {
    return { valid: false, reason: 'invalid_device_fingerprint' };
  }

  if (deviceFingerprint && normalizedTrusted.length >= 1 && !normalizedTrusted.includes(String(deviceFingerprint).trim())) {
    return { valid: false, reason: 'device_not_trusted' };
  }

  return {
    valid: true,
    email: normalizedEmail,
    classId: normalizedClassId,
    deviceFingerprint: deviceFingerprint ? String(deviceFingerprint).trim() : null,
  };
};
