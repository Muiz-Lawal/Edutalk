import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();
const API = process.env.API_URL || `http://localhost:${process.env.PORT || 5001}/api`;

(async ()=>{
  try{
    const res = await axios.post(`${API}/auth/admin/login`, { email: 'finance@test.local', password: 'Password123!' });
    const token = res.data.token;
    console.log('token len', token && token.length);
    const headers = { Authorization: `Bearer ${token}` };
    const profile = await axios.get(`${API}/auth/profile`, { headers });
    console.log('/auth/profile result:', profile.data);
  } catch(e){
    console.error('error', e.response?.data || e.message);
  }
})();
