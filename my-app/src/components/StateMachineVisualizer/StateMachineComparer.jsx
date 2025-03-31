/**
 * StateMachineComparer.jsx
 * 
 * Component for comparing two state machines and visualizing their differences.
 * Helps users identify the structural and rule differences between two state machines.
 */
import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Check, BarChart, List, GitCompare } from 'lucide-react';
import { toast } from 'sonner';

const StateMachineComparer = ({ isOpen, onClose, states }) => {
  // Store the current state machine as a baseline
  const [baseStateMachine, setBaseStateMachine] = useState(null);
  // State for the second state machine to compare
  const [compareStateMachine, setCompareStateMachine] = useState(null);
  // Store parsed state machines from localStorage
  const [savedStateMachines, setSavedStateMachines] = useState([]);
  // Active tab
  const [activeTab, setActiveTab] = useState('structure');
  // Whether comparison is in progress
  const [isComparing, setIsComparing] = useState(false);
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

  // Load saved state machines on component mount
  useEffect(() => {
    loadSavedStateMachines();
  }, []);

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

  // Load saved state machines from localStorage
  const loadSavedStateMachines = () => {
    try {
      // Get available state machines from localStorage
      const machines = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key === 'ivrFlow') {
          machines.push({
            id: 'saved',
            name: 'Last Saved State Machine',
            data: JSON.parse(localStorage.getItem(key))
          });
        } else if (key && key.startsWith('ivrFlow_backup_')) {
          const timestamp = key.replace('ivrFlow_backup_', '');
          const date = new Date(parseInt(timestamp));
          machines.push({
            id: key,
            name: `Backup from ${date.toLocaleString()}`,
            data: JSON.parse(localStorage.getItem(key))
          });
        }
      }
      setSavedStateMachines(machines);
    } catch (error) {
      console.error('Error loading saved state machines:', error);
      toast.error('Failed to load saved state machines');
    }
  };

  // Select a state machine to compare with
  const selectCompareStateMachine = (machineId) => {
    const selected = savedStateMachines.find(m => m.id === machineId);
    if (selected) {
      setCompareStateMachine(selected);
    }
  };

  // Run the comparison between the two state machines
  const runComparison = () => {
    if (!baseStateMachine || !compareStateMachine) {
      toast.error('Please select two state machines to compare');
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

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[75vw] max-w-[75%] bg-white dark:bg-gray-900 rounded-lg shadow-xl">
        <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            <div className="flex items-center gap-2">
              <GitCompare className="w-6 h-6" />
              State Machine Comparison
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-6 space-y-6">
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
              <select 
                className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                value={compareStateMachine?.id || ''}
                onChange={(e) => selectCompareStateMachine(e.target.value)}
              >
                <option value="">Select a state machine...</option>
                {savedStateMachines.map(machine => (
                  <option key={machine.id} value={machine.id}>
                    {machine.name} ({machine.data.length} states)
                  </option>
                ))}
              </select>
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
              <h3 className="text-xl font-medium mb-3">Comparison Results</h3>
              
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
                
                <TabsContent value="structure" className="mt-4">
                  <Table>
                    <TableHeader>
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
                
                <TabsContent value="rules" className="mt-4">
                  <Table>
                    <TableHeader>
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
        
        <DialogFooter className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
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