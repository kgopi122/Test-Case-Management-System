const mongoose = require('mongoose');
const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../.env' });

const User = require('../models/User');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tcm_database';
const JWT_SECRET = process.env.JWT_SECRET || 'development_secret_key_12345';
const API_URL = 'http://localhost:3001/api';

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Find or create a user
        let user = await User.findOne({ email: 'debug@example.com' });
        if (!user) {
            console.log('Creating debug user...');
            user = new User({
                name: 'Debug User',
                email: 'debug@example.com',
                password: 'password123',
                role: 'developer'
            });
            await user.save();
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
        console.log('Generated token for user:', user._id);

        // Test payload
        const payload = {
            filename: 'Main.java',
            content: 'public class Main { public static void main(String[] args) { System.out.println("Hello"); } }',
            language: 'java',
            testCaseIds: []
        };

        console.log('Sending request to', `${API_URL}/code-imports`);
        try {
            const response = await axios.post(`${API_URL}/code-imports`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Success:', response.status, response.data);
        } catch (err) {
            console.error('Request failed:', err.response ? err.response.status : err.code);
            if (err.response) {
                console.error('Data:', err.response.data);
            } else {
                console.error('Error:', err.message);
            }
        }

    } catch (err) {
        console.error('Script error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
