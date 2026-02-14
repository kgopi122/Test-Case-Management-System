require('dotenv').config({ path: './env.atlas' });
const express = require('express');
const cors = require('cors');
const connectAtlas = require('./config/atlas');

// Import routes
const authRoutes = require('./routes/auth');
const testCaseRoutes = require('./routes/testcases');
const codeImportRoutes = require('./routes/codeimports');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'TCM Backend Server (Atlas) is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'MongoDB Atlas'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/testcases', testCaseRoutes);
app.use('/api/code-imports', codeImportRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB Atlas
    const atlasConnected = await connectAtlas();
    
    if (atlasConnected) {
      console.log('🌐 Database: MongoDB Atlas (Connected)');
    } else {
      console.log('❌ Database: MongoDB Atlas (Connection failed)');
      console.log('⚠️  Server will continue with limited functionality');
    }

    app.listen(PORT, () => {
      console.log(`🚀 TCM Backend Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
      console.log(`📋 Test case endpoints: http://localhost:${PORT}/api/testcases`);
      console.log(`💻 Code import endpoints: http://localhost:${PORT}/api/code-imports`);
      console.log('🌐 Database: MongoDB Atlas (Cloud)');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();


