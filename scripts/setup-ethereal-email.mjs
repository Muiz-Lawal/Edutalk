#!/usr/bin/env node
/**
 * Configure Ethereal test email account for development
 * Ethereal provides free temporary test email accounts for nodemailer
 */

import nodemailer from 'nodemailer';

async function setupEtherealEmail() {
  try {
    console.log('ℹ️  Setting up Ethereal test email account...\n');

    // Create test account with Ethereal (free service for testing)
    const testAccount = await nodemailer.createTestAccount();

    console.log('✅ Test email account created!\n');
    console.log('📧 Email Configuration:');
    console.log(`  Host: smtp.ethereal.email`);
    console.log(`  Port: 587`);
    console.log(`  Secure: false`);
    console.log(`  User: ${testAccount.user}`);
    console.log(`  Pass: ${testAccount.pass}\n`);

    console.log('🔗 Test Account URL:');
    console.log(`  https://ethereal.email/messages\n`);

    console.log('📝 Add these to your backend .env file:\n');
    console.log(`EMAIL_HOST=smtp.ethereal.email`);
    console.log(`EMAIL_PORT=587`);
    console.log(`EMAIL_SECURE=false`);
    console.log(`EMAIL_USER=${testAccount.user}`);
    console.log(`EMAIL_PASS=${testAccount.pass}`);
    console.log(`EMAIL_FROM_NAME=EduTalk`);
    console.log(`EMAIL_FROM_ADDRESS=${testAccount.user}\n`);

    // Test send
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    console.log('🧪 Sending test email...');
    const info = await transporter.sendMail({
      from: `EduTalk <${testAccount.user}>`,
      to: testAccount.user,
      subject: 'EduTalk Email Test ✓',
      text: 'If you can read this, email is configured correctly!',
      html: '<b>If you can read this, email is configured correctly!</b>',
    });

    console.log(`✅ Test email sent successfully!`);
    console.log(`📧 Preview URL: ${nodemailer.getTestMessageUrl(info)}\n`);

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

setupEtherealEmail();
