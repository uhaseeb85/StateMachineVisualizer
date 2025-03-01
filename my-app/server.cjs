const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 8080;

// Get base path from environment or use default
const BASE_PATH = process.env.BASE_PATH || '/';

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for simplicity, enable and configure in production
}));

// Compression middleware
app.use(compression());

// Serve static files
app.use(BASE_PATH, express.static(path.join(__dirname, 'dist')));

// Handle SPA routing - serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Application available at: http://localhost:${PORT}${BASE_PATH}`);
}); 