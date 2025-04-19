// Simple startup script for running the application
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Visual Flow Builder with Enhanced Analytics Dashboard');

// Check if node_modules exists, if not run npm install
if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
  console.log('📦 Node modules not found, installing dependencies...');
  execSync('npm install', { stdio: 'inherit', cwd: __dirname });
}

// Check for server/data directory
const dataDir = path.join(__dirname, 'server', 'data');
if (!fs.existsSync(dataDir)) {
  console.log('📁 Creating data directory...');
  fs.mkdirSync(dataDir, { recursive: true });
}

try {
  // Start the application using the dev script
  console.log('🌐 Starting application (client + server)...');
  execSync('npm run dev', { stdio: 'inherit', cwd: __dirname });
} catch (error) {
  console.error('❌ Failed to start the application:', error.message);
  process.exit(1);
} 