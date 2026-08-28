import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Subscription from '../src/models/Subscription.js';
import User from '../src/models/User.js';

dotenv.config();

async function run(email, classId) {
  if (!email || !classId) {
    console.error('Usage: node tools/create-subscription-direct.mjs <studentEmail> <classId>');
    process.exit(2);
  }

  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edutalk';
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  // If identifier looks like a MongoDB ObjectId, find by _id; else treat as email
  let user;
  if (/^[a-f0-9]{24}$/i.test(email)) {
    user = await User.findById(email);
  } else {
    user = await User.findOne({ email });
  }
  if (!user) {
    console.error('User not found:', email);
    process.exit(2);
  }

  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + 1 * 24 * 60 * 60 * 1000);

  const sub = new Subscription({
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

const [,, identifier, classId] = process.argv;
// identifier can be email or ObjectId
run(identifier, classId).catch(err=>{ console.error(err); process.exit(3); });
