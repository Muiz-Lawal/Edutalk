#!/usr/bin/env node
import mongodb from 'mongodb';
const { MongoClient } = mongodb;

async function fixAdminRole() {
  const client = new MongoClient('mongodb://localhost:27017');
  try {
    await client.connect();
    const db = client.db('edutalk');
    
    const result = await db.collection('users').updateOne(
      { email: 'testhost@edutalk.test' },
      { 
        $set: { isAdmin: true, adminRole: 'admin' },
        $unset: { role: 1 }
      }
    );
    
    const user = await db.collection('users').findOne({ email: 'testhost@edutalk.test' });
    console.log('✓ Updated to admin role');
    console.log('  isAdmin:', user?.isAdmin);
    console.log('  adminRole:', user?.adminRole);
    console.log('  isSuperAdmin:', user?.isSuperAdmin);
  } finally {
    await client.close();
  }
}

fixAdminRole().catch(e => console.error('❌', e.message));
