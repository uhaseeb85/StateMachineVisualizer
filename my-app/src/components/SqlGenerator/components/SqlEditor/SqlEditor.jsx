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
  
  // Define SQL keywords for highlighting (including Oracle-specific keywords)
  const keywords = [
    // Standard SQL keywords
    'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON',
    'GROUP BY', 'ORDER BY', 'HAVING', 'INSERT', 'UPDATE', 'DELETE',
    'CREATE', 'ALTER', 'DROP', 'TABLE', 'VIEW', 'INDEX', 'TRIGGER', 'PROCEDURE',
    'AND', 'OR', 'NOT', 'NULL', 'IS', 'IN', 'BETWEEN', 'LIKE', 'AS', 'DISTINCT',
    'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
    // Oracle-specific keywords
    'NUMBER', 'VARCHAR2', 'NVARCHAR2', 'CLOB', 'NCLOB', 'BLOB', 'DATE',
    'TIMESTAMP', 'ROWID', 'ROWNUM', 'CONNECT BY', 'START WITH', 'PRIOR',
    'NOCYCLE', 'LEVEL', 'CONNECT_BY_ROOT', 'CONNECT_BY_ISLEAF', 'SYS_CONNECT_BY_PATH',
    'WITH', 'PARTITION BY', 'OVER', 'MERGE', 'USING', 'MATCHED', 'FORALL',
    'BULK COLLECT', 'RETURNING', 'INTO', 'PACKAGE', 'FUNCTION', 'PRAGMA',
    'EXCEPTION', 'RAISE', 'SEQUENCE', 'MATERIALIZED VIEW', 'SYNONYM'
  ];
  
  // Define SQL functions (including Oracle-specific functions)
  const functions = [
    // Standard SQL functions
    'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'ROUND', 'FLOOR', 'CEIL', 'ABS',
    'CONCAT', 'SUBSTR', 'TRIM', 'UPPER', 'LOWER',
    // Oracle-specific functions
    'NVL', 'NVL2', 'DECODE', 'COALESCE', 'TO_CHAR', 'TO_DATE', 'TO_NUMBER',
    'SYSDATE', 'SYSTIMESTAMP', 'MONTHS_BETWEEN', 'ADD_MONTHS', 'LAST_DAY',
    'NEXT_DAY', 'TRUNC', 'EXTRACT', 'INSTR', 'REGEXP_LIKE', 'REGEXP_REPLACE',
    'REGEXP_SUBSTR', 'REGEXP_INSTR', 'REGEXP_COUNT', 'LISTAGG', 'LAG', 'LEAD',
    'FIRST_VALUE', 'LAST_VALUE', 'ROW_NUMBER', 'RANK', 'DENSE_RANK',
    'PERCENTILE_CONT', 'PERCENTILE_DISC', 'MEDIAN', 'STATS_MODE',
    'CAST', 'NULLIF', 'GREATEST', 'LEAST', 'UID', 'USER', 'USERENV'
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
    <Card className="h-full flex flex-col bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="space-y-1.5 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Sparkles className="w-5 h-5 text-primary" />
            Natural Language to SQL
          </CardTitle>
          
          {sql && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={copyToClipboard}
              className="rounded-full hover:bg-background/80"
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription className="text-sm text-muted-foreground">
          Describe your query in plain English and let AI generate the SQL for you
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-grow flex flex-col gap-6 p-6">
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
                  className="text-xs bg-background/50 hover:bg-background/80 transition-colors"
                  onClick={() => setPrompt(example)}
                >
                  {example}
                </Button>
              ))}
            </div>
          )}
          
          <form onSubmit={handlePromptSubmit} className="space-y-4">
            <Textarea
              value={prompt}
              onChange={handlePromptChange}
              placeholder="Describe your query in natural language..."
              className="w-full min-h-[120px] bg-background/50 backdrop-blur-sm resize-none focus:ring-2 focus:ring-primary/20 transition-all"
              disabled={isGenerating}
            />
            <Button 
              type="submit" 
              disabled={!prompt.trim() || isGenerating}
              className="w-full bg-primary/90 hover:bg-primary transition-colors h-10"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Generate SQL Query
                </>
              )}
            </Button>
          </form>
        </div>
        
        {/* Generated SQL Display */}
        <div className="flex-grow flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Code className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Generated SQL</h3>
          </div>
          <div className="flex-grow relative rounded-lg border border-border/50 bg-background/50 backdrop-blur-sm overflow-hidden">
            <div 
              className="font-mono text-sm p-4 absolute inset-0 overflow-auto"
              dangerouslySetInnerHTML={{ 
                __html: highlightedSql || '<span class="text-muted-foreground">-- Your generated SQL query will appear here --</span>' 
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
