import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Database, Check, Info, Table, Key, FileJson, FileText } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DEMO_SCHEMAS } from '../../constants/apiConstants';

const SchemaUploader = ({ schema, onSchemaChange }) => {
  const [activeTab, setActiveTab] = useState('upload');
  const [parsedSchema, setParsedSchema] = useState(null);
  const fileInputRef = useRef(null);
  
  // Parse schema when it changes
  useEffect(() => {
    if (schema) {
      try {
        const tables = parseSchema(schema);
        setParsedSchema(tables);
      } catch (error) {
        console.error('Error parsing schema:', error);
        setParsedSchema(null);
      }
    } else {
      setParsedSchema(null);
    }
  }, [schema]);
  
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      onSchemaChange(content);
      setActiveTab('visualize');
    };
    reader.readAsText(file);
  };
  
  const handleTextChange = (event) => {
    onSchemaChange(event.target.value);
  };
  
  const handleDemoSelect = (demoSchema) => {
    onSchemaChange(demoSchema.schema);
    setActiveTab('visualize');
  };
  
  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };
  
  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const file = event.dataTransfer.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      onSchemaChange(content);
      setActiveTab('visualize');
    };
    reader.readAsText(file);
  };
  
  // Function to parse SQL schema into table structures
  const parseSchema = (schemaText) => {
    const tables = [];
    const tableRegex = /CREATE\s+TABLE\s+(\w+)\s*\(([\s\S]*?)(?:\);|$)/gi;
    let match;
    
    while ((match = tableRegex.exec(schemaText)) !== null) {
      const tableName = match[1];
      const columnsText = match[2];
      
      const columns = [];
      const columnRegex = /(\w+)\s+([A-Za-z0-9()_]+)(?:\s+([A-Za-z\s]+))?/g;
      let columnMatch;
      
      while ((columnMatch = columnRegex.exec(columnsText)) !== null) {
        const columnName = columnMatch[1];
        const dataType = columnMatch[2];
        const constraints = columnMatch[3] || '';
        
        columns.push({
          name: columnName,
          type: dataType,
          isPrimary: constraints.includes('PRIMARY KEY'),
          isNotNull: constraints.includes('NOT NULL'),
          isUnique: constraints.includes('UNIQUE'),
          hasDefault: constraints.includes('DEFAULT')
        });
      }
      
      // Extract foreign keys
      const foreignKeys = [];
      const fkRegex = /FOREIGN\s+KEY\s+\((\w+)\)\s+REFERENCES\s+(\w+)\((\w+)\)/gi;
      let fkMatch;
      
      while ((fkMatch = fkRegex.exec(columnsText)) !== null) {
        foreignKeys.push({
          column: fkMatch[1],
          refTable: fkMatch[2],
          refColumn: fkMatch[3]
        });
      }
      
      tables.push({
        name: tableName,
        columns,
        foreignKeys
      });
    }
    
    return tables;
  };
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Database className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            Database Schema
          </CardTitle>
        </div>
        <CardDescription>
          {schema 
            ? `${parsedSchema ? parsedSchema.length : 0} tables loaded` 
            : 'Upload or paste your database schema'}
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col">
        <div className="px-4 pt-2">
          <TabsList className="w-full">
            <TabsTrigger value="upload" className="flex-1">
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="paste" className="flex-1">
              <FileText className="w-4 h-4 mr-2" />
              Paste
            </TabsTrigger>
            <TabsTrigger value="visualize" className="flex-1" disabled={!schema}>
              <Table className="w-4 h-4 mr-2" />
              Visualize
            </TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="p-0 flex-grow overflow-hidden">
          <TabsContent value="upload" className="h-full m-0 p-4">
            <div 
              className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 h-full
                       flex flex-col items-center justify-center text-center
                       hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <Database className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Upload Schema File</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Drag and drop your SQL schema file here, or click to browse
              </p>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".sql,.txt"
                className="hidden"
              />
              
              <Button 
                onClick={() => fileInputRef.current.click()}
                className="mb-6"
              >
                <Upload className="w-4 h-4 mr-2" />
                Browse Files
              </Button>
              
              <div className="w-full max-w-md">
                <h4 className="text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">
                  Or use a sample schema:
                </h4>
                <div className="space-y-2">
                  {DEMO_SCHEMAS.map((demo, index) => (
                    <Button 
                      key={index}
                      variant="outline" 
                      className="w-full justify-start text-left"
                      onClick={() => handleDemoSelect(demo)}
                    >
                      <FileJson className="w-4 h-4 mr-2 text-blue-500" />
                      {demo.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="paste" className="h-full m-0 p-4">
            <div className="flex flex-col h-full">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium">Paste SQL Schema</h3>
                <div className="flex items-center text-xs text-gray-500">
                  <Info className="w-3 h-3 mr-1" />
                  <span>CREATE TABLE statements</span>
                </div>
              </div>
              
              <Textarea 
                value={schema}
                onChange={handleTextChange}
                placeholder="CREATE TABLE users (
  id INT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE
);"
                className="flex-grow font-mono text-sm"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="visualize" className="h-full m-0">
            {parsedSchema ? (
              <div className="h-full p-4 overflow-y-auto">
                <div className="space-y-6">
                  {parsedSchema.map((table, tableIndex) => (
                    <div 
                      key={tableIndex}
                      className="border rounded-lg overflow-hidden bg-white dark:bg-gray-900"
                    >
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 border-b border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Table className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                            <h3 className="font-medium">{table.name}</h3>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {table.columns.length} columns
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="divide-y divide-gray-200 dark:divide-gray-800">
                        {table.columns.map((column, columnIndex) => (
                          <div 
                            key={columnIndex}
                            className="p-2 flex items-center text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          >
                            <div className="w-6 flex justify-center">
                              {column.isPrimary && (
                                <Key className="w-3 h-3 text-amber-500" />
                              )}
                            </div>
                            <div className="flex-grow flex items-center">
                              <span className="font-medium mr-2">{column.name}</span>
                              <span className="text-gray-500 dark:text-gray-400 text-xs">{column.type}</span>
                            </div>
                            <div className="flex gap-1">
                              {column.isNotNull && (
                                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                                  NOT NULL
                                </Badge>
                              )}
                              {column.isUnique && (
                                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                                  UNIQUE
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {table.foreignKeys.length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-800 p-2 border-t border-gray-200 dark:border-gray-700">
                          <h4 className="text-xs font-medium text-gray-500 mb-1">Foreign Keys:</h4>
                          <div className="space-y-1">
                            {table.foreignKeys.map((fk, fkIndex) => (
                              <div key={fkIndex} className="text-xs flex items-center">
                                <span className="font-medium">{fk.column}</span>
                                <span className="mx-1">→</span>
                                <span>{fk.refTable}.{fk.refColumn}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-6 text-center text-gray-500 dark:text-gray-400">
                <div>
                  <Database className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No valid schema to visualize</p>
                  <p className="text-sm mt-2">Upload or paste a valid SQL schema</p>
                </div>
              </div>
            )}
          </TabsContent>
        </CardContent>
      </Tabs>
      
      {schema && (
        <CardFooter className="border-t border-gray-200 dark:border-gray-800 p-3 bg-gray-50 dark:bg-gray-900/50">
          <div className="w-full flex items-center justify-between text-sm">
            <div className="flex items-center text-green-600 dark:text-green-400">
              <Check className="w-4 h-4 mr-1" />
              <span>Schema loaded</span>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onSchemaChange('')}
              className="text-gray-500 hover:text-red-500"
            >
              Clear
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

SchemaUploader.propTypes = {
  schema: PropTypes.string.isRequired,
  onSchemaChange: PropTypes.func.isRequired
};

export default SchemaUploader;
