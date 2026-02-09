/**
 * CSVParser.js
 * 
 * CSV file parser implementation.
 * Extracts CSV parsing logic from utils.js.
 */

import Papa from 'papaparse';
import { IFileParser } from './IFileParser';

/**
 * CSV file parser using PapaParse
 */
export class CSVParser extends IFileParser {
  /**
   * Check if this parser can parse the given file
   * @param {File} file - File to check
   * @returns {boolean} True if file is CSV
   */
  canParse(file) {
    if (!file || !file.name) return false;
    const extension = file.name.split('.').pop().toLowerCase();
    return this.getSupportedExtensions().includes(extension);
  }

  /**
   * Parse CSV file and return data rows
   * @param {File} file - CSV file to parse
   * @returns {Promise<Array>} Parsed data rows
   */
  async parse(file) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors && results.errors.length > 0) {
            console.warn('CSV parsing warnings:', results.errors);
          }
          resolve(results.data);
        },
        error: (error) => {
          console.error('CSV parsing error:', error);
          reject(new Error(`Failed to parse CSV: ${error.message}`));
        }
      });
    });
  }

  /**
   * Get the name of this parser
   * @returns {string} Parser name
   */
  getName() {
    return 'CSV Parser';
  }

  /**
   * Get supported file extensions
   * @returns {string[]} Array of supported extensions
   */
  getSupportedExtensions() {
    return ['csv', 'txt'];
  }
}
