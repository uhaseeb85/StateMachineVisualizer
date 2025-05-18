import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Code, Sparkles, Send, Copy, Loader2 } from 'lucide-react';

// Simple syntax highlighting function
const highlightSql = (sql) => {
  if (!sql) return '';
  
  // Define SQL keywords for highlighting
  const keywords = [
    'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON',
    'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET', 'INSERT', 'UPDATE', 'DELETE',
    'CREATE', 'ALTER', 'DROP', 'TABLE', 'VIEW', 'INDEX', 'TRIGGER', 'PROCEDURE',
    'AND', 'OR', 'NOT', 'NULL', 'IS', 'IN', 'BETWEEN', 'LIKE', 'AS', 'DISTINCT',
    'CASE', 'WHEN', 'THEN', 'ELSE', 'END'
  ];
  
  // Define SQL functions for separate highlighting
  const functions = [
    'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'ROUND', 'FLOOR', 'CEILING', 'ABS',
    'CONCAT', 'SUBSTRING', 'TRIM', 'UPPER', 'LOWER', 'DATE', 'NOW', 'CURRENT_TIMESTAMP'
  ];
  
  // Define regex patterns
  const patterns = [
    // Keywords
    { pattern: new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi'), className: 'text-blue-600 dark:text-blue-400 font-semibold' },
    // Functions
    { pattern: new RegExp(`\\b(${functions.join('|')})\\b`, 'gi'), className: 'text-purple-600 dark:text-purple-400 font-medium' },
    // Function calls with parenthesis
    { pattern: /\b\w+\s*\(/g, className: 'text-purple-600 dark:text-purple-400' },
    // Strings
    { pattern: /'[^']*'|"[^"]*"/g, className: 'text-green-600 dark:text-green-400' },
    // Numbers
    { pattern: /\b\d+\b/g, className: 'text-amber-600 dark:text-amber-400' },
    // Comments
    { pattern: /--.*$/gm, className: 'text-gray-500 dark:text-gray-400 italic' },
    // Parentheses
    { pattern: /[()]/g, className: 'text-gray-600 dark:text-gray-400' },
    // Operators
    { pattern: /[=<>!+\-*/%]+/g, className: 'text-red-600 dark:text-red-400' }
  ];
  
  // Apply highlighting
  let highlightedSql = sql;
  let placeholders = [];
  
  // Replace patterns with placeholders to avoid conflicts
  patterns.forEach((item, index) => {
    highlightedSql = highlightedSql.replace(item.pattern, (match) => {
      const placeholder = `__PLACEHOLDER_${index}_${placeholders.length}__`;
      placeholders.push({ placeholder, match, className: item.className });
      return placeholder;
    });
  });
  
  // Replace placeholders with spans
  placeholders.forEach(item => {
    highlightedSql = highlightedSql.replace(
      item.placeholder, 
      `<span class="${item.className}">${item.match}</span>`
    );
  });
  
  // Replace newlines with <br>
  highlightedSql = highlightedSql.replace(/\n/g, '<br>');
  
  return highlightedSql;
};

const SqlEditor = ({ sql, onSqlChange, onGenerateSql, isGenerating, schema }) => {
  const [prompt, setPrompt] = useState('');
  const [highlightedSql, setHighlightedSql] = useState('');
  
  // Update highlighted SQL when sql changes
  useEffect(() => {
    setHighlightedSql(highlightSql(sql));
  }, [sql]);
  
  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
  };
  
  const handlePromptSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    onGenerateSql(prompt);
    // Don't clear prompt so user can see what they asked for
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(sql)
      .then(() => {
        // Could add a toast notification here
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };
  
  // Generate example prompts based on schema
  const getExamplePrompts = () => {
    if (!schema) return [];
    
    // Try to extract table names from schema
    const tableRegex = /CREATE\s+TABLE\s+(\w+)/gi;
    const tables = [];
    let match;
    
    while ((match = tableRegex.exec(schema)) !== null) {
      tables.push(match[1]);
    }
    
    if (tables.length === 0) return [];
    
    // Generate example prompts based on found tables
    const examples = [];
    
    if (tables.includes('users')) {
      examples.push('Find all users who registered in the last month');
    }
    
    if (tables.includes('products')) {
      examples.push('List the top 5 most expensive products');
    }
    
    if (tables.includes('orders') && tables.includes('users')) {
      examples.push('Show me orders placed by users from New York');
    }
    
    // Add some generic examples if we don't have enough
    if (examples.length < 3) {
      examples.push(`Count the number of rows in ${tables[0]}`);
      
      if (tables.length > 1) {
        examples.push(`Join ${tables[0]} with ${tables[1]}`);
      }
    }
    
    return examples;
  };
  
  const examplePrompts = getExamplePrompts();
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-200 dark:border-indigo-800 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
            Natural Language to SQL
          </CardTitle>
          
          {sql && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={copyToClipboard}
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription>
          Describe what you want to query in plain English
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-4 flex-grow flex flex-col gap-4">
        {/* Natural Language Input */}
        <div className="space-y-4">
          {examplePrompts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((example, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setPrompt(example)}
                >
                  {example}
                </Button>
              ))}
            </div>
          )}
          
          <form onSubmit={handlePromptSubmit} className="flex gap-2">
            <Textarea
              value={prompt}
              onChange={handlePromptChange}
              placeholder="Describe your query in natural language..."
              className="flex-grow min-h-[100px]"
              disabled={isGenerating}
            />
            <Button 
              type="submit" 
              disabled={!prompt.trim() || isGenerating}
              className="bg-indigo-600 hover:bg-indigo-700 self-start"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Generate
            </Button>
          </form>
        </div>
        
        {/* Generated SQL Display */}
        <div className="flex-grow">
          <div className="flex items-center gap-2 mb-2">
            <Code className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">Generated SQL</h3>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800 h-[calc(100%-2rem)] overflow-y-auto">
            <div 
              className="font-mono text-sm p-4 whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ 
                __html: highlightedSql || '<span class="text-gray-400">-- Generated SQL will appear here --</span>' 
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

SqlEditor.propTypes = {
  sql: PropTypes.string.isRequired,
  onSqlChange: PropTypes.func.isRequired,
  onGenerateSql: PropTypes.func.isRequired,
  isGenerating: PropTypes.bool.isRequired,
  schema: PropTypes.string
};

export default SqlEditor;
