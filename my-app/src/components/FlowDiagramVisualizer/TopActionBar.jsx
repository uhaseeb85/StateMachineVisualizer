import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import {
  Play,
  Route,
  Trash2,
  Download,
  Upload,
  SwitchCamera,
  Moon,
  Sun,
  Save,
  GitBranch,
  Settings
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { toast } from 'sonner';
import { useState, useRef, useEffect } from 'react';
import GenerateFlowDiagramModal from './GenerateFlowDiagramModal';
import FlowDiagramToolsModal from './FlowDiagramToolsModal';
import FileHistoryDropdown from './FileHistoryDropdown';

const TopActionBar = ({
  onChangeMode,
  onSimulate,
  onFindPath,
  onShowMissingConnections,
  onShowAllAssumptionsQuestions,
  onShowActionHistory,
  onShowComparer,
  actionHistoryCount,
  onClear,
  onImport,
  onExport,
  onSave,
  steps,
  connections,
  // File history props
  currentFileName,
  fileHistory,
  onSelectFile,
  onFileExists,
  onRemoveFile,
  onClearHistory
}) => {
  const { theme, setTheme } = useTheme();
  const [showGenerateDropdown, setShowGenerateDropdown] = useState(false);
  const [selectedRootElement, setSelectedRootElement] = useState(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const dropdownRef = useRef(null);
  const [showAnalysisToolsModal, setShowAnalysisToolsModal] = useState(false);


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowGenerateDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Include all steps (both root and sub-steps) for flow diagram generation
  const rootElements = steps || [];

  const handleImport = async (event) => {
    console.log('Import triggered with event:', event);
    const file = event.target.files?.[0];
    if (file) {
      console.log('Selected file:', file);
      if (!file.name.endsWith('.csv') && !file.name.endsWith('.zip') && !file.name.endsWith('.json')) {
        toast.error('Please select a CSV, JSON, or ZIP file');
        return;
      }
      try {
        await onImport(file);
        toast.success('Flow diagram imported successfully');
        // Reset the file input
        event.target.value = '';
      } catch (error) {
        console.error('Import error:', error);
        toast.error(error.message || 'Error importing flow diagram');
        // Reset the file input
        event.target.value = '';
      }
    }
  };

  const handleExport = () => {
    onExport();
    toast.success('Flow diagram exported successfully');
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all steps? This action cannot be undone.')) {
      onClear();
      toast.success('Flow diagram cleared');
    }
  };

  const handleGenerateFlowDiagram = () => {
    if (!selectedRootElement) {
      toast.error('Please select a root element first');
      return;
    }
    
    // Close dropdown
    setShowGenerateDropdown(false);
    
    // Show the generate flow diagram modal
    setShowGenerateModal(true);
  };

  // Handlers for the Analysis Tools modal
  const handleOpenAnalysisTools = () => {
    setShowAnalysisToolsModal(true);
  };

  const handleCloseAnalysisTools = () => {
    setShowAnalysisToolsModal(false);
  };

  return (
    <div className="mb-8 p-6 
                    bg-gray-100 dark:bg-gray-900
                    border-b border-gray-200 dark:border-gray-700
                    shadow-lg">
      <div className="flex flex-wrap items-center justify-between">
        {/* Left Section: Theme and Core Actions */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle Button */}
          <Button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle between light and dark mode"
            variant="ghost"
            className="theme-toggle w-10 h-10 p-0 text-gray-900 
                     dark:bg-white dark:text-gray-900 dark:hover:bg-blue-600 dark:hover:text-white
                     transform transition-all duration-200 hover:scale-110"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-yellow-500" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* File History Dropdown */}
          <FileHistoryDropdown
            currentFileName={currentFileName}
            fileHistory={fileHistory}
            onSelectFile={onSelectFile}
            onFileExists={onFileExists}
            onRemoveFile={onRemoveFile}
            onClearHistory={onClearHistory}
          />

          {/* Visual Separator */}
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

          {/* Core Actions Group */}
          <div className="flex flex-wrap gap-4">
            {/* Save Button */}
            <Button 
              onClick={() => onSave()}
              title="Save your current flow diagram"
              className="save-action-button bg-gray-900 text-white text-sm
                      dark:bg-gray-800 dark:text-gray-100
                      hover:bg-blue-600 hover:scale-105
                      dark:hover:bg-blue-600
                      transform transition-all duration-200 ease-in-out
                      border border-gray-800 dark:border-gray-700
                      hover:border-blue-500 dark:hover:border-blue-500
                      flex items-center gap-2 px-3 py-1.5 rounded-md"
            >
              <Save className="w-4 h-4" />
              Save
            </Button>

            {/* Import/Export Section */}
            <div className="flex gap-2">
              <Button
                onClick={handleExport}
                title="Export as JSON (no images) or ZIP (with images)"
                className="export-csv-button bg-gray-900 text-white text-sm
                         dark:bg-gray-800 dark:text-gray-100
                         hover:bg-blue-600 hover:scale-105
                         dark:hover:bg-blue-600
                         transform transition-all duration-200 ease-in-out
                         border border-gray-800 dark:border-gray-700
                         hover:border-blue-500 dark:hover:border-blue-500
                         flex items-center gap-2 px-3 py-1.5 rounded-md"
              >
                <Upload className="w-4 h-4" />
                Export
              </Button>

              <div className="relative">
                <Button
                  onClick={() => document.getElementById('file-import').click()}
                  title="Import flow diagram"
                  className="excel-import-button bg-gray-900 text-white text-sm
                           dark:bg-gray-800 dark:text-gray-100
                           hover:bg-blue-600 hover:scale-105
                           dark:hover:bg-blue-600
                           transform transition-all duration-200 ease-in-out
                           border border-gray-800 dark:border-gray-700
                           hover:border-blue-500 dark:hover:border-blue-500
                           flex items-center gap-2 px-3 py-1.5 rounded-md"
                >
                  <Download className="w-4 h-4" />
                  Import Diagram
                </Button>
                <input
                  type="file"
                  id="file-import"
                  className="hidden"
                  accept=".csv,.zip,.json"
                  onChange={handleImport}
                />
              </div>

              <Button
                onClick={handleClear}
                title="Clear All Steps"
                className="clear-button bg-gray-900 text-white text-sm
                         dark:bg-gray-800 dark:text-gray-100
                         hover:bg-red-600 hover:scale-105
                         dark:hover:bg-red-600
                         transform transition-all duration-200 ease-in-out
                         border border-gray-800 dark:border-gray-700
                         hover:border-red-500 dark:hover:border-red-500
                         flex items-center gap-2 px-3 py-1.5 rounded-md"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </Button>
            </div>
          </div>
        </div>

        {/* Right Section: Tools */}
        <div className="flex items-center gap-4">
          {/* Tools Group */}
          <div className="flex gap-4">
            {/* Simulation Button */}
            <Button
              onClick={onSimulate}
              title="Run simulation of the flow diagram"
              className="simulation-button bg-green-600 text-white text-sm
                       hover:bg-green-500 hover:scale-105
                       dark:bg-green-700 dark:hover:bg-green-600
                       transform transition-all duration-200
                       flex items-center gap-2 px-3 py-1.5 rounded-md"
            >
              <Play className="w-4 h-4" />
              Simulation
            </Button>

            {/* Analysis Tools Button */}
            <Button
              onClick={handleOpenAnalysisTools}
              title="Access analysis tools like Pathfinder and Generate Flow Diagram"
              className="analysis-tools-button bg-indigo-600 text-white text-sm
                       hover:bg-indigo-500 hover:scale-105
                       dark:bg-indigo-700 dark:hover:bg-indigo-600
                       transform transition-all duration-200
                       flex items-center gap-2 px-3 py-1.5 rounded-md"
            >
              <Settings className="w-4 h-4" />
              Tools
            </Button>



            {/* Mode Switch Button */}
            <Button
              onClick={onChangeMode}
              title="Switch Visualization Mode"
              className="mode-switch-button bg-gray-900 text-white text-sm
                       hover:bg-gray-800 hover:scale-105
                       dark:bg-gray-800 dark:hover:bg-gray-700
                       transform transition-all duration-200
                       flex items-center gap-2 px-3 py-1.5 rounded-md"
            >
              <SwitchCamera className="w-4 h-4" />
              Switch Mode
            </Button>
          </div>
        </div>
      </div>

      {/* Generate Flow Diagram Modal */}
      <GenerateFlowDiagramModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        rootElement={selectedRootElement}
        steps={steps}
        connections={connections}
      />

      {/* Analysis Tools Modal */}
      <FlowDiagramToolsModal 
        isOpen={showAnalysisToolsModal}
        onClose={handleCloseAnalysisTools}
        onFindPath={onFindPath}
        onShowMissingConnections={onShowMissingConnections}
        onShowAllAssumptionsQuestions={onShowAllAssumptionsQuestions}
        onShowActionHistory={onShowActionHistory}
        onShowComparer={onShowComparer}
        actionHistoryCount={actionHistoryCount}
        steps={steps}
        // Pass needed props for Generate Flow Diagram
        rootElements={rootElements}
        selectedRootElement={selectedRootElement}
        setSelectedRootElement={setSelectedRootElement}
        onGenerateFlowDiagram={handleGenerateFlowDiagram}
      />


    </div>
  );
};

TopActionBar.propTypes = {
  onChangeMode: PropTypes.func.isRequired,
  onSimulate: PropTypes.func.isRequired,
  onFindPath: PropTypes.func.isRequired,
  onShowMissingConnections: PropTypes.func.isRequired,
  onShowAllAssumptionsQuestions: PropTypes.func.isRequired,
  onShowActionHistory: PropTypes.func.isRequired,
  onShowComparer: PropTypes.func.isRequired,
  actionHistoryCount: PropTypes.number,
  onClear: PropTypes.func.isRequired,
  onImport: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  steps: PropTypes.array,
  connections: PropTypes.array,
  // File history props
  currentFileName: PropTypes.string,
  fileHistory: PropTypes.array,
  onSelectFile: PropTypes.func,
  onFileExists: PropTypes.func,
  onRemoveFile: PropTypes.func,
  onClearHistory: PropTypes.func
};

export default TopActionBar;
