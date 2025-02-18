import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import {
  Play,
  Route,
  Trash2,
  Download,
  Upload,
  SwitchCamera,
  HelpCircle,
  Moon,
  Sun,
  History
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

  const handleImport = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast.error('Please select a CSV file');
        return;
      }
      onImport(file);
      toast.success('Flow diagram imported successfully');
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
    <div className="bg-background border-b p-4">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Primary Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={onSimulate}
                className="bg-green-600 hover:bg-green-700 text-white"
                title="Start Simulation"
              >
                <Play className="w-4 h-4 mr-2" />
                Simulate
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onFindPath}
                title="Find Path Between Steps"
              >
                <Route className="w-4 h-4 mr-2" />
                Find Path
              </Button>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-border" />

            {/* Data Management */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                title="Export to CSV"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>

              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="relative"
                  title="Import from CSV"
                  onClick={() => document.getElementById('file-import').click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import
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
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="text-destructive hover:text-destructive"
                title="Clear All Steps"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onChangeMode}
              title="Switch Visualization Mode"
            >
              <SwitchCamera className="w-4 h-4" />
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