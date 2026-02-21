const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { executeAutomatedTest } = require('../controllers/testExecutionController');

// @route   POST /api/testresults/:id/automate
// @desc    Execute automated Black Box test using Playwright
// @access  Private
// * Note: Keeping route path as requested, mapping to TestCase ID
router.post('/:id/automate', auth, executeAutomatedTest);

module.exports = router;
