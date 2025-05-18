import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Table as TableIcon, Code, Download, Search, ArrowUpDown, Filter, ChevronDown, ChevronUp } from 'lucide-react';

const ResultsViewer = ({ results }) => {
  const [activeView, setActiveView] = useState('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredResults, setFilteredResults] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  // Update filtered results when results or search term changes
  useEffect(() => {
    if (!results) {
      setFilteredResults(null);
      return;
    }
    
    if (!searchTerm) {
      setFilteredResults(results);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = {
      ...results,
      rows: results.rows.filter(row => 
        Object.values(row).some(value => 
          String(value).toLowerCase().includes(term)
        )
      )
    };
    
    setFilteredResults(filtered);
  }, [results, searchTerm]);
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        // Could add a toast notification here
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };
  
  const downloadResults = () => {
    if (!results) return;
    
    // Format as CSV
    const headers = results.columns.join(',');
    const rows = results.rows.map(row => 
      results.columns.map(col => JSON.stringify(row[col])).join(',')
    ).join('\n');
    const csv = `${headers}\n${rows}`;
    
    // Create download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sql_results_${new Date().getTime()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleSort = (key) => {
    let direction = 'asc';
    
    if (sortConfig.key === key) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    }
    
    setSortConfig({ key, direction });
  };
  
  const getSortedResults = () => {
    if (!filteredResults || !sortConfig.key) return filteredResults;
    
    const sorted = {
      ...filteredResults,
      rows: [...filteredResults.rows].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        // Handle different data types
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        // Convert to string for comparison
        const aString = String(aValue).toLowerCase();
        const bString = String(bValue).toLowerCase();
        
        if (aString < bString) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aString > bString) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      })
    };
    
    return sorted;
  };
  
  const sortedResults = getSortedResults();
  
  const renderTableView = () => {
    if (!sortedResults) return null;
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              {sortedResults.columns.map((column, index) => (
                <th 
                  key={index} 
                  className="py-2 px-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center">
                    <span>{column}</span>
                    <div className="ml-1 flex flex-col">
                      <ChevronUp className={`h-2 w-2 ${sortConfig.key === column && sortConfig.direction === 'asc' ? 'text-green-500' : 'text-gray-400'}`} />
                      <ChevronDown className={`h-2 w-2 ${sortConfig.key === column && sortConfig.direction === 'desc' ? 'text-green-500' : 'text-gray-400'}`} />
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedResults.rows.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                className={`${rowIndex % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'} 
                           hover:bg-blue-50 dark:hover:bg-blue-900/20`}
              >
                {sortedResults.columns.map((column, colIndex) => (
                  <td key={colIndex} className="py-2 px-3 text-sm text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                    {typeof row[column] === 'object' ? JSON.stringify(row[column]) : row[column]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  const renderJsonView = () => {
    if (!sortedResults) return null;
    
    return (
      <pre className="text-xs font-mono whitespace-pre-wrap bg-gray-100 dark:bg-gray-800 p-4 rounded-lg h-full overflow-auto">
        {JSON.stringify(sortedResults.rows, null, 2)}
      </pre>
    );
  };
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <TableIcon className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
            Query Results
          </CardTitle>
          
          {results && (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => copyToClipboard(JSON.stringify(results.rows, null, 2))}
                className="text-gray-600 hover:text-gray-800"
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={downloadResults}
                className="text-gray-600 hover:text-gray-800"
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </div>
          )}
        </div>
        <CardDescription>
          {results 
            ? `${results.rows.length} rows returned in ${results.executionTime}${searchTerm ? ` • Filtered: ${sortedResults?.rows.length || 0} rows` : ''}` 
            : 'Execute a query to see results'}
        </CardDescription>
      </CardHeader>
      
      <div className="flex-grow flex flex-col">
        {!results ? (
          <div className="h-full flex items-center justify-center p-6 text-center text-gray-500 dark:text-gray-400">
            <div>
              <TableIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No query results to display</p>
              <p className="text-sm mt-2">Execute a query to see the results here</p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-4 pt-3 flex items-center gap-4">
              <TabsList className="w-full max-w-[200px]">
                <TabsTrigger value="table" onClick={() => setActiveView('table')} className={`flex-1 ${activeView === 'table' ? 'bg-green-100 dark:bg-green-900/30' : ''}`}>
                  <TableIcon className="w-4 h-4 mr-2" />
                  Table
                </TabsTrigger>
                <TabsTrigger value="json" onClick={() => setActiveView('json')} className={`flex-1 ${activeView === 'json' ? 'bg-green-100 dark:bg-green-900/30' : ''}`}>
                  <Code className="w-4 h-4 mr-2" />
                  JSON
                </TabsTrigger>
              </TabsList>
              
              <div className="relative flex-grow">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search results..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <CardContent className="p-0 flex-grow h-full">
              <div className="h-full overflow-y-auto">
                {activeView === 'table' ? renderTableView() : renderJsonView()}
              </div>
            </CardContent>
            
            {results.sql && (
              <div className="p-2 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 text-xs text-gray-600 dark:text-gray-400 font-mono">
                <div className="flex items-center justify-between">
                  <div className="truncate flex-grow">
                    <span className="mr-2">SQL:</span>
                    {results.sql.length > 60 
                      ? `${results.sql.substring(0, 60)}...` 
                      : results.sql}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => copyToClipboard(results.sql)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
};

ResultsViewer.propTypes = {
  results: PropTypes.shape({
    columns: PropTypes.arrayOf(PropTypes.string).isRequired,
    rows: PropTypes.arrayOf(PropTypes.object).isRequired,
    sql: PropTypes.string,
    executionTime: PropTypes.string
  })
};

export default ResultsViewer;
