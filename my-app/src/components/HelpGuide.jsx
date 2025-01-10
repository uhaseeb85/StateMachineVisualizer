import React from 'react';
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';

const HelpGuide = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-3/4 max-h-[80vh] overflow-y-auto relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute right-2 top-2 text-gray-500 hover:text-gray-700 
                   dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="w-4 h-4" />
        </Button>

        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          Help Guide
        </h2>

        <div className="space-y-6 text-gray-700 dark:text-gray-300">
          <section>
            <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">Getting Started</h3>
            <p className="mb-2">The State Machine Visualizer helps you create and manage state machines with a simple interface.</p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Start by creating states using the "Add" button in the States section</li>
              <li>Select a state to manage its rules</li>
              <li>Add rules to define state transitions</li>
            </ol>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">Features</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Create and manage states</li>
              <li>Define transition rules between states</li>
              <li>Save configurations locally</li>
              <li>Import/Export functionality</li>
              <li>Dark/Light mode toggle</li>
              <li>Simulation mode</li>
              <li>Feedback submission</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">How to Use</h3>
            <div className="space-y-2">
              <p><strong>Creating States:</strong> Enter a state name and click "Add" to create a new state.</p>
              <p><strong>Adding Rules:</strong> Select a state and click "Add Rule" to create transition rules.</p>
              <p><strong>Simulation:</strong> Use the "Simulate" button to test your state machine.</p>
              <p><strong>Saving:</strong> Click "Save Flow" to store your configuration locally.</p>
              <p><strong>Import/Export:</strong> Use these features to backup or share your configurations.</p>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">Troubleshooting</h3>
            <div className="space-y-2">
              <p><strong>Lost Configuration:</strong> Use the Import feature to restore a previously exported configuration.</p>
              <p><strong>States Not Saving:</strong> Ensure you click the "Save Flow" button after making changes.</p>
              <p><strong>Import Issues:</strong> Verify the format of your import file matches the export format.</p>
              <p><strong>Simulation Problems:</strong> Ensure all states have valid transition rules defined.</p>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">Tips</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Use descriptive state names for better clarity</li>
              <li>Export your configuration regularly as a backup</li>
              <li>Test your state machine using the simulation feature</li>
              <li>Use the feedback form to report issues or suggest improvements</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HelpGuide; 