const io = require('socket.io-client');
const axios = require('axios');

const SOCKET_URL = 'http://localhost:3001';
const API_URL = 'http://localhost:3001/api';

async function testRealTimeUpdates() {
    console.log('--- Testing Real-time Updates ---');

    // 1. Login as Team Lead to get Token and Team ID
    let token, teamId;
    try {
        console.log('Logging in as Team Lead...');
        // Assuming a user exists, or we create one. For this test, let's try to signup a temp lead.
        const tempLead = {
            name: 'SocketTest Lead',
            email: `socket_test_${Date.now()}@test.com`,
            password: 'password123',
            accessMode: 'individual'
        };
        const signupRes = await axios.post(`${API_URL}/auth/signup`, tempLead);
        token = signupRes.data.data.token;
        const user = signupRes.data.data.user;
        console.log('Logged in user:', user.email);

        // Create a team
        console.log('Creating team...');
        const teamName = `SocketTeam_${Date.now()}`;
        const teamRes = await axios.post(`${API_URL}/teams`, { name: teamName }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        teamId = teamRes.data.data.team._id;
        console.log('Team Created:', teamId);

    } catch (e) {
        console.error('Setup failed:', e.response ? e.response.data : e.message);
        return;
    }

    // 2. Connect Socket Client
    console.log('Connecting to Socket...');
    const socket = io(SOCKET_URL);

    socket.on('connect', () => {
        console.log('✅ Socket Connected:', socket.id);
        console.log(`Joining room: team_${teamId}`);
        socket.emit('join_team', teamId);
    });

    socket.on('member_added', (data) => {
        console.log('🎉 RECEIVED EVENT: member_added');
        console.log('Data:', data);
        console.log('✅ TEST PASSED');
        socket.disconnect();
        process.exit(0);
    });

    // 3. Trigger Event (Add Member)
    setTimeout(async () => {
        console.log('Triggering API to add member...');
        try {
            await axios.post(`${API_URL}/teams/members`, {
                username: `mem_${Date.now()}`,
                password: 'password123',
                name: 'Socket Member'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Member added via API.');
        } catch (e) {
            console.error('API Call failed:', e.response ? e.response.data : e.message);
        }
    }, 2000);

    // Timeout if no event received
    setTimeout(() => {
        console.log('❌ TEST FAILED: Timeout waiting for event');
        socket.disconnect();
        process.exit(1);
    }, 10000);
}

testRealTimeUpdates();
