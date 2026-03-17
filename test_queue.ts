import axios from 'axios';

async function test() {
  try {
    const loginRes = await axios.post('https://cmsback.sampaarsh.cloud/auth/login', {
      email: 'doc@test.com',
      password: 'password123'
    });
    const token = loginRes.data.token;
    
    const qRes = await axios.get('https://cmsback.sampaarsh.cloud/doctor/queue?date=2026-03-17', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('DATA_START');
    console.log(JSON.stringify(qRes.data, null, 2));
    console.log('DATA_END');
  } catch (err: any) {
    console.log('ERROR:', err.response?.data?.message || err.message);
  }
}
test();
