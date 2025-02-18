import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import {
  Play,
  Route,
  Trash2,
  Download,
  Upload,
  SwitchCamera
} from 'lucide-react';

const TopActionBar = ({
  onChangeMode,
  onSimulate,
  onFindPath,
  onClear,
  onImport,
  onExport
}) => {
  const handleImport = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      onImport(file);
    }
  };

  return (
    <div className="bg-background border-b p-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onSimulate}
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

        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          title="Clear All Steps"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          title="Export to CSV"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => document.getElementById('import-file').click()}
          title="Import from CSV"
        >
          <Upload className="w-4 h-4 mr-2" />
          Import
        </Button>
        <input
          type="file"
          id="import-file"
          className="hidden"
          accept=".csv"
          onChange={handleImport}
        />

        <Button
          variant="outline"
          size="sm"
          onClick={onChangeMode}
          title="Switch Mode"
        >
          <SwitchCamera className="w-4 h-4 mr-2" />
          Change Mode
        </Button>
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