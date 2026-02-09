/**
 * FileParserRegistry.js
 * 
 * Registry for file parsers using Strategy pattern.
 * Allows adding new file formats without modifying existing code (OCP).
 */

import { CSVParser } from './CSVParser';
import { ExcelParser } from './ExcelParser';

/**
 * File parser registry
 * Manages multiple file parsers and selects appropriate one
 */
export class FileParserRegistry {
  constructor() {
    this.parsers = [];
    this.registerDefaultParsers();
  }

  /**
   * Register default parsers
   * @private
   */
  registerDefaultParsers() {
    this.register(new CSVParser());
    this.register(new ExcelParser());
  }

  /**
   * Register a new parser
   * @param {IFileParser} parser - Parser to register
   */
  register(parser) {
    if (!parser.canParse || !parser.parse) {
      throw new Error('Invalid parser: must implement IFileParser interface');
    }
    this.parsers.push(parser);
  }

  /**
   * Get appropriate parser for a file
   * @param {File} file - File to parse
   * @returns {IFileParser|null} Parser that can handle the file, or null
   */
  getParser(file) {
    return this.parsers.find(parser => parser.canParse(file)) || null;
  }

  /**
   * Parse a file using the appropriate parser
   * @param {File} file - File to parse
   * @returns {Promise<Array>} Parsed data rows
   * @throws {Error} If no parser can handle the file
   */
  async parse(file) {
    const parser = this.getParser(file);
    
    if (!parser) {
      const extension = file.name.split('.').pop().toLowerCase();
      throw new Error(`No parser available for file type: ${extension}`);
    }

    console.log(`Parsing file with ${parser.getName()}`);
    return await parser.parse(file);
  }

  /**
   * Get all supported file extensions
   * @returns {string[]} Array of all supported extensions
   */
  getSupportedExtensions() {
    const extensions = new Set();
    this.parsers.forEach(parser => {
      parser.getSupportedExtensions().forEach(ext => extensions.add(ext));
    });
    return Array.from(extensions);
  }

  /**
   * Get accept string for file input
   * @returns {string} Accept attribute value (e.g., ".csv,.xlsx,.xls")
   */
  getAcceptString() {
    return this.getSupportedExtensions().map(ext => `.${ext}`).join(',');
  }
}

// Singleton instance
let registryInstance = null;

/**
 * Get singleton instance of FileParserRegistry
 * @returns {FileParserRegistry} Registry instance
 */
export const getFileParserRegistry = () => {
  if (!registryInstance) {
    registryInstance = new FileParserRegistry();
  }
  return registryInstance;
};

/**
 * Parse a file using the registry
 * @param {File} file - File to parse
 * @returns {Promise<Array>} Parsed data rows
 */
export const parseFile = async (file) => {
  const registry = getFileParserRegistry();
  return await registry.parse(file);
};
