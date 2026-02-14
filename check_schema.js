const mongoose = require('mongoose');
require('dotenv').config({ path: 'c:/Users/gsai4/Pictures/under construction/TCM/TCM/backend/.env' });

const TestCase = require('./backend/models/TestCase');

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const tc = await TestCase.findOne().lean();
        console.log('Sample Test Case:', tc);

        if (tc && tc.createdBy) {
            console.log('createdBy EXISTS:', tc.createdBy);
        } else {
            console.log('createdBy MISSING');
        }

        mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkData();
