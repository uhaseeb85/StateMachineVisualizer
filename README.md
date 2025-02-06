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
git clone https://github.com/uhaseeb85/state-machine-visualizer.git
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
   - Type the state name in the left panel input field
   - Click "+" button or press Enter to add the state
   - States will appear in the States panel with a counter showing number of rules
   - Each state can be selected to view/edit its rules

2. **Deleting States**
   - Hover over a state to reveal the delete (trash) icon
   - Click the trash icon to delete the state
   - Note: States that are referenced as targets in other states' rules cannot be deleted
   - You must first remove all references to a state before it can be deleted

3. **State Dictionary**
   - Import state descriptions using Excel file
   - Required column: state name and description
   - View descriptions by selecting states
   - Helps maintain documentation of your state machine

### Rules Management

1. **Adding Rules**
   - Select a state from the States panel
   - In the Rules panel, enter:
     - Rule condition (what triggers the transition)
     - Target state (where to transition to)
   - Click "+" to add the rule
   - Rules appear in the list below

2. **Editing Rules**
   - Select the state containing the rule
   - Click on the rule to modify
   - Update condition or target state
   - Changes are saved automatically

3. **Deleting Rules**
   - Hover over a rule to reveal the delete icon
   - Click the delete icon to remove the rule
   - Confirmation is required for deletion

4. **Rule Dictionary**
   - Import rule descriptions via Excel
   - Helps document complex transition conditions
   - View descriptions by clicking on rules
   - Maintains standardization across state machines

### Data Import/Export

1. **CSV Import**
   - Click "Import CSV" in the top toolbar
   - File must contain columns:
     - "Source Node": Starting state
     - "Destination Node": Target state
     - "Rule List": Transition condition
   - Additional columns are preserved for export
   - Existing states/rules will be updated

2. **CSV Export**
   - Click "Export CSV" in the top toolbar
   - Generates CSV file with current configuration
   - Preserves all columns from imported CSV
   - Includes all states and their rules

3. **Configuration Backup**
   - Use "Save" button to store in local storage
   - "Export" button to download configuration file
   - "Import" to restore from configuration file
   - Auto-save feature prevents data loss

### Simulation Mode

1. **Starting Simulation**
   - Click "Simulate" in the top toolbar
   - Select starting state in the modal
   - View current state highlighted in blue

2. **Running Simulation**
   - Click on the current state to view available transitions
   - Rules for current state are displayed
   - Click a rule to evaluate it
   - Choose success/failure to determine next state

3. **Simulation Controls**
   - Undo button to step back
   - Reset to start over
   - Close simulation to return to editor
   - View transition history in the path

### Pathfinder Feature

1. **Finding Paths**
   - Click "Pathfinder" in top toolbar
   - Select source state
   - Select target state
   - Click "Find Paths" to analyze

2. **Understanding Results**
   - Green checkmarks (✓) show successful transitions
   - Red crosses (❌) show failed transitions
   - Arrows (→) indicate direction
   - Multiple paths may be displayed

3. **Loop Detection**
   - Automatically identifies circular paths
   - Shows all states involved in the loop
   - Helps identify infinite transitions
   - Useful for validation

### Additional Features

1. **Dark/Light Mode**
   - Toggle theme using sun/moon icon
   - Persists across sessions
   - Improves visibility in different environments

2. **Change Log**
   - Records all modifications
   - Tracks state and rule changes
   - Helps audit configuration changes
   - Access via "History" button

3. **User Guide**
   - Access via "?" icon in toolbar
   - Contains detailed feature explanations
   - Includes best practices
   - Troubleshooting tips

4. **Responsive Design**
   - Works on desktop and tablet
   - Adapts to different screen sizes
   - Touch-friendly interface
   - Consistent experience across devices

### Best Practices

1. **State Naming**
   - Use clear, descriptive names
   - Maintain consistent naming convention
   - Avoid special characters
   - Keep names concise

2. **Rule Management**
   - Document complex rules using dictionary
   - Verify transitions before implementation
   - Remove unused rules
   - Test all paths

3. **Testing**
   - Use simulation to verify flows
   - Check all possible paths
   - Validate edge cases
   - Document test scenarios

4. **Maintenance**
   - Regular exports for backup
   - Keep dictionaries updated
   - Review and clean unused states
   - Document major changes

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