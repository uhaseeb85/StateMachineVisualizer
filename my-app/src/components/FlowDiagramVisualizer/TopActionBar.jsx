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
  HelpCircle
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { toast } from 'sonner';

const TopActionBar = ({
  onChangeMode,
  onSimulate,
  onFindPath,
  onClear,
  onImport,
  onExport,
  onSave,
  startTour
}) => {
  const { theme, setTheme } = useTheme();

  const handleImport = async (event) => {
    console.log('Import triggered with event:', event);
    const file = event.target.files?.[0];
    if (file) {
      console.log('Selected file:', file);
      if (!file.name.endsWith('.csv')) {
        toast.error('Please select a CSV file');
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

  return (
    <div className="mb-8 p-6 
                  bg-gray-800/50 backdrop-blur-sm
                  border border-gray-700
                  rounded-xl shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left Section: Core Actions */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle Button */}
          <Button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle between light and dark mode"
            variant="ghost"
            className="w-10 h-10 p-0 text-gray-300 
                     hover:bg-gray-700 hover:text-white
                     transform transition-all duration-200 hover:scale-110"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* Tour Button */}
          <Button
            onClick={startTour}
            title="Start guided tour"
            variant="ghost"
            className="w-10 h-10 p-0 text-gray-300 
                     hover:bg-gray-700 hover:text-white
                     transform transition-all duration-200 hover:scale-110"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>

          {/* Save Button */}
          <Button
            onClick={onSave}
            title="Save flow to browser storage"
            variant="ghost"
            className="text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <Save className="h-5 w-5 mr-2" />
            Save
          </Button>

          {/* Import Button */}
          <div className="relative">
            <input
              type="file"
              id="flow-import"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleImport}
              accept=".csv"
            />
            <Button
              title="Import from CSV"
              variant="ghost"
              className="text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <Upload className="h-5 w-5 mr-2" />
              Import
            </Button>
          </div>

          {/* Export Button */}
          <Button
            onClick={onExport}
            title="Export to CSV"
            variant="ghost"
            className="text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <Download className="h-5 w-5 mr-2" />
            Export
          </Button>
        </div>

        {/* Right Section: Tools and Mode Switch */}
        <div className="flex items-center gap-4">
          {/* Simulate Button */}
          <Button
            onClick={onSimulate}
            title="Simulate flow execution"
            variant="ghost"
            className="text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <Play className="h-5 w-5 mr-2" />
            Simulate
          </Button>

          {/* Find Path Button */}
          <Button
            onClick={onFindPath}
            title="Find paths between steps"
            variant="ghost"
            className="text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <Route className="h-5 w-5 mr-2" />
            Find Path
          </Button>

          {/* Clear Button */}
          <Button
            onClick={handleClear}
            title="Clear all steps"
            variant="ghost"
            className="text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <Trash2 className="h-5 w-5 mr-2" />
            Clear
          </Button>

          {/* Change Mode Button */}
          <Button
            onClick={onChangeMode}
            title="Switch to State Machine mode"
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
          >
            <SwitchCamera className="h-5 w-5 mr-2" />
            Change Mode
          </Button>
        </div>
      </div>
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
  startTour: PropTypes.func.isRequired
};

export default TopActionBar; 