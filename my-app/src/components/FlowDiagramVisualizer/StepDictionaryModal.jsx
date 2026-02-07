/**
 * StepDictionaryModal Component
 * Modal for managing the step dictionary
 * Allows viewing, editing, importing, exporting, and syncing dictionary entries
 */

import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Download,
  Upload,
  Trash2,
  Search,
  RefreshCw,
  Edit,
  Save,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * StepDictionaryModal Component
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Object} props.dictionaryHook - Step dictionary hook
 * @param {Array} props.steps - Current flow diagram steps (for sync)
 * @param {Function} props.onUpdateStep - Callback to update step properties
 */
const StepDictionaryModal = ({ isOpen, onClose, dictionaryHook, steps = [], onUpdateStep }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingEntry, setEditingEntry] = useState(null);
  const [editedType, setEditedType] = useState('state');
  const [editedAlias, setEditedAlias] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const fileInputRef = useRef(null);

  if (!dictionaryHook) return null;

  const { dictionary, upsertEntry, removeEntry, syncFromSteps, importDictionary, exportDictionary, clearDictionary } = dictionaryHook;

  /**
   * Filter dictionary based on search query
   */
  const filteredDictionary = searchQuery.trim()
    ? dictionary.filter(entry =>
        entry.stepName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.alias?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : dictionary;

  /**
   * Start editing an entry
   */
  const startEditing = (entry) => {
    setEditingEntry(entry.stepName);
    setEditedType(entry.type);
    setEditedAlias(entry.alias || '');
    setEditedDescription(entry.description || '');
  };

  /**
   * Save edited entry and sync to matching steps
   */
  const saveEdit = (stepName) => {
    // Update dictionary
    upsertEntry(stepName, editedType, editedAlias, editedDescription);
    
    // Sync changes to all matching steps if onUpdateStep is provided
    if (onUpdateStep) {
      const matchingSteps = steps.filter(step => step.name === stepName);
      matchingSteps.forEach(step => {
        onUpdateStep(step.id, {
          type: editedType,
          alias: editedAlias,
          description: editedDescription
        });
      });
      
      if (matchingSteps.length > 0) {
        toast.success(`Updated dictionary entry and ${matchingSteps.length} matching step(s)`);
      } else {
        toast.success('Dictionary entry updated');
      }
    } else {
      toast.success('Dictionary entry updated');
    }
    
    setEditingEntry(null);
  };

  /**
   * Cancel editing
   */
  const cancelEdit = () => {
    setEditingEntry(null);
    setEditedType('state');
    setEditedAlias('');
    setEditedDescription('');
  };

  /**
   * Delete an entry
   */
  const handleDelete = (stepName) => {
    if (window.confirm(`Remove "${stepName}" from dictionary?`)) {
      removeEntry(stepName);
      toast.success('Entry removed');
    }
  };

  /**
   * Handle file import
   */
  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await importDictionary(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Handle sync from current steps
   */
  const handleSync = () => {
    syncFromSteps(steps);
  };

  /**
   * Handle clear dictionary
   */
  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the entire dictionary? This cannot be undone.')) {
      clearDictionary();
    }
  };

  /**
   * Get badge color for step type
   */
  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'state':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'rule':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'behavior':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <DialogTitle>Step Dictionary</DialogTitle>
            <Badge variant="secondary" className="ml-2">
              {dictionary.length} {dictionary.length === 1 ? 'entry' : 'entries'}
            </Badge>
          </div>
        </DialogHeader>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-2 pb-4 border-b">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or alias..."
                className="pl-9"
              />
            </div>
          </div>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleSync}
            className="flex items-center gap-1"
            title="Add all current steps to dictionary"
          >
            <RefreshCw className="h-4 w-4" />
            Sync from Diagram
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleImport}
            className="hidden"
          />
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1"
            title="Import dictionary from CSV or Excel"
          >
            <Upload className="h-4 w-4" />
            Import
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={exportDictionary}
            disabled={dictionary.length === 0}
            className="flex items-center gap-1"
            title="Export dictionary as CSV"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>

          <Button
            size="sm"
            variant="destructive"
            onClick={handleClear}
            disabled={dictionary.length === 0}
            className="flex items-center gap-1"
            title="Clear all entries"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </Button>
        </div>

        {/* Dictionary Table */}
        <div className="flex-1 overflow-y-auto">
          {filteredDictionary.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {dictionary.length === 0 ? 'No Dictionary Entries' : 'No Matches Found'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {dictionary.length === 0
                  ? 'Add entries by creating steps or importing a CSV/Excel file'
                  : 'Try a different search term'
                }
              </p>
              {dictionary.length === 0 && steps.length > 0 && (
                <Button onClick={handleSync} className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Sync {steps.length} Step{steps.length !== 1 ? 's' : ''} from Current Diagram
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDictionary.map((entry) => (
                <div
                  key={entry.stepName}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                  {editingEntry === entry.stepName ? (
                    // Edit Mode
                    <>
                      <div className="flex-1 grid grid-cols-4 gap-3">
                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Step Name
                          </div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {entry.stepName}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Type
                          </div>
                          <div className="flex gap-1">
                            {['state', 'rule', 'behavior'].map((type) => (
                              <Button
                                key={type}
                                size="sm"
                                variant={editedType === type ? 'default' : 'outline'}
                                onClick={() => setEditedType(type)}
                                className="h-7 px-2 text-xs capitalize"
                              >
                                {type}
                              </Button>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Alias
                          </div>
                          <Input
                            value={editedAlias}
                            onChange={(e) => setEditedAlias(e.target.value)}
                            placeholder="Optional"
                            className="h-7 text-sm"
                          />
                        </div>
                        
                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Description
                          </div>
                          <Input
                            value={editedDescription}
                            onChange={(e) => setEditedDescription(e.target.value)}
                            placeholder="Optional"
                            className="h-7 text-sm"
                          />
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={() => saveEdit(entry.stepName)}
                          className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
                          title="Save"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelEdit}
                          className="h-8 w-8 p-0"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    // View Mode
                    <>
                      <div className="flex-1 grid grid-cols-4 gap-3">
                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Step Name
                          </div>
                          <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {entry.stepName}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Type
                          </div>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getTypeBadgeColor(entry.type)}`}
                          >
                            {entry.type}
                          </Badge>
                        </div>
                        
                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Alias
                          </div>
                          <div className="text-sm text-gray-700 dark:text-gray-300 truncate">
                            {entry.alias || <span className="italic text-gray-400">None</span>}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Description
                          </div>
                          <div className="text-sm text-gray-700 dark:text-gray-300 truncate">
                            {entry.description || <span className="italic text-gray-400">None</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing(entry)}
                          className="h-8 w-8 p-0"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(entry.stepName)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Footer */}
        <div className="pt-4 border-t">
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>
              <strong>💡 Tip:</strong> The dictionary provides auto-suggestions when creating steps and automatically updates when you modify step properties.
            </p>
            <p>
              <strong>📥 Import Format:</strong> CSV or Excel with columns: <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">Step Name</code>, <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">Type</code>, <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">Alias</code>, <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">Description</code>
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

StepDictionaryModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  dictionaryHook: PropTypes.shape({
    dictionary: PropTypes.arrayOf(PropTypes.shape({
      stepName: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['state', 'rule', 'behavior']).isRequired,
      alias: PropTypes.string
    })).isRequired,
    upsertEntry: PropTypes.func.isRequired,
    removeEntry: PropTypes.func.isRequired,
    syncFromSteps: PropTypes.func.isRequired,
    importDictionary: PropTypes.func.isRequired,
    exportDictionary: PropTypes.func.isRequired,
    clearDictionary: PropTypes.func.isRequired
  }),
  steps: PropTypes.array,
  onUpdateStep: PropTypes.func
};

export default StepDictionaryModal;
