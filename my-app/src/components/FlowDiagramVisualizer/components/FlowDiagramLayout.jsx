/**
 * Flow Diagram Layout Component
 * Main layout and coordination component
 * 
 * SOLID Principle: Single Responsibility - Layout and modal orchestration only
 */
import { useState } from 'react';
import PropTypes from 'prop-types';
import { Toaster } from 'sonner';
import { useFlowDiagramContext } from '../context/FlowDiagramContext';
import useModalManager from '../hooks/useModalManager';
import TopActionBar from '../TopActionBar';
import StepPanel from '../StepPanel';
import ModalsContainer from './ModalsContainer';
import LoadingSpinner from './LoadingSpinner';
import SaveNotification from './SaveNotification';

/**
 * Main layout component for Flow Diagram Visualizer
 * Coordinates between different UI sections and modals
 */
const FlowDiagramLayout = ({ onChangeMode }) => {
  const context = useFlowDiagramContext();
  
  // Modal management (cleaner than 8 separate useState calls)
  const modals = useModalManager([
    'simulation',
    'pathFinder',
    'unconnectedSteps',
    'assumptionsQuestions',
    'actionHistory',
    'comparer',
    'stepDictionary',
  ]);

  // Export dialog state
  const [exportDialog, setExportDialog] = useState({
    isOpen: false,
    fileName: '',
  });

  /**
   * Handle export button click
   */
  const handleExportClick = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    let defaultName;
    
    if (context.currentFileName) {
      const baseNameWithoutVersion = context.currentFileName.replace(
        /_v\d{4}-\d{2}-\d{2}(?:_v\d{4}-\d{2}-\d{2})*/g,
        ''
      );
      defaultName = `${baseNameWithoutVersion}_v${timestamp}`;
    } else {
      defaultName = `flow_diagram_${timestamp}`;
    }
    
    setExportDialog({
      isOpen: true,
      fileName: defaultName,
    });
  };

  /**
   * Confirm export with user
-specified filename
   */
  const confirmExport = () => {
    if (exportDialog.fileName.trim()) {
      context.exportData(exportDialog.fileName.trim());
      setExportDialog({ isOpen: false, fileName: '' });
    }
  };

  // Loading state
  if (context.isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200 relative">
      {/* Toast notifications */}
      <Toaster richColors />

      {/* Save success notification */}
      <SaveNotification show={context.showSaveNotification} />

      {/* Main content container */}
      <div className="container mx-auto p-4 max-w-full min-h-screen 
                    bg-gradient-to-br from-blue-50 via-gray-50 to-indigo-50
                    dark:from-gray-900 dark:via-gray-800 dark:to-slate-900">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-3xl font-light text-gray-900 dark:text-gray-100 mb-5 tracking-wide">
            Flow Diagram Builder
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Design • Visualize • Test
          </p>
        </div>

        {/* Action bar */}
        <TopActionBar
          onChangeMode={onChangeMode}
          onSimulate={() => modals.openModal('simulation')}
          onFindPath={() => modals.openModal('pathFinder')}
          onShowMissingConnections={() => modals.openModal('unconnectedSteps')}
          onShowAllAssumptionsQuestions={() => modals.openModal('assumptionsQuestions')}
          onShowActionHistory={() => modals.openModal('actionHistory')}
          onShowComparer={() => modals.openModal('comparer')}
          onShowStepDictionary={() => modals.openModal('stepDictionary')}
          actionHistoryCount={context.getEventCount()}
          onClear={context.clearAll}
          onImport={context.importData}
          onExport={handleExportClick}
          onSave={context.saveFlow}
          onUndo={context.undo}
          onRedo={context.redo}
          canUndo={context.canUndo}
          canRedo={context.canRedo}
          steps={context.steps}
          connections={context.connections}
          currentFileName={context.currentFileName}
          onUpdateStep={context.updateStep}
          classificationRules={context.classificationRules}
          onUpdateClassificationRules={context.updateClassificationRules}
          dictionaryHook={context.dictionaryHook}
        />

        {/* Step panel */}
        <div className="mt-8 bg-background rounded-xl border shadow-sm">
          <StepPanel
            steps={context.steps}
            connections={context.connections}
            onAddStep={context.addStep}
            onUpdateStep={context.updateStep}
            onRemoveStep={context.removeStep}
            onAddConnection={context.addConnection}
            onRemoveConnection={context.removeConnection}
            onSave={context.saveFlow}
            dictionaryHook={context.dictionaryHook}
          />
        </div>

        {/* All modals */}
        <ModalsContainer
          modals={modals}
          exportDialog={{
            isOpen: exportDialog.isOpen,
            fileName: exportDialog.fileName,
            setFileName: (name) => setExportDialog(prev => ({ ...prev, fileName: name })),
            confirm: confirmExport,
            close: () => setExportDialog({ isOpen: false, fileName: '' }),
          }}
        />
      </div>
    </div>
  );
};

FlowDiagramLayout.propTypes = {
  onChangeMode: PropTypes.func.isRequired,
};

export default FlowDiagramLayout;
