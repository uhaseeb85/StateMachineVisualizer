/**
 * StateMachineComparer.jsx
 * 
 * Component for comparing two state machines and visualizing their differences.
 * Helps users identify the structural and rule differences between two state machines.
 */
import { useState, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Check, BarChart, List, GitCompare, FileUp, Database, X, Download } from 'lucide-react';
import { toast } from 'sonner';
import { parseExcelFile, validateExcelData, generateId, sortRulesByPriority } from './utils';
import * as XLSX from 'xlsx-js-style';

const StateMachineComparer = ({ isOpen, onClose, states }) => {
  // Store the current state machine as a baseline
  const [baseStateMachine, setBaseStateMachine] = useState(null);
  // State for the second state machine to compare
  const [compareStateMachine, setCompareStateMachine] = useState(null);
  // Active tab
  const [activeTab, setActiveTab] = useState('structure');
  // Whether comparison is in progress
  const [isComparing, setIsComparing] = useState(false);
  // File input ref for CSV import
  const fileInputRef = useRef(null);
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
    if (isOpen && states.length > 0) {
      setBaseStateMachine({
        id: 'current',
        name: 'Current State Machine',
        data: JSON.parse(JSON.stringify(states)) // Deep copy
      });
    }
  }, [isOpen, states]);

  // Trigger file input click for CSV import
  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  // Process the imported CSV/Excel file
  const handleFileImport = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

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
      
      // Reset the file input value
      event.target.value = '';
    } catch (error) {
      console.error('CSV import error:', error);
      toast.error(`Import error: ${error.message}`);
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

      toast.success('Comparison completed successfully');
    } catch (error) {
      console.error('Error comparing state machines:', error);
      toast.error('Failed to compare state machines');
    } finally {
      setIsComparing(false);
    }
  };

  // Compare states between two state machines
  const compareStates = (base, compare) => {
    const result = [];
    
    // Find states in base that are in compare (unchanged or modified)
    // and states in base that are not in compare (removed)
    base.forEach(baseState => {
      const compareState = compare.find(s => s.name === baseState.name);
      
      if (compareState) {
        // Check if the state is modified
        const isModified = baseState.rules.length !== compareState.rules.length;
        
        result.push({
          name: baseState.name,
          status: isModified ? 'modified' : 'unchanged',
          baseRules: baseState.rules.length,
          compareRules: compareState.rules.length
        });
      } else {
        // State in base but not in compare (removed in compare)
        result.push({
          name: baseState.name,
          status: 'removed',
          baseRules: baseState.rules.length,
          compareRules: 0
        });
      }
    });
    
    // Find states in compare that are not in base (added)
    compare.forEach(compareState => {
      const baseState = base.find(s => s.name === compareState.name);
      
      if (!baseState) {
        result.push({
          name: compareState.name,
          status: 'added',
          baseRules: 0,
          compareRules: compareState.rules.length
        });
      }
    });
    
    return result;
  };

  // Compare rules between two state machines
  const compareRules = (base, compare) => {
    const result = [];
    
    base.forEach(baseState => {
      const compareState = compare.find(s => s.name === baseState.name);
      
      if (compareState) {
        // For each rule in the base state
        baseState.rules.forEach(baseRule => {
          // Try to find a matching rule in the compare state
          const matchingRule = compareState.rules.find(r => 
            r.condition === baseRule.condition
          );
          
          if (matchingRule) {
            // Check if the rule has been modified
            const baseNextState = base.find(s => s.id === baseRule.nextState)?.name || 'unknown';
            const compareNextState = compare.find(s => s.id === matchingRule.nextState)?.name || 'unknown';
            
            const isModified = baseNextState !== compareNextState;
            
            result.push({
              stateName: baseState.name,
              condition: baseRule.condition,
              status: isModified ? 'modified' : 'unchanged',
              baseNextState: baseNextState,
              compareNextState: compareNextState
            });
          } else {
            // Rule in base but not in compare (removed in compare)
            const baseNextState = base.find(s => s.id === baseRule.nextState)?.name || 'unknown';
            result.push({
              stateName: baseState.name,
              condition: baseRule.condition,
              status: 'removed',
              baseNextState: baseNextState,
              compareNextState: '-'
            });
          }
        });
        
        // Find rules in compare that are not in base (added)
        compareState.rules.forEach(compareRule => {
          const matchingRule = baseState.rules.find(r => 
            r.condition === compareRule.condition
          );
          
          if (!matchingRule) {
            const compareNextState = compare.find(s => s.id === compareRule.nextState)?.name || 'unknown';
            result.push({
              stateName: compareState.name,
              condition: compareRule.condition,
              status: 'added',
              baseNextState: '-',
              compareNextState: compareNextState
            });
          }
        });
      } else {
        // State only exists in base, all its rules are removed
        baseState.rules.forEach(baseRule => {
          const baseNextState = base.find(s => s.id === baseRule.nextState)?.name || 'unknown';
          result.push({
            stateName: baseState.name,
            condition: baseRule.condition,
            status: 'removed',
            baseNextState: baseNextState,
            compareNextState: '-'
          });
        });
      }
    });
    
    // Find rules in states that only exist in compare
    compare.forEach(compareState => {
      const baseState = base.find(s => s.name === compareState.name);
      
      if (!baseState) {
        // State only exists in compare, all its rules are added
        compareState.rules.forEach(compareRule => {
          const compareNextState = compare.find(s => s.id === compareRule.nextState)?.name || 'unknown';
          result.push({
            stateName: compareState.name,
            condition: compareRule.condition,
            status: 'added',
            baseNextState: '-',
            compareNextState: compareNextState
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
        return <Badge className="bg-green-500">Added</Badge>;
      case 'removed':
        return <Badge className="bg-red-500">Removed</Badge>;
      case 'modified':
        return <Badge className="bg-yellow-500">Modified</Badge>;
      default:
        return <Badge className="bg-gray-500">Unchanged</Badge>;
    }
  };

  // Export comparison results to Excel
  const exportComparisonResults = () => {
    if (results.stateComparison.length === 0) {
      toast.error('No comparison results to export');
      return;
    }

    try {
      // Create a new workbook
      const wb = XLSX.utils.book_new();
      
      // Create a worksheet for state comparison
      const stateData = [
        ['State Name', 'Status', 'Rules in Baseline', 'Rules in Comparison']
      ];
      
      results.stateComparison.forEach(state => {
        stateData.push([
          state.name,
          state.status,
          state.baseRules,
          state.compareRules
        ]);
      });
      
      const stateWs = XLSX.utils.aoa_to_sheet(stateData);
      
      // Apply styles to the state comparison worksheet
      stateData.forEach((_, index) => {
        const rowIndex = index + 1; // Excel is 1-indexed
        const row = results.stateComparison[index - 1]; // Skip header row
        
        if (index > 0 && row) { // Skip header row
          let fillColor = null;
          
          switch (row.status) {
            case 'added':
              fillColor = { fgColor: { rgb: "D4EDDA" } }; // Light green
              break;
            case 'removed':
              fillColor = { fgColor: { rgb: "F8D7DA" } }; // Light red
              break;
            case 'modified':
              fillColor = { fgColor: { rgb: "FFF3CD" } }; // Light yellow
              break;
            default:
              fillColor = { fgColor: { rgb: "E9ECEF" } }; // Light gray
          }
          
          // Apply fill to each cell in the row
          ['A', 'B', 'C', 'D'].forEach(col => {
            const cellRef = `${col}${rowIndex}`;
            if (!stateWs[cellRef]) stateWs[cellRef] = {};
            stateWs[cellRef].s = { fill: fillColor };
          });
        }
      });
      
      // Create a worksheet for rule comparison
      const ruleData = [
        ['State', 'Rule Condition', 'Status', 'Baseline Next State', 'Comparison Next State']
      ];
      
      results.ruleComparison.forEach(rule => {
        ruleData.push([
          rule.stateName,
          rule.condition,
          rule.status,
          rule.baseNextState,
          rule.compareNextState
        ]);
      });
      
      const ruleWs = XLSX.utils.aoa_to_sheet(ruleData);
      
      // Apply styles to the rule comparison worksheet
      ruleData.forEach((_, index) => {
        const rowIndex = index + 1; // Excel is 1-indexed
        const row = results.ruleComparison[index - 1]; // Skip header row
        
        if (index > 0 && row) { // Skip header row
          let fillColor = null;
          
          switch (row.status) {
            case 'added':
              fillColor = { fgColor: { rgb: "D4EDDA" } }; // Light green
              break;
            case 'removed':
              fillColor = { fgColor: { rgb: "F8D7DA" } }; // Light red
              break;
            case 'modified':
              fillColor = { fgColor: { rgb: "FFF3CD" } }; // Light yellow
              break;
            default:
              fillColor = { fgColor: { rgb: "E9ECEF" } }; // Light gray
          }
          
          // Apply fill to each cell in the row
          ['A', 'B', 'C', 'D', 'E'].forEach(col => {
            const cellRef = `${col}${rowIndex}`;
            if (!ruleWs[cellRef]) ruleWs[cellRef] = {};
            ruleWs[cellRef].s = { fill: fillColor };
          });
        }
      });
      
      // Create a summary worksheet
      const summaryData = [
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
      ];
      
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      
      // Add worksheets to workbook
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
      XLSX.utils.book_append_sheet(wb, stateWs, 'State Comparison');
      XLSX.utils.book_append_sheet(wb, ruleWs, 'Rule Comparison');
      
      // Generate a filename based on the comparison
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `state_machine_comparison_${timestamp}.xlsx`;
      
      // Write and download the file
      XLSX.writeFile(wb, filename);
      
      toast.success('Comparison results exported successfully');
    } catch (error) {
      console.error('Error exporting comparison results:', error);
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
        <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4 relative">
          <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            <div className="flex items-center gap-2">
              <GitCompare className="w-6 h-6" />
              State Machine Comparison
            </div>
          </DialogTitle>
          <Button 
            onClick={onClose} 
            className="absolute right-0 top-0 h-8 w-8 p-0 rounded-full"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
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
                  className="flex items-center gap-2 w-full p-3 justify-center bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                >
                  <FileUp className="w-5 h-5" />
                  Select CSV/Excel File for Comparison
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileImport}
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                />
                
                {compareStateMachine && (
                  <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center gap-2">
                      <Database className="w-5 h-5 text-blue-500" />
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
            >
              {isComparing ? 'Comparing...' : 'Compare State Machines'}
            </Button>
          </div>
          
          {/* Results section */}
          {results.stateComparison.length > 0 && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-medium">Comparison Results</h3>
                <Button
                  onClick={exportComparisonResults}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md"
                >
                  <Download className="w-4 h-4" />
                  Export Results
                </Button>
              </div>
              
              {/* Summary section */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 border rounded-lg">
                  <h4 className="text-lg font-medium mb-2">State Changes</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center p-2 bg-green-100 dark:bg-green-900 rounded">
                      <span className="text-lg font-bold text-green-700 dark:text-green-300">{results.summary.addedStates}</span>
                      <span className="text-xs text-green-600 dark:text-green-400">Added</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-red-100 dark:bg-red-900 rounded">
                      <span className="text-lg font-bold text-red-700 dark:text-red-300">{results.summary.removedStates}</span>
                      <span className="text-xs text-red-600 dark:text-red-400">Removed</span>
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
                      <span className="text-xs text-green-600 dark:text-green-400">Added</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-red-100 dark:bg-red-900 rounded">
                      <span className="text-lg font-bold text-red-700 dark:text-red-300">{results.summary.removedRules}</span>
                      <span className="text-xs text-red-600 dark:text-red-400">Removed</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-yellow-100 dark:bg-yellow-900 rounded">
                      <span className="text-lg font-bold text-yellow-700 dark:text-yellow-300">{results.summary.modifiedRules}</span>
                      <span className="text-xs text-yellow-600 dark:text-yellow-400">Modified</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Tabs for detailed comparison */}
              <Tabs defaultValue="structure" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="structure" className="flex gap-2 items-center">
                    <BarChart className="w-4 h-4" />
                    State Structure
                  </TabsTrigger>
                  <TabsTrigger value="rules" className="flex gap-2 items-center">
                    <List className="w-4 h-4" />
                    Rule Transitions
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="structure" className="mt-4 max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white dark:bg-gray-900 z-10">
                      <TableRow>
                        <TableHead>State Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Rules in Baseline</TableHead>
                        <TableHead>Rules in Comparison</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.stateComparison.map((state, index) => (
                        <TableRow key={index} className={
                          state.status === 'added' ? 'bg-green-50 dark:bg-green-900/20' :
                          state.status === 'removed' ? 'bg-red-50 dark:bg-red-900/20' :
                          state.status === 'modified' ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                        }>
                          <TableCell>{state.name}</TableCell>
                          <TableCell>{getStatusBadge(state.status)}</TableCell>
                          <TableCell>{state.baseRules}</TableCell>
                          <TableCell>{state.compareRules}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
                
                <TabsContent value="rules" className="mt-4 max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white dark:bg-gray-900 z-10">
                      <TableRow>
                        <TableHead>State</TableHead>
                        <TableHead>Rule Condition</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Baseline Next</TableHead>
                        <TableHead>Comparison Next</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.ruleComparison.map((rule, index) => (
                        <TableRow key={index} className={
                          rule.status === 'added' ? 'bg-green-50 dark:bg-green-900/20' :
                          rule.status === 'removed' ? 'bg-red-50 dark:bg-red-900/20' :
                          rule.status === 'modified' ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                        }>
                          <TableCell>{rule.stateName}</TableCell>
                          <TableCell>{rule.condition}</TableCell>
                          <TableCell>{getStatusBadge(rule.status)}</TableCell>
                          <TableCell>{rule.baseNextState}</TableCell>
                          <TableCell>{rule.compareNextState}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          {/* No results message */}
          {results.stateComparison.length === 0 && !isComparing && baseStateMachine && compareStateMachine && (
            <div className="text-center p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
              <AlertCircle className="w-8 h-8 mx-auto text-gray-400 mb-2" />
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