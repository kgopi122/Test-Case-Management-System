const mongoose = require('mongoose');

const codeImportSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: [true, 'Filename is required'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Code content is required']
  },
  language: {
    type: String,
    required: [true, 'Programming language is required'],
    enum: ['python', 'javascript', 'java', 'cpp', 'csharp', 'go', 'rust', 'php', 'ruby', 'other'],
    default: 'python'
  },
  importedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  importedAt: {
    type: Date,
    default: Date.now
  },
  // Associated test cases
  testCaseIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestCase'
  }],
  // Execution results
  executionResults: [{
    testCaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TestCase'
    },
    input: {
      type: String
    },
    expectedOutput: {
      type: String
    },
    actualOutput: {
      type: String
    },
    status: {
      type: String,
      enum: ['passed', 'failed', 'error'],
      required: true
    },
    executionTime: {
      type: Number, // in milliseconds
      default: 0
    },
    errorMessage: {
      type: String,
      trim: true
    },
    executedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Code metadata
  fileSize: {
    type: Number,
    default: 0
  },
  lineCount: {
    type: Number,
    default: 0
  },
  // Status tracking
  status: {
    type: String,
    enum: ['imported', 'analyzed', 'tested', 'failed'],
    default: 'imported'
  },
  // Analysis results
  analysis: {
    complexity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    functions: [{
      name: String,
      lineNumber: Number,
      parameters: [String]
    }],
    variables: [{
      name: String,
      type: String,
      lineNumber: Number
    }],
    dependencies: [String]
  }
}, {
  timestamps: true
});

// Index for better query performance
codeImportSchema.index({ importedBy: 1, importedAt: -1 });
codeImportSchema.index({ language: 1 });
codeImportSchema.index({ status: 1 });
codeImportSchema.index({ filename: 'text' }, { language_override: 'text_search_language' });

module.exports = mongoose.model('CodeImport', codeImportSchema);