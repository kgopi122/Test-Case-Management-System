const axios = require('axios');

async function testAddMember() {
    try {
        console.log('--- Debugging Add Member Error ---');

        // 1. Create a Team Lead
        const teamName = `DebugTeam_${Date.now()}`;
        const leadUser = {
            name: 'Debug Lead',
            email: `debug_lead_${Date.now()}@test.com`,
            password: 'password123',
            mode: 'team',
            teamName: teamName
        };

        console.log('Creating Team Lead...');
        const signupRes = await axios.post('http://localhost:3001/api/auth/signup', leadUser);
        const token = signupRes.data.data.token;
        console.log('Team Lead Created. Token:', token ? 'Yes' : 'No');

        // 2. Add Member
        console.log('Adding Member...');
        const memberUser = {
            username: `mem_${Date.now()}`,
            password: 'password123',
            name: 'Debug Member'
        };

        const addRes = await axios.post('http://localhost:3001/api/teams/members', memberUser, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Member Added:', addRes.data);

    } catch (error) {
        if (error.response) {
            console.error('❌ Server Error Response:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

testAddMember();
