const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Import routes
const canvasRoutes = require('./routes/canvas');
const githubRoutes = require('./routes/github');

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request body
app.use(morgan('dev')); // HTTP request logging

// API Routes
app.use('/api/canvas', canvasRoutes);
app.use('/api/github', githubRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// For production, serve the React frontend
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
  });
}

// Start the server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
}

// Export for testing and integration with Electron later
module.exports = app;
