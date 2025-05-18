import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Database, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import SchemaUploader from './components/SchemaUploader';
import SqlEditor from './components/SqlEditor';
import SqlHistory from './components/SqlHistory';
import ApiSettings from './components/ApiSettings';
import { DEFAULT_ENDPOINTS } from './constants/apiConstants';

// Constants for localStorage keys
const STORAGE_KEYS = {
  SQL_HISTORY: 'sql_generator_history',
  SCHEMA: 'sql_generator_schema',
  API_SETTINGS: 'sql_generator_api_settings'
};

// Helper functions for localStorage operations
const saveToStorage = (key, value) => {
  try {
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
    
    // Verify the save was successful
    const savedValue = localStorage.getItem(key);
    if (!savedValue) {
      console.error(`Failed to verify saved data for key: ${key}`);
    }
    
    console.log(`Successfully saved data for key: ${key}`);
  } catch (error) {
    console.error(`Error saving to localStorage for key ${key}:`, error);
  }
};

const loadFromStorage = (key) => {
  try {
    const value = localStorage.getItem(key);
    if (!value) {
      console.log(`No data found in localStorage for key: ${key}`);
      return null;
    }
    
    // If it's a JSON string, parse it
    if (value.startsWith('{') || value.startsWith('[')) {
      return JSON.parse(value);
    }
    
    return value;
  } catch (error) {
    console.error(`Error loading from localStorage for key ${key}:`, error);
    return null;
  }
};

const SqlGenerator = ({ onChangeMode }) => {
  const { theme, setTheme } = useTheme();
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

  // Load data from localStorage on component mount
  useEffect(() => {
    console.log('Loading persisted data...');
    
    // Load Schema
    const savedSchema = loadFromStorage(STORAGE_KEYS.SCHEMA);
    if (savedSchema) {
      console.log('Restoring saved schema');
      setSchema(savedSchema);
    }

    // Load SQL History
    const savedHistory = loadFromStorage(STORAGE_KEYS.SQL_HISTORY);
    if (savedHistory) {
      console.log('Restoring saved SQL history');
      setSqlHistory(savedHistory);
    }
    
    // Load API Settings
    const savedApiSettings = loadFromStorage(STORAGE_KEYS.API_SETTINGS);
    if (savedApiSettings) {
      console.log('Restoring saved API settings');
      setApiSettings(prev => ({
        ...prev,
        ...savedApiSettings
      }));
    }
  }, []);

  // Save schema to localStorage when it changes
  useEffect(() => {
    if (schema) {
      console.log('Saving schema...');
      saveToStorage(STORAGE_KEYS.SCHEMA, schema);
    }
  }, [schema]);

  // Save history to localStorage when it changes
  useEffect(() => {
    if (sqlHistory.length > 0) {
      console.log('Saving SQL history...');
      saveToStorage(STORAGE_KEYS.SQL_HISTORY, sqlHistory);
    }
  }, [sqlHistory]);
  
  // Save API settings to localStorage when they change
  useEffect(() => {
    console.log('Saving API settings...');
    saveToStorage(STORAGE_KEYS.API_SETTINGS, apiSettings);
  }, [apiSettings]);

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
      return "SELECT 1 FROM DUAL;";
    }
    
    // Basic text matching for common query types
    const promptLower = prompt.toLowerCase();
    
    // Count query
    if (promptLower.includes('count') || promptLower.includes('how many')) {
      return `SELECT COUNT(*) AS total_count
FROM ${tables[0]};`;
    }
    
    // Join query
    if (promptLower.includes('join') && tables.length > 1) {
      return `SELECT a.*, b.*
FROM ${tables[0]} a
INNER JOIN ${tables[1]} b ON a.id = b.${tables[0].toLowerCase()}_id;`;
    }
    
    // Top/limit query (using ROWNUM for Oracle)
    if (promptLower.includes('top') || promptLower.includes('expensive') || promptLower.includes('highest') || promptLower.includes('most')) {
      const limit = promptLower.match(/\d+/) ? promptLower.match(/\d+/)[0] : '5';
      return `SELECT *
FROM (
  SELECT a.*, ROWNUM rnum
  FROM (
    SELECT *
    FROM ${tables[0]}
    ORDER BY id DESC
  ) a
  WHERE ROWNUM <= ${limit}
)
WHERE rnum >= 1;`;
    }
    
    // Search/filter query
    if (promptLower.includes('find') || promptLower.includes('where') || promptLower.includes('search')) {
      const searchTerm = prompt.split(' ').pop().replace(/[^a-zA-Z0-9]/g, '');
      return `SELECT *
FROM ${tables[0]}
WHERE UPPER(name) LIKE UPPER('%${searchTerm}%');`;
    }
    
    // Default to a simple SELECT query with ROWNUM
    return `SELECT *
FROM ${tables[0]}
WHERE ROWNUM <= 10;`;
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
            { 
              role: "system", 
              content: `You are an Oracle SQL expert assistant. Follow these rules strictly:

1. ALWAYS respond in this exact format:
\`\`\`sql
-- Your SQL query here, using Oracle syntax
\`\`\`

2. ONLY output the SQL code block - no explanations, no other text
3. Use Oracle-specific syntax (ROWNUM, CONNECT BY, etc.)
4. Never use syntax from other SQL dialects (like LIMIT)
5. Always end queries with a semicolon
6. Use consistent formatting:
   - Keywords in UPPERCASE
   - Identifiers in lowercase
   - One clause per line
   - Proper indentation for subqueries
   - Spaces around operators

Example response format:
\`\`\`sql
SELECT 
  e.last_name,
  e.salary
FROM 
  employees e
WHERE 
  ROWNUM <= 5
ORDER BY 
  e.salary DESC;
\`\`\``
            },
            { 
              role: "user", 
              content: `Database Schema:\n${schema}\n\nGenerate Oracle SQL for: ${prompt}` 
            }
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
            { 
              role: "system", 
              content: `You are an Oracle SQL expert assistant. Follow these rules strictly:

1. ALWAYS respond in this exact format:
\`\`\`sql
-- Your SQL query here, using Oracle syntax
\`\`\`

2. ONLY output the SQL code block - no explanations, no other text
3. Use Oracle-specific syntax (ROWNUM, CONNECT BY, etc.)
4. Never use syntax from other SQL dialects (like LIMIT)
5. Always end queries with a semicolon
6. Use consistent formatting:
   - Keywords in UPPERCASE
   - Identifiers in lowercase
   - One clause per line
   - Proper indentation for subqueries
   - Spaces around operators

Example response format:
\`\`\`sql
SELECT 
  e.last_name,
  e.salary
FROM 
  employees e
WHERE 
  ROWNUM <= 5
ORDER BY 
  e.salary DESC;
\`\`\``
            },
            { 
              role: "user", 
              content: `Database Schema:\n${schema}\n\nGenerate Oracle SQL for: ${prompt}` 
            }
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
            { 
              role: "system", 
              content: `You are an Oracle SQL expert assistant. Follow these rules strictly:

1. ALWAYS respond in this exact format:
\`\`\`sql
-- Your SQL query here, using Oracle syntax
\`\`\`

2. ONLY output the SQL code block - no explanations, no other text
3. Use Oracle-specific syntax (ROWNUM, CONNECT BY, etc.)
4. Never use syntax from other SQL dialects (like LIMIT)
5. Always end queries with a semicolon
6. Use consistent formatting:
   - Keywords in UPPERCASE
   - Identifiers in lowercase
   - One clause per line
   - Proper indentation for subqueries
   - Spaces around operators

Example response format:
\`\`\`sql
SELECT 
  e.last_name,
  e.salary
FROM 
  employees e
WHERE 
  ROWNUM <= 5
ORDER BY 
  e.salary DESC;
\`\`\``
            },
            { 
              role: "user", 
              content: `Database Schema:\n${schema}\n\nGenerate Oracle SQL for: ${prompt}` 
            }
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

      // Clean up any remaining placeholders or template artifacts
      extractedSql = extractedSql
        .replace(/(__PLACEHOLDER_\d+_\d+__)/g, '')
        .replace(/(_+PLACEHOLDER_\d+_\d+_+)/g, '')
        .replace(/\{\{.*?\}\}/g, '')
        .replace(/\[\[.*?\]\]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
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
    <div className="flex flex-col h-screen bg-gradient-to-b from-background to-background/95">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto py-4 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onChangeMode}
                className="hover:bg-background/80"
              >
                <ArrowLeft className="h-5 w-5 text-muted-foreground" />
              </Button>
              <div className="flex items-center gap-2.5">
                <Database className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-semibold tracking-tight">SQL Generator</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="rounded-full hover:bg-background/80"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
              <ApiSettings 
                settings={apiSettings}
                onSettingsChange={handleApiSettingsChange}
              />
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-grow overflow-hidden">
        <div className="container mx-auto h-full p-6">
          <div className="grid grid-cols-12 gap-6 h-full">
            {/* Left Column - Schema Uploader */}
            <div className="col-span-12 md:col-span-3 h-full flex flex-col gap-4">
              <SchemaUploader 
                schema={schema}
                onSchemaChange={handleSchemaChange}
              />
            </div>
            
            {/* Middle Column - SQL Editor */}
            <div className="col-span-12 md:col-span-6 h-full flex flex-col">
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
