import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import { hashPassword } from './utils/auth.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edutalk';

async function seed() {
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to DB');

  const users = [
    { email: 'finance@test.local', password: 'Password123!', firstName: 'Finance', lastName: 'Admin', isAdmin: true, adminRole: 'finance_admin', isSuperAdmin: false },
    { email: 'moderator@test.local', password: 'Password123!', firstName: 'Mod', lastName: 'User', isAdmin: true, adminRole: 'moderator', isSuperAdmin: false },
    { email: 'support@test.local', password: 'Password123!', firstName: 'Support', lastName: 'Agent', isAdmin: true, adminRole: 'support', isSuperAdmin: false },
    { email: 'admin@test.local', password: 'Password123!', firstName: 'General', lastName: 'Admin', isAdmin: true, adminRole: 'admin', isSuperAdmin: false },
    { email: 'super@test.local', password: 'Password123!', firstName: 'Super', lastName: 'Admin', isAdmin: true, adminRole: 'superadmin', isSuperAdmin: true },
    { email: 'student@test.local', password: 'Password123!', firstName: 'Student', lastName: 'User', isStudent: true, isAdmin: false },
    { email: 'host@test.local', password: 'Password123!', firstName: 'Host', lastName: 'User', isHost: true, dateOfBirth: '1990-01-01', isAdmin: false },
  ];

  for (const u of users) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      console.log('Skipping existing:', u.email);
      continue;
    }

    const hashed = await hashPassword(u.password);
    const user = new User({
      email: u.email,
      password: hashed,
      firstName: u.firstName,
      lastName: u.lastName,
      isAdmin: !!u.isAdmin,
      adminRole: u.adminRole || null,
      isSuperAdmin: !!u.isSuperAdmin,
      isHost: !!u.isHost,
      isStudent: !!u.isStudent,
      dateOfBirth: u.dateOfBirth,
    });

    await user.save();
    console.log('Created', u.email);
  }

  await mongoose.disconnect();
  console.log('Done');
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});