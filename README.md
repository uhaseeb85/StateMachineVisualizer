# State Machine Visualizer

A modern, interactive web application for designing, visualizing, and simulating state machines and flow diagrams. Built with React and Tailwind CSS, this tool provides an intuitive interface for creating and managing visual workflows with a focus on user experience.

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

## Deployment

### Local Tomcat Deployment

Follow these steps to deploy the application to your local Tomcat server:

#### Prerequisites

1. Apache Tomcat 9.0 or higher installed
2. Node.js (v18.17.0 or higher)
3. npm (v6.0.0 or higher)

#### Build Configuration

1. Install the required build dependency:
   ```bash
   npm install --save-dev cross-env
   ```

2. The project already includes the necessary configuration in:
   - `vite.config.js` - Handles correct path configuration for Tomcat deployment
   - `package.json` - Includes the Tomcat-specific build command

#### Build and Deploy

1. Build the application for Tomcat:
   ```bash
   npm run build:tomcat
   ```
   This will create a `dist` directory with the build files.

2. Create and set up the Tomcat deployment directory:
   ```bash
   mkdir "%TOMCAT_HOME%\webapps\visualizer"
   ```
   copy contents of dist directory to "%TOMCAT_HOME%\webapps\visualizer\"

   create below directories
   ```bash
   mkdir "%TOMCAT_HOME%\webapps\visualizer\META-INF"
   mkdir "%TOMCAT_HOME%\webapps\visualizer\WEB-INF"
   ```

3. Create the required Tomcat configuration files:

   In `%TOMCAT_HOME%\webapps\visualizer\META-INF\context.xml`:
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <Context antiResourceLocking="false" privileged="true">
   </Context>
   ```

   In `%TOMCAT_HOME%\webapps\visualizer\WEB-INF\web.xml`:
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee"
            xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
            xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaee http://xmlns.jcp.org/xml/ns/javaee/web-app_4_0.xsd"
            version="4.0">
       <display-name>Flow Diagram Application</display-name>
       <error-page>
           <error-code>404</error-code>
           <location>/visualizer/index.html</location>
       </error-page>
   </web-app>
   ```

#### Start Tomcat

1. Start Tomcat server:
   ```bash
   "%TOMCAT_HOME%\bin\startup.bat"
   ```

2. Access the application:
   ```
   http://localhost:8080/visualizer/
   ```

## Usage Guide

### Mode Selection

1. **Choose Your Visualization Mode**
   - State Machine Visualizer for state transitions management
   - Flow Diagram Visualizer for API process flow visualization
   - IVR Designer for interactive voice response design
   - Log Analyzer for log file analysis

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

### Graph Tools

1. **Accessing Graph Tools**
   - Click "Graph Tools" in the top toolbar
   - Choose from available tools:
     - Pathfinder
     - Simulation
     - Graph Splitter

2. **Pathfinder**
   - Find paths between states
   - Analyze possible transitions
   - Detect loops in the state machine
   - Export findings to HTML

3. **Simulation**
   - Select a starting state
   - Step through transitions
   - Evaluate rules for each state
   - Track the path history
   - Switch between horizontal and vertical layouts

4. **Graph Splitter**
   - Break large graphs into manageable subgraphs
   - Preserve connectivity information
   - Identify natural partitions in the graph
   - Color-code states based on subgraph membership

### Flow Diagram Visualization

1. **Creating Flow Diagrams**
   - Add nodes representing process steps
   - Connect nodes with directional arrows
   - Customize node and connection properties
   - Apply automatic layout for clean visualization

2. **Exporting Diagrams**
   - Export diagrams as PNG images
   - Preserve layout and styling
   - High-resolution output for documentation
   - Download with custom filename

3. **Interactive Analysis**
   - Visual analysis of node relationships
   - Identify root nodes and child nodes
   - Highlight connection paths
   - Filter diagram to show relevant nodes

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

### Log Analysis

1. **Local File Analysis**
   - Upload log files directly to the application
   - Pattern matching against known log formats
   - Automatic identification of errors and warnings
   - Context-aware analysis

2. **Splunk Integration**
   - Connect to Splunk instance
   - Run queries against indexed logs
   - Configure server URL, port, and token
   - Import search results for analysis

### Additional Features

1. **Dark/Light Mode**
   - Toggle theme using sun/moon icon
   - Persists across sessions
   - Improves visibility in different environments

2. **Change Log**
   - Records all modifications
   - Tracks state and rule changes
   - Helps audit configuration changes
   - Access via "Local History" button

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
  │   ├── FlowDiagramVisualizer/
  │   │   ├── hooks/          # Custom React hooks
  │   │   ├── CustomNodes/    # Node components for ReactFlow
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
- The project uses React, ReactDOM, and Vite for the core framework
- UI-related libraries like @radix-ui/react-alert-dialog, @radix-ui/react-dialog, @shadcn/ui, lucide-react, tailwind-merge, and tailwindcss-animate
- ReactFlow for interactive flow diagram visualization
- Dagre for automatic graph layout in flow diagrams
- React-joyride for creating guided tours
- Sonner for toast notifications
- html-to-image for taking diagram screenshots
- xlsx-js-style for working with Excel files


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
- Flow diagram layout may need manual adjustment for complex diagrams

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