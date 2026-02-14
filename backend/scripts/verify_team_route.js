const axios = require('axios');

async function testTeamEndpoint() {
    try {
        console.log('Testing POST /api/teams...');
        // Should return 401 Unauthorized if no token, which means route exists.
        // If 404, route doesn't exist.
        await axios.post('http://localhost:3001/api/teams', {});
    } catch (error) {
        if (error.response) {
            console.log(`Response Status: ${error.response.status}`);
            if (error.response.status === 404) {
                console.error('❌ Route not found (404)');
            } else if (error.response.status === 401) {
                console.log('✅ Route exists (401 Unauthorized as expected)');
            } else {
                console.log(`✅ Route exists (Status: ${error.response.status})`);
            }
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

testTeamEndpoint();
