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

  // Background - matching the app's gradient
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);

  // Top Action Bar - matching TopActionBar.jsx
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 0, width, 80);
  drawTopBar(ctx, title);

  // Main content area
  switch (title) {
    case 'Interactive Design':
      drawInteractiveDesign(ctx);
      break;
    case 'Real-time Simulation':
      drawSimulation(ctx);
      break;
    case 'Path Analysis':
      drawPathAnalysis(ctx);
      break;
    case 'Data Persistence':
      drawDataPersistence(ctx);
      break;
    case 'Log Analysis':
      drawLogAnalysis(ctx);
      break;
    case 'Rule Management':
      drawRuleManagement(ctx);
      break;
  }

  return canvas.toBuffer('image/png');
}

// Helper function to draw the top action bar based on TopActionBar.jsx
function drawTopBar(ctx, title) {
  // Theme toggle button
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(40, 40, 20, 0, Math.PI * 2);
  ctx.fill();
  
  // Getting Started button
  drawButton(ctx, 100, 25, 'Getting Started', '#1e293b');
  
  // Save button
  drawButton(ctx, 250, 25, 'Save', '#1e293b');
  
  // Export/Import buttons
  drawButton(ctx, 380, 25, 'Export CSV', '#1e293b');
  drawButton(ctx, 500, 25, 'Import CSV', '#1e293b');
}

// Helper function to draw a button matching the app's UI
function drawButton(ctx, x, y, text, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, 100, 30, 6);
  ctx.fill();
  
  ctx.fillStyle = '#ffffff';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(text, x + 50, y + 20);
}

// Draw functions for each feature
function drawInteractiveDesign(ctx) {
  // Draw StatePanel-like interface
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(50, 100, 300, 600);
  
  // Draw state items
  const states = ['Initial State', 'Processing', 'Completed', 'Error'];
  states.forEach((state, i) => {
    ctx.fillStyle = i === 0 ? '#3b82f6' : '#f1f5f9';
    ctx.beginPath();
    ctx.roundRect(70, 150 + i * 60, 260, 40, 6);
    ctx.fill();
    
    ctx.fillStyle = i === 0 ? '#ffffff' : '#1e293b';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(state, 90, 175 + i * 60);
  });
  
  // Draw RulesPanel-like interface
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(400, 100, 750, 600);
  
  // Draw rule items
  const rules = [
    'status === "ready"',
    'data.isValid === true',
    'error === null'
  ];
  rules.forEach((rule, i) => {
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(420, 150 + i * 80, 710, 60, 6);
    ctx.fill();
    
    ctx.fillStyle = '#1e293b';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(rule, 440, 185 + i * 80);
  });
}

function drawSimulation(ctx) {
  // Based on SimulationModal.jsx
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(50, 100, 1100, 600);
  
  // Draw simulation states
  const states = [
    { x: 200, y: 300, name: 'Start', color: '#3b82f6' },
    { x: 500, y: 300, name: 'Processing', color: '#22c55e' },
    { x: 800, y: 300, name: 'Complete', color: '#6366f1' }
  ];
  
  // Draw connections
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  states.forEach((state, i) => {
    if (i < states.length - 1) {
      drawArrow(ctx, state.x + 40, state.y, states[i + 1].x - 40, states[i + 1].y);
    }
  });
  
  // Draw states
  states.forEach(state => {
    drawSimulationState(ctx, state.x, state.y, state.name, state.color);
  });
}

function drawPathAnalysis(ctx) {
  // Based on PathFinderModal.jsx
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(50, 100, 1100, 600);
  
  // Draw path analysis visualization
  const states = [
    { x: 150, y: 200, name: 'Start' },
    { x: 400, y: 200, name: 'Step 1' },
    { x: 650, y: 200, name: 'Step 2' },
    { x: 400, y: 400, name: 'Alternative' },
    { x: 900, y: 200, name: 'End' }
  ];
  
  // Draw paths
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  drawArrow(ctx, 190, 200, 360, 200);
  drawArrow(ctx, 440, 200, 610, 200);
  drawArrow(ctx, 690, 200, 860, 200);
  drawArrow(ctx, 400, 240, 400, 360);
  drawArrow(ctx, 440, 400, 860, 240);
  
  // Draw states
  states.forEach(state => {
    drawPathState(ctx, state.x, state.y, state.name);
  });
}

function drawDataPersistence(ctx) {
  // Draw export/import interface
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(50, 100, 1100, 600);
  
  // Draw table header
  const columns = ['Source State', 'Destination State', 'Rule Condition', 'Description'];
  columns.forEach((col, i) => {
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(70 + i * 270, 120, 250, 40);
    
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(col, 85 + i * 270, 145);
  });
  
  // Draw table rows
  const rows = 8;
  for (let i = 0; i < rows; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#f8fafc';
    ctx.fillRect(70, 160 + i * 50, 1060, 50);
    
    // Add some mock data
    ctx.fillStyle = '#1e293b';
    ctx.font = '14px Arial';
    ctx.fillText(`State ${i + 1}`, 85, 190 + i * 50);
    ctx.fillText(`State ${i + 2}`, 355, 190 + i * 50);
    ctx.fillText(`condition${i + 1} === true`, 625, 190 + i * 50);
    ctx.fillText(`Transition ${i + 1}`, 895, 190 + i * 50);
  }
}

function drawLogAnalysis(ctx) {
  // Based on LogAnalyzer.jsx
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(50, 100, 1100, 600);
  
  // Draw log entries
  const logs = [
    '[2024-03-10 10:15:23] State transition: Initial → Processing',
    '[2024-03-10 10:15:24] Validating input data...',
    '[2024-03-10 10:15:25] Rule evaluation: status === "ready"',
    '[2024-03-10 10:15:26] Transition successful',
    '[2024-03-10 10:15:27] New state: Processing'
  ];
  
  logs.forEach((log, i) => {
    ctx.fillStyle = i % 2 === 0 ? '#f8fafc' : '#ffffff';
    ctx.fillRect(70, 120 + i * 50, 1060, 50);
    
    ctx.fillStyle = '#1e293b';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(log, 90, 150 + i * 50);
  });
  
  // Draw analysis panel
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(850, 120, 280, 560);
  
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('Analysis Results', 870, 150);
}

function drawRuleManagement(ctx) {
  // Based on RulesPanel.jsx
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(50, 100, 1100, 600);
  
  // Draw rule editor
  const rules = [
    { condition: 'status === "ready"', target: 'Processing' },
    { condition: 'data.isValid === true', target: 'Validation' },
    { condition: 'error === null', target: 'Success' }
  ];
  
  rules.forEach((rule, i) => {
    // Rule container
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(70, 120 + i * 100, 1060, 80, 8);
    ctx.fill();
    
    // Condition
    ctx.fillStyle = '#1e293b';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(rule.condition, 90, 160 + i * 100);
    
    // Target state
    drawButton(ctx, 900, 140 + i * 100, rule.target, '#3b82f6');
  });
  
  // Add rule button
  drawButton(ctx, 70, 420, '+ Add Rule', '#3b82f6');
}

function drawSimulationState(ctx, x, y, name, color) {
  // State circle
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 40, 0, Math.PI * 2);
  ctx.fill();
  
  // State name
  ctx.fillStyle = '#ffffff';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(name, x, y + 5);
}

function drawPathState(ctx, x, y, name) {
  // State box
  ctx.fillStyle = '#3b82f6';
  ctx.beginPath();
  ctx.roundRect(x - 40, y - 25, 80, 50, 8);
  ctx.fill();
  
  // State name
  ctx.fillStyle = '#ffffff';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(name, x, y + 5);
}

function drawArrow(ctx, x1, y1, x2, y2) {
  const headLength = 10;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  
  // Line
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  
  // Arrow head
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headLength * Math.cos(angle - Math.PI / 6),
    y2 - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    x2 - headLength * Math.cos(angle + Math.PI / 6),
    y2 - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
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