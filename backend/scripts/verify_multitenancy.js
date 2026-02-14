const axios = require('axios');

const API_URL = 'http://localhost:3001/api';

async function testMultiTenancy() {
    try {
        console.log('--- Starting Multi-tenancy Verification ---');

        // 1. Verify Individual Signup
        console.log('\n1. Testing Individual Signup...');
        const indUser = {
            name: 'Indie User',
            email: `indie_${Date.now()}@test.com`,
            password: 'password123',
            mode: 'individual'
        };
        const indRes = await axios.post(`${API_URL}/auth/signup`, indUser);
        if (indRes.data.success && indRes.data.data.user.accessMode === 'individual') {
            console.log('✅ Individual Signup Successful');
        } else {
            console.error('❌ Individual Signup Failed', indRes.data);
        }

        // 2. Verify Team Lead Signup
        console.log('\n2. Testing Team Lead Signup...');
        const teamName = `Team_${Date.now()}`;
        const leadUser = {
            name: 'Team Lead',
            email: `lead_${Date.now()}@test.com`,
            password: 'password123',
            mode: 'team',
            teamName: teamName
        };
        const leadRes = await axios.post(`${API_URL}/auth/signup`, leadUser);
        const leadToken = leadRes.data.data.token;

        if (leadRes.data.success && leadRes.data.data.user.accessMode === 'team_lead') {
            console.log(`✅ Team Lead Signup Successful (Team: ${teamName})`);
        } else {
            console.error('❌ Team Lead Signup Failed', leadRes.data);
            return;
        }

        // 3. Verify Add Member (as Lead)
        console.log('\n3. Testing Add Member...');
        const memberUser = {
            username: `member_${Date.now()}`,
            password: 'memberpass123',
            name: 'Team Member 1'
        };

        const addMemberRes = await axios.post(`${API_URL}/teams/members`, memberUser, {
            headers: { Authorization: `Bearer ${leadToken}` }
        });

        if (addMemberRes.data.success) {
            console.log('✅ Member Added Successfully');
        } else {
            console.error('❌ Add Member Failed', addMemberRes.data);
        }

        // 4. Verify Team Member Login
        console.log('\n4. Testing Team Member Login...');
        const memberLogin = {
            teamName: teamName,
            username: memberUser.username,
            password: memberUser.password
        };

        const loginRes = await axios.post(`${API_URL}/auth/signin`, memberLogin);

        if (loginRes.data.success && loginRes.data.data.user.username === memberUser.username) {
            console.log('✅ Team Member Login Successful');
        } else {
            console.error('❌ Team Member Login Failed', loginRes.data);
        }

        console.log('\n--- Verification Complete ---');

    } catch (error) {
        console.error('❌ Verification Error:', error.response ? error.response.data : error.message);
    }
}

testMultiTenancy();
