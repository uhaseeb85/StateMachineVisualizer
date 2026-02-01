/**
 * ConvertToStateMachineModal.jsx
 * 
 * Modal for converting flow diagrams to state machine CSV format
 * with dictionary support, rule mapping configuration, and inline editing.
 */
import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download, Trash2, Plus, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import ExcelJS from 'exceljs';

/**
 * Generate default dictionaries from flow diagram data
 */
const generateDefaultDictionaries = (steps, stepClassifications = {}) => {
  // Generate state dictionary from steps classified as states
  const stateDictionary = steps
    .filter(step => stepClassifications[step.id] !== 'rule')
    .map(step => ({
      key: step.name,
      description: getQualifiedStepName(step, steps)
    }));

  // Generate rule dictionary from steps classified as rules
  const ruleDictionary = steps
    .filter(step => stepClassifications[step.id] === 'rule')
    .map(step => ({
      key: step.name,
      description: getQualifiedStepName(step, steps)
    }));

  return { stateDictionary, ruleDictionary };
};

/**
 * Flatten substeps with qualified names (Parent > Child)
 */
const getQualifiedStepName = (step, allSteps) => {
  if (!step.parentId) return step.name;
  
  const parent = allSteps.find(s => s.id === step.parentId);
  if (!parent) return step.name;
  
  const parentName = getQualifiedStepName(parent, allSteps);
  return `${parentName} > ${step.name}`;
};

/**
 * Convert flow diagram to state machine CSV rows
 */
const convertToStateMachineRows = (steps, connections, ruleMapping, stepClassifications = {}, stateDictionary = [], ruleDictionary = []) => {
  const rows = [];
  
  // Helper function to lookup state name from description
  const lookupStateName = (description) => {
    const entry = stateDictionary.find(item => item.description === description);
    return entry ? entry.key : `[UNKNOWN_STATE: ${description}]`;
  };
  
  // Helper function to lookup rule name from description
  const lookupRuleName = (description) => {
    const entry = ruleDictionary.find(item => item.description === description);
    return entry ? entry.key : `[UNKNOWN_RULE: ${description}]`;
  };
  
  // Create a map of step IDs to qualified names
  const stepNameMap = new Map();
  steps.forEach(step => {
    stepNameMap.set(step.id, getQualifiedStepName(step, steps));
  });
  
  // Separate steps into states and rules
  const stateSteps = steps.filter(step => stepClassifications[step.id] !== 'rule');
  const ruleSteps = steps.filter(step => stepClassifications[step.id] === 'rule');
  
  // Group connections by source step
  const connectionsBySource = new Map();
  connections.forEach(conn => {
    if (!connectionsBySource.has(conn.fromStepId)) {
      connectionsBySource.set(conn.fromStepId, []);
    }
    connectionsBySource.get(conn.fromStepId).push(conn);
  });
  
  // Generate rows for each state step
  stateSteps.forEach(step => {
    const sourceDescription = stepNameMap.get(step.id);
    const sourceName = lookupStateName(sourceDescription);
    const stepConnections = connectionsBySource.get(step.id) || [];
    
    if (stepConnections.length === 0) {
      // Step with no outgoing connections - add row with empty destination
      rows.push({
        sourceNode: sourceName,
        destinationNode: '',
        ruleList: '',
        priority: 50,
        operation: ''
      });
    } else {
      // Add a row for each connection
      stepConnections.forEach(conn => {
        const destinationStep = steps.find(s => s.id === conn.toStepId);
        const destinationDescription = stepNameMap.get(conn.toStepId) || '';
        
        // Determine the rule and final destination
        let ruleKey;
        let finalDestination = '';
        
        // Check if the destination is a rule step
        if (stepClassifications[conn.toStepId] === 'rule') {
          // Follow the chain of rules to find all rules and the final state
          const ruleChain = [];
          let currentStepId = conn.toStepId;
          let visited = new Set(); // Prevent infinite loops
          
          // Follow rule connections until we reach a state or end
          while (currentStepId && !visited.has(currentStepId)) {
            visited.add(currentStepId);
            
            if (stepClassifications[currentStepId] === 'rule') {
              // Add this rule to the chain (lookup the rule name)
              const ruleDescription = stepNameMap.get(currentStepId);
              ruleChain.push(lookupRuleName(ruleDescription));
              
              // Get the next connection
              const nextConnections = connectionsBySource.get(currentStepId) || [];
              if (nextConnections.length > 0) {
                currentStepId = nextConnections[0].toStepId;
              } else {
                // Rule has no outgoing connections
                currentStepId = null;
              }
            } else {
              // Reached a state - this is our final destination (lookup the state name)
              const stateDescription = stepNameMap.get(currentStepId) || '';
              finalDestination = lookupStateName(stateDescription);
              break;
            }
          }
          
          // Join all rules with " + "
          ruleKey = ruleChain.join(' + ');
          
          // If we ended without finding a state, destination is empty
          if (!currentStepId || stepClassifications[currentStepId] === 'rule') {
            finalDestination = '';
          }
        } else {
          // Normal state-to-state connection
          // Lookup the destination state name
          finalDestination = lookupStateName(destinationDescription);
          // Use the mapped rule from success/failure type
          const ruleDescription = conn.type === 'success' ? ruleMapping.success : ruleMapping.failure;
          ruleKey = lookupRuleName(ruleDescription);
        }
        
        rows.push({
          sourceNode: sourceName,
          destinationNode: finalDestination,
          ruleList: ruleKey,
          priority: 50,
          operation: ''
        });
      });
    }
  });
  
  return rows;
};

/**
 * Export CSV using ExcelJS
 */
const exportCSV = async (rows, filename) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('State Machine');
  
  // Add headers
  worksheet.addRow(['Source Node', 'Destination Node', 'Rule List', 'Priority', 'Operation / Edge Effect']);
  
  // Add data rows
  rows.forEach(row => {
    worksheet.addRow([
      row.sourceNode,
      row.destinationNode,
      row.ruleList,
      row.priority,
      row.operation
    ]);
  });
  
  // Generate CSV buffer
  const buffer = await workbook.csv.writeBuffer();
  const blob = new Blob([buffer], { type: 'text/csv;charset=utf-8;' });
  
  // Download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export dictionary as JSON
 */
const exportDictionary = (dictionary, filename) => {
  const json = JSON.stringify(dictionary, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Dictionary Editor Component
 */
const DictionaryEditor = ({ dictionary, onChange, title, keyLabel = "Key", valueLabel = "Description", onUpload, onDownload, uploadId }) => {
  const handleAdd = () => {
    onChange([...dictionary, { key: '', description: '' }]);
  };
  
  const handleDelete = (index) => {
    const newDict = dictionary.filter((_, i) => i !== index);
    onChange(newDict);
  };
  
  const handleChange = (index, field, value) => {
    const newDict = [...dictionary];
    newDict[index] = { ...newDict[index], [field]: value };
    onChange(newDict);
  };
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</h4>
        <div className="flex gap-1">
          <input
            type="file"
            accept=".json"
            onChange={onUpload}
            className="hidden"
            id={uploadId}
          />
          <Button size="sm" variant="outline" onClick={() => document.getElementById(uploadId).click()} title="Upload">
            <Upload className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={onDownload} title="Download">
            <Download className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleAdd} title="Add Entry">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="border border-gray-200 dark:border-gray-700 rounded-md max-h-40 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
            <tr>
              <th className="px-2 py-1 text-left text-gray-700 dark:text-gray-300 font-medium">{keyLabel}</th>
              <th className="px-2 py-1 text-left text-gray-700 dark:text-gray-300 font-medium">{valueLabel}</th>
              <th className="px-2 py-1 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {dictionary.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-2 py-4 text-center text-gray-500 dark:text-gray-400">
                  No entries. Click "Add Entry" to create one.
                </td>
              </tr>
            ) : (
              dictionary.map((entry, index) => (
                <tr key={index} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="px-2 py-1">
                    <Input
                      value={entry.key}
                      onChange={(e) => handleChange(index, 'key', e.target.value)}
                      className="h-7 text-xs"
                      placeholder="Key"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <Input
                      value={entry.description}
                      onChange={(e) => handleChange(index, 'description', e.target.value)}
                      className="h-7 text-xs"
                      placeholder="Description"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(index)}
                      className="h-7 w-7 p-0"
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

DictionaryEditor.propTypes = {
  dictionary: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string,
    description: PropTypes.string
  })).isRequired,
  onChange: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  keyLabel: PropTypes.string,
  valueLabel: PropTypes.string,
  onUpload: PropTypes.func.isRequired,
  onDownload: PropTypes.func.isRequired,
  uploadId: PropTypes.string.isRequired
};

/**
 * Main Modal Component
 */
const ConvertToStateMachineModal = ({ isOpen, onClose, steps, connections }) => {
  const [stateDictionary, setStateDictionary] = useState([]);
  const [ruleDictionary, setRuleDictionary] = useState([]);
  const [ruleMapping, setRuleMapping] = useState({
    success: 'SUCCESS',
    failure: 'FAILURE'
  });
  // Track which steps are classified as rules vs states
  const [stepClassifications, setStepClassifications] = useState({});
  // Track whether to show step classification section
  const [showStepClassification, setShowStepClassification] = useState(false);
  // Store editable CSV rows
  const [editableRows, setEditableRows] = useState([]);
  
  // Initialize with default dictionaries when modal opens
  useEffect(() => {
    if (isOpen && steps.length > 0) {
      // Initialize from existing step types first
      const initialClassifications = {};
      steps.forEach(step => {
        initialClassifications[step.id] = step.type || 'state';
      });
      setStepClassifications(initialClassifications);
      
      // Then generate dictionaries based on classifications
      const { stateDictionary: defaultStates, ruleDictionary: defaultRules } = generateDefaultDictionaries(steps, initialClassifications);
      setStateDictionary(defaultStates);
      setRuleDictionary(defaultRules);
    }
  }, [isOpen, steps]);
  
  // Generate CSV preview data
  const csvRows = useMemo(() => {
    if (!isOpen) return [];
    return convertToStateMachineRows(steps, connections, ruleMapping, stepClassifications, stateDictionary, ruleDictionary);
  }, [steps, connections, ruleMapping, stepClassifications, stateDictionary, ruleDictionary, isOpen]);
  
  // Update editable rows when csvRows change
  useEffect(() => {
    setEditableRows(csvRows);
  }, [csvRows]);
  
  // Handle cell edit
  const handleCellEdit = (rowIndex, field, value) => {
    const newRows = [...editableRows];
    newRows[rowIndex] = { ...newRows[rowIndex], [field]: value };
    setEditableRows(newRows);
  };
  
  // Handle dictionary file upload
  const handleDictionaryUpload = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (Array.isArray(json) && json.every(item => item.key !== undefined && item.description !== undefined)) {
          if (type === 'state') {
            setStateDictionary(json);
            toast.success('State dictionary loaded successfully');
          } else {
            setRuleDictionary(json);
            toast.success('Rule dictionary loaded successfully');
          }
        } else {
          toast.error('Invalid dictionary format. Expected array of {key, description} objects');
        }
      } catch (error) {
        toast.error(`Error parsing JSON: ${error.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };
  
  // Auto-generate dictionaries
  const handleAutoGenerate = () => {
    const { stateDictionary: defaultStates, ruleDictionary: defaultRules } = generateDefaultDictionaries(steps);
    setStateDictionary(defaultStates);
    setRuleDictionary(defaultRules);
    toast.success('Dictionaries auto-generated from flow diagram');
  };
  
  // Export CSV
  const handleExportCSV = async () => {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `state_machine_export_${timestamp}.csv`;
      await exportCSV(editableRows, filename);
      toast.success(`CSV exported: ${filename}`);
      onClose();
    } catch (error) {
      toast.error(`Error exporting CSV: ${error.message}`);
    }
  };
  
  // Export dictionaries
  const handleExportStateDictionary = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    exportDictionary(stateDictionary, `state_dictionary_${timestamp}.json`);
    toast.success('State dictionary exported');
  };
  
  const handleExportRuleDictionary = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    exportDictionary(ruleDictionary, `rule_dictionary_${timestamp}.json`);
    toast.success('Rule dictionary exported');
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] flex flex-col bg-white dark:bg-gray-900">
        <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6" />
            Convert to State Machine CSV
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Configure dictionaries and rule mappings to export your flow diagram as a state machine CSV file.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Step Classification */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Step Classification</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Classify each step as either a "State" (appears as Source/Destination Node) or "Rule" (appears in Rule List column).
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowStepClassification(!showStepClassification)}
              >
                {showStepClassification ? 'Hide' : 'Show'}
              </Button>
            </div>
            {showStepClassification && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-md max-h-60 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300 font-medium">Step Name</th>
                    <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300 font-medium">Classification</th>
                  </tr>
                </thead>
                <tbody>
                  {steps.length === 0 ? (
                    <tr>
                      <td colSpan="2" className="px-3 py-8 text-center text-gray-500 dark:text-gray-400">
                        No steps available.
                      </td>
                    </tr>
                  ) : (
                    steps.map(step => {
                      const qualifiedName = getQualifiedStepName(step, steps);
                      const classification = stepClassifications[step.id] || 'state';
                      return (
                        <tr key={step.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{qualifiedName}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant={classification === 'state' ? 'default' : 'outline'}
                                onClick={() => setStepClassifications(prev => ({ ...prev, [step.id]: 'state' }))}
                                className="h-7 px-3"
                              >
                                State
                              </Button>
                              <Button
                                size="sm"
                                variant={classification === 'rule' ? 'default' : 'outline'}
                                onClick={() => setStepClassifications(prev => ({ ...prev, [step.id]: 'rule' }))}
                                className="h-7 px-3"
                              >
                                Rule
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            )}
          </div>
          
          {/* Dictionary Editors */}
          <div className="grid grid-cols-2 gap-4">
            <DictionaryEditor
              dictionary={stateDictionary}
              onChange={setStateDictionary}
              title="State Dictionary"
              keyLabel="State Name"
              valueLabel="Description"
              onUpload={(e) => handleDictionaryUpload(e, 'state')}
              onDownload={handleExportStateDictionary}
              uploadId="upload-state-dict"
            />
            <DictionaryEditor
              dictionary={ruleDictionary}
              onChange={setRuleDictionary}
              title="Rule Dictionary"
              keyLabel="Rule Name"
              valueLabel="Description"
              onUpload={(e) => handleDictionaryUpload(e, 'rule')}
              onDownload={handleExportRuleDictionary}
              uploadId="upload-rule-dict"
            />
          </div>
          
          {/* CSV Preview */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              CSV Preview ({editableRows.length} rows)
            </h3>
            <div className="border border-gray-200 dark:border-gray-700 rounded-md max-h-80 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300 font-medium">Source Node</th>
                    <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300 font-medium">Destination Node</th>
                    <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300 font-medium">Rule List</th>
                    <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300 font-medium">Priority</th>
                    <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300 font-medium">Operation</th>
                  </tr>
                </thead>
                <tbody>
                  {editableRows.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-3 py-8 text-center text-gray-500 dark:text-gray-400">
                        No data to preview. Add steps and connections to your flow diagram.
                      </td>
                    </tr>
                  ) : (
                    editableRows.map((row, index) => (
                      <tr key={index} className="border-t border-gray-200 dark:border-gray-700">
                        <td className="px-2 py-1">
                          <Input
                            value={row.sourceNode}
                            onChange={(e) => handleCellEdit(index, 'sourceNode', e.target.value)}
                            className="h-8 text-sm"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            value={row.destinationNode}
                            onChange={(e) => handleCellEdit(index, 'destinationNode', e.target.value)}
                            className="h-8 text-sm"
                            placeholder="empty"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            value={row.ruleList}
                            onChange={(e) => handleCellEdit(index, 'ruleList', e.target.value)}
                            className="h-8 text-sm"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            type="number"
                            value={row.priority}
                            onChange={(e) => handleCellEdit(index, 'priority', parseInt(e.target.value) || 50)}
                            className="h-8 text-sm w-20"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            value={row.operation}
                            onChange={(e) => handleCellEdit(index, 'operation', e.target.value)}
                            className="h-8 text-sm"
                            placeholder="empty"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <DialogFooter className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleExportCSV} 
            disabled={csvRows.length === 0}
            className="bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

ConvertToStateMachineModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  steps: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    parentId: PropTypes.string
  })).isRequired,
  connections: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    fromStepId: PropTypes.string.isRequired,
    toStepId: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['success', 'failure']).isRequired
  })).isRequired
};

export default ConvertToStateMachineModal;
