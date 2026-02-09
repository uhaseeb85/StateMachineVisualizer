/**
 * ExportService.js
 * 
 * Service for exporting state machine data.
 * Orchestrates export strategies and provides high-level export operations.
 */

import { CSVExportStrategy } from './CSVExportStrategy';
import { ExcelExportStrategy } from './ExcelExportStrategy';

/**
 * Export service
 * Manages export strategies and provides export operations
 */
export class ExportService {
  constructor() {
    this.strategies = new Map();
    this.registerDefaultStrategies();
  }

  /**
   * Register default export strategies
   * @private
   */
  registerDefaultStrategies() {
    this.register('csv', new CSVExportStrategy());
    this.register('excel', new ExcelExportStrategy());
    this.register('xlsx', new ExcelExportStrategy()); // Alias
  }

  /**
   * Register an export strategy
   * @param {string} format - Format identifier (e.g., 'csv', 'excel')
   * @param {IExportStrategy} strategy - Export strategy instance
   */
  register(format, strategy) {
    if (!strategy.export || !strategy.getName) {
      throw new Error('Invalid strategy: must implement IExportStrategy interface');
    }
    this.strategies.set(format.toLowerCase(), strategy);
  }

  /**
   * Get export strategy by format
   * @param {string} format - Format identifier
   * @returns {IExportStrategy|null} Export strategy or null
   */
  getStrategy(format) {
    return this.strategies.get(format.toLowerCase()) || null;
  }

  /**
   * Export data using specified format
   * @param {Array} data - Data to export
   * @param {string} filename - Output filename (without extension)
   * @param {string} format - Export format ('csv' or 'excel')
   * @param {object} options - Export options
   * @returns {Promise<void>}
   */
  async export(data, filename, format = 'csv', options = {}) {
    const strategy = this.getStrategy(format);
    
    if (!strategy) {
      throw new Error(`Unsupported export format: ${format}`);
    }

    console.log(`Exporting with ${strategy.getName()}`);
    await strategy.export(data, filename, options);
  }

  /**
   * Convert states to export rows
   * @param {Array} states - Array of state objects
   * @param {object} options - Conversion options
   * @param {object} options.loadedDictionary - Rule dictionary for descriptions
   * @returns {Array} Export rows
   */
  convertStatesToRows(states, options = {}) {
    const { loadedDictionary = {} } = options;
    const rows = [];

    states.forEach(state => {
      if (!state.transitions || state.transitions.length === 0) {
        // State with no transitions
        rows.push({
          'Source Node': state.name,
          'Destination Node': '',
          'Rule List': '',
          'Priority': '',
          'Operation / Edge Effect': ''
        });
      } else {
        // State with transitions
        state.transitions.forEach(transition => {
          // Resolve rule description from dictionary
          let ruleDescription = transition.rule;
          if (loadedDictionary[transition.rule]) {
            ruleDescription = loadedDictionary[transition.rule];
          }

          rows.push({
            'Source Node': state.name,
            'Destination Node': transition.targetState,
            'Rule List': ruleDescription,
            'Priority': transition.priority !== undefined ? transition.priority : '',
            'Operation / Edge Effect': transition.operation || ''
          });
        });
      }
    });

    return rows;
  }

  /**
   * Merge multiple CSV files into rows
   * @param {Array} filesData - Array of {sourceFile, rows} objects
   * @param {object} options - Merge options
   * @returns {Array} Merged export rows
   */
  mergeMultipleFiles(filesData, options = {}) {
    const mergedRows = [];
    const { addSourceColumn = true } = options;

    filesData.forEach(({ sourceFile, rows }) => {
      rows.forEach(row => {
        const mergedRow = { ...row };
        
        if (addSourceColumn) {
          mergedRow['Source File'] = sourceFile;
        }

        mergedRows.push(mergedRow);
      });
    });

    return mergedRows;
  }

  /**
   * Get available export formats
   * @returns {string[]} Array of format identifiers
   */
  getAvailableFormats() {
    return Array.from(this.strategies.keys());
  }
}

// Singleton instance
let serviceInstance = null;

/**
 * Get singleton instance of ExportService
 * @returns {ExportService} Service instance
 */
export const getExportService = () => {
  if (!serviceInstance) {
    serviceInstance = new ExportService();
  }
  return serviceInstance;
};
