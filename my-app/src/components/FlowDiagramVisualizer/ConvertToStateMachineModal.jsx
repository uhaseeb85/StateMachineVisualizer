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
  Info
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
      const escapedKeyword = keyword.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\\$&`);
      // Match as whole word or part of string based on keyword length/type
      const regex = new RegExp(String.raw`\b${escapedKeyword}\b`, 'i');
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

const getNextStepIdFromConnections = (connectionsBySource, fromStepId) => {
  const nextConnections = connectionsBySource.get(fromStepId);
  return nextConnections?.[0]?.toStepId || null;
};

const followRuleBehaviorChainToState = ({ startStepId, connectionsBySource, getStepType, getStepLabel }) => {
  const ruleChain = [];
  let currentStepId = startStepId;
  const visited = new Set();

  while (currentStepId && !visited.has(currentStepId)) {
    visited.add(currentStepId);

    const currentType = getStepType(currentStepId);
    if (currentType === 'rule') {
      ruleChain.push(getStepLabel(currentStepId));
      currentStepId = getNextStepIdFromConnections(connectionsBySource, currentStepId);
      continue;
    }

    if (currentType === 'behavior') {
      currentStepId = getNextStepIdFromConnections(connectionsBySource, currentStepId);
      continue;
    }

    return {
      ruleList: ruleChain.join(' + '),
      destinationNode: getStepLabel(currentStepId)
    };
  }

  return {
    ruleList: ruleChain.join(' + '),
    destinationNode: ''
  };
};

const skipBehaviorChain = ({ startStepId, connectionsBySource, getStepType }) => {
  let currentStepId = startStepId;
  const visited = new Set();

  while (currentStepId && !visited.has(currentStepId) && getStepType(currentStepId) === 'behavior') {
    visited.add(currentStepId);
    currentStepId = getNextStepIdFromConnections(connectionsBySource, currentStepId);
  }

  return currentStepId;
};

const resolveStateConnection = ({ toStepId, connectionsBySource, getStepType, getStepLabel }) => {
  const toType = getStepType(toStepId);

  if (toType === 'rule') {
    return followRuleBehaviorChainToState({ startStepId: toStepId, connectionsBySource, getStepType, getStepLabel });
  }

  if (toType === 'behavior') {
    const nextAfterBehaviors = skipBehaviorChain({ startStepId: toStepId, connectionsBySource, getStepType });
    if (!nextAfterBehaviors) {
      return { ruleList: '', destinationNode: '' };
    }

    const nextType = getStepType(nextAfterBehaviors);
    if (nextType === 'rule') {
      return followRuleBehaviorChainToState({ startStepId: nextAfterBehaviors, connectionsBySource, getStepType, getStepLabel });
    }

    if (nextType === 'behavior') {
      return { ruleList: '', destinationNode: '' };
    }

    // Behavior leads directly to a state (no rule) - flag via validation ruleList empty.
    return { ruleList: '', destinationNode: getStepLabel(nextAfterBehaviors) };
  }

  // Normal state-to-state connection
  return { ruleList: 'TRUE', destinationNode: getStepLabel(toStepId) };
};

/**
 * Convert flow diagram to state machine CSV rows
 */
const convertToStateMachineRows = (steps, connections, classificationRules) => {
  const rows = [];
  let priority = 0; // Start priority at 0 and increment for each row

  const stepsById = new Map(steps.map((s) => [s.id, s]));

  const getStepType = (stepId) => {
    const step = stepsById.get(stepId);
    if (!step) return 'state';
    return step.type || detectStepType(step.name, classificationRules);
  };

  const getStepLabel = (stepId) => {
    const step = stepsById.get(stepId);
    if (!step) return '';
    const alias = (step.alias || '').trim();
    return alias || step.name || '';
  };

  // Separate steps into states (exclude both rules and behaviors)
  const stateSteps = steps.filter((step) => {
    const stepType = step.type || detectStepType(step.name, classificationRules);
    return stepType !== 'rule' && stepType !== 'behavior';
  });
  
  // Group connections by source step
  const connectionsBySource = new Map();
  connections.forEach(conn => {
    if (!connectionsBySource.has(conn.fromStepId)) {
      connectionsBySource.set(conn.fromStepId, []);
    }
    connectionsBySource.get(conn.fromStepId).push(conn);
  });

  const resolveConnection = (toStepId) =>
    resolveStateConnection({ toStepId, connectionsBySource, getStepType, getStepLabel });
  
  // Generate rows for each state step
  stateSteps.forEach(step => {
    const sourceName = (step.alias || '').trim() || step.name;
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
        const { ruleList, destinationNode } = resolveConnection(conn.toStepId);
        
        rows.push({
          sourceNode: sourceName,
          destinationNode,
          ruleList,
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
    <div className="space-y-4 flex flex-col flex-1 overflow-hidden">
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
      <div className="border border-gray-200 dark:border-gray-700 rounded-md flex-1 overflow-y-auto">
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
    <div className="space-y-4 flex flex-col flex-1 overflow-hidden">
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
          <div>• Starts with &quot;ask&quot; → <strong>State</strong></div>
          <div>• ALL CAPS (e.g., &quot;DASHBOARD&quot;) → <strong>State</strong></div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 flex-1 overflow-hidden">
        <div className="space-y-3 flex flex-col overflow-hidden">
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
          <div className="border border-gray-200 dark:border-gray-700 rounded-md flex-1 overflow-y-auto">
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

        <div className="space-y-3 flex flex-col overflow-hidden">
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
          <div className="border border-gray-200 dark:border-gray-700 rounded-md flex-1 overflow-y-auto">
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

        <div className="space-y-3 flex flex-col overflow-hidden">
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
          <div className="border border-gray-200 dark:border-gray-700 rounded-md flex-1 overflow-y-auto">
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

    if (!row.sourceNode?.trim()) {
      errors.push({
        id: `err-src-empty-${index}`,
        row: index,
        type: 'error',
        message: `Row ${rowNum}: Source node is empty.`,
        suggestion: 'Set a Source Node value (typically a State alias/name).'
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
const ValidationResultsDisplay = ({ results }) => {
  if (!results) return null;

  const { summary } = results;
  const errorCount = summary?.errors || 0;
  const errorPluralSuffix = errorCount === 1 ? '' : 's';
  const headerBgClass = errorCount > 0
    ? 'bg-red-50 dark:bg-red-950/20'
    : 'bg-green-50 dark:bg-green-950/20';
  const titleText = errorCount > 0
    ? `${errorCount} Error${errorPluralSuffix} Found`
    : 'Validation Passed';

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div 
        className={`flex items-center justify-between px-4 py-3 ${headerBgClass}`}
      >
        <div className="flex items-center gap-3">
          {errorCount > 0 ? (
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          )}
          <span className="font-medium text-sm">
            {titleText}
          </span>
          <div className="flex items-center gap-2 ml-4">
            {errorCount > 0 && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                {errorCount} ERR
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {errorCount === 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              All {summary.total} rows are valid ✓
            </span>
          )}
          {errorCount > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              See issues below each affected row
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

ValidationResultsDisplay.propTypes = {
  results: PropTypes.shape({
    summary: PropTypes.shape({
      total: PropTypes.number,
      errors: PropTypes.number
    })
  })
};

/**
 * Inline Row Validation Display Component
 */
const RowValidationDisplay = ({ issues }) => {
  if (!issues || issues.length === 0) return null;

  const getIssueStyles = (type) => {
    switch (type) {
      case 'error':
        return {
          containerClass: 'border-red-200 bg-red-50/80 dark:border-red-900/50 dark:bg-red-900/20',
          Icon: AlertCircle,
          iconClass: 'w-4 h-4 text-red-600 dark:text-red-400',
          titleClass: 'text-red-900 dark:text-red-200',
          suggestionClass: 'text-red-700 dark:text-red-300'
        };
      case 'warning':
        return {
          containerClass: 'border-amber-200 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-900/20',
          Icon: AlertTriangle,
          iconClass: 'w-4 h-4 text-amber-600 dark:text-amber-400',
          titleClass: 'text-amber-900 dark:text-amber-200',
          suggestionClass: 'text-amber-700 dark:text-amber-300'
        };
      default:
        return {
          containerClass: 'border-blue-200 bg-blue-50/80 dark:border-blue-900/50 dark:bg-blue-900/20',
          Icon: Info,
          iconClass: 'w-4 h-4 text-blue-600 dark:text-blue-400',
          titleClass: 'text-blue-900 dark:text-blue-200',
          suggestionClass: 'text-blue-700 dark:text-blue-300'
        };
    }
  };

  return (
    <tr>
      <td colSpan="5" className="px-0 py-0">
        <div className="bg-gradient-to-r from-red-50 via-amber-50 to-blue-50 dark:from-red-950/10 dark:via-amber-950/10 dark:to-blue-950/10 px-4 py-3 space-y-2">
          {issues.map((issue) => (
            (() => {
              const { containerClass, Icon, iconClass, titleClass, suggestionClass } = getIssueStyles(issue.type);
              return (
                <div key={issue.id} className={`flex gap-3 p-2.5 rounded-md border text-xs ${containerClass}`}>
                  <div className="mt-0.5 flex-shrink-0">
                    <Icon className={iconClass} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold ${titleClass}`}>{issue.message}</p>
                    <p className={`mt-0.5 ${suggestionClass}`}>💡 {issue.suggestion}</p>
                  </div>
                </div>
              );
            })()
          ))}
        </div>
      </td>
    </tr>
  );
};

RowValidationDisplay.propTypes = {
  issues: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['error', 'warning', 'info']).isRequired,
    message: PropTypes.string.isRequired,
    suggestion: PropTypes.string
  }))
};

/**
 * Main Modal Component
 */
const ConvertToStateMachineModal = ({ isOpen, onClose, steps, connections }) => {
  const [classificationRules, setClassificationRules] = useState(DEFAULT_CLASSIFICATION_RULES);
  // Track active tab for dictionaries and classification
  const [activeTab, setActiveTab] = useState('csv'); // 'csv' | 'rules' | 'rootsteps' | null
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
        const persistedClassificationRules = await getItem('flowDiagram_classificationRules');
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
            ])).sort((a, b) => a.localeCompare(b)),
            behaviorKeywords: Array.from(new Set([
              ...DEFAULT_CLASSIFICATION_RULES.behaviorKeywords, 
              ...(persistedClassificationRules.behaviorKeywords || [])
            ])).sort((a, b) => a.localeCompare(b)),
            ruleKeywords: Array.from(new Set([
              ...DEFAULT_CLASSIFICATION_RULES.ruleKeywords, 
              ...(persistedClassificationRules.ruleKeywords || [])
            ])).sort((a, b) => a.localeCompare(b))
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
    return convertToStateMachineRows(filteredSteps, filteredConnections, classificationRules);
  }, [filteredSteps, filteredConnections, classificationRules, isOpen]);
  
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
                  Export your flow diagram as a state machine CSV using step aliases (fallback to step name) and step types (state/rule/behavior).
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
        
        <div className="flex-1 overflow-y-auto py-4">
          {/* Dictionary and Classification Tabs */}
          <div className="space-y-4">
            <div className="flex items-center border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
              <button
                onClick={() => setActiveTab(activeTab === 'csv' ? null : 'csv')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'csv'
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                CSV Preview ({editableRows.length})
              </button>
              <button
                onClick={() => setActiveTab(activeTab === 'rules' ? null : 'rules')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'rules'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Classification Rules
              </button>
              <button
                onClick={() => setActiveTab(activeTab === 'rootsteps' ? null : 'rootsteps')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'rootsteps'
                    ? 'border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Root Steps Selection ({selectedRootSteps.size}/{rootSteps.length})
              </button>
            </div>

            <div className="pt-2 flex flex-col flex-1 overflow-hidden">
              {activeTab === 'csv' && (
                <div className="space-y-6 flex flex-col flex-1 overflow-hidden">
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
                      <ValidationResultsDisplay results={validationResults} />
                    )}
                  </div>

                  {/* CSV Preview Section */}
                  <div className="space-y-3 flex flex-col flex-1 overflow-hidden">
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
                      className="border border-gray-200 dark:border-gray-700 rounded-md flex-1 overflow-auto shadow-inner bg-gray-50/30"
                    >
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
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
                                  ? 'No root steps selected. Select at least one root step in the "Root Steps Selection" tab.'
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
                                <React.Fragment key={`row-group-${row.priority ?? index}`}>
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
                                        className="h-8 text-sm"
                                      />
                                    </td>
                                    <td className="px-2 py-1 relative">
                                      {rowIssues.some(i => i.message.includes('Destination node')) && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" title="Destination node issue" />
                                      )}
                                      <Input
                                        value={row.destinationNode}
                                        onChange={(e) => handleCellEdit(index, 'destinationNode', e.target.value)}
                                        className="h-8 text-sm"
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
                                        className={`h-8 text-sm ${!row.ruleList && row.destinationNode ? 'border-amber-300 dark:border-amber-900 bg-amber-50/30' : ''}`}
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
                </div>
              )}
              {activeTab === 'rootsteps' && (
                <div className="flex flex-col flex-1 overflow-hidden">
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
                  <div className="border border-gray-200 dark:border-gray-700 rounded-md flex-1 overflow-y-auto">
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
              {activeTab === 'rules' && (
                <div className="flex flex-col flex-1 overflow-hidden">
                  <ClassificationRulesEditor
                    rules={classificationRules}
                    onChange={setClassificationRules}
                    onExport={handleExportClassificationRules}
                    onRestoreDefaults={handleRestoreClassificationRulesDefaults}
                  />
                </div>
              )}
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
