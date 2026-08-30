import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import { hashPassword } from './utils/auth.js';

dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edutalk';

async function reset() {
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to DB');

  const email = 'super@test.local';
  const newPassword = process.env.SUPER_ADMIN_PASSWORD || 'Password123!';

  const user = await User.findOne({ email });
  if (!user) {
    console.error('Superadmin not found:', email);
    process.exit(1);
  }

  const hashed = await hashPassword(newPassword);
  user.password = hashed;
  user.isAdmin = true;
  user.adminRole = 'superadmin';
  user.isSuperAdmin = true;
  await user.save();

  console.log('Password reset for', email);
  await mongoose.disconnect();
}

reset().catch(err => {
  console.error(err);
  process.exit(1);
});
