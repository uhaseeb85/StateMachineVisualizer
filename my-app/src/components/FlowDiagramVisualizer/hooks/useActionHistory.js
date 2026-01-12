/**
 * Custom hook for managing action history in the Flow Diagram Builder
 * Tracks all user actions (add/edit/delete steps and connections)
 * Stores last 2000 events in localStorage with restore capability
 */

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

const HISTORY_STORAGE_KEY = 'flowDiagramActionHistory';
const MAX_HISTORY_SIZE = 2000;

/**
 * Event types that can be tracked
 */
export const EVENT_TYPES = {
  STEP_ADDED: 'STEP_ADDED',
  STEP_UPDATED: 'STEP_UPDATED',
  STEP_DELETED: 'STEP_DELETED',
  CONNECTION_ADDED: 'CONNECTION_ADDED',
  CONNECTION_DELETED: 'CONNECTION_DELETED',
  FLOW_IMPORTED: 'FLOW_IMPORTED',
  FLOW_CLEARED: 'FLOW_CLEARED',
  FLOW_RESTORED: 'FLOW_RESTORED'
};

/**
 * Hook for managing action history
 * @returns {Object} History management methods and state
 */
const useActionHistory = () => {
  const [history, setHistory] = useState([]);

  /**
   * Load history from localStorage on mount
   */
  useEffect(() => {
    const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        setHistory(parsedHistory);
      } catch (error) {
        console.error('Error loading action history:', error);
        setHistory([]);
      }
    }
  }, []);

  /**
   * Save history to localStorage whenever it changes
   */
  useEffect(() => {
    if (history.length > 0) {
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
      } catch (error) {
        console.error('Error saving action history:', error);
      }
    }
  }, [history]);

  /**
   * Add a new event to the history
   * @param {string} type - Event type from EVENT_TYPES
   * @param {string} action - Human-readable action description
   * @param {string} changeDetails - Detailed description of what changed
   * @param {Object} snapshot - Full diagram state { steps, connections }
   */
  const addEvent = useCallback((type, action, changeDetails, snapshot) => {
    const newEvent = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      type,
      action,
      changeDetails,
      snapshot: {
        steps: JSON.parse(JSON.stringify(snapshot.steps || [])),
        connections: JSON.parse(JSON.stringify(snapshot.connections || []))
      }
    };

    setHistory(prev => {
      // Add new event at the beginning
      const updated = [newEvent, ...prev];
      
      // Keep only last MAX_HISTORY_SIZE events
      if (updated.length > MAX_HISTORY_SIZE) {
        return updated.slice(0, MAX_HISTORY_SIZE);
      }
      
      return updated;
    });
  }, []);

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    toast.success('Action history cleared');
  }, []);

  /**
   * Export history to Excel file
   */
  const exportToExcel = useCallback(() => {
    if (history.length === 0) {
      toast.error('No history to export');
      return;
    }

    try {
      // Prepare data for Excel
      const excelData = history.map(event => ({
        'Timestamp': new Date(event.timestamp).toLocaleString(),
        'Event Type': event.type.replace(/_/g, ' '),
        'Action': event.action,
        'Details': event.changeDetails
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      ws['!cols'] = [
        { wch: 20 }, // Timestamp
        { wch: 20 }, // Event Type
        { wch: 40 }, // Action
        { wch: 60 }  // Details
      ];

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Action History');

      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      // Save file
      const fileName = `flow_diagram_history_${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(blob, fileName);

      toast.success('History exported to Excel successfully');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Error exporting history: ' + error.message);
    }
  }, [history]);

  /**
   * Get a specific event by ID
   * @param {string} eventId - Event ID
   * @returns {Object|null} Event object or null if not found
   */
  const getEvent = useCallback((eventId) => {
    return history.find(event => event.id === eventId) || null;
  }, [history]);

  /**
   * Get event count
   * @returns {number} Number of events in history
   */
  const getEventCount = useCallback(() => {
    return history.length;
  }, [history]);

  /**
   * Filter history by event type
   * @param {string} eventType - Event type to filter by
   * @returns {Array} Filtered events
   */
  const filterByType = useCallback((eventType) => {
    if (!eventType) return history;
    return history.filter(event => event.type === eventType);
  }, [history]);

  /**
   * Search history by text
   * @param {string} searchText - Text to search for
   * @returns {Array} Matching events
   */
  const searchHistory = useCallback((searchText) => {
    if (!searchText) return history;
    
    const lowerSearch = searchText.toLowerCase();
    return history.filter(event => 
      event.action.toLowerCase().includes(lowerSearch) ||
      event.changeDetails.toLowerCase().includes(lowerSearch) ||
      event.type.toLowerCase().includes(lowerSearch)
    );
  }, [history]);

  return {
    history,
    addEvent,
    clearHistory,
    exportToExcel,
    getEvent,
    getEventCount,
    filterByType,
    searchHistory
  };
};

export default useActionHistory;
