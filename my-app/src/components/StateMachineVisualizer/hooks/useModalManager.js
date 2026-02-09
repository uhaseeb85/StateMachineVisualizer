/**
 * useModalManager Hook
 * 
 * Manages modal visibility state for the State Machine Visualizer.
 * Implements Interface Segregation Principle by providing focused modal state management.
 * 
 * SOLID Principles:
 * - Single Responsibility: Only manages modal visibility  
 * - Interface Segregation: Components only use modal state they need
 */

import { useState } from 'react';

/**
 * Custom hook for managing modal visibility state
 * 
 * @returns {Object} Modal state and control functions
 */
export const useModalManager = () => {
  const [showSimulation, setShowSimulation] = useState(false);
  const [showPathFinder, setShowPathFinder] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [showChangeLog, setShowChangeLog] = useState(false);
  const [showSplunkConfig, setShowSplunkConfig] = useState(false);
  const [showGraphSplitter, setShowGraphSplitter] = useState(false);
  const [showStateMachineComparer, setShowStateMachineComparer] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);

  /**
   * Opens a specific modal
   * @param {string} modalName - Name of the modal to open
   */
  const openModal = (modalName) => {
    const setters = {
      simulation: setShowSimulation,
      pathFinder: setShowPathFinder,
      userGuide: setShowUserGuide,
      changeLog: setShowChangeLog,
      splunkConfig: setShowSplunkConfig,
      graphSplitter: setShowGraphSplitter,
      stateMachineComparer: setShowStateMachineComparer,
      exportDialog: setShowExportDialog,
      importConfirm: setShowImportConfirm
    };

    const setter = setters[modalName];
    if (setter) {
      setter(true);
    }
  };

  /**
   * Closes a specific modal
   * @param {string} modalName - Name of the modal to close
   */
  const closeModal = (modalName) => {
    const setters = {
      simulation: setShowSimulation,
      pathFinder: setShowPathFinder,
      userGuide: setShowUserGuide,
      changeLog: setShowChangeLog,
      splunkConfig: setShowSplunkConfig,
      graphSplitter: setShowGraphSplitter,
      stateMachineComparer: setShowStateMachineComparer,
      exportDialog: setShowExportDialog,
      importConfirm: setShowImportConfirm
    };

    const setter = setters[modalName];
    if (setter) {
      setter(false);
    }
  };

  /**
   * Closes all modals
   */
  const closeAllModals = () => {
    setShowSimulation(false);
    setShowPathFinder(false);
    setShowUserGuide(false);
    setShowChangeLog(false);
    setShowSplunkConfig(false);
    setShowGraphSplitter(false);
    setShowStateMachineComparer(false);
    setShowExportDialog(false);
    setShowImportConfirm(false);
  };

  /**
   * Toggles a specific modal
   * @param {string} modalName - Name of the modal to toggle
   */
  const toggleModal = (modalName) => {
    const state = {
      simulation: showSimulation,
      pathFinder: showPathFinder,
      userGuide: showUserGuide,
      changeLog: showChangeLog,
      splunkConfig: showSplunkConfig,
      graphSplitter: showGraphSplitter,
      stateMachineComparer: showStateMachineComparer,
      exportDialog: showExportDialog,
      importConfirm: showImportConfirm
    };

    if (state[modalName] !== undefined) {
      state[modalName] ? closeModal(modalName) : openModal(modalName);
    }
  };

  return {
    // State
    showSimulation,
    showPathFinder,
    showUserGuide,
    showChangeLog,
    showSplunkConfig,
    showGraphSplitter,
    showStateMachineComparer,
    showExportDialog,
    showImportConfirm,

    // Setters (for direct control)
    setShowSimulation,
    setShowPathFinder,
    setShowUserGuide,
    setShowChangeLog,
    setShowSplunkConfig,
    setShowGraphSplitter,
    setShowStateMachineComparer,
    setShowExportDialog,
    setShowImportConfirm,

    // Helper functions
    openModal,
    closeModal,
    closeAllModals,
    toggleModal
  };
};

export default useModalManager;
