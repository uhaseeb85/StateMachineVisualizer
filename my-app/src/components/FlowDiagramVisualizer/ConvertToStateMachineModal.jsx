/**
 * ConvertToStateMachineModal.jsx
 * 
 * Modal for converting flow diagrams to state machine CSV format
 * with dictionary support, rule mapping configuration, and inline editing.
 */
import { useState, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Upload, Download, Trash2, Plus, FileSpreadsheet, HelpCircle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import ExcelJS from 'exceljs';
import { getItem, setItem } from '@/utils/storageWrapper';
import ConvertToStateMachineWelcomeModal from './ConvertToStateMachineWelcomeModal';

/**
 * Default classification rules
 */
const DEFAULT_CLASSIFICATION_RULES = {
  behaviorKeywords: ['enters', 'enter', 'provide', 'provides', 'submit', 'submits', 'click', 'clicks', 'input', 'inputs', 'select', 'selects', 'choose', 'chooses', 'upload', 'uploads'],
  ruleKeywords: ['is eligible', 'has', 'can', 'should', 'verify', 'verifies', 'check', 'checks', 'validate', 'validates']
};

/**
 * Detect step type based on step name keywords using configurable rules
 */
const detectStepType = (stepName, rules = DEFAULT_CLASSIFICATION_RULES) => {
  if (!stepName) return 'state';
  
  const lowerName = stepName.toLowerCase();
  
  // Priority rule 1: Anything that starts with 'ask' is a state
  if (lowerName.startsWith('ask')) {
    return 'state';
  }
  
  // Priority rule 2: Anything that is ALL CAPS is a state
  if (/[A-Z]/.test(stepName) && stepName === stepName.toUpperCase()) {
    return 'state';
  }
  
  // Check for behavior keywords (action-oriented)
  const behaviorKeywords = rules.behaviorKeywords || [];
  if (behaviorKeywords.some(keyword => lowerName.includes(keyword))) {
    return 'behavior';
  }
  
  // Check for rule keywords (conditional/validation)
  const ruleKeywords = rules.ruleKeywords || [];
  if (ruleKeywords.some(keyword => lowerName.includes(keyword))) {
    return 'rule';
  }
  
  // Default to state
  return 'state';
};

/**
 * Generate default dictionaries from flow diagram data
 */
const generateDefaultDictionaries = (steps, stepClassifications = {}) => {
  // Generate state dictionary from steps classified as states (object format)
  // Exclude both rules and behaviors
  const stateDictionary = {};
  steps
    .filter(step => stepClassifications[step.id] !== 'rule' && stepClassifications[step.id] !== 'behavior')
    .forEach(step => {
      stateDictionary[step.name] = getQualifiedStepName(step, steps);
    });

  // Generate rule dictionary from steps classified as rules (object format)
  const ruleDictionary = {};
  steps
    .filter(step => stepClassifications[step.id] === 'rule')
    .forEach(step => {
      ruleDictionary[step.name] = getQualifiedStepName(step, steps);
    });

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
 * Get all descendants of a step (children and grandchildren)
 */
const getDescendants = (stepId, allSteps) => {
  const descendants = new Set();
  const queue = [stepId];
  
  while (queue.length > 0) {
    const currentId = queue.shift();
    const children = allSteps.filter(s => s.parentId === currentId);
    
    children.forEach(child => {
      descendants.add(child.id);
      queue.push(child.id);
    });
  }
  
  return descendants;
};

/**
 * Convert flow diagram to state machine CSV rows
 */
const convertToStateMachineRows = (steps, connections, ruleMapping, stepClassifications = {}, stateDictionary = {}, ruleDictionary = {}) => {
  const rows = [];
  let priority = 0; // Start priority at 0 and increment for each row
  
  // Helper function to lookup state name from description
  const lookupStateName = (description) => {
    // Find key where value matches the description
    const entry = Object.entries(stateDictionary).find(([key, value]) => value === description);
    return entry ? entry[0] : `[UNKNOWN_STATE: ${description}]`;
  };
  
  // Helper function to lookup rule name from description
  const lookupRuleName = (description) => {
    // Find key where value matches the description
    const entry = Object.entries(ruleDictionary).find(([key, value]) => value === description);
    return entry ? entry[0] : `[UNKNOWN_RULE: ${description}]`;
  };
  
  // Create a map of step IDs to qualified names
  const stepNameMap = new Map();
  steps.forEach(step => {
    stepNameMap.set(step.id, getQualifiedStepName(step, steps));
  });
  
  // Separate steps into states (exclude both rules and behaviors)
  const stateSteps = steps.filter(step => stepClassifications[step.id] !== 'rule' && stepClassifications[step.id] !== 'behavior');
  
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
        priority: priority++,
        operation: ''
      });
    } else {
      // Add a row for each connection
      stepConnections.forEach(conn => {
        const destinationDescription = stepNameMap.get(conn.toStepId) || '';
        
        // Determine the rule and final destination
        let ruleKey;
        let finalDestination = '';
        
        // Check if the destination is a rule step
        if (stepClassifications[conn.toStepId] === 'rule') {
          // Follow the chain of rules/behaviors to find all rules and the final state
          const ruleChain = [];
          let currentStepId = conn.toStepId;
          let visited = new Set(); // Prevent infinite loops
          
          // Follow rule/behavior connections until we reach a state or end
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
            } else if (stepClassifications[currentStepId] === 'behavior') {
              // Skip behaviors - they don't appear in the CSV
              // Just traverse through them to find the next step
              const nextConnections = connectionsBySource.get(currentStepId) || [];
              if (nextConnections.length > 0) {
                currentStepId = nextConnections[0].toStepId;
              } else {
                // Behavior has no outgoing connections
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
          if (!currentStepId || stepClassifications[currentStepId] === 'rule' || stepClassifications[currentStepId] === 'behavior') {
            finalDestination = '';
          }
        } else if (stepClassifications[conn.toStepId] === 'behavior') {
          // State connected directly to behavior (misplaced behavior - should have a rule)
          // Collect behavior names and traverse to find final destination
          const behaviorNames = [];
          let currentStepId = conn.toStepId;
          let visited = new Set();
          
          while (currentStepId && !visited.has(currentStepId)) {
            visited.add(currentStepId);
            
            if (stepClassifications[currentStepId] === 'behavior') {
              // Collect behavior name
              const behaviorName = stepNameMap.get(currentStepId);
              behaviorNames.push(behaviorName);
              
              // Move to next connection
              const nextConnections = connectionsBySource.get(currentStepId) || [];
              if (nextConnections.length > 0) {
                currentStepId = nextConnections[0].toStepId;
              } else {
                currentStepId = null;
              }
            } else if (stepClassifications[currentStepId] === 'rule') {
              // Found a rule - shouldn't happen but handle it
              break;
            } else {
              // Reached a state
              const stateDescription = stepNameMap.get(currentStepId) || '';
              finalDestination = lookupStateName(stateDescription);
              break;
            }
          }
          
          // Flag this as a misplaced behavior
          ruleKey = `{BEHAVIOR: ${behaviorNames.join(' > ')}}`;
          
          if (!currentStepId || stepClassifications[currentStepId] === 'behavior') {
            finalDestination = '';
          }
        } else {
          // Normal state-to-state connection
          // Lookup the destination state name
          finalDestination = lookupStateName(destinationDescription);
          // Direct state-to-state connections use TRUE as the rule
          ruleKey = 'TRUE';
        }
        
        rows.push({
          sourceNode: sourceName,
          destinationNode: finalDestination,
          ruleList: ruleKey,
          priority: priority++,
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
  link.remove();
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
  link.remove();
  URL.revokeObjectURL(url);
};

/**
 * Dictionary Editor Component
 */
const DictionaryEditor = ({ dictionary, onChange, title, keyLabel = "Key", valueLabel = "Description", onUpload, onDownload, uploadId }) => {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  
  const entries = useMemo(() => {
    return Object.entries(dictionary || {}).sort((a, b) => a[0].localeCompare(b[0]));
  }, [dictionary]);
  
  const handleAdd = () => {
    const key = newKey.trim();
    const value = newValue.trim();
    if (!key || !value) {
      toast.error(`Please provide both ${keyLabel.toLowerCase()} and ${valueLabel.toLowerCase()}`);
      return;
    }
    if (dictionary[key]) {
      toast.error(`${keyLabel} "${key}" already exists`);
      return;
    }
    onChange({ ...dictionary, [key]: value });
    setNewKey('');
    setNewValue('');
  };
  
  const handleDelete = (key) => {
    const newDict = { ...dictionary };
    delete newDict[key];
    onChange(newDict);
  };
  
  const handleUpdate = (oldKey, newKey, newValue) => {
    const trimmedKey = newKey.trim();
    const trimmedValue = newValue.trim();
    if (!trimmedKey || !trimmedValue) {
      toast.error('Both fields are required');
      return;
    }
    if (trimmedKey !== oldKey && dictionary[trimmedKey]) {
      toast.error(`${keyLabel} "${trimmedKey}" already exists`);
      return;
    }
    const newDict = { ...dictionary };
    if (trimmedKey !== oldKey) {
      delete newDict[oldKey];
    }
    newDict[trimmedKey] = trimmedValue;
    onChange(newDict);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</h4>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".json"
            onChange={onUpload}
            className="hidden"
            id={uploadId}
          />
          <Button size="sm" variant="outline" onClick={() => document.getElementById(uploadId).click()} className="gap-2">
            <Download className="w-4 h-4" />
            Import
          </Button>
          <Button size="sm" variant="outline" onClick={onDownload} className="gap-2">
            <Upload className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>
      <div className="border border-gray-200 dark:border-gray-700 rounded-md max-h-96 overflow-y-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium">{keyLabel}</th>
              <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium">{valueLabel}</th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {/* Add new entry row */}
            <tr className="bg-blue-50 dark:bg-blue-950/30 border-b-2 border-blue-200 dark:border-blue-800">
              <td className="px-4 py-3">
                <Input
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  className="h-10 text-sm"
                  placeholder="New key..."
                />
              </td>
              <td className="px-4 py-2">
                <Input
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  className="h-10 text-sm"
                  placeholder="New value..."
                />
              </td>
              <td className="px-4 py-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleAdd}
                  disabled={!newKey.trim() || !newValue.trim()}
                  className="h-8 w-8 p-0"
                  title="Add entry (Enter)"
                >
                  <Plus className="w-4 h-4 text-green-600 dark:text-green-400" />
                </Button>
              </td>
            </tr>
            
            {/* Existing entries */}
            {entries.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-4 py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                  No entries yet. Add one above.
                </td>
              </tr>
            ) : (
              entries.map(([key, value]) => (
                <tr key={key} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="px-4 py-2">
                    <Input
                      defaultValue={key}
                      onBlur={(e) => {
                        const newKey = e.target.value.trim();
                        if (newKey && newKey !== key) {
                          handleUpdate(key, newKey, value);
                        } else if (!newKey) {
                          e.target.value = key; // Restore if empty
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.target.blur();
                        } else if (e.key === 'Escape') {
                          e.target.value = key;
                          e.target.blur();
                        }
                      }}
                      className="h-10 text-sm"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Input
                      defaultValue={value}
                      onBlur={(e) => {
                        const newValue = e.target.value.trim();
                        if (newValue && newValue !== value) {
                          handleUpdate(key, key, newValue);
                        } else if (!newValue) {
                          e.target.value = value; // Restore if empty
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.target.blur();
                        } else if (e.key === 'Escape') {
                          e.target.value = value;
                          e.target.blur();
                        }
                      }}
                      className="h-10 text-sm"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(key)}
                      className="h-8 w-8 p-0"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
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
  dictionary: PropTypes.objectOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  keyLabel: PropTypes.string,
  valueLabel: PropTypes.string,
  onUpload: PropTypes.func.isRequired,
  onDownload: PropTypes.func.isRequired,
  uploadId: PropTypes.string.isRequired
};

/**
 * Classification Rules Editor Component
 */
const ClassificationRulesEditor = ({ rules, onChange, onExport, onRestoreDefaults }) => {
  const [newBehavior, setNewBehavior] = useState('');
  const [newRule, setNewRule] = useState('');
  const fileInputRef = useRef(null);

  const handleAddBehavior = () => {
    const keyword = newBehavior.trim().toLowerCase();
    if (!keyword) {
      toast.error('Please enter a behavior keyword');
      return;
    }
    if (rules.behaviorKeywords.includes(keyword)) {
      toast.error(`Behavior keyword "${keyword}" already exists`);
      return;
    }
    onChange({
      ...rules,
      behaviorKeywords: [...rules.behaviorKeywords, keyword].sort((a, b) => a.localeCompare(b))
    });
    setNewBehavior('');
  };

  const handleAddRule = () => {
    const keyword = newRule.trim().toLowerCase();
    if (!keyword) {
      toast.error('Please enter a rule keyword');
      return;
    }
    if (rules.ruleKeywords.includes(keyword)) {
      toast.error(`Rule keyword "${keyword}" already exists`);
      return;
    }
    onChange({
      ...rules,
      ruleKeywords: [...rules.ruleKeywords, keyword].sort((a, b) => a.localeCompare(b))
    });
    setNewRule('');
  };

  const handleRemoveBehavior = (keyword) => {
    const updated = rules.behaviorKeywords.filter((k) => k !== keyword);
    onChange({ ...rules, behaviorKeywords: updated });
  };

  const handleRemoveRule = (keyword) => {
    const updated = rules.ruleKeywords.filter((k) => k !== keyword);
    onChange({ ...rules, ruleKeywords: updated });
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      if (!Array.isArray(imported.behaviorKeywords) || !Array.isArray(imported.ruleKeywords)) {
        toast.error('Invalid format: must contain "behaviorKeywords" and "ruleKeywords" arrays');
        return;
      }
      if (!imported.behaviorKeywords.every(k => typeof k === 'string') || 
          !imported.ruleKeywords.every(k => typeof k === 'string')) {
        toast.error('Invalid format: all keywords must be strings');
        return;
      }
      onChange(imported);
      toast.success('Classification rules imported successfully');
    } catch (error) {
      toast.error('Error parsing rules file: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Keyword Classification Rules</h4>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
            ref={fileInputRef}
          />
          <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
            <Download className="w-4 h-4" />
            Import
          </Button>
          <Button size="sm" variant="outline" onClick={onExport} className="gap-2">
            <Upload className="w-4 h-4" />
            Export
          </Button>
          <Button size="sm" variant="outline" onClick={onRestoreDefaults} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Restore
          </Button>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h5 className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-100">Priority Rules (Built-in)</h5>
        <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
          <div>• Starts with "ask" → <strong>State</strong></div>
          <div>• ALL CAPS (e.g., "DASHBOARD") → <strong>State</strong></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          <h5 className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            Behavior Keywords
          </h5>
          <div className="flex gap-2">
            <Input
              value={newBehavior}
              onChange={(e) => setNewBehavior(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddBehavior()}
              placeholder="e.g., clicks, enters..."
              className="h-9 text-sm flex-1"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleAddBehavior}
              disabled={!newBehavior.trim()}
              className="h-9 w-9 p-0"
            >
              <Plus className="w-4 h-4 text-green-600 dark:text-green-400" />
            </Button>
          </div>
          <div className="border border-gray-200 dark:border-gray-700 rounded-md max-h-48 overflow-y-auto">
            {rules.behaviorKeywords.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">No behavior keywords</div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {rules.behaviorKeywords.map((keyword) => (
                  <div key={keyword} className="px-3 py-2 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800">
                    <code className="text-xs text-gray-700 dark:text-gray-300">{keyword}</code>
                    <Button size="sm" variant="ghost" onClick={() => handleRemoveBehavior(keyword)} className="h-6 w-6 p-0">
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h5 className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            Rule Keywords
          </h5>
          <div className="flex gap-2">
            <Input
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
              placeholder="e.g., has, verify..."
              className="h-9 text-sm flex-1"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleAddRule}
              disabled={!newRule.trim()}
              className="h-9 w-9 p-0"
            >
              <Plus className="w-4 h-4 text-green-600 dark:text-green-400" />
            </Button>
          </div>
          <div className="border border-gray-200 dark:border-gray-700 rounded-md max-h-48 overflow-y-auto">
            {rules.ruleKeywords.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">No rule keywords</div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {rules.ruleKeywords.map((keyword) => (
                  <div key={keyword} className="px-3 py-2 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800">
                    <code className="text-xs text-gray-700 dark:text-gray-300">{keyword}</code>
                    <Button size="sm" variant="ghost" onClick={() => handleRemoveRule(keyword)} className="h-6 w-6 p-0">
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

ClassificationRulesEditor.propTypes = {
  rules: PropTypes.shape({
    behaviorKeywords: PropTypes.arrayOf(PropTypes.string).isRequired,
    ruleKeywords: PropTypes.arrayOf(PropTypes.string).isRequired
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  onRestoreDefaults: PropTypes.func.isRequired
};

/**
 * Main Modal Component
 */
const ConvertToStateMachineModal = ({ isOpen, onClose, steps, connections }) => {
  const [stateDictionary, setStateDictionary] = useState({});
  const [ruleDictionary, setRuleDictionary] = useState({});
  const [classificationRules, setClassificationRules] = useState(DEFAULT_CLASSIFICATION_RULES);
  const [ruleMapping] = useState({
    success: 'SUCCESS',
    failure: 'FAILURE'
  });
  // Track which steps are classified as rules vs states vs behaviors
  const [stepClassifications, setStepClassifications] = useState({});
  // Track active tab for dictionaries and classification
  const [activeTab, setActiveTab] = useState(null); // 'state' | 'rule' | 'classification' | 'rules' | null
  // Store editable CSV rows
  const [editableRows, setEditableRows] = useState([]);
  // Track selected root steps
  const [selectedRootSteps, setSelectedRootSteps] = useState(new Set());
  // Track whether to show welcome modal
  const [showWelcome, setShowWelcome] = useState(false);
  
  // Get all root steps (steps without parentId)
  const rootSteps = useMemo(() => {
    return steps.filter(step => !step.parentId);
  }, [steps]);
  
  // Initialize selectedRootSteps with all root steps when modal opens
  useEffect(() => {
    if (isOpen && rootSteps.length > 0) {
      setSelectedRootSteps(new Set(rootSteps.map(step => step.id)));
    }
  }, [isOpen, rootSteps]);
  
  // Check if welcome modal should be shown on first open
  useEffect(() => {
    if (isOpen) {
      const hideWelcome = localStorage.getItem('flowDiagram_hideConvertWelcome');
      const hasSeenWelcome = sessionStorage.getItem('flowDiagram_hasSeenConvertWelcome');
      
      if (!hideWelcome && !hasSeenWelcome) {
        setShowWelcome(true);
        sessionStorage.setItem('flowDiagram_hasSeenConvertWelcome', 'true');
      }
    }
  }, [isOpen]);
  
  // Filter steps based on selected root steps
  const filteredSteps = useMemo(() => {
    if (selectedRootSteps.size === 0) return [];
    
    const includedStepIds = new Set();
    
    // Add all selected root steps and their descendants
    selectedRootSteps.forEach(rootStepId => {
      includedStepIds.add(rootStepId);
      const descendants = getDescendants(rootStepId, steps);
      descendants.forEach(id => includedStepIds.add(id));
    });
    
    return steps.filter(step => includedStepIds.has(step.id));
  }, [steps, selectedRootSteps]);
  
  // Filter connections to only include those between filtered steps
  const filteredConnections = useMemo(() => {
    const filteredStepIds = new Set(filteredSteps.map(s => s.id));
    return connections.filter(conn => 
      filteredStepIds.has(conn.fromStepId) && filteredStepIds.has(conn.toStepId)
    );
  }, [connections, filteredSteps]);
  
  // Load persisted dictionaries and classification rules on mount
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const persistedStateDictionary = await getItem('flowDiagram_stateDictionary');
        const persistedRuleDictionary = await getItem('flowDiagram_ruleDictionary');
        const persistedStepClassifications = await getItem('flowDiagram_stepClassifications');
        const persistedClassificationRules = await getItem('flowDiagram_classificationRules');
        
        if (persistedStateDictionary && Object.keys(persistedStateDictionary).length > 0) {
          setStateDictionary(persistedStateDictionary);
        }
        if (persistedRuleDictionary && Object.keys(persistedRuleDictionary).length > 0) {
          setRuleDictionary(persistedRuleDictionary);
        }
        if (persistedStepClassifications && Object.keys(persistedStepClassifications).length > 0) {
          setStepClassifications(persistedStepClassifications);
        }
        if (persistedClassificationRules) {
          setClassificationRules(persistedClassificationRules);
        }
      } catch (error) {
        console.error('Error loading persisted data:', error);
      }
    };
    
    if (isOpen) {
      loadPersistedData();
    }
  }, [isOpen]);
  
  // Initialize with default dictionaries when modal opens (if not already persisted)
  useEffect(() => {
    if (isOpen && steps.length > 0) {
      // Only generate defaults if dictionaries are empty
      if (Object.keys(stateDictionary).length === 0 || Object.keys(ruleDictionary).length === 0) {
        // Initialize from existing step types first, or from persisted classifications
        const initialClassifications = Object.keys(stepClassifications).length > 0 
          ? stepClassifications 
          : {};
        
        // Fill in any missing classifications from step types
        steps.forEach(step => {
          if (!initialClassifications[step.id]) {
            initialClassifications[step.id] = step.type || 'state';
          }
        });
        
        if (Object.keys(stepClassifications).length === 0) {
          setStepClassifications(initialClassifications);
        }
        
        // Then generate dictionaries based on classifications
        const { stateDictionary: defaultStates, ruleDictionary: defaultRules } = generateDefaultDictionaries(steps, initialClassifications);
        if (Object.keys(stateDictionary).length === 0) {
          setStateDictionary(defaultStates);
        }
        if (Object.keys(ruleDictionary).length === 0) {
          setRuleDictionary(defaultRules);
        }
      }
    }
  }, [isOpen, steps, stateDictionary, ruleDictionary, stepClassifications]);
  
  // Persist state dictionary whenever it changes
  useEffect(() => {
    if (isOpen && Object.keys(stateDictionary).length > 0) {
      setItem('flowDiagram_stateDictionary', stateDictionary).catch(error => {
        console.error('Error persisting state dictionary:', error);
      });
    }
  }, [stateDictionary, isOpen]);
  
  // Persist rule dictionary whenever it changes
  useEffect(() => {
    if (isOpen && Object.keys(ruleDictionary).length > 0) {
      setItem('flowDiagram_ruleDictionary', ruleDictionary).catch(error => {
        console.error('Error persisting rule dictionary:', error);
      });
    }
  }, [ruleDictionary, isOpen]);
  
  // Persist step classifications whenever they change
  useEffect(() => {
    if (isOpen && Object.keys(stepClassifications).length > 0) {
      setItem('flowDiagram_stepClassifications', stepClassifications).catch(error => {
        console.error('Error persisting step classifications:', error);
      });
    }
  }, [stepClassifications, isOpen]);

  // Persist classification rules whenever they change
  useEffect(() => {
    if (isOpen) {
      setItem('flowDiagram_classificationRules', classificationRules).catch(error => {
        console.error('Error persisting classification rules:', error);
      });
    }
  }, [classificationRules, isOpen]);
  
  // Generate CSV preview data using filtered steps and connections
  const csvRows = useMemo(() => {
    if (!isOpen) return [];
    return convertToStateMachineRows(filteredSteps, filteredConnections, ruleMapping, stepClassifications, stateDictionary, ruleDictionary);
  }, [filteredSteps, filteredConnections, ruleMapping, stepClassifications, stateDictionary, ruleDictionary, isOpen]);
  
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
  
  // Handle root step selection toggle
  const handleToggleRootStep = (stepId) => {
    setSelectedRootSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };
  
  // Handle select/deselect all root steps
  const handleToggleAllRootSteps = () => {
    if (selectedRootSteps.size === rootSteps.length) {
      // Deselect all
      setSelectedRootSteps(new Set());
    } else {
      // Select all
      setSelectedRootSteps(new Set(rootSteps.map(step => step.id)));
    }
  };
  
  // Handle dictionary file upload
  const handleDictionaryUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      // Check if it's an object with string values
      if (typeof json === 'object' && !Array.isArray(json) && 
          Object.values(json).every(v => typeof v === 'string')) {
        if (type === 'state') {
          setStateDictionary(json);
          toast.success('State dictionary loaded successfully');
        } else {
          setRuleDictionary(json);
          toast.success('Rule dictionary loaded successfully');
        }
      } else {
        toast.error('Invalid dictionary format. Expected object with string values: {"key": "description"}');
      }
    } catch (error) {
      toast.error(`Error parsing JSON: ${error.message}`);
    }
    e.target.value = ''; // Reset input
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

  // Export classification rules
  const handleExportClassificationRules = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    exportDictionary(classificationRules, `classification_rules_${timestamp}.json`);
    toast.success('Classification rules exported');
  };

  // Restore classification rules to defaults
  const handleRestoreClassificationRulesDefaults = () => {
    setClassificationRules(DEFAULT_CLASSIFICATION_RULES);
    toast.success('Classification rules restored to defaults');
  };
  
  return (
    <>
      {/* Welcome Modal */}
      <ConvertToStateMachineWelcomeModal 
        isOpen={showWelcome} 
        onClose={() => setShowWelcome(false)} 
      />
      
      {/* Main Conversion Modal */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[98vw] w-[1800px] h-[95vh] flex flex-col bg-white dark:bg-gray-900">
          <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <FileSpreadsheet className="w-6 h-6" />
                  Convert to State Machine CSV
                </DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-400">
                  Configure dictionaries and rule mappings to export your flow diagram as a state machine CSV file.
                </DialogDescription>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowWelcome(true)}
                className="gap-2"
                title="Show help and tutorial"
              >
                <HelpCircle className="w-4 h-4" />
                Help
              </Button>
            </div>
          </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4 space-y-6">
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
                        {selectedRootSteps.size === 0 
                          ? 'No root steps selected. Select at least one root step above.'
                          : 'No data to preview. Add steps and connections to your flow diagram.'
                        }
                      </td>
                    </tr>
                  ) : (
                    editableRows.map((row, index) => (
                      <tr key={`row-${row.priority}-${index}`} className="border-t border-gray-200 dark:border-gray-700">
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
                            onChange={(e) => handleCellEdit(index, 'priority', Number.parseInt(e.target.value, 10) || 50)}
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
          
          {/* Dictionary and Classification Tabs */}
          <div className="space-y-3">
            <div className="flex items-center border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab(activeTab === 'state' ? null : 'state')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'state'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                State Dictionary ({Object.keys(stateDictionary).length})
              </button>
              <button
                onClick={() => setActiveTab(activeTab === 'rule' ? null : 'rule')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'rule'
                    ? 'border-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Rule Dictionary ({Object.keys(ruleDictionary).length})
              </button>
              <button
                onClick={() => setActiveTab(activeTab === 'classification' ? null : 'classification')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'classification'
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Step Classification ({steps.length})
              </button>
              <button
                onClick={() => setActiveTab(activeTab === 'rules' ? null : 'rules')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'rules'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Classification Rules
              </button>
              <button
                onClick={() => setActiveTab(activeTab === 'rootsteps' ? null : 'rootsteps')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'rootsteps'
                    ? 'border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Root Steps Selection ({selectedRootSteps.size}/{rootSteps.length})
              </button>
            </div>
            {activeTab === 'state' && (
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
            )}
            {activeTab === 'rule' && (
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
            )}
            {activeTab === 'rootsteps' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Select which root steps and their descendants should be included in the conversion.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleToggleAllRootSteps}
                    className="gap-2"
                  >
                    {selectedRootSteps.size === rootSteps.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-md max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 w-10"></th>
                        <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300 font-medium">Root Step Name</th>
                        <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300 font-medium">Descendants</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rootSteps.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="px-3 py-8 text-center text-gray-500 dark:text-gray-400">
                            No root steps available.
                          </td>
                        </tr>
                      ) : (
                        rootSteps.map(step => {
                          const qualifiedName = getQualifiedStepName(step, steps);
                          const isSelected = selectedRootSteps.has(step.id);
                          const descendantCount = getDescendants(step.id, steps).size;
                          
                          return (
                            <tr key={step.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="px-3 py-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleRootStep(step.id)}
                                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 cursor-pointer"
                                />
                              </td>
                              <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{qualifiedName}</td>
                              <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">
                                {descendantCount > 0 ? `${descendantCount}` : '-'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {activeTab === 'classification' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Classify steps as State (node), Rule (condition), or Behavior (action that's skipped in CSV).
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        {filteredSteps.filter(s => (stepClassifications[s.id] || 'state') === 'state').length} States
                      </span>
                      <span>
                        {filteredSteps.filter(s => stepClassifications[s.id] === 'rule').length} Rules
                      </span>
                      <span>
                        {filteredSteps.filter(s => stepClassifications[s.id] === 'behavior').length} Behaviors
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newClassifications = { ...stepClassifications };
                      filteredSteps.forEach(step => {
                        newClassifications[step.id] = detectStepType(step.name, classificationRules);
                      });
                      setStepClassifications(newClassifications);
                      toast.success('Auto-detection completed');
                    }}
                    className="gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
                    Auto-Detect Types
                  </Button>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-md max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300 font-medium">Step Name</th>
                        <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300 font-medium">Classification</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSteps.length === 0 ? (
                        <tr>
                          <td colSpan="2" className="px-3 py-8 text-center text-gray-500 dark:text-gray-400">
                            No steps available. Select root steps above.
                          </td>
                        </tr>
                      ) : (
                        filteredSteps.map(step => {
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
                                  <Button
                                    size="sm"
                                    variant={classification === 'behavior' ? 'default' : 'outline'}
                                    onClick={() => setStepClassifications(prev => ({ ...prev, [step.id]: 'behavior' }))}
                                    className="h-7 px-3"
                                  >
                                    Behavior
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
              </div>
            )}
            {activeTab === 'rules' && (
              <ClassificationRulesEditor
                rules={classificationRules}
                onChange={setClassificationRules}
                onExport={handleExportClassificationRules}
                onRestoreDefaults={handleRestoreClassificationRulesDefaults}
              />
            )}
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
    </>
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
