const express = require('express');
const { body, validationResult } = require('express-validator');
const CodeImport = require('../models/CodeImport');
const TestCase = require('../models/TestCase');
const auth = require('../middleware/auth');
const { executeJava } = require('../services/JavaExecutor');

const router = express.Router();

// @route   GET /api/code-imports
// @desc    Get all code imports
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, language, status, search } = req.query;

    // Build filter object
    const filter = { importedBy: req.user._id };
    if (language) filter.language = language;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { filename: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const codeImports = await CodeImport.find(filter)
      .populate('importedBy', 'name email role')
      .populate('testCaseIds', 'title status customInput expectedOutput priority')
      .sort({ importedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await CodeImport.countDocuments(filter);

    res.json({
      success: true,
      data: {
        codeImports,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get code imports error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/code-imports/:id
// @desc    Get single code import
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const codeImport = await CodeImport.findById(req.params.id)
      .populate('importedBy', 'name email role')
      .populate('testCaseIds', 'title status priority customInput expectedOutput');

    if (!codeImport) {
      return res.status(404).json({
        success: false,
        message: 'Code import not found'
      });
    }

    // Check if user owns this code import
    if (codeImport.importedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { codeImport }
    });

  } catch (error) {
    console.error('Get code import error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/code-imports
// @desc    Create new code import
// @access  Private
router.post('/', auth, [
  body('filename').trim().isLength({ min: 1 }).withMessage('Filename is required'),
  body('content').trim().isLength({ min: 1 }).withMessage('Code content is required'),
  body('language').isIn(['python', 'javascript', 'java', 'cpp', 'csharp', 'go', 'rust', 'php', 'ruby', 'other']).withMessage('Invalid programming language')
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

    const { filename, content, language, testCaseIds = [] } = req.body;

    // Calculate file metrics
    const lineCount = content.split('\n').length;
    const fileSize = Buffer.byteLength(content, 'utf8');

    const codeImportData = {
      filename,
      content,
      language,
      importedBy: req.user._id,
      testCaseIds,
      fileSize,
      lineCount
    };

    const codeImport = new CodeImport(codeImportData);
    await codeImport.save();

    await codeImport.populate('importedBy', 'name email role');
    await codeImport.populate('testCaseIds', 'title status');

    res.status(201).json({
      success: true,
      message: 'Code imported successfully',
      data: { codeImport }
    });

  } catch (error) {
    console.error('Create code import error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/code-imports/:id
// @desc    Update code import
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const codeImport = await CodeImport.findById(req.params.id);

    if (!codeImport) {
      return res.status(404).json({
        success: false,
        message: 'Code import not found'
      });
    }

    // Check if user owns this code import
    if (codeImport.importedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update file metrics if content changed
    if (req.body.content && req.body.content !== codeImport.content) {
      req.body.lineCount = req.body.content.split('\n').length;
      req.body.fileSize = Buffer.byteLength(req.body.content, 'utf8');
    }

    Object.assign(codeImport, req.body);
    await codeImport.save();

    await codeImport.populate('importedBy', 'name email role');
    await codeImport.populate('testCaseIds', 'title status');

    res.json({
      success: true,
      message: 'Code import updated successfully',
      data: { codeImport }
    });

  } catch (error) {
    console.error('Update code import error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/code-imports/:id
// @desc    Delete code import
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const codeImport = await CodeImport.findById(req.params.id);

    if (!codeImport) {
      return res.status(404).json({
        success: false,
        message: 'Code import not found'
      });
    }

    // Check if user owns this code import
    if (codeImport.importedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await CodeImport.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Code import deleted successfully'
    });

  } catch (error) {
    console.error('Delete code import error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/code-imports/:id/execute
// @desc    Execute code with test cases
// @access  Private
router.post('/:id/execute', auth, [
  body('testCases').isArray().withMessage('Test cases must be an array'),
  body('testCases.*.input').optional().trim(),
  body('testCases.*.expectedOutput').optional().trim()
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

    const codeImport = await CodeImport.findById(req.params.id);

    if (!codeImport) {
      return res.status(404).json({
        success: false,
        message: 'Code import not found'
      });
    }

    // Check if user owns this code import
    if (codeImport.importedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { testCases } = req.body;
    const executionResults = [];

    // Execute each test case
    for (const testCase of testCases) {
      const startTime = Date.now();
      let actualOutput = '';
      let status = 'passed';
      let errorMessage = '';
      let executionTime = 0;

      try {
        if (codeImport.language.toLowerCase() === 'java') {
          const result = await executeJava(codeImport.content, testCase.input);
          actualOutput = result.output;
          errorMessage = result.error;
          executionTime = result.executionTime;

          if (errorMessage && !actualOutput) {
            // Compilation or Runtime error with no output
            status = 'error';
          }
        } else {
          // Fallback for other languages (MOCK)
          if (codeImport.language === 'python') {
            actualOutput = `Mock output for input: ${testCase.input}`;
          } else {
            actualOutput = `Mock output for ${codeImport.language} with input: ${testCase.input}`;
          }
          executionTime = Date.now() - startTime;
        }

        // Compare outputs (Trim whitespace for robustness)
        if (status !== 'error') {
          // Allow basic equality check
          if (actualOutput.trim() !== testCase.expectedOutput.trim()) {
            status = 'failed';
          } else {
            status = 'passed';
          }
        }

      } catch (error) {
        status = 'error';
        errorMessage = error.message;
        actualOutput = '';
        executionTime = Date.now() - startTime;
      }

      executionResults.push({
        testCaseId: testCase.id || null,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput,
        status,
        executionTime,
        errorMessage,
        executedAt: new Date()
      });
    }

    // Update code import with execution results
    codeImport.executionResults = executionResults;
    codeImport.status = 'tested';
    await codeImport.save();

    res.json({
      success: true,
      message: 'Code execution completed',
      data: {
        codeImport,
        executionResults
      }
    });

  } catch (error) {
    console.error('Execute code error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
