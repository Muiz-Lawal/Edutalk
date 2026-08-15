const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const smtpFields = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'];
const hasSmtpConfig = smtpFields.every((key) => {
  const value = process.env[key];
  return value && value.trim() !== '';
});

const missing = [];
if (!stripeWebhookSecret || stripeWebhookSecret.trim() === '') {
  missing.push('STRIPE_WEBHOOK_SECRET');
}
if (!stripeSecretKey || stripeSecretKey.trim() === '') {
  missing.push('STRIPE_SECRET_KEY');
}
if (!hasSmtpConfig) {
  missing.push('SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM');
}

if (missing.length > 0) {
  console.error(`Missing required provider secrets for real-provider validation: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('Required Brevo SMTP + Stripe secrets are present.');
