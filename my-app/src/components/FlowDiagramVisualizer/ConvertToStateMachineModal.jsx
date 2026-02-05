/**
 * ConvertToStateMachineModal.jsx
 * 
 * Modal for converting flow diagrams to state machine CSV format
 * with dictionary support, rule mapping configuration, and inline editing.
 */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { 
  Upload, 
  Download, 
  Trash2, 
  Plus, 
  FileSpreadsheet, 
  HelpCircle, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  ChevronDown, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import ExcelJS from 'exceljs';
import { getItem, setItem } from '@/utils/storageWrapper';
import ConvertToStateMachineWelcomeModal from './ConvertToStateMachineWelcomeModal';

/**
 * Default classification rules
 */
const DEFAULT_CLASSIFICATION_RULES = {
  stateKeywords: ['page', 'screen', 'view', 'dashboard', 'modal', 'popup', 'tab', 'window'],
  behaviorKeywords: ['answers', 'choose', 'chooses', 'click', 'clicks', 'customer', 'enter', 'enters', 'input', 'inputs', 'provide', 'provides', 'response', 'select', 'selects', 'submit', 'submits', 'upload', 'uploads'],
  ruleKeywords: ['is eligible', 'has', 'can', 'should', 'verify', 'verifies', 'check', 'checks', 'validate', 'validates']
};

/**
 * Detect step type based on step name keywords using configurable rules
 */
const detectStepType = (stepName, rules = DEFAULT_CLASSIFICATION_RULES) => {
  if (!stepName) return 'state';
  
  const lowerName = stepName.toLowerCase().trim();
  
  // Priority rule 1: Anything that starts with 'ask' is a state
  if (lowerName.startsWith('ask')) {
    return 'state';
  }
  
  // Priority rule 2: Anything that is ALL CAPS is a state
  if (/[A-Z]/.test(stepName) && stepName === stepName.toUpperCase()) {
    return 'state';
  }

  // Priority rule 3: Anything with a question mark is a rule
  if (stepName.includes('?')) {
    return 'rule';
  }
  
  // Helper for word-boundary matching
  const matchesKeyword = (keywords) => {
    return (keywords || []).some(keyword => {
      if (!keyword) return false;
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Match as whole word or part of string based on keyword length/type
      const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'i');
      return regex.test(lowerName);
    });
  };
  
  // Check for state keywords
  if (matchesKeyword(rules.stateKeywords)) {
    return 'state';
  }
  
  // Check for behavior keywords (action-oriented)
  if (matchesKeyword(rules.behaviorKeywords)) {
    return 'behavior';
  }
  
  // Check for rule keywords (conditional/validation)
  if (matchesKeyword(rules.ruleKeywords)) {
    return 'rule';
  }
  
  // Default to state
  return 'state';
};

/**
 * Extract step name from UNKNOWN marker
 */
const extractUnknownEntry = (text, type) => {
  const pattern = new RegExp(`\\[UNKNOWN_${type}:\\s*([^\\]]+)\\]`);
  const match = text.match(pattern);
  if (!match) return null;
  // Return the step name directly
  return match[1].trim();
};

/**
 * Generate a suggested key name from a step name
 */
const generateSuggestedKey = (stepName) => {
  return stepName
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .toUpperCase()
    .substring(0, 50);
};

/**
 * Extract all unmapped items from rows and generate dictionary entries
 */
const extractUnmappedItems = (rows) => {
  const unmappedStates = new Set();
  const unmappedRules = new Set();

  rows.forEach((row) => {
    // Check source node
    if (row.sourceNode.includes('[UNKNOWN_STATE:')) {
      const stepName = extractUnknownEntry(row.sourceNode, 'STATE');
      if (stepName) unmappedStates.add(stepName);
    }

    // Check destination node
    if (row.destinationNode.includes('[UNKNOWN_STATE:')) {
      const stepName = extractUnknownEntry(row.destinationNode, 'STATE');
      if (stepName) unmappedStates.add(stepName);
    }

    // Check rule list (may contain multiple rules separated by ' + ')
    if (row.ruleList.includes('[UNKNOWN_RULE:')) {
      const ruleParts = row.ruleList.split(' + ');
      ruleParts.forEach(part => {
        if (part.includes('[UNKNOWN_RULE:')) {
          const stepName = extractUnknownEntry(part, 'RULE');
          if (stepName) unmappedRules.add(stepName);
        }
      });
    }
  });

  // Generate dictionary entries with suggested keys
  const stateEntries = {};
  unmappedStates.forEach(stepName => {
    stateEntries[generateSuggestedKey(stepName)] = stepName;
  });

  const ruleEntries = {};
  unmappedRules.forEach(stepName => {
    ruleEntries[generateSuggestedKey(stepName)] = stepName;
  });

  return { stateEntries, ruleEntries };
};

/**
 * Generate default dictionaries from flow diagram data
 */
const generateDefaultDictionaries = (steps, stepClassifications = {}) => {
  // Generate state dictionary from steps classified as states (object format)
  // Exclude both rules and behaviors
  // Use simple step name as both key and value
  const stateDictionary = {};
  steps
    .filter(step => stepClassifications[step.id] !== 'rule' && stepClassifications[step.id] !== 'behavior')
    .forEach(step => {
      stateDictionary[step.name] = step.name;
    });

  // Generate rule dictionary from steps classified as rules (object format)
  // Use simple step name as both key and value
  const ruleDictionary = {};
  steps
    .filter(step => stepClassifications[step.id] === 'rule')
    .forEach(step => {
      ruleDictionary[step.name] = step.name;
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
  
  // Helper function to lookup state name from step name (direct match)
  const lookupStateName = (stepName) => {
    if (!stepName) return '';
    const entry = Object.entries(stateDictionary).find(([key, value]) => value === stepName);
    return entry ? entry[0] : `[UNKNOWN_STATE: ${stepName}]`;
  };
  
  // Helper function to lookup rule name from step name (direct match)
  const lookupRuleName = (stepName) => {
    if (!stepName) return '';
    const entry = Object.entries(ruleDictionary).find(([key, value]) => value === stepName);
    return entry ? entry[0] : `[UNKNOWN_RULE: ${stepName}]`;
  };
  
  // Create a map of step IDs to simple step names (NO qualified paths)
  const stepNameMap = new Map();
  steps.forEach(step => {
    stepNameMap.set(step.id, step.name);
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
    const sourceStepName = stepNameMap.get(step.id);
    const sourceName = lookupStateName(sourceStepName);
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
        const destinationStepName = stepNameMap.get(conn.toStepId) || '';
        
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
              const ruleStepName = stepNameMap.get(currentStepId);
              ruleChain.push(lookupRuleName(ruleStepName));
              
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
              const stateStepName = stepNameMap.get(currentStepId) || '';
              finalDestination = lookupStateName(stateStepName);
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
          // State connected directly to behavior
          // Traverse through behaviors to find what comes next
          let currentStepId = conn.toStepId;
          let visited = new Set();
          
          // Skip through all behaviors to find the next non-behavior step
          while (currentStepId && !visited.has(currentStepId)) {
            visited.add(currentStepId);
            
            if (stepClassifications[currentStepId] === 'behavior') {
              // Move to next connection
              const nextConnections = connectionsBySource.get(currentStepId) || [];
              if (nextConnections.length > 0) {
                currentStepId = nextConnections[0].toStepId;
              } else {
                currentStepId = null;
              }
            } else {
              // Found a non-behavior step (rule or state)
              break;
            }
          }
          
          // Now check what we found after the behavior(s)
          if (currentStepId && stepClassifications[currentStepId] === 'rule') {
            // Behavior leads to a rule - this is valid! Process the rule chain
            const ruleChain = [];
            let ruleVisited = new Set();
            
            while (currentStepId && !ruleVisited.has(currentStepId)) {
              ruleVisited.add(currentStepId);
              
              if (stepClassifications[currentStepId] === 'rule') {
                // Add this rule to the chain
                const ruleStepName = stepNameMap.get(currentStepId);
                ruleChain.push(lookupRuleName(ruleStepName));
                
                // Get the next connection
                const nextConnections = connectionsBySource.get(currentStepId) || [];
                if (nextConnections.length > 0) {
                  currentStepId = nextConnections[0].toStepId;
                } else {
                  currentStepId = null;
                }
              } else if (stepClassifications[currentStepId] === 'behavior') {
                // Skip behaviors in the rule chain
                const nextConnections = connectionsBySource.get(currentStepId) || [];
                if (nextConnections.length > 0) {
                  currentStepId = nextConnections[0].toStepId;
                } else {
                  currentStepId = null;
                }
              } else {
                // Reached a state
                const stateStepName = stepNameMap.get(currentStepId) || '';
                finalDestination = lookupStateName(stateStepName);
                break;
              }
            }
            
            ruleKey = ruleChain.join(' + ');
            
            if (!currentStepId || stepClassifications[currentStepId] === 'rule' || stepClassifications[currentStepId] === 'behavior') {
              finalDestination = '';
            }
          } else if (currentStepId && stepClassifications[currentStepId] !== 'rule' && stepClassifications[currentStepId] !== 'behavior') {
            // Behavior leads directly to a state (no rule - this is a problem)
            const stateStepName = stepNameMap.get(currentStepId) || '';
            finalDestination = lookupStateName(stateStepName);
            ruleKey = ''; // No rule - flag for validation
          } else {
            // Behavior leads nowhere or to another behavior
            ruleKey = '';
            finalDestination = '';
          }
        } else {
          // Normal state-to-state connection
          // Lookup the destination state name
          finalDestination = lookupStateName(destinationStepName);
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
  const [newState, setNewState] = useState('');
  const [newBehavior, setNewBehavior] = useState('');
  const [newRule, setNewRule] = useState('');
  const fileInputRef = useRef(null);

  const handleAddState = () => {
    const keyword = newState.trim().toLowerCase();
    if (!keyword) {
      toast.error('Please enter a state keyword');
      return;
    }
    if (rules.stateKeywords?.includes(keyword)) {
      toast.error(`State keyword "${keyword}" already exists`);
      return;
    }
    onChange({
      ...rules,
      stateKeywords: [...(rules.stateKeywords || []), keyword].sort((a, b) => a.localeCompare(b))
    });
    setNewState('');
  };

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

  const handleRemoveState = (keyword) => {
    const updated = rules.stateKeywords.filter((k) => k !== keyword);
    onChange({ ...rules, stateKeywords: updated });
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
      if (!Array.isArray(imported.behaviorKeywords) || !Array.isArray(imported.ruleKeywords) || !Array.isArray(imported.stateKeywords)) {
        toast.error('Invalid format: must contain "stateKeywords", "behaviorKeywords" and "ruleKeywords" arrays');
        return;
      }
      if (!imported.behaviorKeywords.every(k => typeof k === 'string') || 
          !imported.ruleKeywords.every(k => typeof k === 'string') ||
          !imported.stateKeywords.every(k => typeof k === 'string')) {
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

      <div className="grid grid-cols-3 gap-6">
        <div className="space-y-3">
          <h5 className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            State Keywords
          </h5>
          <div className="flex gap-2">
            <Input
              value={newState}
              onChange={(e) => setNewState(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddState()}
              placeholder="e.g., page, screen..."
              className="h-9 text-sm flex-1"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleAddState}
              disabled={!newState.trim()}
              className="h-9 w-9 p-0"
            >
              <Plus className="w-4 h-4 text-green-600 dark:text-green-400" />
            </Button>
          </div>
          <div className="border border-gray-200 dark:border-gray-700 rounded-md max-h-48 overflow-y-auto">
            {!rules.stateKeywords || rules.stateKeywords.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">No state keywords</div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {rules.stateKeywords.map((keyword) => (
                  <div key={keyword} className="px-3 py-2 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800">
                    <code className="text-xs text-gray-700 dark:text-gray-300">{keyword}</code>
                    <Button size="sm" variant="ghost" onClick={() => handleRemoveState(keyword)} className="h-6 w-6 p-0">
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
    stateKeywords: PropTypes.arrayOf(PropTypes.string).isRequired,
    behaviorKeywords: PropTypes.arrayOf(PropTypes.string).isRequired,
    ruleKeywords: PropTypes.arrayOf(PropTypes.string).isRequired
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  onRestoreDefaults: PropTypes.func.isRequired
};

/**
 * Validation Logic for State Machine Rows
 */
const validateStateMachineRows = (rows) => {
  const errors = [];

  rows.forEach((row, index) => {
    const rowNum = index + 1;
    
    // Check for unknown states in source
    if (row.sourceNode.includes('[UNKNOWN_STATE:')) {
      const stepName = extractUnknownEntry(row.sourceNode, 'STATE');
      errors.push({
        id: `err-src-${index}`,
        row: index,
        type: 'error',
        message: `Row ${rowNum}: Source node "${stepName || 'unknown'}" is unmapped.`,
        suggestion: "Use 'Add All Missing' button to automatically add all unmapped items."
      });
    }

    // Check for unknown states in destination
    if (row.destinationNode.includes('[UNKNOWN_STATE:')) {
      const stepName = extractUnknownEntry(row.destinationNode, 'STATE');
      errors.push({
        id: `err-dest-${index}`,
        row: index,
        type: 'error',
        message: `Row ${rowNum}: Destination node "${stepName || 'unknown'}" is unmapped.`,
        suggestion: "Use 'Add All Missing' button to automatically add all unmapped items."
      });
    }

    // Check for unknown rules
    if (row.ruleList.includes('[UNKNOWN_RULE:')) {
      const stepName = extractUnknownEntry(row.ruleList, 'RULE');
      errors.push({
        id: `err-rule-${index}`,
        row: index,
        type: 'error',
        message: `Row ${rowNum}: Rule "${stepName || 'unknown'}" is unmapped.`,
        suggestion: "Use 'Add All Missing' button to automatically add all unmapped items."
      });
    }

    // Check for missing rules (behavior issues or direct state-to-state without TRUE)
    if (!row.ruleList && row.destinationNode) {
      errors.push({
        id: `err-missing-rule-${index}`,
        row: index,
        type: 'error',
        message: `Row ${rowNum}: Potential misplaced behavior detected.`,
        suggestion: "Ensure there is a Rule step between the source state and subsequent behaviors/states."
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    summary: {
      total: rows.length,
      errors: errors.length
    }
  };
};

/**
 * Validation Results Display Component - Summary Only
 */
const ValidationResultsDisplay = ({ results, onAddAllMissing, hasUnmapped }) => {
  if (!results) return null;

  const { summary } = results;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div 
        className={`flex items-center justify-between px-4 py-3 ${
          summary.errors > 0 ? 'bg-red-50 dark:bg-red-950/20' : 
          'bg-green-50 dark:bg-green-950/20'
        }`}
      >
        <div className="flex items-center gap-3">
          {summary.errors > 0 ? (
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          )}
          <span className="font-medium text-sm">
            {summary.errors > 0 ? `${summary.errors} Error${summary.errors > 1 ? 's' : ''} Found` : 
             'Validation Passed'}
          </span>
          <div className="flex items-center gap-2 ml-4">
            {summary.errors > 0 && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                {summary.errors} ERR
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {summary.errors === 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              All {summary.total} rows are valid ✓
            </span>
          )}
          {summary.errors > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              See issues below each affected row
            </span>
          )}
          {hasUnmapped && onAddAllMissing && (
            <Button
              size="sm"
              variant="default"
              onClick={onAddAllMissing}
              className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-800"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add All Missing
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Inline Row Validation Display Component
 */
const RowValidationDisplay = ({ issues }) => {
  if (!issues || issues.length === 0) return null;

  return (
    <tr>
      <td colSpan="5" className="px-0 py-0">
        <div className="bg-gradient-to-r from-red-50 via-amber-50 to-blue-50 dark:from-red-950/10 dark:via-amber-950/10 dark:to-blue-950/10 px-4 py-3 space-y-2">
          {issues.map((issue) => (
            <div 
              key={issue.id} 
              className={`flex gap-3 p-2.5 rounded-md border text-xs ${
                issue.type === 'error' ? 'border-red-200 bg-red-50/80 dark:border-red-900/50 dark:bg-red-900/20' :
                issue.type === 'warning' ? 'border-amber-200 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-900/20' :
                'border-blue-200 bg-blue-50/80 dark:border-blue-900/50 dark:bg-blue-900/20'
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {issue.type === 'error' ? <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" /> :
                 issue.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" /> :
                 <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold ${
                  issue.type === 'error' ? 'text-red-900 dark:text-red-200' :
                  issue.type === 'warning' ? 'text-amber-900 dark:text-amber-200' :
                  'text-blue-900 dark:text-blue-200'
                }`}>
                  {issue.message}
                </p>
                <p className={`mt-0.5 ${
                  issue.type === 'error' ? 'text-red-700 dark:text-red-300' :
                  issue.type === 'warning' ? 'text-amber-700 dark:text-amber-300' :
                  'text-blue-700 dark:text-blue-300'
                }`}>
                  💡 {issue.suggestion}
                </p>
              </div>
            </div>
          ))}
        </div>
      </td>
    </tr>
  );
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
  // Validation results
  const [validationResults, setValidationResults] = useState(null);
  // Table ref for jumping to rows
  const tableContainerRef = useRef(null);
  
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
          // Merge persisted rules with defaults to ensure new categories (like stateKeywords)
          // and new default keywords (like customer) are present even if not in old storage
          setClassificationRules({
            ...DEFAULT_CLASSIFICATION_RULES,
            ...persistedClassificationRules,
            // Deep merge keywords arrays to be extra safe
            stateKeywords: Array.from(new Set([
              ...DEFAULT_CLASSIFICATION_RULES.stateKeywords, 
              ...(persistedClassificationRules.stateKeywords || [])
            ])).sort(),
            behaviorKeywords: Array.from(new Set([
              ...DEFAULT_CLASSIFICATION_RULES.behaviorKeywords, 
              ...(persistedClassificationRules.behaviorKeywords || [])
            ])).sort(),
            ruleKeywords: Array.from(new Set([
              ...DEFAULT_CLASSIFICATION_RULES.ruleKeywords, 
              ...(persistedClassificationRules.ruleKeywords || [])
            ])).sort()
          });
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
        // Initialize from persisted classifications, then fill any gaps via auto-detection
        const initialClassifications = Object.keys(stepClassifications).length > 0 
          ? stepClassifications 
          : {};
        
        // Fill in any missing classifications via auto-detection
        steps.forEach(step => {
          if (!initialClassifications[step.id]) {
            initialClassifications[step.id] = detectStepType(step.name, classificationRules);
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
  }, [isOpen, steps, stateDictionary, ruleDictionary, stepClassifications, classificationRules]);
  
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
    // Re-validate before export
    const results = validateStateMachineRows(editableRows);
    if (!results.valid) {
      setValidationResults(results);
      toast.error('Cannot export: State machine has critical errors. Please fix them below.', {
        duration: 5000
      });
      return;
    }

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

  // Run validation
  const handleValidate = () => {
    const results = validateStateMachineRows(editableRows);
    setValidationResults(results);
    if (results.valid) {
      toast.success('Validation passed!');
    } else {
      toast.error(`Validation found ${results.errors.length} error(s)`);
    }
  };

  // Add all missing unmapped states and rules
  const handleAddAllMissing = () => {
    const { stateEntries, ruleEntries } = extractUnmappedItems(editableRows);
    
    const stateCount = Object.keys(stateEntries).length;
    const ruleCount = Object.keys(ruleEntries).length;
    
    if (stateCount === 0 && ruleCount === 0) {
      toast.info('No unmapped items found!');
      return;
    }
    
    // Add all state entries
    if (stateCount > 0) {
      setStateDictionary(prev => ({ ...prev, ...stateEntries }));
    }
    
    // Add all rule entries
    if (ruleCount > 0) {
      setRuleDictionary(prev => ({ ...prev, ...ruleEntries }));
    }
    
    // Build detailed message
    const messages = [];
    if (stateCount > 0) {
      messages.push(`${stateCount} state${stateCount !== 1 ? 's' : ''}`);
    }
    if (ruleCount > 0) {
      messages.push(`${ruleCount} rule${ruleCount !== 1 ? 's' : ''}`);
    }
    
    toast.success(`Added ${messages.join(' and ')} to dictionaries!`);
    
    // Clear validation to force re-validation
    setValidationResults(null);
  };

  // Jump to row in the preview table
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
          {/* Validation Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                Validation & Integrity
              </h3>
              <Button 
                onClick={handleValidate} 
                variant="outline"
                className="gap-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
              >
                <CheckCircle2 className="w-4 h-4" />
                Validate State Machine
              </Button>
            </div>
            {validationResults && (
              <ValidationResultsDisplay 
                results={validationResults} 
                onAddAllMissing={handleAddAllMissing}
                hasUnmapped={editableRows.some(row => 
                  row.sourceNode.includes('[UNKNOWN_') || 
                  row.destinationNode.includes('[UNKNOWN_') || 
                  row.ruleList.includes('[UNKNOWN_')
                )}
              />
            )}
          </div>

          {/* CSV Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                CSV Preview ({editableRows.length} rows)
                {validationResults && (
                  <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    validationResults.summary.errors > 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                    'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                  }`}>
                    {validationResults.summary.errors > 0 ? <AlertCircle className="w-3 h-3" /> :
                     <CheckCircle2 className="w-3 h-3" />}
                    {validationResults.summary.errors > 0 ? 'Error' : 'Valid'}
                  </span>
                )}
              </h3>
            </div>
            <div 
              ref={tableContainerRef}
              className="border border-gray-200 dark:border-gray-700 rounded-md max-h-80 overflow-auto shadow-inner bg-gray-50/30"
            >
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
                    editableRows.map((row, index) => {
                      const rowIssues = validationResults 
                        ? validationResults.errors.filter(i => i.row === index)
                        : [];
                      
                      const rowError = rowIssues.find(i => i.type === 'error');

                      return (
                        <React.Fragment key={`row-group-${index}`}>
                          <tr 
                            className={`border-t border-gray-200 dark:border-gray-700 transition-colors ${
                              rowError ? 'bg-red-50/50 dark:bg-red-900/10' : ''
                            }`}
                          >
                            <td className="px-2 py-1 relative">
                              {rowIssues.some(i => i.message.includes('Source node')) && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" title="Source node issue" />
                              )}
                              <Input
                                value={row.sourceNode}
                                onChange={(e) => handleCellEdit(index, 'sourceNode', e.target.value)}
                                className={`h-8 text-sm ${row.sourceNode.includes('[UNKNOWN_STATE:') ? 'border-red-300 dark:border-red-900 focus-visible:ring-red-500' : ''}`}
                              />
                            </td>
                            <td className="px-2 py-1 relative">
                              {rowIssues.some(i => i.message.includes('Destination node')) && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" title="Destination node issue" />
                              )}
                              <Input
                                value={row.destinationNode}
                                onChange={(e) => handleCellEdit(index, 'destinationNode', e.target.value)}
                                className={`h-8 text-sm ${row.destinationNode.includes('[UNKNOWN_STATE:') ? 'border-red-300 dark:border-red-900 focus-visible:ring-red-500' : ''}`}
                                placeholder="empty"
                              />
                            </td>
                            <td className="px-2 py-1 relative">
                              {rowIssues.some(i => i.id.startsWith('err-missing-rule')) && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" title="Missing rule issue" />
                              )}
                              <Input
                                value={row.ruleList}
                                onChange={(e) => handleCellEdit(index, 'ruleList', e.target.value)}
                                className={`h-8 text-sm ${
                                  row.ruleList.includes('[UNKNOWN_RULE:') ? 'border-red-300 dark:border-red-900 focus-visible:ring-red-500' : 
                                  !row.ruleList && row.destinationNode ? 'border-amber-300 dark:border-amber-900 bg-amber-50/30' : ''
                                }`}
                                placeholder={!row.ruleList && row.destinationNode ? "Needs rule..." : ""}
                              />
                            </td>
                            <td className="px-2 py-1 text-center">
                              <Input
                                type="number"
                                value={row.priority}
                                onChange={(e) => handleCellEdit(index, 'priority', Number.parseInt(e.target.value, 10) || 50)}
                                className="h-8 text-sm w-20 mx-auto"
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
                          {rowIssues.length > 0 && (
                            <RowValidationDisplay issues={rowIssues} />
                          )}
                        </React.Fragment>
                      );
                    })
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
