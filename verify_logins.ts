import axios from 'axios';

const BASE_URL = 'https://cmsback.sampaarsh.cloud';
const credentials = [
  { role: 'Admin', email: 'auto.adm@test.com', url: '/admin/clinic' },
  { role: 'Receptionist', email: 'recp@test.com', url: '/queue?date=2026-03-17' },
  { role: 'Doctor', email: 'doc@test.com', url: '/doctor/queue?date=2026-03-17' },
  { role: 'Patient', email: 'auto.pat@test.com', url: '/appointments/my' }
];

async function verify() {
  console.log('--- STARTING MULTI-ROLE VERIFICATION ---');
  for (const cred of credentials) {
    try {
      console.log(`\n[${cred.role}] Logging in as ${cred.email}...`);
      const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
        email: cred.email,
        password: 'password123'
      });
      
      const token = loginRes.data.token;
      console.log(`[${cred.role}] Login successful. Token obtained.`);
      
      console.log(`[${cred.role}] Fetching ${cred.url}...`);
      const dataRes = await axios.get(`${BASE_URL}${cred.url}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`[${cred.role}] SUCCESS! Data received:`);
      const preview = JSON.stringify(dataRes.data).substring(0, 100);
      console.log(`    Preview: ${preview}...`);
    } catch (err: any) {
      console.log(`[${cred.role}] FAILED: ${err.message}`);
      if (err.response) {
        console.log(`    Status: ${err.response.status}`);
        console.log(`    Data: ${JSON.stringify(err.response.data)}`);
      }
    }
  }
}

verify();
