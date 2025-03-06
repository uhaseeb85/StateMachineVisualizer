# State Machine Visualizer - Technical Documentation

## 1. Application Overview

The State Machine Visualizer is a modern, interactive web application designed for creating, visualizing, and simulating state machines and flow diagrams. It provides developers and engineers with a powerful tool to design, test, and document complex state-based systems with an intuitive user interface.

## 2. Technology Stack

### 2.1 Frontend Framework
- **React 18**: Core UI library for building the component-based interface
- **ReactDOM**: For rendering React components to the DOM

### 2.2 Build Tools
- **Vite 6**: Modern frontend build tool that provides fast development and optimized builds
- **PostCSS**: For processing CSS with plugins
- **Autoprefixer**: For adding browser prefixes to CSS
- **ESLint**: For code linting and ensuring code quality

### 2.3 Styling
- **TailwindCSS**: Utility-first CSS framework for consistent styling
- **Tailwind Merge**: For resolving Tailwind CSS class conflicts
- **Tailwind Animate**: For adding animations to Tailwind components
- **class-variance-authority**: For creating type-safe UI components with variants
- **clsx**: Utility for constructing className strings conditionally

### 2.4 UI Components
- **@shadcn/ui**: Component library based on Radix UI
- **@radix-ui/react-***: Unstyled, accessible UI components
  - react-alert-dialog: For confirmation dialogs
  - react-dialog: For modal dialogs
  - react-select: For dropdown selects
  - react-tooltip: For tooltips

### 2.5 Animation and Visual Effects
- **Framer Motion**: For advanced animations and transitions
- **html2canvas**: For capturing screenshots of the visualizations

### 2.6 Data Processing
- **XLSX-JS-Style**: For working with Excel files, used for importing/exporting state and rule dictionaries
- **PapaParse**: For parsing CSV files, used for importing/exporting state machine definitions

### 2.7 Utilities
- **UUID**: For generating unique identifiers
- **Sonner**: For toast notifications
- **Lucide React**: For SVG icons
- **React Joyride**: For creating guided tours of the application

### 2.8 Deployment Options
- **Vercel**: Cloud deployment platform
- **Apache Tomcat**: Java servlet container for local deployment

## 3. Application Architecture

### 3.1 Directory Structure

```
my-app/
├── dist/                  # Build output
├── node_modules/          # Dependencies
├── public/                # Static assets
├── src/
│   ├── api/               # API integration (Splunk, etc.)
│   ├── assets/            # Images, fonts, etc.
│   ├── components/
│   │   ├── FlowDiagramVisualizer/  # Flow diagram mode components
│   │   │   ├── hooks/              # Custom hooks for flow diagram
│   │   ├── StateMachineVisualizer/ # State machine mode components
│   │   │   ├── hooks/              # Custom hooks for state machine
│   │   │   ├── utils/              # Utility functions
│   │   ├── ui/                     # Shared UI components
│   ├── context/            # React contexts
│   ├── lib/                # Third-party integrations
│   ├── styles/             # Global and custom styles
│   ├── utils/              # Global utility functions
│   ├── App.css
│   ├── index.css
│   └── main.jsx           # Application entry point
├── .gitignore
├── eslint.config.js
├── index.html             # HTML template
├── package.json           # Dependencies and scripts
├── postcss.config.js      # PostCSS configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── vite.config.js         # Vite configuration
```

### 3.2 Application Flow

1. The application starts at `main.jsx`, which renders the `App` component
2. `App` renders either:
   - `LandingPage` for mode selection
   - `StateMachineVisualizer` for state machine visualization
   - `FlowDiagramVisualizer` for flow diagram visualization
3. The selected visualizer component manages its state using custom hooks
4. Each visualizer has its own set of panels, tools, and modals for user interaction

### 3.3 State Management

- Custom hooks provide isolated state management for specific features
- Local storage is used for persistence across sessions
- Context is used for theme management

## 4. Core Components Analysis

### 4.1 App Component (`App.jsx`)

**Purpose**: Main application component that handles mode selection and content rendering.

**Key Features**:
- Theme provider integration
- Landing page display
- Mode switching between State Machine and Flow Diagram visualizers

**Implementation Details**:
- Uses React's useState for managing display state
- Leverages localStorage for remembering the user's mode preference
- Provides callbacks for mode switching

### 4.2 State Machine Visualizer (`StateMachineVisualizer/index.jsx`)

**Purpose**: Core container component for the state machine visualization application.

**Key Features**:
- State and rule management
- Theme support (dark/light mode)
- Import/export functionality (CSV, JSON)
- Interactive simulation
- Path finding capability
- Local storage persistence
- Change history tracking
- Guided tour

**Implementation Details**:
- Uses custom hooks (`useStateMachine`, `useSimulation`) for state management
- Renders several sub-components, including `StatePanel`, `RulesPanel`, `TopActionBar`
- Uses toast notifications for user feedback
- Manages modal visibility for various tools (simulation, path finder, etc.)
- Handles CSV import/export with preservation of additional columns

### 4.3 Flow Diagram Visualizer (`FlowDiagramVisualizer/index.jsx`)

**Purpose**: Container component for the flow diagram visualization application.

**Key Features**:
- Step (node) and arrow (edge) management
- CSV import/export
- Interactive simulation
- Path finding capability
- Local storage persistence

**Implementation Details**:
- Uses custom hook (`useFlowDiagram`) for state management
- Renders sub-components including `StepPanel`, `TopActionBar`
- Handles visualization of flow diagrams with steps and transitions

## 5. State Management

### 5.1 State Machine Hook (`useStateMachine.js`)

**Purpose**: Manages the core state machine logic and state.

**State Elements**:
- States: Array of state objects with IDs, names, and rules
- Selected state: Currently active state for editing
- Dark mode: Theme preference
- Change log: History of user actions

**Key Functions**:
- `addState`: Adds a new state to the state machine
- `deleteState`: Removes a state (with dependency checks)
- `addRule`: Adds a rule to a state
- `deleteRule`: Removes a rule from a state
- `importCSV`: Imports state machine from CSV
- `exportCSV`: Exports state machine to CSV
- `importConfig`: Imports configuration from JSON
- `exportConfig`: Exports configuration to JSON
- `importStateDictionary`: Imports state descriptions from Excel
- `importRuleDictionary`: Imports rule descriptions from Excel

**Persistence**:
- Saves state machine to localStorage
- Maintains a change log in localStorage (max 2000 entries)

### 5.2 Simulation Hook (`useSimulation.js`)

**Purpose**: Manages the simulation state and logic for state machines.

**State Elements**:
- Current state: Active state in simulation
- Path: History of states visited during simulation
- Available transitions: Rules that can be evaluated from current state

**Key Functions**:
- `startSimulation`: Initializes simulation with a starting state
- `evaluateRule`: Processes rule evaluation and state transitions
- `undoStep`: Reverts to previous state in the path
- `resetSimulation`: Restarts simulation from the beginning

### 5.3 Flow Diagram Hook (`useFlowDiagram.js`)

**Purpose**: Manages the flow diagram state and logic.

**State Elements**:
- Steps: Array of step objects (nodes)
- Arrows: Array of arrow objects (edges) connecting steps
- Selected step: Currently active step for editing

**Key Functions**:
- `addStep`: Adds a new step to the diagram
- `deleteStep`: Removes a step (with dependency checks)
- `addArrow`: Adds an arrow between steps
- `deleteArrow`: Removes an arrow
- `importCSV`: Imports flow diagram from CSV
- `exportCSV`: Exports flow diagram to CSV

## 6. Feature Analysis

### 6.1 State Panel (`StatePanel.jsx`)

**Purpose**: Manages the states of the state machine.

**Key Features**:
- Adding new states
- Deleting existing states
- Selecting states for editing
- Importing state descriptions from Excel
- Displaying state metadata (rule count, descriptions)

**Implementation Details**:
- Uses local state for managing the new state name and selected state
- Integrates with the state dictionary for descriptions
- Uses UI components from shadcn/ui
- Highlights selected state with visual feedback

### 6.2 Rules Panel (`RulesPanel.jsx`)

**Purpose**: Manages transition rules between states.

**Key Features**:
- Adding new rules
- Editing existing rules
- Deleting rules
- Importing rule descriptions from Excel
- Displaying rule metadata
- Managing rule conditions and target states

**Implementation Details**:
- Uses state variables for rule editing
- Supports rule dictionaries for descriptions
- Handles compound rules with multiple conditions
- Supports negated conditions (with ! prefix)

### 6.3 Simulation Modal (`SimulationModal.jsx`)

**Purpose**: Provides interactive simulation of state machine flows.

**Key Features**:
- Visual representation of state transitions
- Interactive rule evaluation
- Success/failure outcome selection
- Undo/reset capabilities
- Layout switching (vertical/horizontal)
- Image export functionality

**Implementation Details**:
- Leverages the useSimulation hook for state management
- Uses html2canvas for image export
- Provides step-by-step simulation flow
- Visualizes the simulation path

### 6.4 Path Finder Modal (`PathFinderModal.jsx`)

**Purpose**: Provides advanced path finding capabilities.

**Key Features**:
- Finding paths to end states
- Finding paths between specific states
- Finding paths through intermediate states
- Loop detection
- Exporting results to HTML

**Implementation Details**:
- Uses depth-first search (DFS) algorithm with cycle detection
- Supports multiple search modes
- Implements pagination for large result sets
- Provides visualization of found paths

### 6.5 Log Analyzer (`LogAnalyzer.jsx`)

**Purpose**: Provides log analysis tools with pattern matching.

**Key Features**:
- Local file analysis
- Splunk integration
- Import/manage log pattern dictionaries
- View analysis results with context

**Implementation Details**:
- Uses pattern matching with regular expressions
- Integrates with Splunk API
- Stores log patterns in sessionStorage
- Provides context-aware analysis

### 6.6 Change Log (`ChangeLog.jsx`)

**Purpose**: Displays history of changes to the state machine.

**Key Features**:
- Chronological display of changes
- Export to text file
- Clear history option

**Implementation Details**:
- Uses the change log state from useStateMachine
- Formats and displays timestamped entries
- Provides export functionality

## 7. CSV Import/Export

### 7.1 State Machine Format

**Required Columns**:
- "Source Node": Starting state name
- "Destination Node": Target state name
- "Rule List": Transition condition

**Optional Columns**:
- "Priority": Order of rule evaluation
- Any additional columns are preserved for export

**Implementation**:
- Uses PapaParse for CSV parsing
- Preserves all additional columns during export
- Handles column mapping for flexibility

### 7.2 Flow Diagram Format

**Required Columns**:
- "Source Node": Starting step name
- "Destination Node": Target step name

**Optional Columns**:
- "Rule List": Condition for the arrow
- "Arrow Color": Custom color for the arrow
- Any additional columns are preserved for export

## 8. Integration Points

### 8.1 Splunk Integration

**Purpose**: Integrates with Splunk for log analysis.

**Implementation Details**:
- Configurable server URL, port, token, and index
- Persists configuration in localStorage
- Uses the Splunk search API for querying logs

### 8.2 Excel Import/Export

**Purpose**: Imports and exports dictionaries and configurations.

**Implementation Details**:
- Uses xlsx-js-style for Excel file handling
- Supports state description import
- Supports rule description import
- Supports log pattern dictionary import

## 9. UI/UX Features

### 9.1 Theme Support

**Purpose**: Provides dark and light mode themes.

**Implementation Details**:
- Uses TailwindCSS for theme switching
- Persists theme preference in localStorage
- Updates UI dynamically when theme changes

### 9.2 Guided Tour

**Purpose**: Provides an interactive introduction to the application.

**Implementation Details**:
- Uses React Joyride for step-by-step guide
- Configurable tour steps
- Highlights key features with explanations

### 9.3 Responsive Design

**Purpose**: Ensures usability across device sizes.

**Implementation Details**:
- Uses TailwindCSS responsive utilities
- Adjusts layouts for different screen sizes
- Maintains usability on smaller screens

## 10. Deployment Options

### 10.1 Vercel Deployment

**Configuration**:
- Defined in `vercel.json`
- Uses standard Vite build process

### 10.2 Tomcat Deployment

**Configuration**:
- Uses `cross-env` to set deployment environment
- Modifies base URL for Tomcat context
- Requires additional configuration files in META-INF and WEB-INF

## 11. Code Quality and Maintainability

### 11.1 Linting

**Configuration**:
- ESLint with React-specific rules
- Defined in `eslint.config.js`

### 11.2 Component Structure

- Follows React best practices for component composition
- Uses custom hooks for logic separation
- Implements reusable UI components

### 11.3 Error Handling

- Input validation for user interactions
- Graceful error handling with user feedback
- Defensive coding patterns throughout

## 12. Performance Considerations

### 12.1 Known Limitations

- Large state machines may experience performance impacts
- CSV imports must follow specified column structure
- Some features require modern browser support

### 12.2 Optimization Techniques

- Memoization of expensive calculations
- Efficient state updates
- Pagination for large data sets

## 13. Future Development Opportunities

### 13.1 Potential Enhancements

- Multi-user collaboration features
- Version control integration
- Real-time simulation
- Enhanced visualization options
- Integration with other systems

### 13.2 Architectural Improvements

- State management refactoring for complex state machines
- Performance optimizations for large diagrams
- Enhanced modularity for plugin support

## 14. Maintenance Guidelines

### 14.1 Common Issues

- Port conflicts during development
- Installation issues with npm dependencies
- Node version compatibility

### 14.2 Troubleshooting Steps

- Clear npm cache when experiencing installation issues
- Check Node.js version compatibility
- Review build logs for error details

---

This technical documentation provides a comprehensive overview of the State Machine Visualizer application, its architecture, components, and features. Developers can use this as a reference for maintaining and extending the application. 