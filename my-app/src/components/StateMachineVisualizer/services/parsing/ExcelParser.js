/**
 * ExcelParser.js
 * 
 * Excel file parser implementation.
 * Extracts Excel parsing logic from utils.js.
 */

import ExcelJS from 'exceljs';
import { IFileParser } from './IFileParser';

/**
 * Excel file parser using ExcelJS
 */
export class ExcelParser extends IFileParser {
  /**
   * Check if this parser can parse the given file
   * @param {File} file - File to check
   * @returns {boolean} True if file is Excel
   */
  canParse(file) {
    if (!file || !file.name) return false;
    const extension = file.name.split('.').pop().toLowerCase();
    return this.getSupportedExtensions().includes(extension);
  }

  /**
   * Parse Excel file and return data rows
   * @param {File} file - Excel file to parse
   * @returns {Promise<Array>} Parsed data rows
   */
  async parse(file) {
    try {
      const workbook = new ExcelJS.Workbook();
      const arrayBuffer = await file.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);
      
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new Error('No worksheet found in Excel file');
      }

      const rows = [];
      const headers = [];
      
      // Get headers from first row
      const firstRow = worksheet.getRow(1);
      firstRow.eachCell((cell, colNumber) => {
        headers[colNumber - 1] = cell.value?.toString() || '';
      });

      // Parse data rows
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row
        
        const rowData = {};
        let hasData = false;
        
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          if (header) {
            const value = cell.value?.toString() || '';
            rowData[header] = value;
            if (value) hasData = true;
          }
        });

        // Add row only if it has data
        if (hasData) {
          // Fill in missing columns with empty strings
          headers.forEach(header => {
            if (!(header in rowData)) {
              rowData[header] = '';
            }
          });
          rows.push(rowData);
        }
      });

      return rows;
    } catch (error) {
      console.error('Excel parsing error:', error);
      throw new Error(`Failed to parse Excel file: ${error.message}`);
    }
  }

  /**
   * Get the name of this parser
   * @returns {string} Parser name
   */
  getName() {
    return 'Excel Parser';
  }

  /**
   * Get supported file extensions
   * @returns {string[]} Array of supported extensions
   */
  getSupportedExtensions() {
    return ['xlsx', 'xls'];
  }
}
