const express = require('express');
const { body, validationResult } = require('express-validator');
const TestCase = require('../models/TestCase');
const CodeImport = require('../models/CodeImport');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/testcases
// @desc    Get all test cases
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, priority, assignedTo, search } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Role-based Access Control
    // Individuals see only their own test cases
    if (req.user.accessMode === 'individual') {
      filter.createdBy = req.user._id;
    }
    // Team Leads/Members see team test cases
    else if (req.user.team) {
      // Ensure we use the ID string, not the object if populated
      filter.team = req.user.team._id || req.user.team;
      console.log('Filtering by Team ID:', filter.team);
    }
    // Fallback: If in team mode but no team assigned, see only own
    else {
      filter.createdBy = req.user._id;
      console.log('Filtering by Creator ID (Fallback):', filter.createdBy);
    }

    const testCases = await TestCase.find(filter)
      .populate('assignedTo', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await TestCase.countDocuments(filter);

    res.json({
      success: true,
      data: {
        testCases,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get test cases error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/testcases/:id
// @desc    Get single test case
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const testCase = await TestCase.findById(req.params.id)
      .populate('assignedTo', 'name email role')
      .populate('versions.updatedBy', 'name email');

    if (!testCase) {
      return res.status(404).json({
        success: false,
        message: 'Test case not found'
      });
    }

    res.json({
      success: true,
      data: { testCase }
    });

  } catch (error) {
    console.error('Get test case error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/testcases
// @desc    Create new test case
// @access  Private
router.post('/', auth, [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('description').trim().isLength({ min: 1 }).withMessage('Description is required'),
  body('expectedResult').trim().isLength({ min: 1 }).withMessage('Expected result is required'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  body('status').optional().isIn(['draft', 'ready', 'in_progress', 'completed', 'failed', 'blocked']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const testCaseData = {
      ...req.body,
      createdBy: req.user._id,
      team: req.user.team || null
    };

    const testCase = new TestCase(testCaseData);
    await testCase.save();

    await testCase.populate([
      { path: 'assignedTo', select: 'name email role' },
      { path: 'versions.updatedBy', select: 'name email' },
      { path: 'executionHistory.executedBy', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Test case created successfully',
      data: { testCase }
    });

  } catch (error) {
    console.error('Create test case error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/testcases/:id
// @desc    Update test case
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const testCase = await TestCase.findById(req.params.id);

    if (!testCase) {
      return res.status(404).json({
        success: false,
        message: 'Test case not found'
      });
    }

    // Check ownership
    // 1. Individual: Must be creator
    if (req.user.accessMode === 'individual') {
      if (testCase.createdBy.toString() !== req.user._id.toString()) {
        return res.status(401).json({ success: false, message: 'Not authorized to update this test case' });
      }
    }
    // 2. Team: Must belong to same team
    else if (req.user.team) {
      const teamId = req.user.team._id || req.user.team;
      if (!testCase.team || testCase.team.toString() !== teamId.toString()) {
        return res.status(401).json({ success: false, message: 'Not authorized to update this test case' });
      }
    }
    // 3. Fallback
    else {
      if (testCase.createdBy.toString() !== req.user._id.toString()) {
        return res.status(401).json({ success: false, message: 'Not authorized to update this test case' });
      }
    }

    // Add version tracking
    if (req.body.title !== testCase.title || req.body.description !== testCase.description) {
      testCase.versions.push({
        version: `v${testCase.versions.length + 1}`,
        changes: 'Updated test case details',
        updatedBy: req.user._id
      });
    }

    Object.assign(testCase, req.body);
    await testCase.save();

    await testCase.populate([
      { path: 'assignedTo', select: 'name email role' },
      { path: 'versions.updatedBy', select: 'name email' },
      { path: 'executionHistory.executedBy', select: 'name email' }
    ]);

    res.json({
      success: true,
      message: 'Test case updated successfully',
      data: { testCase }
    });

  } catch (error) {
    console.error('Update test case error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/testcases/:id
// @desc    Delete test case
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const testCase = await TestCase.findById(req.params.id);

    if (!testCase) {
      return res.status(404).json({
        success: false,
        message: 'Test case not found'
      });
    }

    // Check ownership
    // 1. Individual: Must be creator
    if (req.user.accessMode === 'individual') {
      if (testCase.createdBy.toString() !== req.user._id.toString()) {
        return res.status(401).json({ success: false, message: 'Not authorized to delete this test case' });
      }
    }
    // 2. Team: Must belong to same team
    else if (req.user.team) {
      const teamId = req.user.team._id || req.user.team;
      if (!testCase.team || testCase.team.toString() !== teamId.toString()) {
        return res.status(401).json({ success: false, message: 'Not authorized to delete this test case' });
      }
    }
    // 3. Fallback (e.g. team mode but no team)
    else {
      if (testCase.createdBy.toString() !== req.user._id.toString()) {
        return res.status(401).json({ success: false, message: 'Not authorized to delete this test case' });
      }
    }

    await TestCase.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Test case deleted successfully'
    });

  } catch (error) {
    console.error('Delete test case error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/testcases/:id/execute
// @desc    Execute test case
// @access  Private
router.post('/:id/execute', auth, [
  body('actualResult').trim().isLength({ min: 1 }).withMessage('Actual result is required'),
  body('status').isIn(['passed', 'failed', 'blocked', 'skipped']).withMessage('Invalid execution status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const testCase = await TestCase.findById(req.params.id);

    if (!testCase) {
      return res.status(404).json({
        success: false,
        message: 'Test case not found'
      });
    }

    const { actualResult, status, comments, executionTime = 0 } = req.body;

    // Add execution record
    testCase.executionHistory.push({
      executedBy: req.user._id,
      status,
      actualResult,
      comments,
      executionTime
    });

    // Update test case status
    if (status === 'passed' || status === 'failed') {
      testCase.status = status === 'passed' ? 'completed' : 'failed';
    }

    await testCase.save();

    res.json({
      success: true,
      message: 'Test case executed successfully',
      data: { testCase }
    });

  } catch (error) {
    console.error('Execute test case error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;


