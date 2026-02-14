const axios = require('axios');

const API_URL = 'http://localhost:3001/api/auth';

const runAuthTest = async () => {
    console.log("--- Testing Authentication ---");
    const email = `testuser_${Date.now()}@example.com`;
    const password = 'password123';

    try {
        // 1. Signup
        console.log(`\n1. Signing up user: ${email}`);
        const signupRes = await axios.post(`${API_URL}/signup`, {
            name: 'Test User',
            email,
            password
        });
        console.log("✅ Signup Successful. Token received:", !!signupRes.data.data.token);

        // Login immediately with the new user
        console.log(`\n2. Signing in user: ${email}`);
        const signinRes = await axios.post(`${API_URL}/signin`, {
            email,
            password
        });
        console.log("✅ Signin Successful. Token received:", !!signinRes.data.data.token);

    } catch (err) {
        console.error("❌ Auth Test Failed:");
        if (err.response) {
            console.error("Status:", err.response.status);
            console.error("Data:", JSON.stringify(err.response.data, null, 2));
        } else {
            console.error("Message:", err.message);
        }
    }
};

runAuthTest();
