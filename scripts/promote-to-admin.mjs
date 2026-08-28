#!/usr/bin/env node
/**
 * Promote test host to admin role
 * Usage: node scripts/promote-to-admin.mjs
 */

import mongoose from 'mongoose';

const mongoUri = 'mongodb://localhost:27017/edutalk';

const userSchema = new mongoose.Schema({
  email: String,
  firstName: String,
  lastName: String,
  role: { type: String, default: 'student', enum: ['student', 'host', 'admin'] }
});

const User = mongoose.model('User', userSchema);

async function promoteAdmin() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    const user = await User.findOneAndUpdate(
      { email: 'testhost@edutalk.test' },
      { role: 'admin' },
      { new: true }
    );

    if (user) {
      console.log(`✓ Promoted ${user.email} to admin role`);
      console.log(`  Name: ${user.firstName} ${user.lastName}`);
      console.log(`  Role: ${user.role}`);
    } else {
      console.log('✗ Test host user not found');
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  }
}

promoteAdmin();
