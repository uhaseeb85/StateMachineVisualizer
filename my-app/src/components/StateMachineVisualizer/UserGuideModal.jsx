/**
 * UserGuideModal Component
 * 
 * A comprehensive guide modal that provides detailed information about the State Machine Visualizer.
 * The guide is organized into sections covering:
 * - Core functionality
 * - Data management
 * - User interface features
 * - State management workflows
 * - Data import/export procedures
 * - Simulation capabilities
 * - Pathfinder functionality
 * 
 * Each section uses clear headings, lists, and visual organization to make
 * the information easily digestible for users of all experience levels.
 */

import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';

const UserGuideModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header Section */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">State Machine Visualizer Guide</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose} 
            className="h-8 w-8 p-0"
            title="Close guide"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Guide Content */}
        <div className="p-6 overflow-y-auto">
          <div className="space-y-8">
            {/* Core Functionality Section */}
            <section>
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">🎯 Core Functionality</h3>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li>Create, edit, and delete states</li>
                <li>Define transition rules between states</li>
                <li>Visual representation of state relationships</li>
                <li>Real-time state machine simulation</li>
                <li>Path finding and loop detection</li>
              </ul>
            </section>

            {/* Data Management Section */}
            <section>
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">💾 Data Management</h3>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li>CSV/Excel import and export</li>
                <li>Local storage persistence</li>
                <li>Configuration backup and sharing</li>
                <li>Rule dictionary support</li>
              </ul>
            </section>

            {/* User Interface Section */}
            <section>
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">🎨 User Interface</h3>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li>Dark/Light mode toggle</li>
                <li>Responsive design</li>
                <li>Interactive visualization</li>
                <li>Real-time feedback</li>
                <li>User guide and tooltips</li>
              </ul>
            </section>

            {/* State Management Section */}
            <section>
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">📝 State Management</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Creating States</h4>
                  <ol className="list-decimal list-inside text-gray-600 dark:text-gray-300 space-y-1">
                    <li>Enter state name in input field</li>
                    <li>Click &quot;Add&quot; or press Enter</li>
                    <li>States appear in left panel</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Managing Rules</h4>
                  <ol className="list-decimal list-inside text-gray-600 dark:text-gray-300 space-y-1">
                    <li>Select a state to view/edit rules</li>
                    <li>Add rules with conditions and target states</li>
                    <li>Delete or modify existing rules</li>
                  </ol>
                </div>
              </div>
            </section>

            {/* Data Import/Export Section */}
            <section>
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">📤 Data Import/Export</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">CSV Import</h4>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">Required columns:</p>
                  <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 ml-4 space-y-1">
                    <li>&quot;Source Node&quot;</li>
                    <li>&quot;Destination Node&quot;</li>
                    <li>&quot;Rule List&quot;</li>
                  </ul>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">Optional columns:</p>
                  <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 ml-4 space-y-1">
                    <li>&quot;Priority&quot; (numeric values -99 to +99, default: 50)</li>
                  </ul>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">Additional columns are preserved</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">CSV Export</h4>
                  <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1">
                    <li>Exports current configuration</li>
                    <li>Maintains additional columns from import</li>
                    <li>Preserves rule relationships</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Simulation Section */}
            <section>
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">🎮 Simulation</h3>
              <ol className="list-decimal list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li>Click &quot;Simulate&quot; button</li>
                <li>Select starting state</li>
                <li>Follow state transitions</li>
                <li>Use undo for step-back</li>
                <li>View transition history</li>
              </ol>
            </section>

            {/* Pathfinder Section */}
            <section>
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">🔍 Pathfinder</h3>
              <ol className="list-decimal list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li>Access via &quot;Pathfinder&quot; button</li>
                <li>Select source and destination</li>
                <li>View all possible paths</li>
                <li>Analyze transition rules</li>
              </ol>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

UserGuideModal.propTypes = {
  // Modal close handler
  onClose: PropTypes.func.isRequired
};

export default UserGuideModal;
