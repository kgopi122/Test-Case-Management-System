const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const CodeImport = require('../models/CodeImport');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tcm_database';
const JWT_SECRET = process.env.JWT_SECRET || 'development_secret_key_12345';
const API_URL = 'http://localhost:3001/api';

async function run() {
    try {
        await mongoose.connect(MONGO_URI);

        // valid user
        const user = await User.findOne({ email: 'debug@example.com' });
        if (!user) {
            console.log("Debug user not found run debug_code_import.js first if needed");
            return;
        }
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });

        // Create a code import first (or find one)
        let codeImport = await CodeImport.findOne({ importedBy: user._id });
        if (!codeImport) {
            console.log("Creating temp code import");
            codeImport = await CodeImport.create({
                filename: 'Test.java',
                content: 'public class Test { public static void main(String[] args) {} }',
                language: 'java',
                importedBy: user._id
            });
        }

        const id = codeImport._id;
        console.log(`Testing execute on CodeImport ID: ${id}`);

        // Payload mirroring frontend behavior for "Run"
        const payload = {
            testCases: [{ input: ' ', expectedOutput: '' }]
        };

        try {
            await axios.post(`${API_URL}/code-imports/${id}/execute`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Success: Request completed (Unexpected)');
        } catch (err) {
            if (err.response) {
                console.log(`Caught expected error: ${err.response.status} ${err.response.statusText}`);
                console.log('Validation errors:', JSON.stringify(err.response.data.errors, null, 2));
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
