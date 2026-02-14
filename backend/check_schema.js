const mongoose = require('mongoose');
require('dotenv').config();

const TestCase = require('./models/TestCase');

async function checkData() {
    try {
        console.log('Connecting to', process.env.MONGODB_URI);
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
