/**
 * IExportStrategy.js
 * 
 * Export strategy interface for Strategy pattern.
 * Allows adding new export formats without modifying existing code (OCP).
 */

/* eslint-disable no-unused-vars */

/**
 * Export strategy interface
 * @interface
 */
export class IExportStrategy {
  /**
   * Export data to a file
   * @param {Array} data - Data to export
   * @param {string} filename - Output filename
   * @param {object} options - Additional export options
   * @returns {Promise<void>}
   */
  async export(_data, _filename, _options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Get the name of this export strategy
   * @returns {string} Strategy name
   */
  getName() {
    throw new Error('Method not implemented');
  }

  /**
   * Get the file extension for this format
   * @returns {string} File extension (e.g., 'csv', 'xlsx')
   */
  getExtension() {
    throw new Error('Method not implemented');
  }

  /**
   * Validate data before export
   * @param {Array} data - Data to validate
   * @returns {boolean} True if data is valid for export
   */
  validateData(data) {
    return Array.isArray(data) && data.length > 0;
  }
}
