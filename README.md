# State Machine Visualizer

A modern, interactive web application for designing, visualizing, and simulating state machines and flow diagrams. Built with React and Tailwind CSS, this tool provides an intuitive interface for creating and managing visual workflows with a focus on user experience.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Development](#development)
  - [Build](#build)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Core Components](#core-components)
- [Data Formats](#data-formats)
- [Deployment Options](#deployment-options)
  - [Local Development](#local-development)
  - [Tomcat Deployment](#tomcat-deployment)
  - [Vercel Deployment](#vercel-deployment)
- [Developer Guidelines](#developer-guidelines)
  - [Code Style](#code-style)
  - [Adding Features](#adding-features)
  - [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Overview

The State Machine Visualizer is an application designed to help engineers and developers create, visualize, and simulate complex state-based systems. It provides multiple visualization modes including:

- **State Machine Visualizer** - For designing state transitions and rules
- **Flow Diagram Visualizer** - For API and process flow visualization
- **Log Analyzer** - For analyzing log files and pattern matching
- **AI Log Analysis** - For AI-powered log analysis and insights

## Features

### Core Features
- Interactive state machine and flow diagram creation
- Multiple visualization modes for different use cases
- Dark/Light theme support
- Local storage persistence
- Import/Export functionality (CSV, Excel, JSON)
- Responsive design for different screen sizes
- **Version Control/Change Log:** Track and view history of modifications
- **Guided Tours:** Step-by-step onboarding and feature discovery
- **Simulation:** Real-time simulation for state machines and flow diagrams
- **Graph Tools:** Path finding, graph splitting, and more
- **Excel Import/Export:** For state/rule/log pattern dictionaries
- **Custom Node Types:** Flow diagrams support custom node rendering

### State Machine Visualizer
- States and rules management
- Interactive simulation
- Path finding with loop detection
- State and rule dictionaries
- Graph tools for advanced analysis

### Flow Diagram Visualizer
- Node and edge creation with customization
- Auto-layout using Dagre algorithm
- Interactive graph manipulation
- Export as images

### Log Analysis
- Local file analysis with pattern matching
- Splunk integration for querying logs
- Pattern dictionaries for standardized analysis

### AI Log Analysis
- Analyze log files using AI/LLMs for intelligent insights
- Ask questions about logs in natural language (chat-based UI)
- Supports chunking, streaming, and API key configuration
- Customizable API settings and log size management

## Getting Started

### Prerequisites
- Node.js (v18.17.0 or higher recommended)
- npm (v6.0.0 or higher)
- Modern web browser (Chrome, Firefox, Safari, or Edge)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/state-machine-visualizer.git
cd state-machine-visualizer
```

2. Navigate to the application directory
```bash
cd my-app
```

3. Install dependencies
```bash
npm install
```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

For production build:
```bash
npm run build
```

For Tomcat deployment:
```bash
npm run build:tomcat
```

For Vercel deployment:
```bash
npm run build:vercel
```

## Project Structure

```
my-app/
├── dist/                  # Build output
├── node_modules/          # Dependencies
├── public/                # Static assets
├── src/
│   ├── api/               # API integration (Splunk, etc.)
│   ├── assets/            # Images, fonts, etc.
│   ├── components/
│   │   ├── AiLogAnalysis/     # AI Log Analysis mode components
│   │   │   ├── components/    # Sub-components (ApiSettings, ChatUI, StatusLog)
│   │   │   ├── constants/     # Constants for AI features
│   │   │   ├── hooks/         # Custom hooks (useAiStreaming)
│   │   │   └── utils/         # Utility functions for AI features
│   │   ├── FlowDiagramVisualizer/  # Flow Diagram mode components
│   │   │   ├── CustomNodes/   # Custom node types (StepNode)
│   │   │   └── hooks/         # Custom hooks (useFlowDiagram)
│   │   │   └── (other specific components like StepPanel, Modals, etc.)
│   │   ├── LogAnalyzer/       # Log Analyzer mode components
│   │   │   ├── utils/         # Utility functions for Log Analyzer
│   │   │   └── (other specific components like FileAnalysis, SplunkAnalysis, etc.)
│   │   ├── StateMachineVisualizer/ # State machine mode components
│   │   │   ├── hooks/         # Custom hooks (useStateMachine, useSimulation)
│   │   │   └── utils/         # Utility functions for State Machine
│   │   │   └── (other specific components like StatePanel, RulesPanel, Modals, etc.)
│   │   ├── ui/                # Shared UI components (Button, Dialog, Card, etc.)
│   │   ├── App.jsx            # Main application component
│   │   ├── ErrorBoundary.jsx  # Error handling component
│   │   ├── LandingPage.jsx    # Initial mode selection page
│   │   ├── ModeCard.jsx       # Card component for mode selection
│   │   ├── ModeSelector.jsx   # Logic for mode selection
│   │   └── ThemeProvider.jsx  # Theme management
│   ├── lib/                   # Third-party integrations (if any, beyond node_modules)
│   ├── styles/                # Global and custom styles
│   ├── utils/                 # Global utility functions
│   ├── App.css
│   ├── index.css
│   └── main.jsx               # Application entry point
├── .gitignore
├── eslint.config.js
├── index.html                 # HTML template
├── package.json               # Dependencies and scripts
├── postcss.config.js          # PostCSS configuration
├── tailwind.config.js         # Tailwind CSS configuration
└── vite.config.js             # Vite configuration
```

## Architecture

The application follows a component-based architecture using React:

1. The entry point is `main.jsx`, which renders the `App` component
2. `App` manages the application mode (state machine, flow diagram, log analyzer)
3. Each visualization mode is a separate container component
4. Custom hooks provide isolated state management for specific features
5. Context is used for theme management and shared state
6. Components utilize UI components from Radix UI and shadcn/ui

## Core Components

### App Component
- Manages mode selection and renders appropriate visualizer
- Integrates with ThemeProvider for dark/light mode
- Implements error boundary for error handling

### State Machine Visualizer
- Core component for state machine visualization
- Uses `useStateMachine` hook for state management
- Renders `StatePanel`, `RulesPanel` and other sub-components
- Manages modals for simulation, path finding, etc.

### Flow Diagram Visualizer
- Core component for flow diagram visualization
- Uses `useFlowDiagram` hook for state management
- Leverages ReactFlow for node and edge visualization
- Implements auto-layout with Dagre

### Log Analyzer
- Provides log analysis functionality
- Integrates with Splunk API for remote logs
- Uses pattern matching for log analysis

### AI Log Analysis
- Provides AI-powered log analysis functionality
- Uses AI/LLMs for intelligent insights
- Supports chunking, streaming, and API key configuration
- Customizable API settings and log size management

## Data Formats

### State Machine CSV Format

Required columns:
- "Source Node": Starting state name
- "Destination Node": Target state name
- "Rule List": Transition condition

Additional columns are preserved during import/export.

### Excel Dictionaries

State Dictionary Format:
- State Name
- Description

Rule Dictionary Format:
- Rule Condition
- Description

## Deployment Options

### Local Development
```bash
npm run dev
```

### Tomcat Deployment

1. Build for Tomcat:
```bash
npm run build:tomcat
```

2. Set up Tomcat directory structure:
```bash
mkdir "%TOMCAT_HOME%\webapps\visualizer"
mkdir "%TOMCAT_HOME%\webapps\visualizer\META-INF"
mkdir "%TOMCAT_HOME%\webapps\visualizer\WEB-INF"
```

3. Copy dist contents to Tomcat directory:
```bash
copy dist\* "%TOMCAT_HOME%\webapps\visualizer\"
```

4. Create required config files (context.xml and web.xml)

5. Start Tomcat:
```bash
"%TOMCAT_HOME%\bin\startup.bat"
```

### Vercel Deployment

Configuration in `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

## Developer Guidelines

### Code Style
- ESLint configuration is provided in `eslint.config.js`
- Follow React best practices for component structure
- Use custom hooks for logic separation
- Utilize Tailwind CSS for styling

### Adding Features
1. Create new components in the appropriate directory
2. Use custom hooks for state management
3. Follow existing patterns for consistency
4. Update documentation as needed

### Testing
- Manual testing via development server
- Test all features in both dark and light mode
- Verify CSV import/export functionality
- Check responsive design on different screen sizes

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
   # Should be v18.17.0 or higher
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
- Open an issue or discussion on the [GitHub repository](https://github.com/yourusername/state-machine-visualizer)