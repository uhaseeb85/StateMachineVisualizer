/**
 * Custom hook for managing a step dictionary
 * Provides auto-suggestions, type/alias lookup, and import/export functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import Papa from 'papaparse';
import ExcelJS from 'exceljs';
import storage from '@/utils/storageWrapper';

/**
 * @typedef {Object} DictionaryEntry
 * @property {string} stepName - Unique step name (case-insensitive key)
 * @property {'state' | 'rule' | 'behavior'} type - Step type
 * @property {string} alias - Optional alias for the step
 * @property {string} description - Optional description for the step
 */

/**
 * Custom hook for managing step dictionary
 * @param {string} storageKey - Key for IndexedDB persistence
 * @returns {Object} Dictionary management methods and state
 */
const useStepDictionary = (storageKey = 'flowDiagramStepDictionary') => {
  const [dictionary, setDictionary] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load dictionary from IndexedDB on mount
   */
  useEffect(() => {
    const loadDictionary = async () => {
      try {
        console.log('[useStepDictionary] Loading dictionary from storage');
        const savedDictionary = await storage.getItem(storageKey);
        
        if (savedDictionary && Array.isArray(savedDictionary)) {
          console.log('[useStepDictionary] Loaded', savedDictionary.length, 'entries');
          setDictionary(savedDictionary);
        } else {
          console.log('[useStepDictionary] No saved dictionary found, initializing empty');
          setDictionary([]);
        }
      } catch (error) {
        console.error('[useStepDictionary] Error loading dictionary:', error);
        setDictionary([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadDictionary();
  }, [storageKey]);

  /**
   * Save dictionary to IndexedDB
   */
  const saveDictionary = useCallback(async (newDictionary) => {
    try {
      await storage.setItem(storageKey, newDictionary);
      console.log('[useStepDictionary] Saved', newDictionary.length, 'entries');
    } catch (error) {
      console.error('[useStepDictionary] Error saving dictionary:', error);
      toast.error('Failed to save step dictionary');
    }
  }, [storageKey]);

  /**
   * Normalize step name for case-insensitive comparison
   */
  const normalizeStepName = (name) => {
    return name?.trim().toLowerCase() || '';
  };

  /**
   * Lookup a step in the dictionary
   * @param {string} stepName - Step name to lookup
   * @returns {DictionaryEntry | null} Dictionary entry or null if not found
   */
  const lookup = useCallback((stepName) => {
    if (!stepName) return null;
    
    const normalized = normalizeStepName(stepName);
    const entry = dictionary.find(
      entry => normalizeStepName(entry.stepName) === normalized
    );
    
    return entry || null;
  }, [dictionary]);

  /**
   * Add or update a dictionary entry
   * @param {string} stepName - Step name
   * @param {'state' | 'rule' | 'behavior'} type - Step type
   * @param {string} alias - Optional alias
   * @param {string} description - Optional description
   */
  const upsertEntry = useCallback((stepName, type = 'state', alias = '', description = '') => {
    if (!stepName?.trim()) return;

    const normalized = normalizeStepName(stepName);
    
    setDictionary(prev => {
      // Check if entry already exists
      const existingIndex = prev.findIndex(
        entry => normalizeStepName(entry.stepName) === normalized
      );

      let newDictionary;
      
      if (existingIndex >= 0) {
        // Update existing entry
        newDictionary = [...prev];
        newDictionary[existingIndex] = {
          stepName: stepName.trim(),
          type: type || 'state',
          alias: alias?.trim() || '',
          description: description?.trim() || ''
        };
        console.log('[useStepDictionary] Updated entry:', stepName);
      } else {
        // Add new entry
        newDictionary = [
          ...prev,
          {
            stepName: stepName.trim(),
            type: type || 'state',
            alias: alias?.trim() || '',
            description: description?.trim() || ''
          }
        ];
        console.log('[useStepDictionary] Added new entry:', stepName);
      }

      // Save to storage
      saveDictionary(newDictionary);
      
      return newDictionary;
    });
  }, [saveDictionary]);

  /**
   * Remove a dictionary entry
   * @param {string} stepName - Step name to remove
   */
  const removeEntry = useCallback((stepName) => {
    if (!stepName) return;

    const normalized = normalizeStepName(stepName);
    
    setDictionary(prev => {
      const newDictionary = prev.filter(
        entry => normalizeStepName(entry.stepName) !== normalized
      );
      
      if (newDictionary.length !== prev.length) {
        console.log('[useStepDictionary] Removed entry:', stepName);
        saveDictionary(newDictionary);
      }
      
      return newDictionary;
    });
  }, [saveDictionary]);

  /**
   * Sync dictionary from current steps
   * Adds new steps and updates existing entries if properties changed
   * @param {Array} steps - Array of step objects
   */
  const syncFromSteps = useCallback((steps) => {
    if (!steps || !Array.isArray(steps)) return;

    let addedCount = 0;
    let updatedCount = 0;
    
    setDictionary(prev => {
      const newDictionary = [...prev];
      
      steps.forEach(step => {
        if (!step.name) return;
        
        const normalized = normalizeStepName(step.name);
        const existingIndex = newDictionary.findIndex(
          entry => normalizeStepName(entry.stepName) === normalized
        );
        
        const stepData = {
          stepName: step.name.trim(),
          type: step.type || 'state',
          alias: step.alias?.trim() || '',
          description: step.description?.trim() || ''
        };
        
        if (existingIndex === -1) {
          // New entry - add it
          newDictionary.push(stepData);
          addedCount++;
        } else {
          // Existing entry - check if any properties changed
          const existing = newDictionary[existingIndex];
          const hasChanges = 
            existing.type !== stepData.type ||
            existing.alias !== stepData.alias ||
            existing.description !== stepData.description;
          
          if (hasChanges) {
            // Update existing entry
            newDictionary[existingIndex] = stepData;
            updatedCount++;
          }
        }
      });
      
      const totalChanges = addedCount + updatedCount;
      
      if (totalChanges > 0) {
        console.log('[useStepDictionary] Synced:', addedCount, 'added,', updatedCount, 'updated');
        
        if (addedCount > 0 && updatedCount > 0) {
          toast.success(`Added ${addedCount} and updated ${updatedCount} step(s)`);
        } else if (addedCount > 0) {
          toast.success(`Added ${addedCount} step(s) to dictionary`);
        } else if (updatedCount > 0) {
          toast.success(`Updated ${updatedCount} step(s) in dictionary`);
        }
        
        saveDictionary(newDictionary);
      } else {
        toast.info('Dictionary is already up to date');
      }
      
      return newDictionary;
    });
  }, [saveDictionary]);

  /**
   * Get suggestions based on query string
   * @param {string} query - Search query
   * @returns {Array<DictionaryEntry>} Matching entries
   */
  const getSuggestions = useCallback((query) => {
    if (!query?.trim()) return [];
    
    const normalized = normalizeStepName(query);
    
    return dictionary.filter(entry => 
      normalizeStepName(entry.stepName).includes(normalized)
    ).sort((a, b) => {
      // Prioritize entries that start with the query
      const aStarts = normalizeStepName(a.stepName).startsWith(normalized);
      const bStarts = normalizeStepName(b.stepName).startsWith(normalized);
      
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      
      // Then sort alphabetically
      return a.stepName.localeCompare(b.stepName);
    });
  }, [dictionary]);

  /**
   * Import dictionary from CSV or Excel file
   * @param {File} file - File to import
   * @returns {Promise<boolean>} Success status
   */
  const importDictionary = useCallback(async (file) => {
    try {
      const fileName = file.name.toLowerCase();
      
      if (fileName.endsWith('.csv')) {
        // Parse CSV
        return new Promise((resolve) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              try {
                const entries = results.data
                  .filter(row => row['Step Name']?.trim())
                  .map(row => ({
                    stepName: row['Step Name'].trim(),
                    type: ['state', 'rule', 'behavior'].includes(row['Type']?.toLowerCase()) 
                      ? row['Type'].toLowerCase() 
                      : 'state',
                    alias: row['Alias']?.trim() || '',
                    description: row['Description']?.trim() || ''
                  }));

                if (entries.length === 0) {
                  toast.error('No valid entries found in CSV');
                  resolve(false);
                  return;
                }

                // Merge with existing dictionary
                setDictionary(prev => {
                  const merged = [...prev];
                  let addedCount = 0;
                  let updatedCount = 0;

                  entries.forEach(entry => {
                    const normalized = normalizeStepName(entry.stepName);
                    const existingIndex = merged.findIndex(
                      e => normalizeStepName(e.stepName) === normalized
                    );

                    if (existingIndex >= 0) {
                      merged[existingIndex] = entry;
                      updatedCount++;
                    } else {
                      merged.push(entry);
                      addedCount++;
                    }
                  });

                  console.log('[useStepDictionary] Imported:', addedCount, 'added,', updatedCount, 'updated');
                  toast.success(`Imported ${addedCount} new, updated ${updatedCount} existing entries`);
                  saveDictionary(merged);
                  
                  return merged;
                });

                resolve(true);
              } catch (error) {
                console.error('Error processing CSV:', error);
                toast.error('Failed to process CSV file');
                resolve(false);
              }
            },
            error: (error) => {
              console.error('Error parsing CSV:', error);
              toast.error('Failed to parse CSV file');
              resolve(false);
            }
          });
        });
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        // Parse Excel using ExcelJS
        const arrayBuffer = await file.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);
        
        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
          toast.error('No worksheet found in Excel file');
          return false;
        }

        const rows = [];
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header row
          
          const rowData = {
            'Step Name': row.getCell(1).value,
            'Type': row.getCell(2).value,
            'Alias': row.getCell(3).value,
            'Description': row.getCell(4).value
          };
          rows.push(rowData);
        });

        const entries = rows
          .filter(row => row['Step Name']?.toString().trim())
        .map(row => ({
          stepName: row['Step Name'].toString().trim(),
          type: ['state', 'rule', 'behavior'].includes(row['Type']?.toString().toLowerCase()) 
            ? row['Type'].toString().toLowerCase() 
            : 'state',
          alias: row['Alias']?.toString().trim() || '',
          description: row['Description']?.toString().trim() || ''
        }));

        if (entries.length === 0) {
          toast.error('No valid entries found in Excel file');
          return false;
        }

        // Merge with existing dictionary
        setDictionary(prev => {
          const merged = [...prev];
          let addedCount = 0;
          let updatedCount = 0;

          entries.forEach(entry => {
            const normalized = normalizeStepName(entry.stepName);
            const existingIndex = merged.findIndex(
              e => normalizeStepName(e.stepName) === normalized
            );

            if (existingIndex >= 0) {
              merged[existingIndex] = entry;
              updatedCount++;
            } else {
              merged.push(entry);
              addedCount++;
            }
          });

          console.log('[useStepDictionary] Imported:', addedCount, 'added,', updatedCount, 'updated');
          toast.success(`Imported ${addedCount} new, updated ${updatedCount} existing entries`);
          saveDictionary(merged);
          
          return merged;
        });

        return true;
      } else {
        toast.error('Please upload a CSV or Excel file');
        return false;
      }
    } catch (error) {
      console.error('Error importing dictionary:', error);
      toast.error('Failed to import dictionary: ' + error.message);
      return false;
    }
  }, [saveDictionary]);

  /**
   * Export dictionary as CSV
   */
  const exportDictionary = useCallback(() => {
    try {
      if (dictionary.length === 0) {
        toast.info('Dictionary is empty, nothing to export');
        return;
      }

      // Prepare CSV data
      const csvData = dictionary.map(entry => ({
        'Step Name': entry.stepName,
        'Type': entry.type,
        'Alias': entry.alias || '',
        'Description': entry.description || ''
      }));

      // Convert to CSV string
      const csv = Papa.unparse(csvData);

      // Create blob and download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `step_dictionary_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      toast.success('Dictionary exported successfully');
    } catch (error) {
      console.error('Error exporting dictionary:', error);
      toast.error('Failed to export dictionary');
    }
  }, [dictionary]);

  /**
   * Clear all dictionary entries
   */
  const clearDictionary = useCallback(() => {
    setDictionary([]);
    saveDictionary([]);
    toast.success('Dictionary cleared');
  }, [saveDictionary]);

  return {
    dictionary,
    isLoading,
    lookup,
    upsertEntry,
    removeEntry,
    syncFromSteps,
    getSuggestions,
    importDictionary,
    exportDictionary,
    clearDictionary
  };
};

export default useStepDictionary;
