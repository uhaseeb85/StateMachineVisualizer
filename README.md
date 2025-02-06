# State Machine Visualizer

A modern, interactive web application for designing, visualizing, and simulating state machines. Built with React and Tailwind CSS, this tool provides an intuitive interface for creating and managing state machines with a focus on user experience.

## Table of Contents
- [Installation](#installation)
- [Features](#features)
- [Usage Guide](#usage-guide)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Installation

### Prerequisites
- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)
- Modern web browser (Chrome, Firefox, Safari, or Edge)

### Setup Steps
1. Clone the repository
```bash
git clone https://github.com/yourusername/state-machine-visualizer.git
cd state-machine-visualizer
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Features

### Core Functionality
- Create, edit, and delete states
- Define transition rules between states
- Visual representation of state relationships
- Real-time state machine simulation
- Path finding and loop detection

### Data Management
- CSV/Excel import and export
- Local storage persistence
- Configuration backup and sharing
- Rule dictionary support

### User Interface
- Dark/Light mode toggle
- Responsive design
- Interactive visualization
- Real-time feedback
- User guide and tooltips

## Usage Guide

### State Management
1. **Creating States**
   - Enter state name in input field
   - Click "Add" or press Enter
   - States appear in left panel

2. **Managing Rules**
   - Select a state to view/edit rules
   - Add rules with conditions and target states
   - Delete or modify existing rules

### Data Import/Export
1. **CSV Import**
   - Required columns:
     - "Source Node"
     - "Destination Node"
     - "Rule List"
   - Additional columns are preserved

2. **CSV Export**
   - Exports current configuration
   - Maintains additional columns from import
   - Preserves rule relationships

### Simulation
1. Click "Simulate" button
2. Select starting state
3. Follow state transitions
4. Use undo for step-back
5. View transition history

### Pathfinder
1. Access via "Pathfinder" button
2. Select source and destination
3. View all possible paths
4. Analyze transition rules

## Development

### Project Structure
```
src/
  ├── components/
  │   ├── StateMachineVisualizer/
  │   │   ├── hooks/          # Custom React hooks
  │   │   ├── components/     # UI components
  │   │   └── utils/          # Utility functions
  │   └── ui/                 # Shared UI components
  ├── lib/                    # Third-party integrations
  └── utils/                  # Global utility functions
```

### Commands
```bash
# Development
npm run dev          # Start development server

# Production
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm run test         # Run tests
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Find process using port 5173
   lsof -i :5173
   # Kill the process
   kill -9 <PID>
   ```

2. **Installation Issues**
   ```bash
   # Clear npm cache
   npm cache clean --force
   # Reinstall dependencies
   npm install
   ```

3. **Node Version**
   ```bash
   # Check version
   node --version
   # Should be v14.0.0 or higher
   ```

### Known Limitations
- Large state machines may experience performance impacts
- CSV imports must follow specified column structure
- Some features require modern browser support

## Contributing

1. Fork the repository
2. Create feature branch
   ```bash
   git checkout -b feature/YourFeature
   ```
3. Commit changes
   ```bash
   git commit -m 'Add YourFeature'
   ```
4. Push to branch
   ```bash
   git push origin feature/YourFeature
   ```
5. Open Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

---

For support, feedback, or suggestions:
- Open an issue in the repository