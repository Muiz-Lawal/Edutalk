import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API = process.env.API_URL || `http://localhost:${process.env.PORT || 5001}/api`;

async function run() {
  try {
    console.log('Integration run against API:', API);

    // Admin login (seeded account)
    const loginRes = await axios.post(`${API}/auth/admin/login`, {
      email: 'finance@test.local',
      password: 'Password123!'
    }, { timeout: 10000 });

    const token = loginRes.data.token;
    if (!token) {
      console.error('No token received from admin login:', loginRes.data);
      process.exit(1);
    }

    console.log('Received admin token length:', token.length);

    const headers = { Authorization: `Bearer ${token}` };

    // Call admin users endpoint
    const usersRes = await axios.get(`${API}/admin/users`, { headers, timeout: 10000 });
    console.log('/admin/users response status:', usersRes.status);
    console.log('Sample user:', usersRes.data.users?.[0] || 'no users');

    // Basic assertion: finance_admin view should NOT include email in user listing (minimal view)
    if (Array.isArray(usersRes.data.users) && usersRes.data.users.length > 0) {
      const u = usersRes.data.users[0];
      if (u.email) {
        console.error('TEST FAILED: finance_admin payload exposed email for user:', u);
        process.exit(2);
      }
    } else {
      console.warn('No users returned to validate');
    }

    // Call admin logs endpoint (may be empty)
    const logsRes = await axios.get(`${API}/admin/logs`, { headers, timeout: 10000 });
    console.log('/admin/logs response status:', logsRes.status);
    console.log('Sample log:', logsRes.data.logs?.[0] || 'no logs');

    console.log('Integration checks passed');
    process.exit(0);
  } catch (err) {
    console.error('Integration run failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

run();