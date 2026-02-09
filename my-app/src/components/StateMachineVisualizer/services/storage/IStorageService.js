/**
 * IStorageService.js
 * 
 * Storage service interface for dependency injection.
 * Abstracts the underlying storage mechanism (IndexedDB, localStorage, etc.)
 */

/**
 * Storage service interface
 * @interface
 */
export class IStorageService {
  /**
   * Get an item from storage
   * @param {string} key - Storage key
   * @returns {Promise<any>} The stored value or null if not found
   */
  async getItem(key) {
    throw new Error('Method not implemented');
  }

  /**
   * Set an item in storage
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   * @returns {Promise<void>}
   */
  async setItem(key, value) {
    throw new Error('Method not implemented');
  }

  /**
   * Remove an item from storage
   * @param {string} key - Storage key
   * @returns {Promise<void>}
   */
  async removeItem(key) {
    throw new Error('Method not implemented');
  }

  /**
   * Clear all items from storage
   * @returns {Promise<void>}
   */
  async clear() {
    throw new Error('Method not implemented');
  }

  /**
   * Check if a key exists in storage
   * @param {string} key - Storage key
   * @returns {Promise<boolean>}
   */
  async hasItem(key) {
    throw new Error('Method not implemented');
  }

  /**
   * Get all keys in storage
   * @returns {Promise<string[]>}
   */
  async keys() {
    throw new Error('Method not implemented');
  }
}
