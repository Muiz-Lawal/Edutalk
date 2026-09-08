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

  if (u.isHost) {
    safe.hostBio = u.hostBio;
    safe.hostDisplayName = u.hostDisplayName;
    safe.hostHeadline = u.hostHeadline;
    safe.hostExperience = u.hostExperience;
    safe.hostLanguages = u.hostLanguages || [];
    safe.hostCategories = u.hostCategories || [];
    safe.hostCredentials = u.hostCredentials || [];
    safe.payoutCountry = u.payoutCountry;
    safe.payoutMethod = u.payoutMethod;
    safe.payoutMethods = u.payoutMethods || [];
    safe.payoutDeferred = Boolean(u.payoutDeferred);
    safe.hostCommissionAccepted = Boolean(u.hostCommissionAccepted);
    safe.hostVerified = Boolean(u.hostVerified);
    safe.totalActiveStudents = u.totalActiveStudents || 0;
    safe.averageRating = u.averageRating || 0;
    safe.freeAdmissionSlots = u.freeAdmissionSlots || 0;
  }

  return safe;
}
