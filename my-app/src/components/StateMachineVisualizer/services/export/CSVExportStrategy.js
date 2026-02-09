/**
 * CSVExportStrategy.js
 * 
 * CSV export strategy implementation using ExcelJS.
 * Extracts CSV export logic from index.jsx.
 */

import ExcelJS from 'exceljs';
import { IExportStrategy } from './IExportStrategy';

/**
 * CSV export strategy using ExcelJS
 */
export class CSVExportStrategy extends IExportStrategy {
  /**
   * Export data to CSV file
   * @param {Array} data - Array of state objects with transitions
   * @param {string} filename - Output filename (without extension)
   * @param {object} options - Export options
   * @param {boolean} options.includeHeaders - Include header row (default: true)
   * @param {Array} options.columns - Column definitions
   * @returns {Promise<void>}
   */
  async export(data, filename, options = {}) {
    if (!this.validateData(data)) {
      throw new Error('Invalid data for export: must be non-empty array');
    }

    const {
      includeHeaders = true,
      columns = [
        'Source Node',
        'Destination Node',
        'Rule List',
        'Priority',
        'Operation / Edge Effect'
      ]
    } = options;

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('State Machine');

      // Add header row
      if (includeHeaders) {
        worksheet.addRow(columns);
      }

      // Add data rows
      data.forEach(row => {
        const rowData = columns.map(col => {
          const value = row[col];
          return value !== undefined && value !== null ? value : '';
        });
        worksheet.addRow(rowData);
      });

      // Generate CSV buffer
      const buffer = await workbook.csv.writeBuffer();
      
      // Download file
      this.downloadFile(buffer, filename);
    } catch (error) {
      console.error('CSV export error:', error);
      throw new Error(`Failed to export CSV: ${error.message}`);
    }
  }

  /**
   * Download file to browser
   * @param {Buffer} buffer - File buffer
   * @param {string} filename - Filename without extension
   * @private
   */
  downloadFile(buffer, filename) {
    const blob = new Blob([buffer], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = `${filename}.${this.getExtension()}`;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    link.remove();
    URL.revokeObjectURL(url);
  }

  /**
   * Get the name of this export strategy
   * @returns {string} Strategy name
   */
  getName() {
    return 'CSV Export';
  }

  /**
   * Get the file extension
   * @returns {string} File extension
   */
  getExtension() {
    return 'csv';
  }

  /**
   * Validate data before export
   * @param {Array} data - Data to validate
   * @returns {boolean} True if data is valid
   */
  validateData(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return false;
    }

    // Ensure at least one row has required fields
    return data.some(row => 
      row['Source Node'] !== undefined || 
      row['Destination Node'] !== undefined
    );
  }
}
