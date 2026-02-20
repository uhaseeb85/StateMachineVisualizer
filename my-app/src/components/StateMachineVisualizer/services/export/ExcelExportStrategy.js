/**
 * ExcelExportStrategy.js
 * 
 * Excel export strategy implementation using ExcelJS.
 * Provides enhanced Excel export with formatting.
 */

import ExcelJS from 'exceljs';
import { IExportStrategy } from './IExportStrategy';

/**
 * Excel export strategy using ExcelJS with formatting
 */
export class ExcelExportStrategy extends IExportStrategy {
  /**
   * Export data to Excel file
   * @param {Array} data - Array of state objects with transitions
   * @param {string} filename - Output filename (without extension)
   * @param {object} options - Export options
   * @param {boolean} options.includeHeaders - Include header row (default: true)
   * @param {Array} options.columns - Column definitions
   * @param {boolean} options.autoFilter - Add auto-filter (default: true)
   * @param {boolean} options.freezeHeader - Freeze header row (default: true)
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
      ],
      autoFilter = true,
      freezeHeader = true
    } = options;

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('State Machine');

      // Add header row with formatting
      if (includeHeaders) {
        const headerRow = worksheet.addRow(columns);
        headerRow.font = { bold: true };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
      }

      // Add data rows
      data.forEach(row => {
        const rowData = columns.map(col => {
          const value = row[col];
          return value !== undefined && value !== null ? value : '';
        });
        worksheet.addRow(rowData);
      });

      // Auto-size columns
      columns.forEach((col, index) => {
        const columnIndex = index + 1;
        let maxLength = col.length;
        
        worksheet.getColumn(columnIndex).eachCell({ includeEmpty: false }, (cell) => {
          const cellValue = cell.value?.toString() || '';
          maxLength = Math.max(maxLength, cellValue.length);
        });
        
        worksheet.getColumn(columnIndex).width = Math.min(maxLength + 2, 50);
      });

      // Add auto-filter
      if (autoFilter && includeHeaders) {
        worksheet.autoFilter = {
          from: { row: 1, column: 1 },
          to: { row: 1, column: columns.length }
        };
      }

      // Freeze header row
      if (freezeHeader && includeHeaders) {
        worksheet.views = [
          { state: 'frozen', xSplit: 0, ySplit: 1 }
        ];
      }

      // Generate Excel buffer
      const buffer = await workbook.xlsx.writeBuffer();
      
      // Download file
      this.downloadFile(buffer, filename);
    } catch (error) {
      console.error('Excel export error:', error);
      throw new Error(`Failed to export Excel: ${error.message}`);
    }
  }

  /**
   * Download file to browser
   * @param {Buffer} buffer - File buffer
   * @param {string} filename - Filename without extension
   * @private
   */
  downloadFile(buffer, filename) {
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
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
    return 'Excel Export';
  }

  /**
   * Get the file extension
   * @returns {string} File extension
   */
  getExtension() {
    return 'xlsx';
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
