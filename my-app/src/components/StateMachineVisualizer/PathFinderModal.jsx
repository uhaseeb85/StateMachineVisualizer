import React, { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, ArrowRight, Loader2, FileDown, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Document, Page, Text, View, StyleSheet, PDFViewer, pdf } from '@react-pdf/renderer';

export default function PathFinderModal({ states, onClose }) {
  const [selectedStartState, setSelectedStartState] = useState('');
  const [selectedEndState, setSelectedEndState] = useState('');
  const [searchMode, setSearchMode] = useState('endStates');
  const [paths, setPaths] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [shouldCancel, setShouldCancel] = useState(false);
  const PATH_LIMIT = 100;
  const [currentPage, setCurrentPage] = useState(1);
  const pathsPerPage = 10;
  const [error, setError] = useState(null);

  const pdfStyles = StyleSheet.create({
    page: {
      padding: 30,
      backgroundColor: 'white',
    },
    title: {
      fontSize: 24,
      marginBottom: 20,
      fontWeight: 'bold',
      color: '#111827',
    },
    pathContainer: {
      marginBottom: 16,
      padding: 16,
      backgroundColor: '#f9fafb',
      borderRadius: 8,
    },
    stateContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    state: {
      padding: '6px 12px',
      backgroundColor: 'white',
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#e5e7eb',
    },
    stateText: {
      fontSize: 14,
      color: '#111827',
    },
    arrowContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    arrow: {
      color: '#9ca3af',
      fontSize: 14,
    },
    rulesContainer: {
      gap: 4,
    },
    failedRule: {
      padding: '4px 8px',
      backgroundColor: '#fee2e2',
      color: '#b91c1c',
      borderRadius: 4,
      fontSize: 14,
      marginVertical: 2,
    },
    successRule: {
      padding: '4px 8px',
      backgroundColor: '#dcfce7',
      color: '#15803d',
      borderRadius: 4,
      fontSize: 14,
      marginVertical: 2,
    },
    pathInfo: {
      fontSize: 12,
      color: '#6b7280',
      marginTop: 8,
    },
  });

  const PathsDocument = () => (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.title}>Found Paths</Text>
        {paths.map((path, index) => (
          <View key={index} style={pdfStyles.pathContainer}>
            <View style={pdfStyles.stateContainer}>
              {path.states.map((state, stateIndex) => (
                <React.Fragment key={stateIndex}>
                  <View style={pdfStyles.state}>
                    <Text style={pdfStyles.stateText}>{state}</Text>
                  </View>
                  
                  {stateIndex < path.states.length - 1 && (
                    <>
                      <View style={pdfStyles.rulesContainer}>
                        {path.failedRules[stateIndex]?.map((rule, ruleIndex) => (
                          <Text key={ruleIndex} style={pdfStyles.failedRule}>
                            ❌ R{rule.split('R')[1]}
                          </Text>
                        ))}
                        <Text style={pdfStyles.successRule}>
                          ✓ {path.rules[stateIndex]}
                        </Text>
                      </View>
                      <Text style={pdfStyles.arrow}>→</Text>
                    </>
                  )}
                </React.Fragment>
              ))}
            </View>
            <Text style={pdfStyles.pathInfo}>
              Path length: {path.states.length} states, {path.rules.length} transitions
            </Text>
          </View>
        ))}
      </Page>
    </Document>
  );

  const handleExportPDF = async () => {
    try {
      const blob = await pdf(<PathsDocument />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'paths.pdf';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const findPaths = useCallback(async (startStateId, endStateId = null) => {
    const startState = states.find(s => s.id === startStateId);
    if (!startState) {
      setError('Start state not found');
      return;
    }

    let allPaths = [];
    let visited = new Set();
    let totalStates = states.length;
    let processedStates = 0;

    const dfs = async (currentState, currentPath = [], rulePath = [], failedRulesPath = []) => {
      if (shouldCancel) {
        throw new Error('Search cancelled');
      }

      currentPath.push(currentState.name);
      visited.add(currentState.id);
      
      processedStates++;
      setProgress(Math.min((processedStates / (totalStates * 2)) * 100, 99));

      await new Promise(resolve => setTimeout(resolve, 50));

      if (endStateId) {
        if (currentState.id === endStateId) {
          const newPath = {
            states: [...currentPath],
            rules: [...rulePath],
            failedRules: [...failedRulesPath]
          };
          allPaths.push(newPath);
          setPaths([...allPaths]);
        }
      } else {
        if (currentState.rules.length === 0) {
          const newPath = {
            states: [...currentPath],
            rules: [...rulePath],
            failedRules: [...failedRulesPath]
          };
          allPaths.push(newPath);
          setPaths([...allPaths]);
        }
      }

      for (let i = 0; i < currentState.rules.length; i++) {
        const rule = currentState.rules[i];
        const nextState = states.find(s => s.id === rule.nextState);
        if (nextState && !currentPath.includes(nextState.name)) {
          const failedRules = currentState.rules.slice(0, i).map(r => r.condition);
          await dfs(
            nextState, 
            [...currentPath], 
            [...rulePath, rule.condition],
            [...failedRulesPath, failedRules]
          );
        }
      }

      visited.delete(currentState.id);
    };

    try {
      setPaths([]);
      setIsSearching(true);
      await dfs(startState);
      setProgress(100);
    } catch (error) {
      if (error.message === 'Search cancelled') {
        console.log('Search was cancelled');
      } else {
        console.error('Error during search:', error);
      }
    } finally {
      setIsSearching(false);
    }
  }, [states, shouldCancel]);

  const handleFindPaths = async () => {
    if (!selectedStartState) return;
    
    try {
      setError(null);
      await findPaths(selectedStartState, selectedEndState);
    } catch (error) {
      console.error('Path finding error:', error);
      setError('An error occurred while finding paths');
    }
  };

  const handleCancel = () => {
    setShouldCancel(true);
    toast.info('Cancelling path search...');
  };

  const indexOfLastPath = currentPage * pathsPerPage;
  const indexOfFirstPath = indexOfLastPath - pathsPerPage;
  const currentPaths = paths.slice(indexOfFirstPath, indexOfLastPath);
  const totalPages = Math.ceil(paths.length / pathsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [paths]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl h-[80vh] 
                    flex flex-col overflow-hidden">
        <div className="p-6 flex-shrink-0">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Find Paths
            </h2>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Experimental Feature: This path finding functionality is currently in beta and may not work as expected for all state machine configurations.
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-0">
          <div className="space-y-6">
            <div className="flex gap-4">
              <Button
                onClick={() => {
                  setSearchMode('endStates');
                  setSelectedEndState('');
                  setPaths([]);
                }}
                variant={searchMode === 'endStates' ? 'default' : 'outline'}
                className={searchMode === 'endStates' ? 'bg-blue-500 hover:bg-blue-600' : ''}
              >
                Find Paths to End States
              </Button>
              <Button
                onClick={() => {
                  setSearchMode('specificState');
                  setPaths([]);
                }}
                variant={searchMode === 'specificState' ? 'default' : 'outline'}
                className={searchMode === 'specificState' ? 'bg-blue-500 hover:bg-blue-600' : ''}
              >
                Find Paths Between States
              </Button>
            </div>

            <div className="flex gap-4 items-center">
              <select
                value={selectedStartState}
                onChange={(e) => setSelectedStartState(e.target.value)}
                className="flex-1 h-9 rounded-md border border-gray-300 dark:border-gray-600 
                         text-sm dark:bg-gray-700 dark:text-white px-3"
              >
                <option value="">Select Starting State</option>
                {states.map(state => (
                  <option key={state.id} value={state.id}>
                    {state.name}
                  </option>
                ))}
              </select>

              {searchMode === 'specificState' && (
                <select
                  value={selectedEndState}
                  onChange={(e) => setSelectedEndState(e.target.value)}
                  className="flex-1 h-9 rounded-md border border-gray-300 dark:border-gray-600 
                           text-sm dark:bg-gray-700 dark:text-white px-3"
                >
                  <option value="">Select Target State</option>
                  {states.map(state => (
                    <option key={state.id} value={state.id}>
                      {state.name}
                    </option>
                  ))}
                </select>
              )}

              <Button
                onClick={handleFindPaths}
                disabled={!selectedStartState || (searchMode === 'specificState' && !selectedEndState) || isSearching}
                className="bg-blue-500 hover:bg-blue-600 text-white whitespace-nowrap"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Find Paths
              </Button>

              {isSearching && (
                <Button
                  onClick={handleCancel}
                  variant="destructive"
                  className="whitespace-nowrap"
                >
                  Cancel
                </Button>
              )}
            </div>

            {isSearching && (
              <div className="space-y-2">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  Searching... {Math.round(progress)}%
                </div>
              </div>
            )}

            {paths.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Found {paths.length} possible path{paths.length !== 1 ? 's' : ''}
                  </div>
                  <Button
                    onClick={handleExportPDF}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                </div>

                {currentPaths.map((path, index) => (
                  <div 
                    key={index}
                    className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg space-y-2"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      {path.states.map((state, stateIndex) => (
                        <React.Fragment key={stateIndex}>
                          <span className="px-3 py-1.5 bg-white dark:bg-gray-700 rounded-md
                                       border border-gray-200 dark:border-gray-600">
                            {state}
                          </span>
                          {stateIndex < path.states.length - 1 && (
                            <div className="flex items-center gap-2">
                              <ArrowRight className="w-4 h-4 text-gray-400" />
                              <div className="space-y-1">
                                {path.failedRules[stateIndex]?.length > 0 && (
                                  <div className="space-y-1">
                                    {path.failedRules[stateIndex].map((rule, ruleIndex) => (
                                      <span key={ruleIndex} className="px-2 py-1 bg-red-100 dark:bg-red-900/30 
                                                       text-red-700 dark:text-red-300 rounded block">
                                        ❌ {rule}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 
                                              text-green-700 dark:text-green-300 rounded block">
                                  ✓ {path.rules[stateIndex]}
                                </span>
                              </div>
                              <ArrowRight className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Path length: {path.states.length} states, {path.rules.length} transitions
                    </div>
                  </div>
                ))}

                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="text-sm"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="text-sm"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            )}

            {paths.length === 0 && (selectedStartState && (searchMode === 'endStates' || selectedEndState)) && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                No paths found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 