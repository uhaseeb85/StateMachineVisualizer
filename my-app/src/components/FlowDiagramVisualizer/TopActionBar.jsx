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
  onClear,
  onImport,
  onExport,
  onSave,
  steps,
  connections,
  // New props for file history
  currentFileName,
  fileHistory,
  onSelectFile,
  onFileExists,
  onRemoveFile
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

  // Filter root level elements (steps with parentId === null)
  const rootElements = steps ? steps.filter(step => step.parentId === null) : [];

  const handleImport = async (event) => {
    console.log('Import triggered with event:', event);
    const file = event.target.files?.[0];
    if (file) {
      console.log('Selected file:', file);
      if (!file.name.endsWith('.csv') && !file.name.endsWith('.zip')) {
        toast.error('Please select a CSV or ZIP file');
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
                title="Export as ZIP file"
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
                Export as ZIP
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
                  accept=".csv,.zip"
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
            {/* Generate Flow Diagram Button with Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <Button
                onClick={() => setShowGenerateDropdown(!showGenerateDropdown)}
                title="Generate Flow Diagram"
                className="generate-diagram-button bg-purple-600 text-white text-sm
                       hover:bg-purple-500 hover:scale-105
                       dark:bg-purple-700 dark:hover:bg-purple-600
                       transform transition-all duration-200
                       flex items-center gap-2 px-3 py-1.5 rounded-md"
              >
                <GitBranch className="w-4 h-4" />
                Generate Flow Diagram
              </Button>
              
              {showGenerateDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700">
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Select Root Element</h3>
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto">
                    {rootElements.length > 0 ? (
                      <div className="p-2">
                        {rootElements.map(element => (
                          <div 
                            key={element.id} 
                            className={`p-2 cursor-pointer rounded-md transition-colors ${
                              selectedRootElement?.id === element.id 
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' 
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'
                            }`}
                            onClick={() => setSelectedRootElement(element)}
                          >
                            {element.name}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                        No root elements found. Add a root step first.
                      </div>
                    )}
                  </div>
                  
                  <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                    <Button
                      onClick={() => setShowGenerateDropdown(false)}
                      variant="outline"
                      className="text-sm py-1 h-8"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleGenerateFlowDiagram}
                      disabled={!selectedRootElement}
                      className="text-sm py-1 h-8 bg-blue-600 hover:bg-blue-500 text-white"
                    >
                      Generate
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Analysis Tools Button */}
            <Button
              onClick={handleOpenAnalysisTools}
              title="Access analysis tools like Simulation and Pathfinder"
              className="analysis-tools-button bg-indigo-600 text-white text-sm
                       hover:bg-indigo-500 hover:scale-105
                       dark:bg-indigo-700 dark:hover:bg-indigo-600
                       transform transition-all duration-200
                       flex items-center gap-2 px-3 py-1.5 rounded-md"
            >
              <Settings className="w-4 h-4" />
              Analysis Tools
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
        onSimulate={onSimulate}
        onFindPath={onFindPath}
      />
    </div>
  );
};

TopActionBar.propTypes = {
  onChangeMode: PropTypes.func.isRequired,
  onSimulate: PropTypes.func.isRequired,
  onFindPath: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
  onImport: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  steps: PropTypes.array,
  connections: PropTypes.array,
  // New props for file history
  currentFileName: PropTypes.string,
  fileHistory: PropTypes.array,
  onSelectFile: PropTypes.func,
  onFileExists: PropTypes.func,
  onRemoveFile: PropTypes.func
};

export default TopActionBar; 