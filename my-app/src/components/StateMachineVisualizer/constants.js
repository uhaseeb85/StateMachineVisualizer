export const tourSteps = [
  {
    target: '.getting-started-button',
    content: 'Welcome to State Machine Visualizer! This interactive tour will help you understand all the features available.',
    title: '👋 Welcome',
    disableBeacon: true,
    placement: 'bottom',
  },
  {
    target: '.save-button',
    content: 'Save your state machine configuration to browser storage. Your work is automatically preserved between sessions.',
    title: '💾 Save',
    placement: 'bottom',
  },
  {
    target: '.theme-toggle',
    content: 'Toggle between light and dark mode for comfortable viewing in any environment.',
    title: '🌓 Theme Toggle',
    placement: 'bottom',
  },
  {
    target: '.export-button',
    content: 'Export your state machine as a JSON file that you can share or import later.',
    title: '📤 Export',
    placement: 'bottom',
  },
  {
    target: '.import-button',
    content: 'Import a previously exported JSON state machine configuration.',
    title: '📥 Import',
    placement: 'bottom',
  },
  {
    target: '.excel-import-button',
    content: 'Import states and rules from an Excel/CSV file. The file should include columns for Source State, Destination State, and Rules.',
    title: '📊 Excel Import',
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
    target: '.simulation-button',
    content: 'Test your state machine by running an interactive simulation. You can see how states transition based on your rules.',
    title: '▶️ Simulation',
    placement: 'bottom',
  },
  {
    target: '.find-paths-button',
    content: 'Analyze your state machine by finding all possible paths between states. This helps validate your flow and identify potential issues.',
    title: '🔍 Pathfinder',
    placement: 'bottom',
  },
  {
    target: '.state-input',
    content: 'Create new states by entering a name here and clicking the + button.',
    title: '➕ Add States',
    placement: 'bottom',
  },
  {
    target: '.states-list',
    content: 'Your states appear here. Click a state to select it and manage its rules. The number shows how many rules each state has.',
    title: '📋 States List',
    placement: 'bottom',
  },
  {
    target: '.rules-section',
    content: 'After selecting a state, add rules here to define when and where it can transition to other states.',
    title: '⚡ Rules Management',
    placement: 'bottom',
  }
]; 