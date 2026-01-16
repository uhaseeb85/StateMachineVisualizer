/**
 * FlowDiagramComparer.jsx
 * 
 * Component for comparing two flow diagrams and visualizing their differences.
 * Helps users identify structural differences between two flow diagram versions.
 */
import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Check, GitCompare, FileUp, Database, Download } from 'lucide-react';
import { toast } from 'sonner';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';

const FlowDiagramComparer = ({ isOpen, onClose, steps, connections }) => {
  // Store the current flow diagram as baseline
  const [baseFlowDiagram, setBaseFlowDiagram] = useState(null);
  // State for the second flow diagram to compare
  const [compareFlowDiagram, setCompareFlowDiagram] = useState(null);
  // Whether comparison is in progress
  const [isComparing, setIsComparing] = useState(false);
  // File input ref for import
  const fileInputRef = useRef(null);
  // Comparison results
  const [results, setResults] = useState({
    stepComparison: [],
    connectionComparison: [],
    summary: {
      addedSteps: 0,
      removedSteps: 0,
      modifiedSteps: 0,
      addedConnections: 0,
      removedConnections: 0,
      modifiedConnections: 0
    }
  });

  // Update baseline flow diagram when component opens
  useEffect(() => {
    if (isOpen && steps.length > 0) {
      setBaseFlowDiagram({
        id: 'current',
        name: 'Current Flow Diagram',
        steps: JSON.parse(JSON.stringify(steps)),
        connections: JSON.parse(JSON.stringify(connections))
      });
    }
  }, [isOpen, steps, connections]);

  // Trigger file input click for import
  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  // Process the imported JSON/ZIP file
  const handleFileImport = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      // Check file type
      if (file.name.endsWith('.json')) {
        // Handle JSON import
        const jsonText = await file.text();
        const flowData = JSON.parse(jsonText);
        
        if (!flowData.steps || !Array.isArray(flowData.steps)) {
          throw new Error('Invalid JSON format: Missing steps array');
        }

        setCompareFlowDiagram({
          id: 'imported',
          name: `Imported from ${file.name}`,
          steps: flowData.steps || [],
          connections: flowData.connections || []
        });

        toast.success(`Successfully imported "${file.name}" for comparison`);
      } else if (file.name.endsWith('.zip')) {
        // Handle ZIP import
        const zip = new JSZip();
        const zipContents = await zip.loadAsync(file);
        
        const dataFile = zipContents.file("data.json");
        if (!dataFile) {
          throw new Error('Invalid ZIP file: Missing data.json');
        }
        
        const jsonContent = await dataFile.async("string");
        const flowData = JSON.parse(jsonContent);
        
        if (!flowData.steps || !Array.isArray(flowData.steps)) {
          throw new Error('Invalid data format: Missing steps array');
        }

        setCompareFlowDiagram({
          id: 'imported',
          name: `Imported from ${file.name}`,
          steps: flowData.steps || [],
          connections: flowData.connections || []
        });

        toast.success(`Successfully imported "${file.name}" for comparison`);
      } else {
        throw new Error('Please upload a JSON or ZIP file.');
      }

      event.target.value = '';
    } catch (error) {
      console.error('Import error:', error);
      toast.error(`Import error: ${error.message}`);
      event.target.value = '';
    }
  };

  // Run the comparison between the two flow diagrams
  const runComparison = () => {
    if (!baseFlowDiagram || !compareFlowDiagram) {
      toast.error('Please select a JSON/ZIP file to compare');
      return;
    }

    setIsComparing(true);
    
    try {
      // Compare steps
      const stepComparison = compareSteps(baseFlowDiagram.steps, compareFlowDiagram.steps);
      
      // Compare connections
      const connectionComparison = compareConnections(
        baseFlowDiagram.steps,
        baseFlowDiagram.connections,
        compareFlowDiagram.steps,
        compareFlowDiagram.connections
      );
      
      // Generate summary
      const summary = {
        addedSteps: stepComparison.filter(s => s.status === 'added').length,
        removedSteps: stepComparison.filter(s => s.status === 'removed').length,
        modifiedSteps: stepComparison.filter(s => s.status === 'modified').length,
        addedConnections: connectionComparison.filter(c => c.status === 'added').length,
        removedConnections: connectionComparison.filter(c => c.status === 'removed').length,
        modifiedConnections: connectionComparison.filter(c => c.status === 'modified').length
      };

      setResults({
        stepComparison,
        connectionComparison,
        summary
      });

      const hasDifferences = 
        summary.addedSteps > 0 || 
        summary.removedSteps > 0 || 
        summary.modifiedSteps > 0 || 
        summary.addedConnections > 0 || 
        summary.removedConnections > 0 || 
        summary.modifiedConnections > 0;

      if (!hasDifferences) {
        toast.success('Flow diagrams are identical - no differences found');
      } else {
        toast.success('Comparison completed successfully');
      }
    } catch (error) {
      console.error('Error comparing flow diagrams:', error);
      toast.error('Failed to compare flow diagrams');
    } finally {
      setIsComparing(false);
    }
  };

  // Compare steps between two flow diagrams
  const compareSteps = (baseSteps, compareSteps) => {
    const result = [];
    
    // Check each base step
    baseSteps.forEach(baseStep => {
      const compareStep = compareSteps.find(s => s.id === baseStep.id || s.name === baseStep.name);
      
      if (compareStep) {
        // Check if modified
        let isModified = false;
        const changes = [];
        
        if (baseStep.name !== compareStep.name) {
          changes.push(`Name: "${baseStep.name}" → "${compareStep.name}"`);
          isModified = true;
        }
        
        if (baseStep.description !== compareStep.description) {
          changes.push('Description changed');
          isModified = true;
        }
        
        if (baseStep.expectedResponse !== compareStep.expectedResponse) {
          changes.push('Expected Response changed');
          isModified = true;
        }
        
        result.push({
          id: baseStep.id,
          name: baseStep.name,
          status: isModified ? 'modified' : 'unchanged',
          changes
        });
      } else {
        // Step in base but not in compare (removed)
        result.push({
          id: baseStep.id,
          name: baseStep.name,
          status: 'removed',
          changes: []
        });
      }
    });
    
    // Find steps in compare that are not in base (added)
    compareSteps.forEach(compareStep => {
      const baseStep = baseSteps.find(s => s.id === compareStep.id || s.name === compareStep.name);
      
      if (!baseStep) {
        result.push({
          id: compareStep.id,
          name: compareStep.name,
          status: 'added',
          changes: []
        });
      }
    });
    
    return result;
  };

  // Compare connections between two flow diagrams
  const compareConnections = (baseSteps, baseConnections, compareSteps, compareConnections) => {
    const result = [];
    
    // Helper to get step name by ID
    const getStepName = (steps, stepId) => {
      const step = steps.find(s => s.id === stepId);
      return step ? step.name : `Unknown (${stepId})`;
    };
    
    // Check each base connection
    baseConnections.forEach(baseConn => {
      const compareConn = compareConnections.find(c =>
        c.fromStepId === baseConn.fromStepId &&
        c.toStepId === baseConn.toStepId
      );
      
      const fromName = getStepName(baseSteps, baseConn.fromStepId);
      const toName = getStepName(baseSteps, baseConn.toStepId);
      
      if (compareConn) {
        // Connection exists in both
        if (baseConn.type !== compareConn.type) {
          result.push({
            fromStep: fromName,
            toStep: toName,
            status: 'modified',
            baseType: baseConn.type,
            compareType: compareConn.type,
            changes: [`Type: ${baseConn.type} → ${compareConn.type}`]
          });
        } else {
          result.push({
            fromStep: fromName,
            toStep: toName,
            status: 'unchanged',
            baseType: baseConn.type,
            compareType: compareConn.type,
            changes: []
          });
        }
      } else {
        // Connection in base but not in compare (removed)
        result.push({
          fromStep: fromName,
          toStep: toName,
          status: 'removed',
          baseType: baseConn.type,
          compareType: null,
          changes: []
        });
      }
    });
    
    // Find connections in compare that are not in base (added)
    compareConnections.forEach(compareConn => {
      const baseConn = baseConnections.find(c =>
        c.fromStepId === compareConn.fromStepId &&
        c.toStepId === compareConn.toStepId
      );
      
      if (!baseConn) {
        const fromName = getStepName(compareSteps, compareConn.fromStepId);
        const toName = getStepName(compareSteps, compareConn.toStepId);
        
        result.push({
          fromStep: fromName,
          toStep: toName,
          status: 'added',
          baseType: null,
          compareType: compareConn.type,
          changes: []
        });
      }
    });
    
    return result;
  };

  // Get status badge based on status string
  const getStatusBadge = (status) => {
    switch (status) {
      case 'added':
        return <Badge className="bg-red-500">Removed in Current</Badge>;
      case 'removed':
        return <Badge className="bg-green-500">Only in Current</Badge>;
      case 'modified':
        return <Badge className="bg-yellow-500">Modified</Badge>;
      default:
        return <Badge className="bg-gray-500">Unchanged</Badge>;
    }
  };

  // Export comparison results to Excel
  const exportComparisonResults = async () => {
    if (results.stepComparison.length === 0) {
      toast.error('No comparison results to export');
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      
      // Create unified comparison data
      const unifiedData = [
        ['Type', 'Name', 'Status', 'Details']
      ];
      
      // Add step differences
      results.stepComparison
        .filter(step => step.status !== 'unchanged')
        .forEach(step => {
          let details = '';
          if (step.status === 'modified') {
            details = step.changes.join('; ');
          }
          
          unifiedData.push([
            'Step',
            step.name,
            step.status,
            details
          ]);
        });
      
      // Add connection differences
      results.connectionComparison
        .filter(conn => conn.status !== 'unchanged')
        .forEach(conn => {
          let details = '';
          
          if (conn.status === 'modified') {
            details = conn.changes.join('; ');
          } else if (conn.status === 'added') {
            details = `Type: ${conn.compareType}`;
          } else if (conn.status === 'removed') {
            details = `Type: ${conn.baseType}`;
          }
          
          unifiedData.push([
            'Connection',
            `${conn.fromStep} → ${conn.toStep}`,
            conn.status,
            details
          ]);
        });
      
      // Create unified worksheet
      const unifiedWs = workbook.addWorksheet('Differences');
      unifiedWs.columns = [
        { header: 'Type', key: 'Type', width: 15 },
        { header: 'Name', key: 'Name', width: 40 },
        { header: 'Status', key: 'Status', width: 15 },
        { header: 'Details', key: 'Details', width: 60 }
      ];
      
      // Add data rows (skip header)
      for (let i = 1; i < unifiedData.length; i++) {
        unifiedWs.addRow({
          Type: unifiedData[i][0],
          Name: unifiedData[i][1],
          Status: unifiedData[i][2],
          Details: unifiedData[i][3]
        });
      }
      
      // Create summary data
      const summaryData = [
        ['Flow Diagram Comparison Summary'],
        [''],
        ['Step Changes'],
        ['Added Steps', results.summary.addedSteps],
        ['Removed Steps', results.summary.removedSteps],
        ['Modified Steps', results.summary.modifiedSteps],
        [''],
        ['Connection Changes'],
        ['Added Connections', results.summary.addedConnections],
        ['Removed Connections', results.summary.removedConnections],
        ['Modified Connections', results.summary.modifiedConnections],
        [''],
        ['Baseline Flow Diagram', baseFlowDiagram?.name || 'Current Flow Diagram'],
        ['Comparison Flow Diagram', compareFlowDiagram?.name || 'Imported Flow Diagram'],
        ['Comparison Date', new Date().toLocaleString()]
      ];
      
      // Create summary worksheet
      const summaryWs = workbook.addWorksheet('Summary');
      summaryData.forEach(row => {
        summaryWs.addRow(row);
      });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `flow_diagram_comparison_${timestamp}.xlsx`;
      
      // Generate and save the file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Comparison results exported successfully');
    } catch (error) {
      console.error('Error exporting comparison results:', error);
      toast.error('Failed to export comparison results');
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[75vw] max-w-[75%] h-[80vh] max-h-[80vh] bg-white dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden">
        <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            <div className="flex items-center gap-2">
              <GitCompare className="w-6 h-6" />
              Flow Diagram Comparison
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-6 space-y-6 overflow-y-auto h-[calc(80vh-140px)]">
          {/* Selection section */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Baseline Flow Diagram</h3>
              <div className="p-4 border rounded-lg">
                <div className="text-md font-medium">{baseFlowDiagram?.name || 'Current Flow Diagram'}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {baseFlowDiagram?.steps?.length || 0} steps, {baseFlowDiagram?.connections?.length || 0} connections
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-3">Flow Diagram to Compare</h3>
              <div className="flex flex-col space-y-3">
                <Button
                  onClick={handleImportClick}
                  className="flex items-center gap-2 w-full p-3 justify-center bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                >
                  <FileUp className="w-5 h-5" />
                  Select JSON/ZIP File for Comparison
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileImport}
                  accept=".json,.zip"
                  className="hidden"
                />
                
                {compareFlowDiagram && (
                  <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center gap-2">
                      <Database className="w-5 h-5 text-blue-500" />
                      <div className="text-sm font-medium">{compareFlowDiagram.name}</div>
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      {compareFlowDiagram.steps.length} steps, {compareFlowDiagram.connections.length} connections
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-center">
            <Button 
              onClick={runComparison} 
              disabled={!baseFlowDiagram || !compareFlowDiagram || isComparing}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              {isComparing ? 'Comparing...' : 'Compare Flow Diagrams'}
            </Button>
          </div>
          
          {/* Results section */}
          {results.stepComparison.length > 0 && (
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
              
              {/* Status legend */}
              <div className="mb-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                <h4 className="text-sm font-medium mb-2">Understanding Comparison Results</h4>
                <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <Badge className="bg-red-500">Removed in Current</Badge>
                    <span>Element exists in comparison flow but has been removed from current flow</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge className="bg-green-500">Only in Current</Badge>
                    <span>Element exists only in the current flow but not in the comparison</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge className="bg-yellow-500">Modified</Badge>
                    <span>Element exists in both but has different properties</span>
                  </li>
                </ul>
              </div>
              
              {/* Summary section */}
              {(results.summary.addedSteps > 0 || 
                results.summary.removedSteps > 0 || 
                results.summary.modifiedSteps > 0 || 
                results.summary.addedConnections > 0 || 
                results.summary.removedConnections > 0 || 
                results.summary.modifiedConnections > 0) ? (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 border rounded-lg">
                      <h4 className="text-lg font-medium mb-2">Step Changes</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col items-center p-2 bg-red-100 dark:bg-red-900 rounded">
                          <span className="text-lg font-bold text-red-700 dark:text-red-300">{results.summary.addedSteps}</span>
                          <span className="text-xs text-red-600 dark:text-red-400">Removed</span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-green-100 dark:bg-green-900 rounded">
                          <span className="text-lg font-bold text-green-700 dark:text-green-300">{results.summary.removedSteps}</span>
                          <span className="text-xs text-green-600 dark:text-green-400">Only in Current</span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-yellow-100 dark:bg-yellow-900 rounded">
                          <span className="text-lg font-bold text-yellow-700 dark:text-yellow-300">{results.summary.modifiedSteps}</span>
                          <span className="text-xs text-yellow-600 dark:text-yellow-400">Modified</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="text-lg font-medium mb-2">Connection Changes</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col items-center p-2 bg-red-100 dark:bg-red-900 rounded">
                          <span className="text-lg font-bold text-red-700 dark:text-red-300">{results.summary.addedConnections}</span>
                          <span className="text-xs text-red-600 dark:text-red-400">Removed</span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-green-100 dark:bg-green-900 rounded">
                          <span className="text-lg font-bold text-green-700 dark:text-green-300">{results.summary.removedConnections}</span>
                          <span className="text-xs text-green-600 dark:text-green-400">Only in Current</span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-yellow-100 dark:bg-yellow-900 rounded">
                          <span className="text-lg font-bold text-yellow-700 dark:text-yellow-300">{results.summary.modifiedConnections}</span>
                          <span className="text-xs text-yellow-600 dark:text-yellow-400">Modified</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Unified comparison table */}
                  <div className="mt-4 border rounded-lg overflow-hidden">
                    <div className="p-4 border-b bg-gray-50 dark:bg-gray-800">
                      <h4 className="text-md font-medium">Unified Flow Diagram Comparison</h4>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-white dark:bg-gray-900 z-10">
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Details</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {/* Step differences */}
                          {results.stepComparison
                            .filter(step => step.status !== 'unchanged')
                            .map((step, index) => (
                            <TableRow key={`step-${index}`} className={
                              step.status === 'added' ? 'bg-red-50 dark:bg-red-900/20' :
                              step.status === 'removed' ? 'bg-green-50 dark:bg-green-900/20' :
                              step.status === 'modified' ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                            }>
                              <TableCell>Step</TableCell>
                              <TableCell>{step.name}</TableCell>
                              <TableCell>{getStatusBadge(step.status)}</TableCell>
                              <TableCell>
                                <div className="text-xs text-gray-700 dark:text-gray-300">
                                  {step.changes.length > 0 ? (
                                    <ul className="list-disc list-inside">
                                      {step.changes.map((change, i) => (
                                        <li key={i}>{change}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <span>-</span>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                          
                          {/* Connection differences */}
                          {results.connectionComparison
                            .filter(conn => conn.status !== 'unchanged')
                            .map((conn, index) => (
                            <TableRow key={`conn-${index}`} className={
                              conn.status === 'added' ? 'bg-red-50 dark:bg-red-900/20' :
                              conn.status === 'removed' ? 'bg-green-50 dark:bg-green-900/20' :
                              conn.status === 'modified' ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                            }>
                              <TableCell>Connection</TableCell>
                              <TableCell>{conn.fromStep} → {conn.toStep}</TableCell>
                              <TableCell>{getStatusBadge(conn.status)}</TableCell>
                              <TableCell>
                                <div className="text-xs text-gray-700 dark:text-gray-300">
                                  {conn.status === 'modified' ? (
                                    <span>{conn.changes.join('; ')}</span>
                                  ) : conn.status === 'added' ? (
                                    <span>Type: {conn.compareType}</span>
                                  ) : conn.status === 'removed' ? (
                                    <span>Type: {conn.baseType}</span>
                                  ) : (
                                    <span>-</span>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                          
                          {/* No differences message */}
                          {results.stepComparison.filter(s => s.status !== 'unchanged').length === 0 && 
                           results.connectionComparison.filter(c => c.status !== 'unchanged').length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                                No differences found
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
                    <Check className="w-8 h-8 text-green-500" />
                  </div>
                  <h4 className="text-lg font-medium text-green-600 dark:text-green-400 mb-1">
                    Flow Diagrams Are Identical
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    No differences were found between the baseline and comparison flow diagrams.
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* No results message */}
          {results.stepComparison.length === 0 && !isComparing && baseFlowDiagram && compareFlowDiagram && (
            <div className="text-center p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
              <AlertCircle className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600 dark:text-gray-400">
                Click "Compare Flow Diagrams" to see the differences
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <Button variant="outline" onClick={onClose} className="px-6">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

FlowDiagramComparer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  steps: PropTypes.array.isRequired,
  connections: PropTypes.array.isRequired
};

export default FlowDiagramComparer;
