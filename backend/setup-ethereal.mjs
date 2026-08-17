import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

async function setupEthereralEmail() {
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

    // Update .env file
    const envPath = path.join(process.cwd(), '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');

    envContent = envContent.replace(/SMTP_USER=.*/g, `SMTP_USER=${testAccount.user}`);
    envContent = envContent.replace(/SMTP_PASS=.*/g, `SMTP_PASS=${testAccount.pass}`);

    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file updated with Ethereal credentials\n');

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

setupEthereralEmail();
