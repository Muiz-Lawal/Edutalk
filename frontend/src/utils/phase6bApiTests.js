/**
 * Phase 6B API Testing Suite
 * Tests all progress, certificate, and achievement endpoints
 */

const API_URL = 'http://localhost:5000/api';
let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// Mock token for testing (replace with actual token)
const mockToken = localStorage.getItem('token') || 'test-token';

/**
 * Test helper function
 */
const testEndpoint = async (method, endpoint, description, body = null) => {
  try {
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json().catch(() => ({}));

    const status = response.ok ? '✓' : '✗';
    const result = {
      endpoint,
      description,
      status: response.status,
      success: response.ok,
      data
    };

    if (response.ok) {
      testResults.passed++;
      console.log(`${status} [${response.status}] ${description}`);
    } else {
      testResults.failed++;
      console.log(`${status} [${response.status}] ${description} - ${data.message || 'Error'}`);
      testResults.errors.push(`${description}: ${data.message}`);
    }

    return result;
  } catch (error) {
    testResults.failed++;
    console.error(`✗ ${description} - ${error.message}`);
    testResults.errors.push(`${description}: ${error.message}`);
    return {
      endpoint,
      description,
      success: false,
      error: error.message
    };
  }
};

/**
 * Run all API tests
 */
export const runPhase6BTests = async () => {
  console.log('\n🚀 Starting Phase 6B API Tests...\n');

  // ========== PROGRESS ENDPOINTS ==========
  console.log('📊 Testing Progress Endpoints\n');

  await testEndpoint('GET', '/progress/my-progress', 'Get student progress');
  await testEndpoint('GET', '/progress/class/64a1b2c3d4e5f6g7h8i9j0k1', 'Get class progress');
  await testEndpoint(
    'POST',
    '/progress/64a1b2c3d4e5f6g7h8i9j0k1/attendance',
    'Mark attendance',
    { attended: true, hoursAttended: 1.5 }
  );
  await testEndpoint(
    'POST',
    '/progress/64a1b2c3d4e5f6g7h8i9j0k1/score',
    'Record quiz score',
    { score: 85, quizType: 'mid-term', totalPoints: 100 }
  );
  await testEndpoint('GET', '/progress/analytics', 'Get progress analytics');
  await testEndpoint('GET', '/progress/at-risk-students', 'Get at-risk students');
  await testEndpoint('GET', '/progress/predictions/64a1b2c3d4e5f6g7h8i9j0k1', 'Get completion prediction');
  await testEndpoint('GET', '/progress/leaderboard/64a1b2c3d4e5f6g7h8i9j0k1', 'Get leaderboard');
  await testEndpoint('GET', '/progress/export', 'Export progress report');

  // ========== CERTIFICATE ENDPOINTS ==========
  console.log('\n📜 Testing Certificate Endpoints\n');

  await testEndpoint('GET', '/certificates', 'List certificates');
  await testEndpoint(
    'POST',
    '/certificates/generate',
    'Generate certificate',
    { enrollmentId: '64a1b2c3d4e5f6g7h8i9j0k1', templateId: 'classic' }
  );
  await testEndpoint('GET', '/certificates/64a1b2c3d4e5f6g7h8i9j0k1', 'Get certificate details');
  await testEndpoint('GET', '/certificates/64a1b2c3d4e5f6g7h8i9j0k1/download', 'Download certificate');
  await testEndpoint('POST', '/certificates/64a1b2c3d4e5f6g7h8i9j0k1/share', 'Share certificate', {
    email: 'friend@example.com',
    message: 'Check out my certificate!'
  });
  await testEndpoint('GET', '/certificates/public/verify/CERT-ABC123', 'Verify certificate (public)');
  await testEndpoint('GET', '/certificates/templates', 'Get certificate templates');
  await testEndpoint('GET', '/certificates/analytics', 'Get certificate analytics');
  await testEndpoint('GET', '/certificates/export', 'Export certificates');

  // ========== ACHIEVEMENT ENDPOINTS ==========
  console.log('\n🏆 Testing Achievement Endpoints\n');

  await testEndpoint(
    'POST',
    '/achievements/grant',
    'Grant achievement',
    { userId: '64a1b2c3d4e5f6g7h8i9j0k1', type: 'first_session' }
  );
  await testEndpoint('GET', '/achievements', 'Get my achievements');
  await testEndpoint('GET', '/achievements/64a1b2c3d4e5f6g7h8i9j0k1', 'Get user achievements');
  await testEndpoint('GET', '/achievements/leaderboard', 'Get achievement leaderboard');
  await testEndpoint('GET', '/achievements/milestones', 'Check achievement milestones');
  await testEndpoint('GET', '/achievements/badges', 'Get all available badges');
  await testEndpoint('GET', '/achievements/stats', 'Get achievement statistics');
  await testEndpoint('GET', '/achievements/profile', 'Get achievement profile');
  await testEndpoint('GET', '/achievements/export', 'Export achievements');

  // ========== SUMMARY ==========
  console.log('\n' + '='.repeat(50));
  console.log(`\n✓ Passed: ${testResults.passed}`);
  console.log(`✗ Failed: ${testResults.failed}`);
  console.log(`Total: ${testResults.passed + testResults.failed}\n`);

  if (testResults.errors.length > 0) {
    console.log('Errors:');
    testResults.errors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err}`);
    });
  }

  return testResults;
};

export default {
  runPhase6BTests,
  testEndpoint
};
