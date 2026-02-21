const { runPlaywrightTest } = require('../utils/playwrightRunner');
const TestCase = require('../models/TestCase');
const mongoose = require('mongoose');

/**
 * Controller to execute an automated Black Box test via Playwright.
 */
const executeAutomatedTest = async (req, res) => {
    try {
        const testResultId = req.params.id; // This maps to the TestCase ID in this system
        const executionParams = req.body;
        const { targetUrl } = executionParams;

        if (!targetUrl) {
            return res.status(400).json({ success: false, message: 'targetUrl is required.' });
        }

        // 1. Run the Playwright test
        const testOutcome = await runPlaywrightTest(executionParams);

        // If this is an unsaved 'temp' test case from the frontend, skip database updates
        if (testResultId === 'temp') {
            return res.status(200).json({
                success: true,
                message: 'Automated test executed successfully (unsaved).',
                data: { testCase: null, outcome: testOutcome }
            });
        }

        // Validate ObjectId before querying to prevent CastErrors
        if (!mongoose.Types.ObjectId.isValid(testResultId)) {
            return res.status(400).json({ success: false, message: 'Invalid test case ID format.' });
        }

        // 2. Locate the existing TestCase (or TestResult) to update
        const testCase = await TestCase.findById(testResultId);

        if (!testCase) {
            return res.status(404).json({ success: false, message: 'Test case not found.' });
        }

        // 3. Keep the additive nature by pushing to execution history and updating status
        // Using existing schema properties 'executionHistory' and 'status' from TestCase
        const executionRecord = {
            executedBy: req.user ? req.user._id : undefined, // If auth middleware adds user
            status: testOutcome.status.toLowerCase() === 'passed' ? 'passed' : 'failed',
            actualResult: testOutcome.actualResult,
            executionTime: testOutcome.executionTimeMs,
            comments: `Automated Playwright Execution on ${targetUrl}`
        };

        // If executionHistory exists, push, else create array (additive)
        if (!testCase.executionHistory) {
            testCase.executionHistory = [];
        }
        testCase.executionHistory.push(executionRecord);

        // Update overall top-level status
        testCase.status = testOutcome.status.toLowerCase() === 'passed' ? 'completed' : 'failed';

        // Save using Mongoose
        await testCase.save();

        return res.status(200).json({
            success: true,
            message: 'Automated test executed successfully.',
            data: { testCase, outcome: testOutcome }
        });

    } catch (error) {
        console.error('executeAutomatedTest controller error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error during automated test execution.',
            error: error.message
        });
    }
};

module.exports = {
    executeAutomatedTest
};
