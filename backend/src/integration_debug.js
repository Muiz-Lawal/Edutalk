import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();
const API = process.env.API_URL || `http://localhost:${process.env.PORT || 5001}/api`;

(async ()=>{
  try{
    const res = await axios.post(`${API}/auth/admin/login`, { email: 'finance@test.local', password: 'Password123!' });
    console.log('loginRes.data keys:', Object.keys(res.data));
    console.log('loginRes.data.user:', res.data.user);
    console.log('loginRes.data.token exists:', !!res.data.token);
    // decode token (if present)
    if (res.data.token) {
      try{
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.decode(res.data.token);
        console.log('decoded token:', decoded);
      } catch(e) { console.error('jwt decode failed', e.message); }
    }
  } catch(err){
    console.error('login failed:', err.response?.data || err.message);
  }
})();
