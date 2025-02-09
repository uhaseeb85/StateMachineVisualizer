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


## Dependencies: 
- The project uses React, ReactDOM, and Vite. 
- It also includes several UI-related libraries like @radix-ui/react-alert-dialog, @radix-ui/react-dialog, @shadcn/ui, lucide-react, tailwind-merge, and tailwindcss-animate. 
- There's also react-joyride for creating guided tours, 
- sonner for toast notifications, html2canvas for taking screenshots, 
- @react-pdf/renderer for rendering PDFs, and xlsx-js-style for working with Excel files.
Scripts: 
- The project has scripts for dev, build, lint, and preview.
- Includes eslint, prettier, typescript, and vite.

## File level Functional Details

### index.jsx
- Core Component: This is the main container component for the state machine visualization application. It orchestrates all sub-components and manages the global state.
- Key Features: The component description highlights key features such as state and rule management, theme support, import/export functionality, interactive simulation, path finding, local storage persistence, change history tracking, and a guided tour.
- Sub-components: It imports and renders several sub-components, including StatePanel, RulesPanel, TopActionBar, SimulationModal, PathFinderModal, UserGuideModal, ChangeLog, VersionInfo, and SplunkConfig.
- Custom Hooks: It uses custom hooks useStateMachine and useSimulation to manage state machine logic and simulation functionality, respectively.
- UI Components: It utilizes UI components from @/components/ui/ (likely a custom UI library) and sonner for toast notifications.
- State Management: The component uses useState for managing modal visibility, loaded dictionaries, and other UI-related states. It also leverages localStorage for persisting dictionaries.
- CSV Export: The handleExportCSV function handles CSV export with preservation of additional columns, merging current state data with previously imported data.

### useStateMachine.js

- Core Logic: This hook manages the core state machine logic, including states, selected state, dark mode, save notifications, and the change log.
- State Management: It uses useState for managing states and useEffect for persisting data to localStorage.
- Change Log: The hook maintains a change log to track user actions. The change log is stored in localStorage and has a maximum size of 2000 entries.
- Import/Export: The hook includes functions for importing and exporting state machine configurations as JSON files.
- Excel Import: The hook includes functions for importing state machine configurations from Excel files. It uses the xlsx-js-style library for parsing Excel files.
- Rule Dictionary Import: The hook includes functions for importing rule dictionaries from Excel files.
- Helper Functions: The hook includes helper functions for adding timestamped entries to the change log and generating unique IDs.
- Delete State: The handleDeleteState function checks if any other state has a rule pointing to the state to be deleted, and prevents deletion if it is used as a target state in other rules.

### ChangeLog.jsx

- Purpose: This component displays a modal containing a chronological history of changes made to the state machine.
- Features: It displays timestamped change entries, allows exporting the history to a text file, and provides an option to clear the history.
- Storage: The component relies on the changeLog state, which is managed by the useStateMachine hook and persisted in localStorage.
- UI: The component uses UI components from @/components/ui/ for buttons and modal structure. It also uses icons from lucide-react.
- Export Functionality: The exportToFile function formats the change log entries and creates a downloadable text file.
- Reset Functionality: The resetHistory function clears the change log from both the state and localStorage after user confirmation.

### LogAnalyzer.jsx

- Purpose: This component provides a log analysis tool that supports both local file analysis and Splunk integration.
- Features: It allows users to upload and analyze local log files, connect to Splunk for remote log analysis, import/manage log pattern dictionaries, and view analysis results with context.
- Analysis Method: The component uses a pattern-matching approach with regular expressions to identify known patterns in logs and provide relevant suggestions.
- Splunk Integration: The component integrates with Splunk, allowing users to analyze logs directly from their Splunk instance. It uses the searchSplunk function from @/api/splunk.js to search for logs in Splunk.
- Log Dictionary: The component uses a log dictionary to store log patterns and analysis rules. The log dictionary is stored in sessionStorage.
- UI: The component uses UI components from @/components/ui/ for buttons, inputs, and alerts. It also uses icons from lucide-react.
- Screens: The component uses a state variable screen to manage different screens, including a select screen, a Splunk analysis screen, and a file analysis screen.
- Sample Patterns: The component includes a set of sample log patterns that can be used as a starting point for creating a log dictionary.

### PathFinderModal.jsx

- Purpose: This component provides advanced path finding capabilities within the state machine.
- Features: It supports finding paths to end states, between specific states, and through intermediate states. It also detects loops in the state machine and exports results to HTML.
- Algorithm: The component uses a depth-first search (DFS) algorithm with cycle detection for path finding.
- Search Modes: The component supports different search modes, including finding paths to end states, finding paths between states, and finding paths through an intermediate state.
- Loop Detection: The component includes a function to detect loops in the state machine.
- UI: The component uses UI components from @/components/ui/ for buttons and selects. It also uses icons from lucide-react.
- Export Functionality: The component includes a function to export the search results to an HTML file.
- Pagination: The component implements pagination for large result sets.

### RulesPanel.jsx

- Purpose: This component manages transition rules between states in the state machine.
- Features: It allows adding new rules, editing existing rules, deleting rules, importing rule descriptions from Excel, displaying rule metadata, and managing rule conditions and target states.
- Rule Management: The component uses state variables to manage the rule editing process, including newRuleCondition, newRuleNextState, editingRuleId, and editingRuleCondition.
- Rule Dictionary: The component supports importing rule descriptions from an Excel file. The imported rule descriptions are stored in the loadedDictionary state variable.
- UI: The component uses UI components from @/components/ui/ for buttons and inputs. It also uses icons from lucide-react.
- Rule Descriptions: The component displays descriptions for individual parts of a compound rule, handling negated conditions (with ! prefix).

### SimulationModal.jsx

- Purpose: This component provides interactive simulation of state machine flows.
- Features: It offers visual representation of state transitions, interactive rule evaluation, success/failure outcome selection, undo/reset capabilities, layout switching (vertical/horizontal), and image export functionality.
- Simulation Process: The simulation follows a step-by-step process where users can click on states to initiate transitions, evaluate rules for state changes, determine success/failure outcomes, and track the simulation path visually.
- UI: The component uses UI components from @/components/ui/ for buttons. It also uses icons from lucide-react.
- Layout: The component allows switching between vertical and horizontal layouts.
- Image Export: The component includes a function to export the simulation view as an image.
- State Management: The component receives the simulationState as a prop, which is managed by the useSimulation hook.

### SplunkConfig.jsx

- Purpose: This component provides a configuration modal for setting up Splunk integration parameters.
- Features: It handles server URL, port, token, and index configuration, and persists the configuration in localStorage.
- Validation: The component includes input validation to ensure that the configuration parameters are valid.
- UI: The component uses UI components from @/components/ui/ for buttons and inputs.
- State Management: The component uses the useState hook to manage the form state and validation errors.

### StatePanel.jsx

- Purpose: This component manages the states of the state machine.
- Features: It allows adding new states, deleting existing states, selecting states for editing, importing state descriptions from Excel, and displaying state metadata (rule count, descriptions).
- State Management: The component uses local state to manage the new state name and selected state ID.
- State Dictionary: The component supports importing state descriptions from an Excel file. The imported state descriptions are stored in the loadedStateDictionary state variable.
- UI: The component uses UI components from @/components/ui/ for buttons and inputs. It also uses icons from lucide-react.
- State Selection: The component highlights the selected state and displays its description (if available).

### TopActionBar.jsx

- Purpose: This component provides a navigation and action bar for the State Machine Visualizer.
- Features: It includes controls for theme toggling, getting started tour, save/export/import operations, and tool access (Pathfinder, Simulation, Log Analysis).
- UI: The component uses UI components from @/components/ui/ for buttons. It also uses icons from lucide-react.
- Log Analysis Modal: The component manages the visibility of the LogAnalyzer modal.
- Responsive Design: The component is designed to be responsive.

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

This project is licensed under the MIT License.

---

For support, feedback, or suggestions:
- Open an issue in the repository