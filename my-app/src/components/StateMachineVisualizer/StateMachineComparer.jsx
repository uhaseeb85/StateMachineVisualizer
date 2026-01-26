/**
 * StateMachineComparer.jsx
 * 
 * Component for comparing two state machines and visualizing their differences.
 * Helps users identify the structural and rule differences between two state machines.
 */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Check, GitCompare, FileUp, Database, Download, Plus, XCircle, Loader2, Search, Filter as FilterIcon } from 'lucide-react';
import { toast } from 'sonner';
import { parseExcelFile, validateExcelData, generateId, sortRulesByPriority } from './utils';
import ExcelJS from 'exceljs';

const StateMachineComparer = ({ isOpen, onClose, states }) => {
  // Store the current state machine as a baseline
  const [baseStateMachine, setBaseStateMachine] = useState(null);
  // State for the second state machine to compare
  const [compareStateMachine, setCompareStateMachine] = useState(null);
  // Whether comparison is in progress
  const [isComparing, setIsComparing] = useState(false);
  // Whether file import is in progress
  const [isLoading, setIsLoading] = useState(false);
  // File input ref for CSV import
  const fileInputRef = useRef(null);
  // Filter and search state
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  // Comparison results
  const [results, setResults] = useState({
    stateComparison: [],
    ruleComparison: [],
    summary: {
      addedStates: 0,
      removedStates: 0,
      modifiedStates: 0,
      addedRules: 0,
      removedRules: 0,
      modifiedRules: 0
    }
  });

  // Update baseline state machine when component opens
  useEffect(() => {
    if (isOpen) {
      setBaseStateMachine({
        id: 'current',
        name: 'Current State Machine',
        data: JSON.parse(JSON.stringify(states)) // Deep copy
      });
    }
  }, [isOpen]);

  // Debounce search input for performance with large datasets
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText]);

  // Trigger file input click for CSV import
  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  // Process the imported CSV/Excel file
  const handleFileImport = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      // File size validation (50MB limit)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        throw new Error('File size exceeds 50MB limit');
      }

      setIsLoading(true);

      // Process Excel/CSV file
      const rows = await parseExcelFile(file);
      const { sourceNodeIndex, destNodeIndex, ruleListIndex, headers } = validateExcelData(rows);
      
      // Get priority index if it exists
      const priorityIndex = headers.findIndex(h => h === 'priority' || h === 'priority ');
      
      // Get operation index if it exists
      const operationIndex = headers.findIndex(h => h === 'operation' || h === 'operation ');

      // Create state map
      const stateMap = new Map();
      
      // Process rows (starting from row 1, skipping header)
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        
        // Skip empty rows
        if (!row[sourceNodeIndex] || !row[destNodeIndex]) continue;
        
        const sourceNode = row[sourceNodeIndex].toString().trim();
        const destNode = row[destNodeIndex].toString().trim();
        const ruleList = row[ruleListIndex]?.toString().trim() || 'TRUE';
        const priority = priorityIndex !== -1 ? Number(row[priorityIndex] || 50) : 50;
        const operation = operationIndex !== -1 ? row[operationIndex]?.toString().trim() : '';
        
        // Create states if they don't exist
        if (!stateMap.has(sourceNode)) {
          stateMap.set(sourceNode, {
            id: generateId(),
            name: sourceNode,
            rules: []
          });
        }
        
        if (!stateMap.has(destNode)) {
          stateMap.set(destNode, {
            id: generateId(),
            name: destNode,
            rules: []
          });
        }
        
        // Add rule
        const sourceState = stateMap.get(sourceNode);
        const targetState = stateMap.get(destNode);
        sourceState.rules.push({
          id: generateId(),
          condition: ruleList,
          nextState: targetState.id,
          priority: priority,
          operation: operation
        });
      }
      
      // Convert Map to array of states
      const importedStates = Array.from(stateMap.values());
      
      // Sort rules by priority
      importedStates.forEach(state => {
        state.rules = sortRulesByPriority(state.rules);
      });
      
      // Set as compare state machine
      setCompareStateMachine({
        id: 'imported',
        name: `Imported from ${file.name}`,
        data: importedStates
      });
      
      toast.success(`Successfully imported "${file.name}" for comparison`);
    } catch (error) {
      console.error('StateMachineComparer - Import error:', error);
      toast.error(`Import error: ${error.message}`);
    } finally {
      setIsLoading(false);
      event.target.value = '';
    }
  };

  // Run the comparison between the two state machines
  const runComparison = () => {
    if (!baseStateMachine || !compareStateMachine) {
      toast.error('Please select a CSV/Excel file to compare');
      return;
    }

    setIsComparing(true);
    
    try {
      const base = baseStateMachine.data;
      const compare = compareStateMachine.data;
      
      // Compare states first
      const stateComparison = compareStates(base, compare);
      
      // Compare rules
      const ruleComparison = compareRules(base, compare);
      
      // Generate summary
      const summary = {
        addedStates: stateComparison.filter(s => s.status === 'added').length,
        removedStates: stateComparison.filter(s => s.status === 'removed').length,
        modifiedStates: stateComparison.filter(s => s.status === 'modified').length,
        addedRules: ruleComparison.filter(r => r.status === 'added').length,
        removedRules: ruleComparison.filter(r => r.status === 'removed').length,
        modifiedRules: ruleComparison.filter(r => r.status === 'modified').length
      };

      setResults({
        stateComparison,
        ruleComparison,
        summary
      });

      // Check if there are any actual differences
      const hasDifferences = 
        summary.addedStates > 0 || 
        summary.removedStates > 0 || 
        summary.modifiedStates > 0 || 
        summary.addedRules > 0 || 
        summary.removedRules > 0 || 
        summary.modifiedRules > 0;

      if (!hasDifferences) {
        toast.success('State machines are identical - no differences found');
      } else {
        toast.success('Comparison completed successfully');
      }
    } catch (error) {
      console.error('Error comparing state machines:', error);
      toast.error('Failed to compare state machines');
    } finally {
      setIsComparing(false);
    }
  };

  // Helper: Check if two states match using multi-criteria approach
  const statesMatch = useCallback((state1, state2) => {
    // Priority 1: Exact ID match
    if (state1.id === state2.id) {
      return true;
    }
    
    // Priority 2: Name match
    if (state1.name === state2.name) {
      return true;
    }
    
    // Priority 3: Normalized name match (handles spacing/case differences)
    const normalizedName1 = state1.name.toLowerCase().trim().replace(/\s+/g, ' ');
    const normalizedName2 = state2.name.toLowerCase().trim().replace(/\s+/g, ' ');
    if (normalizedName1 === normalizedName2) {
      return true;
    }
    
    return false;
  }, []);

  // Helper: Check if two rules match using comprehensive criteria
  const rulesMatch = useCallback((rule1, states1, rule2, states2) => {
    // Priority 1: Exact ID match (if both have string IDs)
    if (typeof rule1.id === 'string' && typeof rule2.id === 'string' && 
        rule1.id === rule2.id && rule1.id.startsWith('id_')) {
      return true;
    }
    
    // Priority 2: Condition match (primary identifier)
    const condition1 = rule1.condition.trim().toLowerCase();
    const condition2 = rule2.condition.trim().toLowerCase();
    if (condition1 !== condition2) {
      return false;
    }
    
    // Priority 3: Check if target states match (by name, not ID)
    const targetState1 = states1.find(s => s.id === rule1.nextState);
    const targetState2 = states2.find(s => s.id === rule2.nextState);
    
    if (targetState1 && targetState2) {
      // Both target states exist - compare by name
      if (targetState1.name.toLowerCase() !== targetState2.name.toLowerCase()) {
        return false;
      }
    } else if (targetState1 || targetState2) {
      // One exists but not the other - different rules
      return false;
    }
    
    return true;
  }, []);

  // Helper: Compare two rules and identify what changed
  const compareRuleDetails = useCallback((rule1, states1, rule2, states2) => {
    const changes = [];
    
    // Compare next states
    const nextState1 = states1.find(s => s.id === rule1.nextState)?.name || 'unknown';
    const nextState2 = states2.find(s => s.id === rule2.nextState)?.name || 'unknown';
    if (nextState1 !== nextState2) {
      changes.push(`Next state: ${nextState1} → ${nextState2}`);
    }
    
    // Compare priorities
    const priority1 = rule1.priority !== undefined && rule1.priority !== null ? rule1.priority : 50;
    const priority2 = rule2.priority !== undefined && rule2.priority !== null ? rule2.priority : 50;
    if (priority1 !== priority2) {
      changes.push(`Priority: ${priority1} → ${priority2}`);
    }
    
    // Compare operations
    const op1 = rule1.operation || '';
    const op2 = rule2.operation || '';
    if (op1 !== op2) {
      const displayOp1 = op1 || 'none';
      const displayOp2 = op2 || 'none';
      changes.push(`Operation: ${displayOp1} → ${displayOp2}`);
    }
    
    return {
      isModified: changes.length > 0,
      changes
    };
  }, []);

  // Compare states between two state machines
  const compareStates = (base, compare) => {
    const result = [];
    const processedCompareStates = new Set();
    
    // Process base states
    base.forEach(baseState => {
      const compareState = compare.find(s => statesMatch(baseState, s));
      
      if (compareState) {
        processedCompareStates.add(compareState.id);
        
        // Check if modified by comparing rules
        let isModified = false;
        
        // Quick check - different number of rules
        if (baseState.rules.length !== compareState.rules.length) {
          isModified = true;
        } else {
          // Deep comparison - check each rule
          const sortedBaseRules = [...baseState.rules].sort((a, b) => 
            a.condition.localeCompare(b.condition)
          );
          const sortedCompareRules = [...compareState.rules].sort((a, b) => 
            a.condition.localeCompare(b.condition)
          );
          
          for (let i = 0; i < sortedBaseRules.length; i++) {
            const baseRule = sortedBaseRules[i];
            const compareRule = sortedCompareRules[i];
            
            // Use enhanced matching
            if (!rulesMatch(baseRule, base, compareRule, compare)) {
              isModified = true;
              break;
            }
            
            // Check if rule details changed
            const comparison = compareRuleDetails(baseRule, base, compareRule, compare);
            if (comparison.isModified) {
              isModified = true;
              break;
            }
          }
        }
        
        result.push({
          name: baseState.name,
          status: isModified ? 'modified' : 'unchanged',
          baseRules: baseState.rules.length,
          compareRules: compareState.rules.length
        });
      } else {
        // State removed
        result.push({
          name: baseState.name,
          status: 'removed',
          baseRules: baseState.rules.length,
          compareRules: 0
        });
      }
    });
    
    // Find added states
    compare.forEach(compareState => {
      if (!processedCompareStates.has(compareState.id)) {
        const baseState = base.find(s => statesMatch(s, compareState));
        if (!baseState) {
          result.push({
            name: compareState.name,
            status: 'added',
            baseRules: 0,
            compareRules: compareState.rules.length
          });
        }
      }
    });
    
    return result;
  };

  // Compare rules between two state machines
  const compareRules = (base, compare) => {
    const result = [];
    
    base.forEach(baseState => {
      const compareState = compare.find(s => statesMatch(baseState, s));
      
      if (compareState) {
        // Track processed compare rules to find added rules
        const processedCompareRules = new Set();
        
        // Check each base rule
        baseState.rules.forEach(baseRule => {
          const matchingRule = compareState.rules.find(r => 
            rulesMatch(baseRule, base, r, compare)
          );
          
          if (matchingRule) {
            processedCompareRules.add(matchingRule.id);
            
            // Use helper to detect changes
            const comparison = compareRuleDetails(baseRule, base, matchingRule, compare);
            
            const baseNextState = base.find(s => s.id === baseRule.nextState)?.name || 'unknown';
            const compareNextState = compare.find(s => s.id === matchingRule.nextState)?.name || 'unknown';
            
            result.push({
              stateName: baseState.name,
              condition: baseRule.condition,
              status: comparison.isModified ? 'modified' : 'unchanged',
              baseNextState,
              compareNextState,
              basePriority: baseRule.priority !== undefined ? baseRule.priority : 50,
              comparePriority: matchingRule.priority !== undefined ? matchingRule.priority : 50,
              baseOperation: baseRule.operation || '',
              compareOperation: matchingRule.operation || '',
              changes: comparison.changes
            });
          } else {
            // Rule removed
            const baseNextState = base.find(s => s.id === baseRule.nextState)?.name || 'unknown';
            result.push({
              stateName: baseState.name,
              condition: baseRule.condition,
              status: 'removed',
              baseNextState,
              compareNextState: '-',
              basePriority: baseRule.priority !== undefined ? baseRule.priority : 50,
              comparePriority: null,
              baseOperation: baseRule.operation || '',
              compareOperation: '',
              changes: []
            });
          }
        });
        
        // Find added rules
        compareState.rules.forEach(compareRule => {
          if (!processedCompareRules.has(compareRule.id)) {
            const matchingRule = baseState.rules.find(r => 
              rulesMatch(r, base, compareRule, compare)
            );
            
            if (!matchingRule) {
              const compareNextState = compare.find(s => s.id === compareRule.nextState)?.name || 'unknown';
              result.push({
                stateName: compareState.name,
                condition: compareRule.condition,
                status: 'added',
                baseNextState: '-',
                compareNextState,
                basePriority: null,
                comparePriority: compareRule.priority !== undefined ? compareRule.priority : 50,
                baseOperation: '',
                compareOperation: compareRule.operation || '',
                changes: []
              });
            }
          }
        });
      } else {
        // State doesn't exist in compare - all rules removed
        baseState.rules.forEach(baseRule => {
          const baseNextState = base.find(s => s.id === baseRule.nextState)?.name || 'unknown';
          result.push({
            stateName: baseState.name,
            condition: baseRule.condition,
            status: 'removed',
            baseNextState,
            compareNextState: '-',
            basePriority: baseRule.priority !== undefined ? baseRule.priority : 50,
            comparePriority: null,
            baseOperation: baseRule.operation || '',
            compareOperation: '',
            changes: []
          });
        });
      }
    });
    
    // Find rules in added states
    compare.forEach(compareState => {
      const baseState = base.find(s => statesMatch(s, compareState));
      
      if (!baseState) {
        compareState.rules.forEach(compareRule => {
          const compareNextState = compare.find(s => s.id === compareRule.nextState)?.name || 'unknown';
          result.push({
            stateName: compareState.name,
            condition: compareRule.condition,
            status: 'added',
            baseNextState: '-',
            compareNextState,
            basePriority: null,
            comparePriority: compareRule.priority !== undefined ? compareRule.priority : 50,
            baseOperation: '',
            compareOperation: compareRule.operation || '',
            changes: []
          });
        });
      }
    });
    
    return result;
  };

  // Get status badge based on status string
  const getStatusBadge = (status) => {
    switch (status) {
      case 'added':
        return (
          <Badge className="bg-green-500 inline-flex items-center gap-1">
            <Plus className="h-3 w-3" aria-hidden="true" />
            <span>New in Comparison</span>
          </Badge>
        );
      case 'removed':
        return (
          <Badge className="bg-red-500 inline-flex items-center gap-1">
            <XCircle className="h-3 w-3" aria-hidden="true" />
            <span>Missing from Comparison</span>
          </Badge>
        );
      case 'modified':
        return (
          <Badge className="bg-yellow-500 inline-flex items-center gap-1">
            <AlertCircle className="h-3 w-3" aria-hidden="true" />
            <span>Modified</span>
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-500 inline-flex items-center gap-1">
            <Check className="h-3 w-3" aria-hidden="true" />
            <span>Unchanged</span>
          </Badge>
        );
    }
  };

  // Memoized filtered state comparisons
  const filteredStateComparison = useMemo(() => {
    let filtered = results.stateComparison;
    
    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(state => state.status === statusFilter);
    }
    
    // Filter by type (only show if type is ALL or State)
    if (typeFilter !== 'ALL' && typeFilter !== 'State') {
      filtered = [];
    }
    
    // Search filter
    if (debouncedSearchText) {
      const lowerSearch = debouncedSearchText.toLowerCase();
      filtered = filtered.filter(state =>
        state.name.toLowerCase().includes(lowerSearch)
      );
    }
    
    return filtered;
  }, [results.stateComparison, statusFilter, typeFilter, debouncedSearchText]);

  // Memoized filtered rule comparisons
  const filteredRuleComparison = useMemo(() => {
    let filtered = results.ruleComparison;
    
    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(rule => rule.status === statusFilter);
    }
    
    // Filter by type (only show if type is ALL or Rule)
    if (typeFilter !== 'ALL' && typeFilter !== 'Rule') {
      filtered = [];
    }
    
    // Search filter
    if (debouncedSearchText) {
      const lowerSearch = debouncedSearchText.toLowerCase();
      filtered = filtered.filter(rule =>
        rule.condition.toLowerCase().includes(lowerSearch) ||
        rule.stateName.toLowerCase().includes(lowerSearch) ||
        rule.baseNextState.toLowerCase().includes(lowerSearch) ||
        rule.compareNextState.toLowerCase().includes(lowerSearch) ||
        (rule.baseOperation && rule.baseOperation.toLowerCase().includes(lowerSearch)) ||
        (rule.compareOperation && rule.compareOperation.toLowerCase().includes(lowerSearch))
      );
    }
    
    return filtered;
  }, [results.ruleComparison, statusFilter, typeFilter, debouncedSearchText]);

  // Computed counts for display
  const filterCounts = useMemo(() => {
    const totalStates = results.stateComparison.length;
    const totalRules = results.ruleComparison.length;
    const visibleStates = filteredStateComparison.length;
    const visibleRules = filteredRuleComparison.length;
    const totalVisible = visibleStates + visibleRules;
    const totalAll = totalStates + totalRules;
    
    return {
      totalStates,
      totalRules,
      visibleStates,
      visibleRules,
      totalVisible,
      totalAll,
      isFiltered: debouncedSearchText || statusFilter !== 'ALL' || typeFilter !== 'ALL'
    };
  }, [filteredStateComparison, filteredRuleComparison, results, debouncedSearchText, statusFilter, typeFilter]);

  // Memoized changed states (for performance)
  const changedStates = useMemo(() =>
    results.stateComparison.filter(state => state.status !== 'unchanged'),
    [results.stateComparison]
  );

  // Memoized changed rules (for performance)
  const changedRules = useMemo(() =>
    results.ruleComparison.filter(rule => rule.status !== 'unchanged'),
    [results.ruleComparison]
  );

  // Computed results
  const hasResults = useMemo(() =>
    results.stateComparison.length > 0,
    [results.stateComparison]
  );

  const hasDifferences = useMemo(() =>
    changedStates.length > 0 || changedRules.length > 0,
    [changedStates, changedRules]
  );

  // Export comparison results to Excel
  const exportComparisonResults = async () => {
    if (!hasResults) {
      toast.error('No comparison results to export');
      return;
    }

    try {
      // Create a new workbook
      const workbook = new ExcelJS.Workbook();
      
      // Create a summary worksheet
      const summarySheet = workbook.addWorksheet('Summary');
      summarySheet.addRows([
        ['Comparison Summary'],
        [''],
        ['State Changes'],
        ['Added States', results.summary.addedStates],
        ['Removed States', results.summary.removedStates],
        ['Modified States', results.summary.modifiedStates],
        [''],
        ['Rule Changes'],
        ['Added Rules', results.summary.addedRules],
        ['Removed Rules', results.summary.removedRules],
        ['Modified Rules', results.summary.modifiedRules],
        [''],
        ['Baseline State Machine', baseStateMachine?.name || 'Current State Machine'],
        ['Comparison State Machine', compareStateMachine?.name || 'Imported State Machine'],
        ['Comparison Date', new Date().toLocaleString()]
      ]);
      
      // Create a unified comparison worksheet
      const diffSheet = workbook.addWorksheet('Differences');
      diffSheet.columns = [
        { header: 'Type', key: 'type', width: 10 },
        { header: 'Name', key: 'name', width: 40 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Details', key: 'details', width: 60 }
      ];
      
      // Add state differences using memoized changedStates
      changedStates.forEach(state => {
          let details = '';
          if (state.status === 'modified') {
            details = `Rules: ${state.baseRules} → ${state.compareRules}`;
          } else if (state.status === 'added') {
            details = `Contains ${state.compareRules} rules`;
          } else {
            details = `Contains ${state.baseRules} rules`;
          }
          
          diffSheet.addRow({
            type: 'State',
            name: state.name,
            status: state.status,
            details: details
          });
        });
      
      // Add rule differences using memoized changedRules
      changedRules.forEach(rule => {
          let details = '';
          
          if (rule.status === 'modified') {
            details = rule.changes.join('; ');
          } else if (rule.status === 'added') {
            const parts = [];
            parts.push(`Target state: ${rule.compareNextState}`);
            if (rule.comparePriority) parts.push(`Priority: ${rule.comparePriority}`);
            if (rule.compareOperation) parts.push(`Operation: ${rule.compareOperation}`);
            details = parts.join('; ');
          } else if (rule.status === 'removed') {
            const parts = [];
            parts.push(`Target state: ${rule.baseNextState}`);
            if (rule.basePriority) parts.push(`Priority: ${rule.basePriority}`);
            if (rule.baseOperation) parts.push(`Operation: ${rule.baseOperation}`);
            details = parts.join('; ');
          }
          
          diffSheet.addRow({
            type: 'Rule',
            name: `${rule.condition} (in state "${rule.stateName}")`,
            status: rule.status,
            details: details
          });
        });
      
      // Apply styles to the differences worksheet
      diffSheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header
        
        const status = row.getCell(3).value;
        let fillColor = null;
        
        switch (status) {
          case 'added':
            fillColor = 'FFF8D7DA'; // Light red
            break;
          case 'removed':
            fillColor = 'FFD4EDDA'; // Light green
            break;
          case 'modified':
            fillColor = 'FFFFF3CD'; // Light yellow
            break;
          default:
            fillColor = 'FFE9ECEF'; // Light gray
        }
        
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: fillColor }
          };
        });
      });
      
      // Generate a filename based on the comparison
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `state_machine_comparison_${timestamp}.xlsx`;
      
      // Write and download the file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Comparison results exported successfully');
    } catch (error) {
      console.error('StateMachineComparer - Error exporting comparison results:', error);
      toast.error('Failed to export comparison results');
    }
  };

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[75vw] max-w-[75%] h-[80vh] max-h-[80vh] bg-white dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden">
        <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            <div className="flex items-center gap-2">
              <GitCompare className="w-6 h-6" aria-hidden="true" />
              State Machine Comparison
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-6 space-y-6 overflow-y-auto h-[calc(80vh-140px)]">
          {/* Selection section */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Baseline State Machine</h3>
              <div className="p-4 border rounded-lg">
                <div className="text-md font-medium">{baseStateMachine?.name || 'Current State Machine'}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {baseStateMachine?.data?.length || 0} states, {baseStateMachine?.data?.reduce((total, state) => total + state.rules.length, 0) || 0} rules
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-3">State Machine to Compare</h3>
              <div className="flex flex-col space-y-3">
                <Button
                  onClick={handleImportClick}
                  disabled={isLoading}
                  className="flex items-center gap-2 w-full p-3 justify-center bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                  aria-label="Select CSV or Excel file for comparison"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                      Loading file...
                    </>
                  ) : (
                    <>
                      <FileUp className="w-5 h-5" aria-hidden="true" />
                      Select CSV/Excel File for Comparison
                    </>
                  )}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileImport}
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  aria-label="File input for state machine comparison"
                />
                
                {compareStateMachine && (
                  <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center gap-2">
                      <Database className="w-5 h-5 text-blue-500" aria-hidden="true" />
                      <div className="text-sm font-medium">{compareStateMachine.name}</div>
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      {compareStateMachine.data.length} states, {compareStateMachine.data.reduce((total, state) => total + state.rules.length, 0)} rules
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-center">
            <Button 
              onClick={runComparison} 
              disabled={!baseStateMachine || !compareStateMachine || isComparing}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              aria-label="Run comparison between state machines"
            >
              {isComparing ? 'Comparing...' : 'Compare State Machines'}
            </Button>
          </div>
          
          {/* ARIA live region for screen reader announcements */}
          <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {isComparing && "Comparison in progress"}
            {hasResults && !isComparing && hasDifferences && 
              `Comparison complete. Found ${results.summary.addedStates + results.summary.removedStates + results.summary.modifiedStates} state changes and ${results.summary.addedRules + results.summary.removedRules + results.summary.modifiedRules} rule changes.`
            }
            {hasResults && !isComparing && !hasDifferences &&
              "Comparison complete. No differences found between state machines."
            }
          </div>
          
          {/* Results section */}
          {hasResults && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-medium">Comparison Results</h3>
                <Button
                  onClick={exportComparisonResults}
                  disabled={!hasDifferences}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Export comparison results to Excel"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  Export Results
                </Button>
              </div>
              
              {/* Status legend */}
              <div className="mb-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                <h4 className="text-sm font-medium mb-2">Understanding Comparison Results</h4>
                <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <Badge className="bg-green-500 inline-flex items-center gap-1">
                      <Plus className="h-3 w-3" aria-hidden="true" />
                      <span>New in Comparison</span>
                    </Badge>
                    <span>Element exists in comparison file but not in baseline</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge className="bg-red-500 inline-flex items-center gap-1">
                      <XCircle className="h-3 w-3" aria-hidden="true" />
                      <span>Missing from Comparison</span>
                    </Badge>
                    <span>Element exists in baseline but not in comparison file</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge className="bg-yellow-500 inline-flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" aria-hidden="true" />
                      <span>Modified</span>
                    </Badge>
                    <span>Element exists in both but has different properties</span>
                  </li>
                </ul>
              </div>
              
              {/* Summary section */}
              {hasDifferences ? (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 border rounded-lg">
                      <h4 className="text-lg font-medium mb-2">State Changes</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col items-center p-2 bg-green-100 dark:bg-green-900 rounded">
                          <span className="text-lg font-bold text-green-700 dark:text-green-300">{results.summary.addedStates}</span>
                          <span className="text-xs text-green-600 dark:text-green-400">New</span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-red-100 dark:bg-red-900 rounded">
                          <span className="text-lg font-bold text-red-700 dark:text-red-300">{results.summary.removedStates}</span>
                          <span className="text-xs text-red-600 dark:text-red-400">Missing</span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-yellow-100 dark:bg-yellow-900 rounded">
                          <span className="text-lg font-bold text-yellow-700 dark:text-yellow-300">{results.summary.modifiedStates}</span>
                          <span className="text-xs text-yellow-600 dark:text-yellow-400">Modified</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="text-lg font-medium mb-2">Rule Changes</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col items-center p-2 bg-green-100 dark:bg-green-900 rounded">
                          <span className="text-lg font-bold text-green-700 dark:text-green-300">{results.summary.addedRules}</span>
                          <span className="text-xs text-green-600 dark:text-green-400">New</span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-red-100 dark:bg-red-900 rounded">
                          <span className="text-lg font-bold text-red-700 dark:text-red-300">{results.summary.removedRules}</span>
                          <span className="text-xs text-red-600 dark:text-red-400">Missing</span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-yellow-100 dark:bg-yellow-900 rounded">
                          <span className="text-lg font-bold text-yellow-700 dark:text-yellow-300">{results.summary.modifiedRules}</span>
                          <span className="text-xs text-yellow-600 dark:text-yellow-400">Modified</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Filter and Search Controls */}
                  <div className="mb-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FilterIcon className="w-4 h-4 text-gray-500" aria-hidden="true" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Filters
                      </span>
                      {filterCounts.isFiltered && (
                        <Badge variant="outline" className="ml-2">
                          Showing {filterCounts.totalVisible} of {filterCounts.totalAll}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Search Input */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
                        <Input
                          type="text"
                          placeholder="Search states, rules, conditions..."
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          className="pl-10"
                          aria-label="Search comparison results"
                        />
                      </div>
                      
                      {/* Status Filter */}
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger aria-label="Filter by status">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All Statuses</SelectItem>
                          <SelectItem value="added">New in Comparison</SelectItem>
                          <SelectItem value="removed">Missing from Comparison</SelectItem>
                          <SelectItem value="modified">Modified</SelectItem>
                          <SelectItem value="unchanged">Unchanged</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {/* Type Filter */}
                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger aria-label="Filter by type">
                          <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All Types</SelectItem>
                          <SelectItem value="State">States Only</SelectItem>
                          <SelectItem value="Rule">Rules Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Clear Filters Button */}
                    {filterCounts.isFiltered && (
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSearchText('');
                            setStatusFilter('ALL');
                            setTypeFilter('ALL');
                          }}
                          className="text-xs"
                          aria-label="Clear all filters"
                        >
                          <XCircle className="w-3 h-3 mr-1" aria-hidden="true" />
                          Clear Filters
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Tabs for detailed comparison */}
                  <div className="mt-4 border rounded-lg overflow-hidden">
                    <div className="p-4 border-b bg-gray-50 dark:bg-gray-800">
                      <h4 className="text-md font-medium">Unified State Machine Comparison</h4>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      <Table>
                        <TableCaption className="sr-only">
                          Comparison results showing differences between baseline and imported state machines
                        </TableCaption>
                        <TableHeader className="sticky top-0 bg-white dark:bg-gray-900 z-10">
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Details</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {/* State differences */}
                          {filteredStateComparison.map((state, index) => (
                            <TableRow 
                              key={`state-${index}`} 
                              className={
                                state.status === 'added' ? 'bg-green-50 dark:bg-green-900/20' :
                                state.status === 'removed' ? 'bg-red-50 dark:bg-red-900/20' :
                                state.status === 'modified' ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                              }
                              tabIndex={0}
                              role="row"
                              aria-label={`${state.status} state: ${state.name}`}
                            >
                              <TableCell>State</TableCell>
                              <TableCell>{state.name}</TableCell>
                              <TableCell>{getStatusBadge(state.status)}</TableCell>
                              <TableCell>
                                <div className="text-xs text-gray-700 dark:text-gray-300">
                                  {state.status === 'modified' ? (
                                    <span>Rules: {state.baseRules} → {state.compareRules}</span>
                                  ) : state.status === 'added' ? (
                                    <span>Contains {state.compareRules} rules</span>
                                  ) : (
                                    <span>Contains {state.baseRules} rules</span>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                          
                          {/* Rule differences */}
                          {filteredRuleComparison.map((rule, index) => (
                            <TableRow 
                              key={`rule-${index}`} 
                              className={
                                rule.status === 'added' ? 'bg-green-50 dark:bg-green-900/20' :
                                rule.status === 'removed' ? 'bg-red-50 dark:bg-red-900/20' :
                                rule.status === 'modified' ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                              }
                              tabIndex={0}
                              role="row"
                              aria-label={`${rule.status} rule: ${rule.condition} in state ${rule.stateName}`}
                            >
                              <TableCell>Rule</TableCell>
                              <TableCell>
                                <div className="font-mono text-xs">{rule.condition}</div>
                                <div className="text-xs text-gray-500">in state "{rule.stateName}"</div>
                              </TableCell>
                              <TableCell>{getStatusBadge(rule.status)}</TableCell>
                              <TableCell>
                                {rule.status === 'modified' ? (
                                  <ul className="text-xs space-y-1 list-disc list-inside">
                                    {rule.changes.map((change, i) => (
                                      <li key={i} className="text-gray-700 dark:text-gray-300">{change}</li>
                                    ))}
                                  </ul>
                                ) : rule.status === 'added' ? (
                                  <div className="text-xs text-gray-700 dark:text-gray-300">
                                    <p>Target state: {rule.compareNextState}</p>
                                    {rule.comparePriority && <p>Priority: {rule.comparePriority}</p>}
                                    {rule.compareOperation && <p>Operation: {rule.compareOperation}</p>}
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-700 dark:text-gray-300">
                                    <p>Target state: {rule.baseNextState}</p>
                                    {rule.basePriority && <p>Priority: {rule.basePriority}</p>}
                                    {rule.baseOperation && <p>Operation: {rule.baseOperation}</p>}
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                          
                          {/* No differences message */}
                          {filteredStateComparison.length === 0 && filteredRuleComparison.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                {filterCounts.isFiltered ? (
                                  <div>
                                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" aria-hidden="true" />
                                    <p>No items match your filters</p>
                                    <p className="text-xs mt-1">Try adjusting your search or filters</p>
                                  </div>
                                ) : (
                                  'No differences found'
                                )}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-6 mb-6 text-center bg-gray-50 dark:bg-gray-800 border rounded-lg">
                  <div className="flex justify-center mb-3">
                    <Check className="w-8 h-8 text-green-500" aria-hidden="true" />
                  </div>
                  <h4 className="text-lg font-medium text-green-600 dark:text-green-400 mb-1">
                    State Machines Are Identical
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    No differences were found between the baseline and comparison state machines.
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* No results message */}
          {!hasResults && !isComparing && baseStateMachine && compareStateMachine && (
            <div className="text-center p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
              <AlertCircle className="w-8 h-8 mx-auto text-gray-400 mb-2" aria-hidden="true" />
              <p className="text-gray-600 dark:text-gray-400">
                Click "Compare State Machines" to see the differences
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-between">
          <Button variant="outline" onClick={onClose} className="px-6">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

StateMachineComparer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  states: PropTypes.array.isRequired
};

export default StateMachineComparer; 