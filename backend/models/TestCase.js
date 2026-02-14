const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  preconditions: {
    type: String,
    trim: true
  },
  steps: [{
    stepNumber: {
      type: Number,
      required: true
    },
    action: {
      type: String,
      required: true,
      trim: true
    },
    expectedResult: {
      type: String,
      required: true,
      trim: true
    }
  }],
  expectedResult: {
    type: String,
    required: [true, 'Expected result is required'],
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  tags: [{
    type: String,
    trim: true
  }],
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['draft', 'ready', 'in_progress', 'completed', 'failed', 'blocked'],
    default: 'draft'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  // Custom test case fields
  isCustom: {
    type: Boolean,
    default: false
  },
  customInput: {
    type: String,
    trim: true
  },
  expectedOutput: {
    type: String,
    trim: true
  },
  // Link to Code Runner import
  linkedCode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CodeImport'
  },
  // Version control
  versions: [{
    version: {
      type: String,
      required: true
    },
    changes: {
      type: String,
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Execution history
  executionHistory: [{
    executedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    executedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['passed', 'failed', 'blocked', 'skipped'],
      required: true
    },
    actualResult: {
      type: String,
      trim: true
    },
    comments: {
      type: String,
      trim: true
    },
    executionTime: {
      type: Number, // in milliseconds
      default: 0
    }
  }]
}, {
  timestamps: true
});

// Index for better query performance
testCaseSchema.index({ title: 'text', description: 'text' });
testCaseSchema.index({ status: 1, priority: 1 });
testCaseSchema.index({ assignedTo: 1 });
testCaseSchema.index({ tags: 1 });

module.exports = mongoose.model('TestCase', testCaseSchema);