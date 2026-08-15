const requiredSecrets = ['STRIPE_WEBHOOK_SECRET', 'SENDGRID_API_KEY'];
const missing = requiredSecrets.filter((key) => {
  const value = process.env[key];
  return !value || value.trim() === '';
});

if (missing.length > 0) {
  console.error(`Missing required provider secrets for real-provider validation: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('Required real-provider secrets are present.');
