import React from 'react';
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';

export default function UserGuideModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">State Machine Visualizer User Guide</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="space-y-8">
            {/* Getting Started */}
            <section>
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">🚀 Getting Started</h3>
              <div className="space-y-4 text-gray-600 dark:text-gray-300">
                <p>The State Machine Visualizer helps you design, visualize, and test state machines. Here's how to get started:</p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Add states using the States panel on the left</li>
                  <li>Select a state to add rules in the Rules panel</li>
                  <li>Connect states using rules to create your state machine</li>
                </ol>
              </div>
            </section>

            {/* Key Features */}
            <section>
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">🎯 Key Features</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">States Management</h4>
                  <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1">
                    <li>Create states with unique names</li>
                    <li>Import predefined states using State Dictionary</li>
                    <li>Delete states when no longer needed</li>
                    <li>View state descriptions when using dictionary</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Rules Management</h4>
                  <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1">
                    <li>Add rules to define state transitions</li>
                    <li>Import rule definitions using Rule Dictionary</li>
                    <li>Edit or delete existing rules</li>
                    <li>View rule descriptions when using dictionary</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Tools & Features</h4>
                  <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1">
                    <li>Simulate: Test your state machine's behavior</li>
                    <li>Pathfinder: Find all possible paths between states</li>
                    <li>Save/Load: Preserve your work</li>
                    <li>Import/Export: Share configurations with others</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Common Tasks */}
            <section>
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">📝 Common Tasks</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Adding States and Rules</h4>
                  <ol className="list-decimal list-inside text-gray-600 dark:text-gray-300 space-y-1">
                    <li>Enter a state name in the States panel and click "+"</li>
                    <li>Select the state you want to add rules to</li>
                    <li>Enter rule condition and select target state</li>
                    <li>Click "+" to add the rule</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Using Dictionaries</h4>
                  <ol className="list-decimal list-inside text-gray-600 dark:text-gray-300 space-y-1">
                    <li>Prepare Excel file with required columns (state/rule, description)</li>
                    <li>Click "Load State/Rule Dictionary"</li>
                    <li>Select your Excel file</li>
                    <li>View descriptions by clicking on states/rules</li>
                  </ol>
                </div>
              </div>
            </section>

            {/* Troubleshooting */}
            <section>
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">🔧 Troubleshooting</h3>
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Common Issues & Solutions</h4>
                  <div className="space-y-3 text-gray-600 dark:text-gray-300">
                    <div>
                      <p className="font-medium">Dictionary import fails:</p>
                      <ul className="list-disc list-inside ml-4">
                        <li>Ensure Excel file has correct column headers</li>
                        <li>Check file format (.xlsx or .xls)</li>
                        <li>Verify file is not corrupted</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium">Can't add state/rule:</p>
                      <ul className="list-disc list-inside ml-4">
                        <li>Check for duplicate names</li>
                        <li>Ensure all required fields are filled</li>
                        <li>Verify target state exists</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium">Simulation not working:</p>
                      <ul className="list-disc list-inside ml-4">
                        <li>Verify all states are connected</li>
                        <li>Check rule conditions are valid</li>
                        <li>Ensure no circular dependencies</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Tips & Best Practices */}
            <section>
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">💡 Tips & Best Practices</h3>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li>Save your work frequently using the Save button</li>
                <li>Use meaningful names for states and rules</li>
                <li>Test your state machine using the Simulation feature</li>
                <li>Verify paths using the Pathfinder before implementation</li>
                <li>Keep state machines modular and focused</li>
                <li>Document complex rules using the dictionary feature</li>
              </ul>
            </section>

            {/* Adding new detailed sections for Simulation and Pathfinder */}
            <section className="space-y-8">
              {/* Simulation Feature */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  🎮 Using the Simulation Feature
                </h3>
                <div className="space-y-4 text-gray-600 dark:text-gray-300">
                  <p>The Simulation feature allows you to test your state machine's behavior in real-time.</p>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">How to Run a Simulation:</h4>
                    <ol className="list-decimal list-inside space-y-2">
                      <li>Click the "Simulate" button in the top toolbar</li>
                      <li>In the simulation modal:
                        <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                          <li>Select your starting state</li>
                          <li>Choose which rules are "active" by toggling them</li>
                          <li>Watch the state transitions happen based on your active rules</li>
                        </ul>
                      </li>
                      <li>The simulation will show:
                        <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                          <li>Current state (highlighted)</li>
                          <li>Available transitions based on active rules</li>
                          <li>Next possible states</li>
                        </ul>
                      </li>
                    </ol>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Tips for Effective Simulation:</h4>
                    <ul className="list-disc list-inside space-y-2">
                      <li>Start with a simple set of active rules to understand basic flows</li>
                      <li>Gradually activate more rules to test complex scenarios</li>
                      <li>Use simulation to verify that:
                        <ul className="list-disc list-inside ml-6 mt-1">
                          <li>States transition as expected</li>
                          <li>No unwanted state transitions occur</li>
                          <li>Dead ends are intentional</li>
                        </ul>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Pathfinder Feature */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  🔍 Using the Pathfinder Feature
                </h3>
                <div className="space-y-4 text-gray-600 dark:text-gray-300">
                  <p>The Pathfinder helps you discover and analyze all possible paths between states in your state machine.</p>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">How to Use Pathfinder:</h4>
                    <ol className="list-decimal list-inside space-y-2">
                      <li>Click the "Pathfinder" button in the top toolbar</li>
                      <li>In the pathfinder modal:
                        <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                          <li>Select your source (starting) state</li>
                          <li>Select your target (ending) state</li>
                          <li>Click "Find Paths" to analyze</li>
                        </ul>
                      </li>
                      <li>Understanding the results:
                        <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                          <li>Green checkmarks (✓) show successful rules that allow the transition</li>
                          <li>Red crosses (❌) show rules that were evaluated but didn't pass</li>
                          <li>Arrows (→) show the direction of state transitions</li>
                          <li>Each path shows the complete sequence of states and rules</li>
                        </ul>
                      </li>
                    </ol>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Key Benefits of Pathfinder:</h4>
                    <ul className="list-disc list-inside space-y-2">
                      <li>Identify all possible ways to reach a target state</li>
                      <li>Debug complex state machines by understanding:
                        <ul className="list-disc list-inside ml-6 mt-1">
                          <li>Which rules are preventing transitions</li>
                          <li>Whether unwanted paths exist</li>
                          <li>If states are unreachable</li>
                        </ul>
                      </li>
                      <li>Optimize state transitions by finding:
                        <ul className="list-disc list-inside ml-6 mt-1">
                          <li>Shortest paths between states</li>
                          <li>Redundant rules or transitions</li>
                          <li>Missing connections</li>
                        </ul>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Pro Tips:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Use Pathfinder before implementing your state machine to validate the design</li>
                      <li>Regularly check paths after adding new states or rules</li>
                      <li>Look for unexpected paths that might indicate logic errors</li>
                      <li>Use the results to document all possible flows in your system</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
} 