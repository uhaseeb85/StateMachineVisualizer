export const tourSteps = [
  {
    target: '.theme-toggle',
    content: 'Switch between light and dark mode for comfortable viewing in any environment.',
    title: '🌓 Theme Toggle',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.save-action-button',
    content: 'Save your current state machine configuration. Your work is automatically preserved between sessions.',
    title: '💾 Save Configuration',
    placement: 'bottom',
  },
  {
    target: '.export-csv-button',
    content: 'Export your state machine as a CSV file that you can share or import later.',
    title: '📤 Export to CSV',
    placement: 'bottom',
  },
  {
    target: '.excel-import-button',
    content: 'Import states and rules from a CSV file. The file should include Source Node, Destination Node, and Rule List columns.',
    title: '📥 Import from CSV',
    placement: 'bottom',
  },
  {
    target: '.load-state-dictionary-button',
    content: 'Load descriptions for your states from an Excel file. This helps document what each state represents and its purpose in the flow.',
    title: '📖 State Dictionary',
    placement: 'right',
  },
  {
    target: '.load-rule-dictionary-button',
    content: 'Load descriptions for your rules from an Excel file. This helps document the conditions and logic behind each transition rule.',
    title: '📝 Rule Dictionary',
    placement: 'right',
  },
  {
    target: '.local-history-button',
    content: 'View a chronological history of all changes made to your state machine. You can export the history or clear it if needed.',
    title: '📜 Local History',
    placement: 'bottom',
  },
  {
    target: '.log-analyzer-button',
    content: 'Analyze logs to understand state machine behavior. Supports both local files and Splunk integration.',
    title: '🔍 Log Analysis',
    placement: 'bottom',
  },
  {
    target: '.find-paths-button',
    content: 'Find all possible paths between states. Helps validate your flow and identify potential issues.',
    title: '🛣️ Path Finding',
    placement: 'bottom',
  },
  {
    target: '.simulation-button',
    content: 'Test your state machine by running an interactive simulation. See how states transition based on your rules.',
    title: '▶️ Simulation',
    placement: 'bottom',
  },
  {
    target: '.states-list',
    content: 'View and manage your states here. Click a state to edit its properties and rules.',
    title: '📋 States Panel',
    placement: 'right',
  },
  {
    target: '.rules-section',
    content: 'Define and manage transition rules between states. Each rule specifies when and how states can transition to other states.',
    title: '📐 Rules Panel',
    placement: 'right',
  }
]; 