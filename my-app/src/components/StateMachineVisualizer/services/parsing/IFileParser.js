/**
 * IFileParser.js
 * 
 * File parser interface for Strategy pattern.
 * Allows adding new file formats without modifying existing code (OCP).
 */

/**
 * File parser interface
 * @interface
 */
export class IFileParser {
  /**
   * Check if this parser can parse the given file
   * @param {File} file - File to check
   * @returns {boolean} True if parser can handle this file
   */
  canParse(file) {
    throw new Error('Method not implemented');
  }

  /**
   * Parse the file and return data rows
   * @param {File} file - File to parse
   * @returns {Promise<Array>} Parsed data rows
   */
  async parse(file) {
    throw new Error('Method not implemented');
  }

  /**
   * Get the name of this parser
   * @returns {string} Parser name
   */
  getName() {
    throw new Error('Method not implemented');
  }

  /**
   * Get supported file extensions
   * @returns {string[]} Array of supported extensions (e.g., ['csv', 'txt'])
   */
  getSupportedExtensions() {
    throw new Error('Method not implemented');
  }
}
