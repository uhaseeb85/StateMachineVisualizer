/**
 * ActionHistoryModal Component
 * Displays the history of user actions with search, filter, restore, and export capabilities
 */

import PropTypes from 'prop-types';
import { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Download, 
  Trash2, 
  RotateCcw,
  Clock,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EVENT_TYPES } from './hooks/useActionHistory';

const ActionHistoryModal = ({
  isOpen,
  onClose,
  history,
  onRestore,
  onExportToExcel,
  onClearHistory
}) => {
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedEvent, setExpandedEvent] = useState(null);
  const ITEMS_PER_PAGE = 50;

  // Filter and search history
  const filteredHistory = useMemo(() => {
    let filtered = history;

    // Filter by type
    if (filterType !== 'ALL') {
      filtered = filtered.filter(event => event.type === filterType);
    }

    // Search
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      filtered = filtered.filter(event =>
        event.action.toLowerCase().includes(lowerSearch) ||
        event.changeDetails.toLowerCase().includes(lowerSearch) ||
        event.type.toLowerCase().includes(lowerSearch)
      );
    }

    return filtered;
  }, [history, filterType, searchText]);

  // Pagination
  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredHistory.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredHistory, currentPage]);

  // Reset page when filters change
  const handleFilterChange = (value) => {
    setFilterType(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
    setCurrentPage(1);
  };

  const handleRestore = (eventId) => {
    if (window.confirm('Are you sure you want to restore to this point? This will replace your current diagram.')) {
      onRestore(eventId);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all history? This action cannot be undone.')) {
      onClearHistory();
      onClose();
    }
  };

  const toggleExpand = (eventId) => {
    setExpandedEvent(expandedEvent === eventId ? null : eventId);
  };

  // Get icon and color for event type
  const getEventStyle = (type) => {
    switch (type) {
      case EVENT_TYPES.STEP_ADDED:
      case EVENT_TYPES.CONNECTION_ADDED:
        return { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', icon: '➕' };
      case EVENT_TYPES.STEP_UPDATED:
        return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: '✏️' };
      case EVENT_TYPES.STEP_DELETED:
      case EVENT_TYPES.CONNECTION_DELETED:
        return { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', icon: '🗑️' };
      case EVENT_TYPES.FLOW_IMPORTED:
        return { color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', icon: '📥' };
      case EVENT_TYPES.FLOW_CLEARED:
        return { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', icon: '🧹' };
      case EVENT_TYPES.FLOW_RESTORED:
        return { color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20', icon: '↩️' };
      default:
        return { color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-900/20', icon: '•' };
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Action History
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {filteredHistory.length} event{filteredHistory.length !== 1 ? 's' : ''} 
                {filterType !== 'ALL' && ` (filtered)`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 space-y-4">
          <div className="flex gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search history..."
                value={searchText}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>

            {/* Filter */}
            <Select value={filterType} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Events</SelectItem>
                <SelectItem value={EVENT_TYPES.STEP_ADDED}>Step Added</SelectItem>
                <SelectItem value={EVENT_TYPES.STEP_UPDATED}>Step Updated</SelectItem>
                <SelectItem value={EVENT_TYPES.STEP_DELETED}>Step Deleted</SelectItem>
                <SelectItem value={EVENT_TYPES.CONNECTION_ADDED}>Connection Added</SelectItem>
                <SelectItem value={EVENT_TYPES.CONNECTION_DELETED}>Connection Deleted</SelectItem>
                <SelectItem value={EVENT_TYPES.FLOW_IMPORTED}>Flow Imported</SelectItem>
                <SelectItem value={EVENT_TYPES.FLOW_CLEARED}>Flow Cleared</SelectItem>
                <SelectItem value={EVENT_TYPES.FLOW_RESTORED}>Flow Restored</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={onExportToExcel}
              variant="outline"
              className="flex items-center gap-2"
              disabled={history.length === 0}
            >
              <Download className="w-4 h-4" />
              Export to Excel
            </Button>
            <Button
              onClick={handleClearHistory}
              variant="outline"
              className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              disabled={history.length === 0}
            >
              <Trash2 className="w-4 h-4" />
              Clear History
            </Button>
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-6">
          {paginatedHistory.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No history events found</p>
              <p className="text-sm mt-2">
                {searchText || filterType !== 'ALL' 
                  ? 'Try adjusting your filters' 
                  : 'Actions will appear here as you work'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {paginatedHistory.map((event) => {
                const style = getEventStyle(event.type);
                const isExpanded = expandedEvent === event.id;

                return (
                  <div
                    key={event.id}
                    className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow ${style.bg}`}
                  >
                    {/* Event Row */}
                    <div className="p-4 flex items-center gap-4">
                      {/* Icon */}
                      <div className="text-2xl flex-shrink-0">{style.icon}</div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-medium ${style.color}`}>
                            {event.type.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTimestamp(event.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {event.action}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {event.changeDetails}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          onClick={() => handleRestore(event.id)}
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-1"
                          title="Restore to this point"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Restore
                        </Button>
                        <Button
                          onClick={() => toggleExpand(event.id)}
                          variant="ghost"
                          size="sm"
                          className="p-1"
                          title="Show details"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && event.snapshot && (
                      <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
                        <div className="mt-3 text-xs space-y-2">
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Snapshot:</span>
                            <div className="mt-1 text-gray-600 dark:text-gray-400">
                              • {event.snapshot.steps?.length || 0} step(s)
                              <br />
                              • {event.snapshot.connections?.length || 0} connection(s)
                            </div>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Event ID:</span>
                            <span className="ml-2 text-gray-600 dark:text-gray-400 font-mono">
                              {event.id}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <Button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

ActionHistoryModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  history: PropTypes.array.isRequired,
  onRestore: PropTypes.func.isRequired,
  onExportToExcel: PropTypes.func.isRequired,
  onClearHistory: PropTypes.func.isRequired
};

export default ActionHistoryModal;
