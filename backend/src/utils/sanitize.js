// Utility helpers to sanitize model objects before returning in API responses

export function sanitizeUserForRequester(user, requesterRole = null) {
  if (!user) return null;
  // Accept either a Mongoose document or plain object
  const u = user.toObject ? user.toObject() : { ...user };

  // Always remove sensitive internal fields
  delete u.password;
  delete u.__v;

  // Fields that should not be exposed to anyone except the user themselves or superadmin
  const minimal = {
    id: u._id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    isHost: u.isHost,
    isStudent: u.isStudent,
    planTier: u.planTier,
    createdAt: u.createdAt,
  };

  // If requester is a finance admin, return minimal financial-oriented view
  if (requesterRole === 'finance_admin') {
    return minimal;
  }

  // Default: return a safe view for normal consumers (exclude tokens, stripe ids)
  const safe = {
    ...minimal,
    bio: u.bio,
    profileImage: u.profileImage,
    interests: u.interests || [],
    phoneVerified: Boolean(u.phoneVerified),
    theme: u.theme || 'system',
    timezone: u.timezone,
    preferredLanguage: u.preferredLanguage,
    preferredCurrency: u.preferredCurrency,
    adminRole: u.adminRole,
    isAdmin: u.isAdmin,
    isSuperAdmin: u.isSuperAdmin,
    dateOfBirth: u.dateOfBirth ? u.dateOfBirth : undefined,
  };

  return safe;
}
