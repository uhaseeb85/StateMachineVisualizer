/**
 * useThemeManagement.js
 * 
 * Theme management hook (SRP).
 * Separated from state machine concerns.
 */

import { useState, useEffect, useCallback } from 'react';
import { useStorage } from '../context/ServicesContext';
import { STORAGE_KEYS } from '../constants/storageKeys';

/**
 * Hook for theme management (dark/light mode)
 * @returns {Object} Theme methods and state
 */
export const useThemeManagement = () => {
  const storage = useStorage();
  const [isDarkMode, setIsDarkMode] = useState(false);

  /**
   * Load theme preference from storage on initialization
   */
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const darkModePreference = await storage.getItem(STORAGE_KEYS.DARK_MODE);
        if (darkModePreference === 'true' || darkModePreference === true) {
          setIsDarkMode(true);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
    };

    loadTheme();
  }, [storage]);

  /**
   * Apply theme to document and persist preference
   */
  useEffect(() => {
    // Apply theme class to document
    document.documentElement.classList.toggle('dark', isDarkMode);
    
    // Persist to storage
    storage.setItem(STORAGE_KEYS.DARK_MODE, isDarkMode).catch(error => {
      console.error('Error saving theme preference:', error);
    });
  }, [isDarkMode, storage]);

  /**
   * Toggle theme
   */
  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  /**
   * Set theme explicitly
   * @param {boolean} dark - True for dark mode, false for light mode
   */
  const setTheme = useCallback((dark) => {
    setIsDarkMode(dark);
  }, []);

  return {
    isDarkMode,
    toggleTheme,
    setTheme
  };
};
