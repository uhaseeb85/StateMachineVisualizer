import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Database } from 'lucide-react';
import SchemaUploader from './components/SchemaUploader';
import SqlEditor from './components/SqlEditor';
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
  const [isGenerating, setIsGenerating] = useState(false);

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

  // Generate a sample SQL query based on the prompt and schema
  const generateDemoSql = (prompt, schema) => {
    // Extract table names from the schema
    const tableRegex = /CREATE\s+TABLE\s+(\w+)/gi;
    const tables = [];
    let match;
    
    while ((match = tableRegex.exec(schema)) !== null) {
      tables.push(match[1]);
    }
    
    if (tables.length === 0) {
      return "SELECT 1;";
    }
    
    // Basic text matching for common query types
    const promptLower = prompt.toLowerCase();
    
    // Count query
    if (promptLower.includes('count') || promptLower.includes('how many')) {
      return `SELECT COUNT(*) FROM ${tables[0]};`;
    }
    
    // Join query
    if (promptLower.includes('join') && tables.length > 1) {
      return `SELECT ${tables[0]}.*, ${tables[1]}.* 
FROM ${tables[0]}
JOIN ${tables[1]} ON ${tables[0]}.id = ${tables[1]}.${tables[0].slice(0, -1)}_id;`;
    }
    
    // Top/limit query
    if (promptLower.includes('top') || promptLower.includes('expensive') || promptLower.includes('highest') || promptLower.includes('most')) {
      const limit = promptLower.match(/\d+/) ? promptLower.match(/\d+/)[0] : '5';
      return `SELECT * FROM ${tables[0]} ORDER BY id DESC LIMIT ${limit};`;
    }
    
    // Search/filter query
    if (promptLower.includes('find') || promptLower.includes('where') || promptLower.includes('search')) {
      const searchTerm = prompt.split(' ').pop().replace(/[^a-zA-Z0-9]/g, '');
      return `SELECT * FROM ${tables[0]} WHERE name LIKE '%${searchTerm}%';`;
    }
    
    // Default to a simple SELECT query
    return `SELECT * FROM ${tables[0]} LIMIT 10;`;
  };

  const callLlmApi = async (prompt) => {
    const { endpoint, apiKey, model, provider, temperature, maxTokens } = apiSettings;
    
    if (!endpoint) {
      throw new Error('API endpoint is not configured');
    }
    
    let payload;
    let headers = { 'Content-Type': 'application/json' };
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    // Create the appropriate payload based on provider
    switch (provider) {
      case 'LM_STUDIO':
        payload = {
          messages: [
            { role: "system", content: "You are an SQL expert assistant. Use the provided database schema to generate accurate SQL queries based on user requests." },
            { role: "user", content: `Database Schema:\n${schema}\n\nGenerate SQL for: ${prompt}` }
          ],
          temperature: temperature,
          max_tokens: maxTokens,
          stream: false
        };
        break;
        
      case 'OLLAMA':
        payload = {
          model: model || 'llama3',
          messages: [
            { role: "system", content: "You are an SQL expert assistant. Use the provided database schema to generate accurate SQL queries based on user requests." },
            { role: "user", content: `Database Schema:\n${schema}\n\nGenerate SQL for: ${prompt}` }
          ],
          options: {
            temperature: temperature
          }
        };
        break;
        
      case 'CUSTOM':
      default:
        payload = {
          model: model,
          messages: [
            { role: "system", content: "You are an SQL expert assistant. Use the provided database schema to generate accurate SQL queries based on user requests." },
            { role: "user", content: `Database Schema:\n${schema}\n\nGenerate SQL for: ${prompt}` }
          ],
          temperature: temperature,
          max_tokens: maxTokens
        };
        break;
    }
    
    try {
      console.log('Calling API with endpoint:', endpoint);
      console.log('Payload:', JSON.stringify(payload, null, 2));
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
      }
      
      const data = await response.json();
      console.log('API response:', data);
      
      // Extract the generated SQL based on the provider's response format
      let generatedSql;
      
      if (provider === 'OLLAMA') {
        generatedSql = data.message?.content;
      } else {
        // LM_STUDIO and CUSTOM (OpenAI-compatible)
        generatedSql = data.choices?.[0]?.message?.content;
      }
      
      if (!generatedSql) {
        throw new Error('No SQL was generated in the response');
      }
      
      // Try to extract just the SQL code from the response
      // Look for SQL between markdown code blocks or backticks
      let extractedSql = '';
      
      // First, try to match markdown SQL code blocks
      const markdownSqlRegex = /```sql\s*([\s\S]*?)\s*```/;
      const markdownMatch = markdownSqlRegex.exec(generatedSql);
      
      if (markdownMatch && markdownMatch[1]) {
        extractedSql = markdownMatch[1].trim();
      } else {
        // Try to match any markdown code blocks
        const markdownRegex = /```\s*([\s\S]*?)\s*```/;
        const generalMatch = markdownRegex.exec(generatedSql);
        
        if (generalMatch && generalMatch[1]) {
          extractedSql = generalMatch[1].trim();
        } else {
          // Try to match inline code with backticks
          const inlineCodeRegex = /`([^`]+)`/;
          const inlineMatch = inlineCodeRegex.exec(generatedSql);
          
          if (inlineMatch && inlineMatch[1]) {
            extractedSql = inlineMatch[1].trim();
          } else {
            // If we can't find code blocks, look for SQL-like patterns
            const sqlPatternRegex = /SELECT\s+[\w\*]+\s+FROM\s+\w+/i;
            const patternMatch = sqlPatternRegex.exec(generatedSql);
            
            if (patternMatch) {
              // Extract from the match until a common ending (;, newline, etc)
              const startIndex = patternMatch.index;
              let endIndex = generatedSql.indexOf(';', startIndex);
              
              if (endIndex === -1) {
                // Try to find the end of the statement with a newline if no semicolon
                endIndex = generatedSql.indexOf('\n\n', startIndex);
              }
              
              if (endIndex === -1) {
                // If still no clear end, take a reasonable chunk
                endIndex = Math.min(startIndex + 200, generatedSql.length);
              }
              
              extractedSql = generatedSql.substring(startIndex, endIndex + 1).trim();
            } else {
              // If all else fails, just use the whole response
              extractedSql = generatedSql;
            }
          }
        }
      }
      
      console.log('Extracted SQL:', extractedSql);
      return extractedSql;
      
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  const handleGenerateSql = async (prompt) => {
    if (!schema) {
      alert('Please upload a database schema first');
      return;
    }

    setIsGenerating(true);
    
    try {
      let generatedSql;
      
      try {
        // Try to call the LLM API
        generatedSql = await callLlmApi(prompt);
      } catch (apiError) {
        console.error('API call failed, using fallback demo mode:', apiError);
        // Fall back to demo mode
        generatedSql = generateDemoSql(prompt, schema);
      }
      
      // Update current SQL
      setCurrentSql(generatedSql);
      
      // Add to history
      const newHistoryItem = {
        id: Date.now().toString(),
        prompt,
        sql: generatedSql,
        timestamp: new Date().toISOString()
      };
      
      setSqlHistory(prev => [newHistoryItem, ...prev]);
      
    } catch (error) {
      console.error('Error generating SQL:', error);
      alert(`Failed to generate SQL: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectSql = (sql) => {
    setCurrentSql(sql);
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
            
            {/* Middle Column - SQL Editor */}
            <div className="col-span-12 md:col-span-6 h-full flex flex-col gap-4">
              <SqlEditor 
                sql={currentSql}
                onSqlChange={handleSqlChange}
                onGenerateSql={handleGenerateSql}
                isGenerating={isGenerating}
                schema={schema}
              />
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
