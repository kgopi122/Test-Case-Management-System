const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  username: {
    type: String,
    trim: true,
    maxlength: [30, 'Username cannot exceed 30 characters'],
    unique: true,
    sparse: true // Allow unique constraint to ignore null values
  },
  testerId: {
    type: String,
    trim: true,
    sparse: true
  },
  email: {
    type: String,
    required: function () { return this.accessMode !== 'team_member'; }, // Only required for Individual/Lead
    sparse: true, // Allow multiple nulls for team members without email
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['admin', 'tester', 'developer', 'manager'],
    default: 'tester'
  },
  accessMode: {
    type: String,
    enum: ['individual', 'team_lead', 'team_member'],
    default: 'individual',
    required: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  avatar: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    {
      userId: this._id,
      email: this.email,
      email: this.email,
      role: this.role,
      accessMode: this.accessMode,
      team: this.team,
      username: this.username
    },
    process.env.JWT_SECRET || 'fallback-secret-key',
    { expiresIn: '7d' }
  );
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);


