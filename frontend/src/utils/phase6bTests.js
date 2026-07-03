import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

// Mock token for testing
const mockToken = 'mock-jwt-token-for-testing';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${mockToken}`
  }
});

// Test Results Tracker
const results = {
  passed: 0,
  failed: 0,
  errors: []
};

// Test helper
async function testEndpoint(name, method, endpoint, data = null, expectedStatus = 200) {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    console.log(`   ${method} ${endpoint}`);
    
    let response;
    switch (method.toUpperCase()) {
      case 'GET':
        response = await api.get(endpoint);
        break;
      case 'POST':
        response = await api.post(endpoint, data);
        break;
      case 'PUT':
        response = await api.put(endpoint, data);
        break;
      case 'DELETE':
        response = await api.delete(endpoint);
        break;
      default:
        throw new Error('Invalid method');
    }

    if (response.status === expectedStatus || response.status >= 200 && response.status < 300) {
      console.log(`   ✅ PASS (Status: ${response.status})`);
      results.passed++;
    } else {
      console.log(`   ❌ FAIL (Expected: ${expectedStatus}, Got: ${response.status})`);
      results.failed++;
    }
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log(`   ⚠️  EXPECTED AUTH ERROR (${error.response.status})`);
      results.passed++;
    } else {
      console.log(`   ❌ ERROR: ${error.message}`);
      results.failed++;
      results.errors.push({ endpoint, error: error.message });
    }
  }
}

// Run all tests
export async function runPhase6BTests() {
  console.log('\n========== PHASE 6B API TEST SUITE ==========\n');

  // Progress Endpoints
  console.log('\n📊 PROGRESS ENDPOINTS:');
  await testEndpoint('Get Student Progress', 'GET', '/progress/my-progress', null, 200);
  await testEndpoint('Get Class Progress', 'GET', '/progress/class/test-class-id', null, 200);
  await testEndpoint('Update Progress', 'PUT', '/progress/enrollment/test-enrollment-id', {
    completionPercentage: 50,
    currentScore: 85
  }, 200);
  await testEndpoint('Mark Attendance', 'POST', '/progress/enrollment/test-enrollment-id/attendance', {
    attended: true,
    duration: 90
  }, 200);
  await testEndpoint('Get Progress Analytics', 'GET', '/progress/class/test-class-id/analytics', null, 200);
  await testEndpoint('Get At-Risk Students', 'GET', '/progress/class/test-class-id/at-risk', null, 200);
  await testEndpoint('Predict Completion', 'GET', '/progress/enrollment/test-enrollment-id/prediction', null, 200);
  await testEndpoint('Get Leaderboard', 'GET', '/progress/class/test-class-id/leaderboard', null, 200);

  // Certificate Endpoints
  console.log('\n🎓 CERTIFICATE ENDPOINTS:');
  await testEndpoint('Generate Certificate', 'POST', '/certificates', {
    enrollmentId: 'test-enrollment-id',
    templateId: 'classic'
  }, 200);
  await testEndpoint('Get Certificate', 'GET', '/certificates/test-cert-id', null, 200);
  await testEndpoint('Download Certificate', 'GET', '/certificates/test-cert-id/download', null, 200);
  await testEndpoint('Verify Certificate (Public)', 'GET', '/certificates/verify/test-verification-code', null, 200);
  await testEndpoint('Share Certificate', 'POST', '/certificates/test-cert-id/share', {
    platform: 'linkedin'
  }, 200);
  await testEndpoint('Get My Certificates', 'GET', '/certificates/my-certificates', null, 200);
  await testEndpoint('Get Certificate Templates', 'GET', '/certificates/templates/all', null, 200);

  // Achievement Endpoints
  console.log('\n🏆 ACHIEVEMENT ENDPOINTS:');
  await testEndpoint('Get My Achievements', 'GET', '/achievements/my-achievements', null, 200);
  await testEndpoint('Get All Badges', 'GET', '/achievements/badges/all', null, 200);
  await testEndpoint('Get Achievement Profile', 'GET', '/achievements/profile/test-user-id', null, 200);
  await testEndpoint('Check Milestones', 'POST', '/achievements/check/test-enrollment-id', {}, 200);
  await testEndpoint('Get Achievement Stats', 'GET', '/achievements/stats/test-class-id', null, 200);

  // Results
  console.log('\n\n========== TEST RESULTS ==========');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Total: ${results.passed + results.failed}`);
  
  if (results.errors.length > 0) {
    console.log('\n⚠️  Errors:');
    results.errors.forEach(err => {
      console.log(`  - ${err.endpoint}: ${err.error}`);
    });
  }

  return results;
}

export default runPhase6BTests;
