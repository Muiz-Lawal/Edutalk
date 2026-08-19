import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Subscription from '../..//backend/src/models/Subscription.js';
import User from '../..//backend/src/models/User.js';
import fs from 'fs';

dotenv.config({ path: '../../backend/.env' });

async function run(email, classId) {
  if (!email || !classId) {
    console.error('Usage: node smoke/create-subscription-direct.mjs <studentEmail> <classId>');
    process.exit(2);
  }

  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edutalk';
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const user = await (await import('../../backend/src/models/User.js')).default.findOne({ email });
  if (!user) {
    console.error('User not found:', email);
    process.exit(2);
  }

  const SubscriptionModel = (await import('../../backend/src/models/Subscription.js')).default;

  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + 1 * 24 * 60 * 60 * 1000);

  const sub = new SubscriptionModel({
    userId: user._id,
    classId,
    accessCode: `SMOKE-${Date.now()}`,
    numberOfDays: 1,
    startDate,
    endDate,
    status: 'active',
    totalDaysPurchased: 1,
    totalAmountPaid: 0,
  });

  await sub.save();
  console.log('Created subscription', sub._id.toString());
  await mongoose.disconnect();
}

const [,, email, classId] = process.argv;
run(email, classId).catch(err=>{ console.error(err); process.exit(3); });
