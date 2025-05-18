import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { History, Code, Copy, Trash2, Star, Search, Clock, Filter } from 'lucide-react';

const SqlHistory = ({ history, onSelectSql, onClearHistory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [favorites, setFavorites] = useState([]);
  
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        // Could add a toast notification here
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };
  
  const toggleFavorite = (id) => {
    setFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id) 
        : [...prev, id]
    );
  };
  
  const filteredHistory = history.filter(item => {
    // Filter by search term
    const matchesSearch = searchTerm === '' || 
      item.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sql.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by tab
    const matchesTab = 
      activeTab === 'all' || 
      (activeTab === 'favorites' && favorites.includes(item.id));
    
    return matchesSearch && matchesTab;
  });
  
  // Group history by date
  const groupedHistory = filteredHistory.reduce((groups, item) => {
    const date = new Date(item.timestamp).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {});
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <History className="w-5 h-5 mr-2 text-amber-600 dark:text-amber-400" />
            SQL History
          </CardTitle>
          
          {history.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClearHistory}
              className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
        <CardDescription>
          {history.length > 0 
            ? `${history.length} previously generated SQL queries` 
            : 'Your SQL query history will appear here'}
        </CardDescription>
      </CardHeader>
      
      <div className="px-3 pt-2">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">
              <Clock className="w-3.5 h-3.5 mr-1" />
              All
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex-1">
              <Star className="w-3.5 h-3.5 mr-1" />
              Favorites
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="px-3 pt-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      
      <CardContent className="p-0 flex-grow">
        {history.length === 0 ? (
          <div className="h-full flex items-center justify-center p-6 text-center text-gray-500 dark:text-gray-400">
            <div>
              <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No SQL queries in history yet</p>
              <p className="text-sm mt-2">Generate your first query to see it here</p>
            </div>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="h-full flex items-center justify-center p-6 text-center text-gray-500 dark:text-gray-400">
            <div>
              <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No matching queries found</p>
              <p className="text-sm mt-2">Try a different search term</p>
            </div>
          </div>
        ) : (
          <div className="h-[400px] overflow-y-auto">
            <div className="p-3 space-y-4">
              {Object.entries(groupedHistory).map(([date, items]) => (
                <div key={date} className="space-y-2">
                  <div className="flex items-center">
                    <div className="h-px bg-gray-200 dark:bg-gray-800 flex-grow mr-2" />
                    <span className="text-xs text-gray-500 font-medium">{date}</span>
                    <div className="h-px bg-gray-200 dark:bg-gray-800 flex-grow ml-2" />
                  </div>
                  
                  {items.map((item) => (
                    <div 
                      key={item.id}
                      className="border rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer"
                      onClick={() => onSelectSql(item.sql)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(item.timestamp)}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={`h-6 w-6 ${favorites.includes(item.id) ? 'text-amber-500' : 'text-gray-400'}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(item.id);
                            }}
                          >
                            <Star className="h-3.5 w-3.5" fill={favorites.includes(item.id) ? 'currentColor' : 'none'} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(item.sql);
                            }}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-sm font-medium mb-2 line-clamp-2">{item.prompt}</p>
                      
                      <div className="bg-gray-100 dark:bg-gray-900 rounded p-2 max-h-20 overflow-hidden relative">
                        <pre className="text-xs font-mono line-clamp-3">{item.sql}</pre>
                        <div className="absolute bottom-0 right-0 flex items-center p-1">
                          <Code className="h-3 w-3 text-gray-400" />
                        </div>
                      </div>
                      
                      {/* SQL Type Badge - detect type of SQL query */}
                      <div className="mt-2 flex items-center gap-1">
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] px-1.5 py-0 h-4 ${
                            item.sql.toLowerCase().includes('select') 
                              ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' 
                              : item.sql.toLowerCase().includes('insert') 
                                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                                : item.sql.toLowerCase().includes('update') 
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
                                  : item.sql.toLowerCase().includes('delete') 
                                    ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                                    : ''
                          }`}
                        >
                          {item.sql.toLowerCase().includes('select') 
                            ? 'SELECT' 
                            : item.sql.toLowerCase().includes('insert') 
                              ? 'INSERT'
                              : item.sql.toLowerCase().includes('update') 
                                ? 'UPDATE'
                                : item.sql.toLowerCase().includes('delete') 
                                  ? 'DELETE'
                                  : 'OTHER'}
                        </Badge>
                        
                        {/* Show if it's a favorite */}
                        {favorites.includes(item.id) && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 text-[10px] px-1.5 py-0 h-4">
                            <Star className="h-2 w-2 mr-1 fill-current" />
                            Favorite
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

SqlHistory.propTypes = {
  history: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      prompt: PropTypes.string.isRequired,
      sql: PropTypes.string.isRequired,
      timestamp: PropTypes.string.isRequired
    })
  ).isRequired,
  onSelectSql: PropTypes.func.isRequired,
  onClearHistory: PropTypes.func.isRequired
};

export default SqlHistory;
