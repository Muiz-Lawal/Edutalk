import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API = process.env.API_URL || `http://localhost:${process.env.PORT || 5001}/api`;
const TOKEN = process.env.TEST_TOKEN || '';
const STUDENT_ID = process.env.TEST_STUDENT_ID || '';
const CLASS_ID = process.env.TEST_CLASS_ID || '';
const ENROLLMENT_ID = process.env.TEST_ENROLLMENT_ID || '';

const headers = TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {};

async function run() {
  try {
    if (ENROLLMENT_ID) {
      console.log('Triggering check for enrollment', ENROLLMENT_ID);
      const r = await axios.post(`${API}/achievements/check/${ENROLLMENT_ID}`, null, { headers });
      console.log('Check result:', r.data);
    } else if (STUDENT_ID && CLASS_ID) {
      console.log('Granting achievement to', STUDENT_ID);
      const r = await axios.post(`${API}/achievements`, { studentId: STUDENT_ID, classId: CLASS_ID, type: 'first_session' }, { headers });
      console.log('Grant result:', r.data);
    } else {
      console.warn('No TEST_STUDENT_ID/TEST_CLASS_ID/TEST_ENROLLMENT_ID set. Exiting.');
      return;
    }

    // wait
    await new Promise((res) => setTimeout(res, 2000));

    const notes = await axios.get(`${API}/notifications`, { headers });
    console.log('Notifications:', notes.data);

    const bal = STUDENT_ID ? await axios.get(`${API}/points/balance/${STUDENT_ID}`, { headers }) : await axios.get(`${API}/points/balance/`, { headers });
    console.log('Balance:', bal.data);

    const hist = STUDENT_ID ? await axios.get(`${API}/points/history/${STUDENT_ID}`, { headers }) : await axios.get(`${API}/points/history/`, { headers });
    console.log('History:', hist.data);

    console.log('Integration test finished');
  } catch (err) {
    console.error('Integration test failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

run();
