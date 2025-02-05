export const tourSteps = [
  {
    target: '.getting-started-button',
    content: 'Welcome to State Machine Visualizer! This interactive tour will help you understand all the features available.',
    title: '👋 Welcome',
    disableBeacon: true,
    placement: 'bottom',
  },
  {
    target: '.theme-toggle',
    content: 'Toggle between light and dark mode for comfortable viewing in any environment.',
    title: '🌓 Theme Toggle',
    placement: 'bottom',
  },
  {
    target: '.save-button',
    content: 'Save your state machine configuration to browser storage. Your work is automatically preserved between sessions.',
    title: '💾 Save',
    placement: 'bottom',
  },
  {
    target: '.export-csv-button',
    content: 'Export your state machine as a CSV file that you can share or import later.',
    title: '📤 Export CSV',
    placement: 'bottom',
  },
  {
    target: '.excel-import-button',
    content: 'Import states and rules from a CSV file. The file should include columns for Source Node, Destination Node, and Rule List.',
    title: '📥 Import CSV',
    placement: 'bottom',
  },
  {
    target: '.load-state-dictionary-button',
    content: 'Load descriptions for your states from an Excel file. This helps document what each state represents.',
    title: '📖 State Dictionary',
    placement: 'bottom',
  },
  {
    target: '.load-rule-dictionary-button',
    content: 'Load descriptions for your rules from an Excel file. This helps document what each rule means and does.',
    title: '📝 Rule Dictionary',
    placement: 'bottom',
  },
  {
    target: '.find-paths-button',
    content: 'Analyze your state machine by finding all possible paths between states. This helps validate your flow and identify potential issues.',
    title: '🔍 Pathfinder',
    placement: 'bottom',
  },
  {
    target: '.simulation-button',
    content: 'Test your state machine by running an interactive simulation. You can see how states transition based on your rules.',
    title: '▶️ Simulation',
    placement: 'bottom',
  },
  {
    target: '.canvas-container',
    content: 'This is your workspace. Double-click anywhere to create a new state. Connect states by dragging from one node to another.',
    title: '🎨 Canvas',
    placement: 'bottom',
  }
]; 