#!/usr/bin/env node

/**
 * Phase 6B Integration Test Suite
 * Tests Progress, Certificates, Leaderboards, and Achievements
 */

const baseURL = 'http://localhost:5001/api';
let authToken = null;

// Test student IDs and class IDs (from fixtures)
const testData = {
  student1Email: 'student1@test.com',
  student1Password: 'password123',
  student2Email: 'student2@test.com',
  hostEmail: 'host1@test.com',
  hostPassword: 'password123',
};

/**
 * Make HTTP request helper
 */
async function request(method, path, body = null, headers = {}) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (authToken) {
    options.headers.Authorization = `Bearer ${authToken}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${baseURL}${path}`, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Test Cases
 */
const tests = [
  {
    name: 'Phase 6B - Progress API',
    tests: [
      {
        name: 'GET /api/progress/my-progress',
        fn: async () => {
          const { status, data } = await request('GET', '/progress/my-progress');
          if (status === 200 && data.success) {
            const progress = data.data?.[0];
            if (
              progress &&
              progress.enrollmentId &&
              progress.completionPercentage !== undefined &&
              progress.className
            ) {
              return { pass: true, message: 'Progress data returned correctly' };
            }
          }
          return { pass: false, message: `Expected 200 with progress array, got ${status}` };
        },
      },
      {
        name: 'GET /api/progress/class/:classId/analytics',
        fn: async () => {
          // Would need real classId - skip for now
          return { skip: true, message: 'Requires valid classId' };
        },
      },
    ],
  },
  {
    name: 'Phase 6B - Certificate API',
    tests: [
      {
        name: 'GET /api/certificates/my-certificates',
        fn: async () => {
          const { status, data } = await request('GET', '/certificates/my-certificates');
          if (status === 200 && data.success) {
            return { pass: true, message: 'Certificates endpoint working' };
          }
          return { pass: false, message: `Expected 200, got ${status}` };
        },
      },
      {
        name: 'GET /api/certificates/templates/all',
        fn: async () => {
          const { status, data } = await request('GET', '/certificates/templates/all');
          if (status === 200 && Array.isArray(data.data)) {
            return { pass: true, message: 'Certificate templates returned' };
          }
          return { pass: false, message: 'Failed to get certificate templates' };
        },
      },
    ],
  },
  {
    name: 'Phase 6B - Leaderboard API',
    tests: [
      {
        name: 'GET /api/achievements/leaderboard/:classId',
        fn: async () => {
          return { skip: true, message: 'Requires valid classId' };
        },
      },
      {
        name: 'GET /api/achievements/my-achievements',
        fn: async () => {
          const { status, data } = await request('GET', '/achievements/my-achievements');
          if (status === 200) {
            return { pass: true, message: 'Achievements endpoint working' };
          }
          return { pass: false, message: `Expected 200, got ${status}` };
        },
      },
    ],
  },
];

/**
 * Run tests
 */
async function runTests() {
  console.log('🧪 Phase 6B Integration Test Suite\n');

  // Try to login first
  console.log('📝 Authenticating...');
  const loginRes = await request('POST', '/auth/login', {
    email: testData.student1Email,
    password: testData.student1Password,
  });

  if (loginRes.data?.token) {
    authToken = loginRes.data.token;
    console.log('✅ Login successful\n');
  } else {
    console.log('⚠️  Login failed - tests may fail\n');
  }

  // Run test suites
  for (const suite of tests) {
    console.log(`\n📋 ${suite.name}`);
    console.log('─'.repeat(50));

    for (const test of suite.tests) {
      const result = await test.fn();
      if (result.skip) {
        console.log(`⏭️  SKIP: ${test.name}`);
        console.log(`   ${result.message}\n`);
      } else if (result.pass) {
        console.log(`✅ PASS: ${test.name}`);
        console.log(`   ${result.message}\n`);
      } else {
        console.log(`❌ FAIL: ${test.name}`);
        console.log(`   ${result.message}\n`);
      }
    }
  }

  console.log('\n' + '═'.repeat(50));
  console.log('Test suite complete!');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { runTests };
