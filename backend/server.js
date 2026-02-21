require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const testCaseRoutes = require('./routes/testcases');
const codeImportRoutes = require('./routes/codeimports');
const teamRoutes = require('./routes/teams');
const testResultRoutes = require('./routes/testResultRoutes'); // ADDED

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
    message: 'TCM Backend Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/testcases', testCaseRoutes);
app.use('/api/code-imports', codeImportRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/testresults', testResultRoutes); // ADDED
app.use('/api/activity', require('./routes/activity'));

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
    // Connect to database
    const dbConnected = await connectDB();

    if (dbConnected) {
      console.log('🌐 Database: MongoDB (Connected)');
    } else {
      console.log('❌ Database: MongoDB (Connection failed)');
      console.log('⚠️  Server will continue with limited functionality');
    }

    const http = require('http');
    const server = http.createServer(app);
    const initializeSocket = require('./services/socket');
    const io = initializeSocket(server);
    app.set('io', io);

    server.listen(PORT, () => {
      console.log(`🚀 TCM Backend Server running on port ${PORT}`);
      console.log(`ws Socket.io enabled`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
      console.log(`📋 Test case endpoints: http://localhost:${PORT}/api/testcases`);
      console.log(`💻 Code import endpoints: http://localhost:${PORT}/api/code-imports`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();


