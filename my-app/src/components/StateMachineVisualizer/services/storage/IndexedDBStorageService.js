/**
 * IndexedDBStorageService.js
 * 
 * Concrete implementation of IStorageService using IndexedDB.
 * Wraps the existing storageWrapper utility.
 */

import storage from '@/utils/storageWrapper';
import { IStorageService } from './IStorageService';

/**
 * IndexedDB storage service implementation
 */
export class IndexedDBStorageService extends IStorageService {
  /**
   * Get an item from IndexedDB storage
   * @param {string} key - Storage key
   * @returns {Promise<any>} The stored value or null if not found
   */
  async getItem(key) {
    try {
      return await storage.getItem(key);
    } catch (error) {
      console.error(`Error getting item from storage: ${key}`, error);
      return null;
    }
  }

  /**
   * Set an item in IndexedDB storage
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   * @returns {Promise<void>}
   */
  async setItem(key, value) {
    try {
      await storage.setItem(key, value);
    } catch (error) {
      console.error(`Error setting item in storage: ${key}`, error);
      throw error;
    }
  }

  /**
   * Remove an item from IndexedDB storage
   * @param {string} key - Storage key
   * @returns {Promise<void>}
   */
  async removeItem(key) {
    try {
      await storage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item from storage: ${key}`, error);
      throw error;
    }
  }

  /**
   * Clear all items from IndexedDB storage
   * @returns {Promise<void>}
   */
  async clear() {
    try {
      await storage.clear();
    } catch (error) {
      console.error('Error clearing storage', error);
      throw error;
    }
  }

  /**
   * Check if a key exists in IndexedDB storage
   * @param {string} key - Storage key
   * @returns {Promise<boolean>}
   */
  async hasItem(key) {
    try {
      const value = await storage.getItem(key);
      return value !== null && value !== undefined;
    } catch (error) {
      console.error(`Error checking item in storage: ${key}`, error);
      return false;
    }
  }

  /**
   * Get all keys in IndexedDB storage
   * @returns {Promise<string[]>}
   */
  async keys() {
    // Note: storageWrapper may not support this natively
    // This is a placeholder implementation
    return [];
  }
}
