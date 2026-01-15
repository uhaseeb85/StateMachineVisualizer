/**
 * Storage Wrapper using localforage (IndexedDB)
 * 
 * Provides a localStorage-like API but uses IndexedDB for much larger storage capacity
 * - localStorage: 5-10MB quota
 * - IndexedDB: ~50GB+ quota
 * 
 * Features:
 * - Automatic migration from localStorage to IndexedDB
 * - Support for storing Blobs directly (no base64 encoding needed)
 * - Backward compatible API
 * - Storage usage monitoring
 */

import localforage from 'localforage';
import { toast } from 'sonner';

// Configure localforage for the Flow Diagram Visualizer
const flowDiagramStore = localforage.createInstance({
  name: 'FlowDiagramVisualizer',
  storeName: 'flowdiagrams',
  description: 'Storage for flow diagram data, history, and images'
});

// Initialize localforage and ensure it's ready
let isReady = false;
const readyPromise = flowDiagramStore.ready().then(() => {
  isReady = true;
  console.log('IndexedDB storage initialized successfully');
  return true;
}).catch((error) => {
  console.error('Error initializing IndexedDB:', error);
  toast.error('Storage initialization failed. Some features may not work properly.');
  throw error;
});

/**
 * Ensure storage is ready before operations
 * @returns {Promise<void>}
 */
const ensureReady = async () => {
  if (!isReady) {
    console.log('[Storage] Waiting for localforage to be ready...');
    await readyPromise;
    console.log('[Storage] localforage is now ready');
  }
};

/**
 * Check if a key exists in localStorage (for migration)
 * @param {string} key - Key to check
 * @returns {boolean}
 */
const existsInLocalStorage = (key) => {
  return localStorage.getItem(key) !== null;
};

/**
 * Migrate a single key from localStorage to IndexedDB
 * @param {string} key - Key to migrate
 * @returns {Promise<boolean>} True if migrated successfully
 */
export const migrateKeyFromLocalStorage = async (key) => {
  try {
    await ensureReady();
    
    // Check if already migrated
    const existsInIndexedDB = await flowDiagramStore.getItem(key);
    if (existsInIndexedDB !== null) {
      // Already migrated, clean up localStorage
      localStorage.removeItem(key);
      return false;
    }

    // Get from localStorage
    const value = localStorage.getItem(key);
    if (value === null) {
      return false; // Doesn't exist in localStorage
    }

    // Parse if it's JSON
    let parsedValue;
    try {
      parsedValue = JSON.parse(value);
    } catch {
      parsedValue = value; // Store as string if not JSON
    }

    // Save to IndexedDB
    await flowDiagramStore.setItem(key, parsedValue);
    
    // Remove from localStorage after successful migration
    localStorage.removeItem(key);
    
    console.log(`Migrated ${key} from localStorage to IndexedDB`);
    return true;
  } catch (error) {
    console.error(`Error migrating ${key}:`, error);
    return false;
  }
};

/**
 * Migrate all relevant data from localStorage to IndexedDB
 * Should be called once on app initialization
 * @returns {Promise<number>} Number of keys migrated
 */
export const migrateFromLocalStorage = async () => {
  await ensureReady();
  
  const keysToMigrate = [
    'flowDiagramData',
    'flowDiagramData_currentFileName',
    'flowDiagramActionHistory',
    'ivrFlow',
    'stateMachineCurrentFileName',
    'darkMode',
    'theme',
    'splunkConfig',
    'visualizer_mode'
  ];

  // Also check for dynamic keys
  const allLocalStorageKeys = Object.keys(localStorage);
  allLocalStorageKeys.forEach(key => {
    if (key.startsWith('importedCSV_') || key.startsWith('changeLog_')) {
      keysToMigrate.push(key);
    }
  });

  let migratedCount = 0;
  
  for (const key of keysToMigrate) {
    const migrated = await migrateKeyFromLocalStorage(key);
    if (migrated) {
      migratedCount++;
    }
  }

  if (migratedCount > 0) {
    console.log(`Migration complete: ${migratedCount} keys migrated to IndexedDB`);
    toast.success(`Migrated ${migratedCount} data items to enhanced storage`);
  }

  return migratedCount;
};

/**
 * Get an item from storage
 * @param {string} key - Storage key
 * @returns {Promise<any>} Stored value or null
 */
export const getItem = async (key) => {
  try {
    await ensureReady();
    console.log(`[Storage] Getting item: ${key}`);
    const value = await flowDiagramStore.getItem(key);
    console.log(`[Storage] Got item ${key}:`, value ? 'found' : 'null');
    return value;
  } catch (error) {
    console.error(`Error getting ${key} from storage:`, error);
    return null;
  }
};

/**
 * Set an item in storage
 * @param {string} key - Storage key
 * @param {any} value - Value to store (can be object, string, Blob, etc.)
 * @returns {Promise<boolean>} True if successful
 */
export const setItem = async (key, value) => {
  try {
    await ensureReady();
    await flowDiagramStore.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Error setting ${key} in storage:`, error);
    
    // Check if it's a quota error (unlikely with IndexedDB but possible)
    if (error.name === 'QuotaExceededError') {
      toast.error('Storage quota exceeded! Please clear some data.');
    } else {
      toast.error(`Failed to save: ${error.message}`);
    }
    
    return false;
  }
};

/**
 * Remove an item from storage
 * @param {string} key - Storage key
 * @returns {Promise<boolean>} True if successful
 */
export const removeItem = async (key) => {
  try {
    await ensureReady();
    await flowDiagramStore.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing ${key} from storage:`, error);
    return false;
  }
};

/**
 * Clear all items from storage
 * @returns {Promise<boolean>} True if successful
 */
export const clear = async () => {
  try {
    await ensureReady();
    await flowDiagramStore.clear();
    toast.success('All data cleared from storage');
    return true;
  } catch (error) {
    console.error('Error clearing storage:', error);
    toast.error('Failed to clear storage');
    return false;
  }
};

/**
 * Get all keys in storage
 * @returns {Promise<string[]>} Array of keys
 */
export const keys = async () => {
  try {
    await ensureReady();
    return await flowDiagramStore.keys();
  } catch (error) {
    console.error('Error getting storage keys:', error);
    return [];
  }
};

/**
 * Get storage usage estimate
 * Note: IndexedDB doesn't provide exact size, this is an estimate
 * @returns {Promise<{usage: number, quota: number, percentage: number}>}
 */
export const getStorageEstimate = async () => {
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
        percentage: estimate.quota ? Math.round((estimate.usage / estimate.quota) * 100) : 0
      };
    }
    
    // Fallback if API not available
    return {
      usage: 0,
      quota: 50 * 1024 * 1024 * 1024, // Assume 50GB
      percentage: 0
    };
  } catch (error) {
    console.error('Error getting storage estimate:', error);
    return {
      usage: 0,
      quota: 50 * 1024 * 1024 * 1024,
      percentage: 0
    };
  }
};

/**
 * Get formatted storage usage string
 * @returns {Promise<string>} Human-readable storage usage
 */
export const getFormattedStorageUsage = async () => {
  const { usage, quota, percentage } = await getStorageEstimate();
  
  const usageMB = (usage / (1024 * 1024)).toFixed(2);
  const quotaGB = (quota / (1024 * 1024 * 1024)).toFixed(0);
  
  return `${usageMB} MB / ${quotaGB} GB (${percentage}%)`;
};

/**
 * Clear cached data (CSV imports, obsolete keys)
 * Preserves main diagram data and settings
 * @returns {Promise<number>} Number of items cleared
 */
export const clearCachedData = async () => {
  try {
    const allKeys = await keys();
    let clearedCount = 0;
    
    for (const key of allKeys) {
      // Remove CSV import caches
      if (key === 'lastImportedCSV' || key.startsWith('importedCSV_')) {
        await removeItem(key);
        clearedCount++;
      }
      // Remove legacy flow state
      else if (key === 'flowState') {
        await removeItem(key);
        clearedCount++;
      }
    }
    
    if (clearedCount > 0) {
      console.log(`Cleared ${clearedCount} cached items from storage`);
      toast.success(`Cleared ${clearedCount} cached data item(s)`);
    } else {
      toast.info('No cached data to clear');
    }
    
    return clearedCount;
  } catch (error) {
    console.error('Error clearing cached data:', error);
    toast.error('Failed to clear cached data');
    return 0;
  }
};

/**
 * Convert base64 data URL to Blob
 * @param {string} dataUrl - Base64 data URL
 * @returns {Blob|null} Blob object or null if invalid
 */
export const dataUrlToBlob = (dataUrl) => {
  try {
    if (!dataUrl || !dataUrl.startsWith('data:')) {
      return null;
    }
    
    const parts = dataUrl.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1];
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new Blob([u8arr], { type: mime });
  } catch (error) {
    console.error('Error converting data URL to Blob:', error);
    return null;
  }
};

/**
 * Convert Blob to data URL
 * @param {Blob} blob - Blob object
 * @returns {Promise<string>} Data URL
 */
export const blobToDataUrl = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Export the store instance for advanced usage
export { flowDiagramStore };

// Default export with all functions
export default {
  getItem,
  setItem,
  removeItem,
  clear,
  keys,
  migrateFromLocalStorage,
  migrateKeyFromLocalStorage,
  getStorageEstimate,
  getFormattedStorageUsage,
  clearCachedData,
  dataUrlToBlob,
  blobToDataUrl,
  flowDiagramStore
};
