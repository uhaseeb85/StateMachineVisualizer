/**
 * Generic modal state management hook
 * Manages visibility state for multiple modals
 * 
 * SOLID Principle: Single Responsibility - Only manages modal visibility
 * Open/Closed Principle: Works with any set of modal names
 */
import { useState, useCallback, useMemo } from 'react';

/**
 * Hook for managing multiple modal states
 * @param {Array<string>} modalNames - Array of modal names to manage
 * @returns {Object} Modal management methods
 */
export const useModalManager = (modalNames = []) => {
  // Initialize state with all modals closed
  const [openModals, setOpenModals] = useState(() =>
    modalNames.reduce((acc, name) => ({ ...acc, [name]: false }), {})
  );

  /**
   * Open a specific modal
   * @param {string} modalName - Name of modal to open
   */
  const openModal = useCallback((modalName) => {
    setOpenModals(prev => ({ ...prev, [modalName]: true }));
  }, []);

  /**
   * Close a specific modal
   * @param {string} modalName - Name of modal to close
   */
  const closeModal = useCallback((modalName) => {
    setOpenModals(prev => ({ ...prev, [modalName]: false }));
  }, []);

  /**
   * Toggle a specific modal's visibility
   * @param {string} modalName - Name of modal to toggle
   */
  const toggleModal = useCallback((modalName) => {
    setOpenModals(prev => ({ ...prev, [modalName]: !prev[modalName] }));
  }, []);

  /**
   * Check if a modal is open
   * @param {string} modalName - Name of modal to check
   * @returns {boolean} True if modal is open
   */
  const isOpen = useCallback((modalName) => {
    return openModals[modalName] || false;
  }, [openModals]);

  /**
   * Close all modals
   */
  const closeAll = useCallback(() => {
    setOpenModals(prev => 
      Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {})
    );
  }, []);

  /**
   * Open multiple modals at once
   * @param {Array<string>} modalNames - Array of modal names to open
   */
  const openMultiple = useCallback((modalNamesToOpen) => {
    setOpenModals(prev => {
      const updates = modalNamesToOpen.reduce(
        (acc, name) => ({ ...acc, [name]: true }),
        {}
      );
      return { ...prev, ...updates };
    });
  }, []);

  /**
   * Get count of currently open modals
   */
  const openCount = useMemo(() => {
    return Object.values(openModals).filter(Boolean).length;
  }, [openModals]);

  /**
   * Get list of currently open modal names
   */
  const openModalNames = useMemo(() => {
    return Object.entries(openModals)
      .filter(([, isOpen]) => isOpen)
      .map(([name]) => name);
  }, [openModals]);

  return {
    // Primary actions
    openModal,
    closeModal,
    toggleModal,
    isOpen,
    
    // Batch actions
    closeAll,
    openMultiple,
    
    // State info
    openCount,
    openModalNames,
    allClosed: openCount === 0,
    
    // Raw state (for advanced use)
    modalStates: openModals,
  };
};

export default useModalManager;
