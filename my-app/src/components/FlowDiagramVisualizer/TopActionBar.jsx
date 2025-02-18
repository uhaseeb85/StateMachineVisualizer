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
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { toast } from 'sonner';

const TopActionBar = ({
  onChangeMode,
  onSimulate,
  onFindPath,
  onClear,
  onImport,
  onExport
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

          {/* Visual Separator */}
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

          {/* Core Actions Group */}
          <div className="flex flex-wrap gap-4">
            {/* Import/Export Section */}
            <div className="flex gap-2">
              <Button
                onClick={handleExport}
                title="Export to CSV"
                className="export-csv-button bg-gray-900 text-white text-sm
                         dark:bg-gray-800 dark:text-gray-100
                         hover:bg-blue-600 hover:scale-105
                         dark:hover:bg-blue-600
                         transform transition-all duration-200 ease-in-out
                         border border-gray-800 dark:border-gray-700
                         hover:border-blue-500 dark:hover:border-blue-500
                         flex items-center gap-2 px-3 py-1.5 rounded-md"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>

              <div className="relative">
                <Button
                  onClick={() => document.getElementById('file-import').click()}
                  title="Import from CSV"
                  className="excel-import-button bg-gray-900 text-white text-sm
                           dark:bg-gray-800 dark:text-gray-100
                           hover:bg-blue-600 hover:scale-105
                           dark:hover:bg-blue-600
                           transform transition-all duration-200 ease-in-out
                           border border-gray-800 dark:border-gray-700
                           hover:border-blue-500 dark:hover:border-blue-500
                           flex items-center gap-2 px-3 py-1.5 rounded-md"
                >
                  <Upload className="w-4 h-4" />
                  Import CSV
                </Button>
                <input
                  type="file"
                  id="file-import"
                  className="hidden"
                  accept=".csv"
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
            <Button
              onClick={onFindPath}
              title="Find paths between steps"
              className="find-paths-button bg-blue-600 text-white text-sm
                       hover:bg-blue-500 hover:scale-105
                       dark:bg-blue-700 dark:hover:bg-blue-600
                       transform transition-all duration-200
                       flex items-center gap-2 px-3 py-1.5 rounded-md"
            >
              <Route className="w-4 h-4" />
              Find Paths
            </Button>

            <Button
              onClick={onSimulate}
              title="Run a simulation"
              className="simulation-button bg-green-600 text-white text-sm
                       hover:bg-green-500 hover:scale-105
                       dark:bg-green-700 dark:hover:bg-green-600
                       transform transition-all duration-200
                       flex items-center gap-2 px-3 py-1.5 rounded-md"
            >
              <Play className="w-4 h-4" />
              Simulate
            </Button>

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
};

export default TopActionBar; 