import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Database } from 'lucide-react';
import SchemaUploader from './components/SchemaUploader';
import SqlEditor from './components/SqlEditor';
import ResultsViewer from './components/ResultsViewer';
import SqlHistory from './components/SqlHistory';
import ApiSettings from './components/ApiSettings';
import { DEFAULT_ENDPOINTS } from './constants/apiConstants';

const SqlGenerator = ({ onChangeMode }) => {
  const [schema, setSchema] = useState('');
  const [apiSettings, setApiSettings] = useState({
    endpoint: DEFAULT_ENDPOINTS.LM_STUDIO,
    apiKey: '',
    model: '',
    provider: 'LM_STUDIO',
    temperature: 0.7,
    maxTokens: 2000,
  });
  const [sqlHistory, setSqlHistory] = useState([]);
  const [currentSql, setCurrentSql] = useState('');
  const [results, setResults] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('sql_history');
    if (savedHistory) {
      try {
        setSqlHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Failed to parse SQL history:', error);
      }
    }
  }, []);

  // Save history to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('sql_history', JSON.stringify(sqlHistory));
  }, [sqlHistory]);

  const handleSchemaChange = (newSchema) => {
    setSchema(newSchema);
  };

  const handleApiSettingsChange = (newSettings) => {
    setApiSettings(newSettings);
  };

  const handleSqlChange = (sql) => {
    setCurrentSql(sql);
  };

  const handleGenerateSql = async (prompt) => {
    if (!schema) {
      alert('Please upload a database schema first');
      return;
    }

    setIsGenerating(true);
    
    try {
      // In a real implementation, this would call the LLM API
      // For now, we'll simulate a response
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const generatedSql = `SELECT * FROM users WHERE username LIKE '%${prompt}%';`;
      
      setCurrentSql(generatedSql);
      
      // Add to history
      const newHistoryItem = {
        id: Date.now().toString(),
        prompt,
        sql: generatedSql,
        timestamp: new Date().toISOString()
      };
      
      setSqlHistory(prev => [newHistoryItem, ...prev]);
      
      // Simulate query execution
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setResults({
        columns: ['id', 'username', 'email', 'created_at'],
        rows: [
          { id: 1, username: 'john_doe', email: 'john@example.com', created_at: '2023-01-15' },
          { id: 2, username: 'jane_smith', email: 'jane@example.com', created_at: '2023-02-20' }
        ],
        sql: generatedSql,
        executionTime: '0.05s'
      });
      
    } catch (error) {
      console.error('Error generating SQL:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExecuteSql = async () => {
    if (!currentSql) {
      alert('Please enter or generate SQL first');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // In a real implementation, this would execute the SQL against a database
      // For now, we'll simulate a response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setResults({
        columns: ['id', 'username', 'email', 'created_at'],
        rows: [
          { id: 1, username: 'john_doe', email: 'john@example.com', created_at: '2023-01-15' },
          { id: 2, username: 'jane_smith', email: 'jane@example.com', created_at: '2023-02-20' },
          { id: 3, username: 'bob_johnson', email: 'bob@example.com', created_at: '2023-03-10' }
        ],
        sql: currentSql,
        executionTime: '0.03s'
      });
      
    } catch (error) {
      console.error('Error executing SQL:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectSql = (sql) => {
    setCurrentSql(sql);
    setActiveTab('editor');
  };

  const handleClearHistory = () => {
    setSqlHistory([]);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border p-4 bg-card">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onChangeMode}
              className="mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Database className="h-6 w-6 text-amber-500" />
            <h1 className="text-xl font-bold">SQL Generator</h1>
          </div>
          
          <ApiSettings 
            settings={apiSettings}
            onSettingsChange={handleApiSettingsChange}
          />
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-grow overflow-hidden">
        <div className="container mx-auto h-full p-4">
          <div className="grid grid-cols-12 gap-4 h-full">
            {/* Left Column - Schema Uploader */}
            <div className="col-span-12 md:col-span-3 h-full flex flex-col gap-4">
              <SchemaUploader 
                schema={schema}
                onSchemaChange={handleSchemaChange}
              />
            </div>
            
            {/* Middle Column - SQL Editor & Results */}
            <div className="col-span-12 md:col-span-6 h-full flex flex-col gap-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <TabsList className="w-full max-w-md mx-auto">
                  <TabsTrigger value="editor" className="flex-1">SQL Editor</TabsTrigger>
                  <TabsTrigger value="results" className="flex-1">Results</TabsTrigger>
                </TabsList>
                
                <div className="flex-grow overflow-hidden">
                  <TabsContent value="editor" className="h-full m-0 p-0">
                    <SqlEditor 
                      sql={currentSql}
                      onSqlChange={handleSqlChange}
                      onGenerateSql={handleGenerateSql}
                      onExecuteSql={handleExecuteSql}
                      isGenerating={isGenerating}
                      schema={schema}
                    />
                  </TabsContent>
                  
                  <TabsContent value="results" className="h-full m-0 p-0">
                    <ResultsViewer results={results} />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
            
            {/* Right Column - SQL History */}
            <div className="col-span-12 md:col-span-3 h-full">
              <SqlHistory 
                history={sqlHistory}
                onSelectSql={handleSelectSql}
                onClearHistory={handleClearHistory}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

SqlGenerator.propTypes = {
  onChangeMode: PropTypes.func.isRequired
};

export default SqlGenerator;
