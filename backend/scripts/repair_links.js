const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const TestCase = require('../models/TestCase');
const CodeImport = require('../models/CodeImport');

const repair = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tcms';
        await mongoose.connect(uri);
        console.log('Connected to MongoDB for repair');

        // 1. Get recent Code Import
        const latestImport = await CodeImport.findOne().sort({ updatedAt: -1 });
        if (!latestImport) {
            console.log("No Code Import found to link to.");
            return;
        }
        console.log(`Latest Import: ${latestImport._id} (${latestImport.filename})`);

        // 2. Find orphan Runner Test Cases (created today)
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const orphans = await TestCase.find({
            title: /Runner Test Case/,
            createdAt: { $gte: startOfDay },
            $or: [{ linkedCode: null }, { linkedCode: { $exists: false } }]
        });

        console.log(`Found ${orphans.length} orphan test cases.`);

        if (orphans.length > 0) {
            const orphanIds = orphans.map(tc => tc._id);

            // Link them to latestImport
            const updateResult = await TestCase.updateMany(
                { _id: { $in: orphanIds } },
                { $set: { linkedCode: latestImport._id } }
            );
            console.log(`Updated test cases: ${updateResult.modifiedCount}`);

            // Link them back to CodeImport (bidirectional)
            // Get current IDs
            const currentTestCaseIds = latestImport.testCaseIds.map(id => id.toString());
            const newIds = orphanIds.map(id => id.toString());
            const combined = [...new Set([...currentTestCaseIds, ...newIds])];

            latestImport.testCaseIds = combined;
            await latestImport.save();
            console.log(`Updated CodeImport with ${orphans.length} new links.`);
        } else {
            console.log("All Runner test cases seem linked.");
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

repair();
