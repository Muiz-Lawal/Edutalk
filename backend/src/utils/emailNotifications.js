import nodemailer from 'nodemailer';

// Initialize email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'noreply@edutalk.com',
    pass: process.env.EMAIL_PASSWORD || '',
  },
});

// Send 2FA setup email
export const send2FASetupEmail = async (email, backupCodes) => {
  const mailOptions = {
    from: 'noreply@edutalk.com',
    to: email,
    subject: '🔐 Two-Factor Authentication Enabled - EduTalk',
    html: `
      <h2>Two-Factor Authentication Enabled</h2>
      <p>Your account now has 2FA enabled for enhanced security.</p>
      <h3>Backup Codes</h3>
      <p>Save these codes in a safe place. Use them if you lose access to your authenticator app:</p>
      <pre>${backupCodes.join('\n')}</pre>
      <p><strong>⚠️ Never share these codes with anyone!</strong></p>
    `,
  };

  return transporter.sendMail(mailOptions);
};

// Send suspicious activity alert
export const sendSuspiciousActivityEmail = async (email, details) => {
  const { action, location, timestamp, ipAddress } = details;

  const mailOptions = {
    from: 'noreply@edutalk.com',
    to: email,
    subject: '⚠️ Suspicious Activity Detected - EduTalk',
    html: `
      <h2>Suspicious Activity Alert</h2>
      <p>We detected unusual activity on your admin account.</p>
      <ul>
        <li><strong>Action:</strong> ${action}</li>
        <li><strong>Time:</strong> ${timestamp}</li>
        <li><strong>IP Address:</strong> ${ipAddress}</li>
        <li><strong>Location:</strong> ${location || 'Unknown'}</li>
      </ul>
      <p>If this wasn't you, please <strong>change your password immediately</strong> and contact support.</p>
      <a href="https://edutalk.com/admin/change-password">Change Password</a>
    `,
  };

  return transporter.sendMail(mailOptions);
};

// Send failed login attempts alert
export const sendFailedLoginEmail = async (email, attemptCount, ipAddress) => {
  const mailOptions = {
    from: 'noreply@edutalk.com',
    to: email,
    subject: `❌ ${attemptCount} Failed Login Attempts - EduTalk`,
    html: `
      <h2>Failed Login Attempts</h2>
      <p>There were ${attemptCount} failed login attempts on your account.</p>
      <ul>
        <li><strong>IP Address:</strong> ${ipAddress}</li>
        <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
      </ul>
      <p>If this was you, you can safely ignore this message.</p>
      <p>If this wasn't you, please secure your account immediately.</p>
      <a href="https://edutalk.com/admin/change-password">Change Password</a>
    `,
  };

  return transporter.sendMail(mailOptions);
};

// Send new admin created notification
export const sendAdminCreatedEmail = async (email, credentials) => {
  const { password, role, createdBy } = credentials;

  const mailOptions = {
    from: 'noreply@edutalk.com',
    to: email,
    subject: '✅ Your Admin Account Has Been Created - EduTalk',
    html: `
      <h2>Welcome to EduTalk Admin</h2>
      <p>Your admin account has been created by ${createdBy}.</p>
      <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> ${password}</p>
        <p><strong>Role:</strong> ${role}</p>
      </div>
      <p><strong>⚠️ Change your password immediately after first login!</strong></p>
      <a href="https://edutalk.com/admin/login">Login to Admin Panel</a>
    `,
  };

  return transporter.sendMail(mailOptions);
};

// Send password change notification
export const sendPasswordChangedEmail = async (email) => {
  const mailOptions = {
    from: 'noreply@edutalk.com',
    to: email,
    subject: '🔐 Password Changed Successfully - EduTalk',
    html: `
      <h2>Password Changed</h2>
      <p>Your admin account password was changed successfully.</p>
      <p>If you didn't make this change, please contact support immediately.</p>
      <a href="https://edutalk.com/admin/security">Account Security</a>
    `,
  };

  return transporter.sendMail(mailOptions);
};

// Send inactivity warning
export const sendInactivityWarningEmail = async (email) => {
  const mailOptions = {
    from: 'noreply@edutalk.com',
    to: email,
    subject: '⏰ Inactivity Warning - EduTalk Admin',
    html: `
      <h2>Inactivity Notice</h2>
      <p>Your admin session will be logged out in 5 minutes due to inactivity.</p>
      <p>Click the link below to continue your session:</p>
      <a href="https://edutalk.com/admin/dashboard">Continue Session</a>
    `,
  };

  return transporter.sendMail(mailOptions);
};

// Send SuperAdmin approval request
export const sendSuperAdminApprovalEmail = async (email, applicantEmail, reason) => {
  const mailOptions = {
    from: 'noreply@edutalk.com',
    to: email,
    subject: '🔑 SuperAdmin Account Creation Approval Needed - EduTalk',
    html: `
      <h2>SuperAdmin Account Approval Required</h2>
      <p>A new SuperAdmin account has been requested and needs your approval.</p>
      <ul>
        <li><strong>Applicant Email:</strong> ${applicantEmail}</li>
        <li><strong>Reason:</strong> ${reason}</li>
      </ul>
      <a href="https://edutalk.com/admin/approvals">Review Request</a>
    `,
  };

  return transporter.sendMail(mailOptions);
};
