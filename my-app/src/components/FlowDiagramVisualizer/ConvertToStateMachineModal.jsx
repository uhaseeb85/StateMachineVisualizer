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
import ConvertToStateMachineWelcomeModal from './ConvertToStateMachineWelcomeModal';

/**
 * Auto-classify steps based on naming rules
 * Rule 1: Ends with ? → rule
 * Rule 2: ALL CAPS → state
 */
const autoClassifyStep = (stepName) => {
  if (!stepName) return null;
  
  // Rule 1: Ends with ? → rule
  if (stepName.trim().endsWith('?')) {
    return 'rule';
  }
  
  // Rule 2: ALL CAPS (with at least one letter) → state
  if (/[A-Z]/.test(stepName) && stepName === stepName.toUpperCase()) {
    return 'state';
  }
  
  return null; // No rule matches, keep existing type
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
const convertToStateMachineRows = (steps, connections) => {
  const rows = [];
  let priority = 0; // Start priority at 0 and increment for each row

  const stepsById = new Map(steps.map((s) => [s.id, s]));

  const getStepType = (stepId) => {
    const step = stepsById.get(stepId);
    if (!step) return 'state';
    return step.type || 'state';
  };

  const getStepLabel = (stepId) => {
    const step = stepsById.get(stepId);
    if (!step) return '';
    const alias = (step.alias || '').trim();
    return alias || step.name || '';
  };

  // Separate steps into states (exclude both rules and behaviors)
  const stateSteps = steps.filter((step) => {
    const stepType = step.type || 'state';
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

  const dedupedRows = [];
  const emptyRowSources = new Set();
  const normalize = (value) => (value ?? '').toString().trim();
  const isBlank = (value) => normalize(value) === '';

  rows.forEach((row) => {
    const normalizedSource = normalize(row.sourceNode);
    const isEmptyRow =
      isBlank(row.destinationNode) &&
      isBlank(row.ruleList) &&
      isBlank(row.operation);

    if (isEmptyRow) {
      if (emptyRowSources.has(normalizedSource)) {
        return;
      }
      emptyRowSources.add(normalizedSource);
    }

    dedupedRows.push({
      ...row,
      sourceNode: normalizedSource,
      destinationNode: normalize(row.destinationNode),
      ruleList: normalize(row.ruleList),
      operation: normalize(row.operation)
    });
  });

  return dedupedRows.map((row, index) => ({
    ...row,
    priority: index
  }));
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
 * Step Classification Editor Component
 */
const StepClassificationEditor = ({ steps, onUpdateStep, onRunAutoClassify }) => {
  const getQualifiedName = (step, allSteps) => {
    if (!step.parentId) return step.name;
    const parent = allSteps.find(s => s.id === step.parentId);
    if (!parent) return step.name;
    const parentName = getQualifiedName(parent, allSteps);
    return `${parentName} > ${step.name}`;
  };

  const handleTypeChange = (stepId, newType) => {
    if (onUpdateStep) {
      onUpdateStep(stepId, { type: newType });
      toast.success('Step type updated');
    }
  };

  return (
    <div className="space-y-4 flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Classify Step Types
        </h4>
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Changes sync with Step Panel
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onRunAutoClassify}
            disabled={!onRunAutoClassify || steps.length === 0}
            className="h-7 px-3 text-xs"
          >
            Run Auto-Classification
          </Button>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h5 className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-100">
          Auto-Classification Rules
        </h5>
        <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
          <div>• Ends with ? (e.g., &quot;is eligible?&quot;) → <strong>Rule</strong></div>
          <div>• ALL CAPS (e.g., &quot;DASHBOARD&quot;) → <strong>State</strong></div>
          <div className="mt-2 italic">Auto-classification runs from this tab</div>
        </div>
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-md flex-1 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300 font-medium">
                Step Name
              </th>
              <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-300 font-medium w-48">
                Type
              </th>
            </tr>
          </thead>
          <tbody>
            {steps.length === 0 ? (
              <tr>
                <td colSpan="2" className="px-3 py-8 text-center text-gray-500 dark:text-gray-400">
                  No steps to classify.
                </td>
              </tr>
            ) : (
              steps.map(step => {
                const qualifiedName = getQualifiedName(step, steps);
                const currentType = step.type || 'state';
                
                return (
                  <tr key={step.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-3 py-2 text-gray-900 dark:text-gray-100">
                      {qualifiedName}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2 justify-center">
                        <Button
                          type="button"
                          size="sm"
                          variant={currentType === 'state' ? 'default' : 'outline'}
                          onClick={() => handleTypeChange(step.id, 'state')}
                          className="h-7 px-3 text-xs"
                        >
                          State
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={currentType === 'rule' ? 'default' : 'outline'}
                          onClick={() => handleTypeChange(step.id, 'rule')}
                          className="h-7 px-3 text-xs"
                        >
                          Rule
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={currentType === 'behavior' ? 'default' : 'outline'}
                          onClick={() => handleTypeChange(step.id, 'behavior')}
                          className="h-7 px-3 text-xs"
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
  );
};

StepClassificationEditor.propTypes = {
  steps: PropTypes.array.isRequired,
  onUpdateStep: PropTypes.func,
  onRunAutoClassify: PropTypes.func
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
const ConvertToStateMachineModal = ({ isOpen, onClose, steps, connections, onUpdateStep }) => {
  // Track active tab for dictionaries and classification
  const [activeTab, setActiveTab] = useState('csv'); // 'csv' | 'rootsteps' | 'classify' | null
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
  
  // Generate CSV preview data using filtered steps and connections
  const csvRows = useMemo(() => {
    if (!isOpen) return [];
    return convertToStateMachineRows(filteredSteps, filteredConnections);
  }, [filteredSteps, filteredConnections, isOpen]);
  
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

  const runAutoClassification = () => {
    if (!onUpdateStep || filteredSteps.length === 0) {
      return;
    }

    const typeUpdates = new Map();

    filteredSteps.forEach(step => {
      const suggestedType = autoClassifyStep(step.name);
      if (suggestedType && step.type !== suggestedType) {
        typeUpdates.set(step.id, suggestedType);
      }
    });

    if (typeUpdates.size === 0) {
      toast.info('No steps matched auto-classification rules');
      return;
    }

    typeUpdates.forEach((type, stepId) => {
      onUpdateStep(stepId, { type });
    });

    const updatedFilteredSteps = filteredSteps.map(step => {
      if (typeUpdates.has(step.id)) {
        return { ...step, type: typeUpdates.get(step.id) };
      }
      return step;
    });

    const updatedRows = convertToStateMachineRows(updatedFilteredSteps, filteredConnections);
    setEditableRows(updatedRows);
    setValidationResults(null);
    toast.info(`Auto-classified ${typeUpdates.size} step(s)`);
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
                onClick={() => setActiveTab(activeTab === 'rootsteps' ? null : 'rootsteps')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'rootsteps'
                    ? 'border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Root Steps Selection ({selectedRootSteps.size}/{rootSteps.length})
              </button>
              <button
                onClick={() => setActiveTab(activeTab === 'classify' ? null : 'classify')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'classify'
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Step Classification ({filteredSteps.length})
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
              {activeTab === 'classify' && (
                <div className="flex flex-col flex-1 overflow-hidden">
                  <StepClassificationEditor
                    steps={filteredSteps}
                    onUpdateStep={onUpdateStep}
                    onRunAutoClassify={runAutoClassification}
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
  })).isRequired,
  onUpdateStep: PropTypes.func
};

export default ConvertToStateMachineModal;
