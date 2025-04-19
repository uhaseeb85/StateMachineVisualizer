import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Path to visitor counter file
const counterFilePath = path.join(dataDir, 'visitor-counter.json');
const visitsDataPath = path.join(dataDir, 'visits-data.json');
const usersFilePath = path.join(dataDir, 'users.json');

// Initialize files if they don't exist
if (!fs.existsSync(counterFilePath)) {
  fs.writeFileSync(counterFilePath, JSON.stringify({ count: 0 }));
}

if (!fs.existsSync(visitsDataPath)) {
  fs.writeFileSync(visitsDataPath, JSON.stringify({
    visits: [],
    componentUsage: {
      stateMachine: 0,
      flowDiagram: 0,
      logAnalyzer: 0,
      aiLogAnalysis: 0
    },
    uniqueVisitors: {}
  }));
}

// Create default admin user if users file doesn't exist
if (!fs.existsSync(usersFilePath)) {
  // Generate a secure password hash
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync('admin123', salt, 1000, 64, 'sha512').toString('hex');
  
  fs.writeFileSync(usersFilePath, JSON.stringify({
    users: [
      {
        id: uuidv4(),
        username: 'admin',
        hash: hash,
        salt: salt,
        role: 'admin',
        created: new Date().toISOString()
      }
    ]
  }));
  console.log('Default admin user created with password: admin123');
}

// Rate limiter for page views - simple in-memory store
// In production, you'd use Redis or another persistent store
const pageViewRequests = new Map();

// Authentication middleware
const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  // In a real app, you'd verify the JWT token
  // For this example, we'll use a simple token verification
  if (token === 'admin-token') {
    next();
  } else {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

// Rate limiter middleware
const rateLimiter = (req, res, next) => {
  // Get client IP address or a unique identifier
  const clientId = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  
  // Get current timestamp
  const now = Date.now();
  
  // Check if this client has made a request recently
  if (pageViewRequests.has(clientId)) {
    const lastRequest = pageViewRequests.get(clientId);
    // If last request was less than 2 seconds ago, reject
    if (now - lastRequest < 2000) {
      console.log(`Rate limited page view from ${clientId}`);
      // Don't increment, but still return current count
      try {
        const data = JSON.parse(fs.readFileSync(counterFilePath, 'utf8'));
        return res.json(data);
      } catch (error) {
        return res.status(429).json({ error: 'Too many requests' });
      }
    }
  }
  
  // Update the last request time for this client
  pageViewRequests.set(clientId, now);
  
  // Clean up old entries every 5 minutes
  if (Math.random() < 0.01) { // 1% chance on each request to run cleanup
    const twoMinutesAgo = now - 120000;
    for (const [key, timestamp] of pageViewRequests.entries()) {
      if (timestamp < twoMinutesAgo) {
        pageViewRequests.delete(key);
      }
    }
  }
  
  // Continue to the actual route handler
  next();
};

// User authentication routes
app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const usersData = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
    const user = usersData.users.find(u => u.username === username);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Verify password
    const inputHash = crypto.pbkdf2Sync(password, user.salt, 1000, 64, 'sha512').toString('hex');
    
    if (inputHash !== user.hash) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // In a real app, you would generate a JWT token here
    res.json({
      token: 'admin-token',
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Root route - for testing
app.get('/', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Get current visitor count
app.get('/api/visitor-count', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(counterFilePath, 'utf8'));
    res.json(data);
  } catch (error) {
    console.error('Error reading visitor count:', error);
    res.status(500).json({ error: 'Failed to read visitor count' });
  }
});

// Record a page view - automatically increments counter
app.post('/api/page-view', rateLimiter, (req, res) => {
  try {
    // Get visitor info
    const clientId = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const referer = req.headers['referer'] || 'direct';
    
    // Read current data
    const countData = JSON.parse(fs.readFileSync(counterFilePath, 'utf8'));
    const visitsData = JSON.parse(fs.readFileSync(visitsDataPath, 'utf8'));
    
    // Update count
    countData.count += 1;
    
    // Add visit data
    const visitEntry = {
      timestamp: new Date().toISOString(),
      ip: clientId,
      userAgent,
      referer
    };
    
    visitsData.visits.push(visitEntry);
    
    // Track unique visitors (using IP as identifier)
    if (!visitsData.uniqueVisitors[clientId]) {
      visitsData.uniqueVisitors[clientId] = {
        firstVisit: new Date().toISOString(),
        visits: 1
      };
    } else {
      visitsData.uniqueVisitors[clientId].visits += 1;
      visitsData.uniqueVisitors[clientId].lastVisit = new Date().toISOString();
    }
    
    // Save data
    fs.writeFileSync(counterFilePath, JSON.stringify(countData));
    fs.writeFileSync(visitsDataPath, JSON.stringify(visitsData));
    
    console.log(`Page view recorded, new count: ${countData.count}`);
    res.json(countData);
  } catch (error) {
    console.error('Error recording page view:', error);
    res.status(500).json({ error: 'Failed to record page view' });
  }
});

// Record component usage
app.post('/api/component-usage', (req, res) => {
  try {
    const { component } = req.body;
    
    if (!component) {
      return res.status(400).json({ error: 'Component name is required' });
    }
    
    const validComponents = ['stateMachine', 'flowDiagram', 'logAnalyzer', 'aiLogAnalysis'];
    
    if (!validComponents.includes(component)) {
      return res.status(400).json({ error: 'Invalid component name' });
    }
    
    const visitsData = JSON.parse(fs.readFileSync(visitsDataPath, 'utf8'));
    
    // Increment component usage
    visitsData.componentUsage[component] += 1;
    
    // Save data
    fs.writeFileSync(visitsDataPath, JSON.stringify(visitsData));
    
    res.json({ success: true, component, count: visitsData.componentUsage[component] });
  } catch (error) {
    console.error('Error recording component usage:', error);
    res.status(500).json({ error: 'Failed to record component usage' });
  }
});

// Get analytics data - protected by authentication
app.get('/api/analytics', authenticateUser, (req, res) => {
  try {
    const countData = JSON.parse(fs.readFileSync(counterFilePath, 'utf8'));
    const visitsData = JSON.parse(fs.readFileSync(visitsDataPath, 'utf8'));
    
    // Calculate unique visitor count
    const uniqueVisitorCount = Object.keys(visitsData.uniqueVisitors).length;
    
    // Get recent visits (last 50)
    const recentVisits = visitsData.visits.slice(-50).reverse();
    
    // Return analytics data
    res.json({
      totalVisits: countData.count,
      uniqueVisitors: uniqueVisitorCount,
      componentUsage: visitsData.componentUsage,
      recentVisits
    });
  } catch (error) {
    console.error('Error getting analytics data:', error);
    res.status(500).json({ error: 'Failed to get analytics data' });
  }
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app; 