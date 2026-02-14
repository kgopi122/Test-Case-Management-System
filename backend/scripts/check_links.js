const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const TestCase = require('../models/TestCase');
const CodeImport = require('../models/CodeImport');

const checkLinks = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tcms';
        console.log('Connecting to:', uri.replace(/:([^:@]{1,})@/, ':****@')); // Mask password
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const testCases = await TestCase.find().sort({ createdAt: -1 }).limit(5);
        console.log(`Found ${testCases.length} recent test cases.`);

        testCases.forEach(tc => {
            console.log(JSON.stringify(tc, null, 2));
        });

        const imports = await CodeImport.find().sort({ createdAt: -1 }).limit(5);
        console.log(`Found ${imports.length} recent code imports.`);
        imports.forEach(ci => {
            console.log(`Import ID: ${ci._id}`);
            console.log(`  Filename: ${ci.filename}`);
            console.log(`  TestCaseIDs: ${ci.testCaseIds}`);
            console.log('---');
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

checkLinks();
