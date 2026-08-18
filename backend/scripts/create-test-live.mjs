import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import ClassModel from '../src/models/Class.js';
import LiveStream from '../src/models/LiveStream.js';

async function main(){
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  // Create test user
  const user = new User({
    email: `test-host-${Date.now()}@example.com`,
    password: 'password123',
    firstName: 'Test',
    lastName: 'Host',
    isHost: true,
    hostVerified: true,
  });
  await user.save();
  console.log('Created user:', user._id);

  // Create class
  const classDoc = new ClassModel({
    title: 'Test Class for Live',
    description: 'Auto-created test class',
    hostId: user._id,
    monthlyPrice: 10,
  });
  await classDoc.save();
  console.log('Created class:', classDoc._id);

  // Create live stream
  const liveStream = new LiveStream({
    classId: classDoc._id,
    hostId: user._id,
    title: 'Test Live Stream',
    description: 'Stream created for local integration test',
    status: 'live',
    streamKey: `test-${Date.now()}`,
    playbackUrl: `http://localhost:5001/test-playback/${Date.now()}/manifest.m3u8`,
    startedAt: new Date(),
  });
  await liveStream.save();
  console.log('Created liveStream:', liveStream._id);

  await mongoose.disconnect();
  console.log('Done');
  console.log(JSON.stringify({ userId: user._id, classId: classDoc._id, liveStreamId: liveStream._id }));
}

main().catch(err=>{
  console.error(err);
  process.exit(1);
});

