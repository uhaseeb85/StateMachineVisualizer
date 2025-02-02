export const tourSteps = [
  {
    target: '.getting-started-button',
    content: 'Welcome to State Machine Visualizer! This tour will help you get started.',
    disableBeacon: true,
  },
  {
    target: '.load-state-dictionary-button',
    content: 'Load a state dictionary from Excel to add descriptions to your states. The Excel file should have "state" and "description" columns.',
  },
  {
    target: '.state-input',
    content: 'Start by adding a state name here',
  },
  {
    target: '.add-state-button',
    content: 'Click this button to add your state',
  },
  {
    target: '.states-list',
    content: 'Your states will appear here. Click on a state to manage its rules',
  },
  {
    target: '.load-rule-dictionary-button',
    content: 'Load a rule dictionary from Excel to add descriptions to your rules. The Excel file should have "rule name" and "rule description" columns.',
  },
  {
    target: '.rules-section',
    content: 'Once you select a state, you can add rules here to define transitions to other states',
  },
  {
    target: '.simulation-button',
    content: 'After adding states and rules, click here to simulate your state machine',
  },
  {
    target: '.save-button',
    content: 'Save your work at any time',
  },
  {
    target: '.export-button',
    content: 'Export your state machine configuration as JSON',
  },
  {
    target: '.import-button',
    content: 'Import a previously saved JSON configuration',
  },
  {
    target: '.excel-import-button',
    content: 'You can also import states and rules from an Excel/CSV file. The file should have columns for Source Node, Destination Node, and Rule List.',
  },
  {
    target: '.find-paths-button',
    content: 'Analyze your state machine by finding all possible paths from any state to end states (states with no rules).',
  },
  {
    target: '.theme-toggle',
    content: 'Toggle between light and dark mode',
  }
]; 