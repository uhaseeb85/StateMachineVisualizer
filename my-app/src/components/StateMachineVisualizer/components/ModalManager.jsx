/**
 * ModalManager.jsx
 * 
 * Modal visibility manager component (SRP).
 * Centralized management of all modal components.
 */

import React from 'react';
import PropTypes from 'prop-types';
import SimulationModal from '../SimulationModal';
import PathFinderModal from '../PathFinderModal';
import UserGuideModal from '../UserGuideModal';
import ChangeLog from '../ChangeLog';
import SplunkConfig from '../SplunkConfig';
import GraphSplitterModal from '../GraphSplitterModal';
import ImportConfirmModal from '../ImportConfirmModal';
import StateMachineComparer from '../StateMachineComparer';
import ExportDialog from './ExportDialog';

/**
 * Modal manager component
 * Renders all modals based on visibility state
 */
const ModalManager = ({
  // Modal visibility states
  showSimulation,
  showPathFinder,
  showUserGuide,
  showChangeLog,
  showSplunkConfig,
  showGraphSplitter,
  showStateMachineComparer,
  showExportDialog,
  showImportConfirm,
  
  // Modal close handlers
  onCloseSimulation,
  onClosePathFinder,
  onCloseUserGuide,
  onCloseChangeLog,
  onCloseSplunkConfig,
  onCloseGraphSplitter,
  onCloseStateMachineComparer,
  onCloseExportDialog,
  onCloseImportConfirm,
  
  // Modal-specific props with defaults
  simulationProps = {},
  pathFinderProps = {},
  changeLogProps = {},
  graphSplitterProps = {},
  comparerProps = {},
  exportDialogProps = {},
  importConfirmProps = {}
}) => {
  return (
    <>
      {/* Simulation Modal - conditionally rendered */}
      {showSimulation && (
        <SimulationModal
          onClose={onCloseSimulation}
          {...simulationProps}
        />
      )}

      {/* Path Finder Modal - conditionally rendered */}
      {showPathFinder && (
        <PathFinderModal
          states={pathFinderProps.states || []}
          onClose={onClosePathFinder}
        />
      )}

      {/* User Guide Modal - conditionally rendered */}
      {showUserGuide && (
        <UserGuideModal
          isOpen={showUserGuide}
          onClose={onCloseUserGuide}
        />
      )}

      {/* Change Log Modal - conditionally rendered */}
      {showChangeLog && (
        <ChangeLog
          isOpen={showChangeLog}
          onClose={onCloseChangeLog}
          {...changeLogProps}
        />
      )}

      {/* Splunk Config Modal - conditionally rendered */}
      {showSplunkConfig && (
        <SplunkConfig
          isOpen={showSplunkConfig}
          onClose={onCloseSplunkConfig}
        />
      )}

      {/* Graph Splitter Modal - conditionally rendered */}
      {showGraphSplitter && (
        <GraphSplitterModal
          isOpen={showGraphSplitter}
          onClose={onCloseGraphSplitter}
          {...graphSplitterProps}
        />
      )}

      {/* State Machine Comparer Modal - conditionally rendered */}
      {showStateMachineComparer && (
        <StateMachineComparer
          isOpen={showStateMachineComparer}
          onClose={onCloseStateMachineComparer}
          {...comparerProps}
        />
      )}

      {/* Export Dialog - conditionally rendered */}
      {showExportDialog && (
        <ExportDialog
          isOpen={showExportDialog}
          onClose={onCloseExportDialog}
          {...exportDialogProps}
        />
      )}

      {/* Import Confirm Modal - conditionally rendered */}
      {showImportConfirm && (
        <ImportConfirmModal
          isOpen={showImportConfirm}
          onClose={onCloseImportConfirm}
          {...importConfirmProps}
        />
      )}
    </>
  );
};

ModalManager.propTypes = {
  // Visibility states
  showSimulation: PropTypes.bool.isRequired,
  showPathFinder: PropTypes.bool.isRequired,
  showUserGuide: PropTypes.bool.isRequired,
  showChangeLog: PropTypes.bool.isRequired,
  showSplunkConfig: PropTypes.bool.isRequired,
  showGraphSplitter: PropTypes.bool.isRequired,
  showStateMachineComparer: PropTypes.bool.isRequired,
  showExportDialog: PropTypes.bool.isRequired,
  showImportConfirm: PropTypes.bool.isRequired,
  
  // Close handlers
  onCloseSimulation: PropTypes.func.isRequired,
  onClosePathFinder: PropTypes.func.isRequired,
  onCloseUserGuide: PropTypes.func.isRequired,
  onCloseChangeLog: PropTypes.func.isRequired,
  onCloseSplunkConfig: PropTypes.func.isRequired,
  onCloseGraphSplitter: PropTypes.func.isRequired,
  onCloseStateMachineComparer: PropTypes.func.isRequired,
  onCloseExportDialog: PropTypes.func.isRequired,
  onCloseImportConfirm: PropTypes.func.isRequired,
  
  // Modal-specific props
  simulationProps: PropTypes.object,
  pathFinderProps: PropTypes.object,
  changeLogProps: PropTypes.object,
  graphSplitterProps: PropTypes.object,
  comparerProps: PropTypes.object,
  exportDialogProps: PropTypes.object,
  importConfirmProps: PropTypes.object
};

export default ModalManager;
