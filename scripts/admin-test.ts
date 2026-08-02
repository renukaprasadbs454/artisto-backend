import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API = process.env.VITE_API_URL || process.env.API_URL || 'http://localhost:4000/api/v1';

async function main() {
  try {
    console.log('Logging in as admin...');
    const loginRes = await axios.post(`${API}/auth/login`, { email: 'admin@kwiko.com', password: 'Admin@kwiko123' }, { headers: { 'Content-Type': 'application/json' } });
    const accessToken = loginRes.data?.data?.accessToken || loginRes.data?.accessToken;
    if (!accessToken) {
      console.error('No access token received:', loginRes.data);
      process.exit(1);
    }
    console.log('Got access token. Fetching user table...');

    const usersRes = await axios.get(`${API}/admin/tables/users`, { headers: { Authorization: `Bearer ${accessToken}` } });
    const users = usersRes.data?.data || usersRes.data;
    console.log(`Found ${users.length} users (showing up to 10):`);
    console.log(users.slice(0, 10));

    console.log('\nTo perform actions (suspend or change role), run this script with flags.');
  } catch (e: any) {
    if (e.response) {
      console.error('API error:', e.response.status, e.response.data);
    } else {
      console.error('Error:', e.message || e);
    }
    process.exit(1);
  }
}

main();
