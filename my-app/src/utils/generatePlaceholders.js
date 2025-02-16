import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to create a placeholder image
function createPlaceholder(title, width = 1200, height = 800) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);

  // Add some visual elements
  // Header bar
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, 0, width, 60);

  // Sidebar
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 60, 250, height - 60);

  // Main content area grid
  const gridSize = 50;
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  
  for (let x = 250; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 60);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  
  for (let y = 60; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(250, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Add title
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 24px Arial';
  ctx.fillText(title, 20, 35);

  // Add some mock UI elements based on the feature
  switch (title) {
    case 'Interactive Design':
      // Add mock states
      drawState(ctx, 400, 200, 'State 1');
      drawState(ctx, 600, 200, 'State 2');
      drawArrow(ctx, 450, 200, 550, 200);
      break;
    case 'Real-time Simulation':
      // Add simulation elements
      drawState(ctx, 400, 200, 'Active', '#22c55e');
      drawState(ctx, 600, 200, 'Pending');
      drawState(ctx, 500, 400, 'Complete');
      drawArrow(ctx, 450, 200, 550, 200);
      drawArrow(ctx, 600, 250, 550, 350);
      break;
    case 'Path Analysis':
      // Add path visualization
      drawState(ctx, 400, 200, 'Start');
      drawState(ctx, 600, 200, 'Middle');
      drawState(ctx, 800, 200, 'End');
      drawArrow(ctx, 450, 200, 550, 200);
      drawArrow(ctx, 650, 200, 750, 200);
      break;
    case 'Data Persistence':
      // Add mock data table
      drawTable(ctx, 300, 100, 800, 400);
      break;
    case 'Log Analysis':
      // Add mock log entries
      drawLogs(ctx, 300, 100, 800, 400);
      break;
    case 'Rule Management':
      // Add mock rule interface
      drawRules(ctx, 300, 100, 800, 400);
      break;
  }

  return canvas.toBuffer('image/png');
}

// Helper functions
function drawState(ctx, x, y, label, color = '#3b82f6') {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 30, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#ffffff';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(label, x, y + 5);
}

function drawArrow(ctx, x1, y1, x2, y2) {
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  
  // Draw line
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  
  // Draw arrow head
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 15 * Math.cos(angle - Math.PI / 6), y2 - 15 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - 15 * Math.cos(angle + Math.PI / 6), y2 - 15 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fillStyle = '#64748b';
  ctx.fill();
}

function drawTable(ctx, x, y, width, height) {
  const rows = 8;
  const cols = 3;
  const rowHeight = height / rows;
  const colWidth = width / cols;
  
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  
  // Draw header
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(x, y, width, rowHeight);
  
  // Draw grid
  for (let i = 0; i <= rows; i++) {
    ctx.beginPath();
    ctx.moveTo(x, y + i * rowHeight);
    ctx.lineTo(x + width, y + i * rowHeight);
    ctx.stroke();
  }
  
  for (let i = 0; i <= cols; i++) {
    ctx.beginPath();
    ctx.moveTo(x + i * colWidth, y);
    ctx.lineTo(x + i * colWidth, y + height);
    ctx.stroke();
  }
}

function drawLogs(ctx, x, y, width, height) {
  const lineHeight = 30;
  ctx.font = '14px monospace';
  ctx.fillStyle = '#475569';
  
  for (let i = 0; i < 12; i++) {
    const timestamp = new Date().toISOString();
    ctx.fillText(`[${timestamp}] Log entry ${i + 1}`, x + 10, y + 25 + i * lineHeight);
    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(x, y + (i + 1) * lineHeight);
    ctx.lineTo(x + width, y + (i + 1) * lineHeight);
    ctx.stroke();
  }
}

function drawRules(ctx, x, y, width, height) {
  const ruleHeight = 60;
  const rules = ['IF state = "A" THEN goto "B"', 'IF condition = true THEN goto "C"', 'IF value > 10 THEN goto "D"'];
  
  rules.forEach((rule, i) => {
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(x, y + i * ruleHeight, width, ruleHeight - 10);
    
    ctx.fillStyle = '#475569';
    ctx.font = '16px Arial';
    ctx.fillText(rule, x + 20, y + 35 + i * ruleHeight);
  });
}

// Generate and save images
const features = [
  'Interactive Design',
  'Real-time Simulation',
  'Path Analysis',
  'Data Persistence',
  'Log Analysis',
  'Rule Management'
];

features.forEach(feature => {
  const fileName = feature.toLowerCase().replace(/\s+/g, '-') + '.png';
  const buffer = createPlaceholder(feature);
  fs.writeFileSync(path.join(__dirname, '../../src/assets/features', fileName), buffer);
  console.log(`Generated ${fileName}`);
}); 