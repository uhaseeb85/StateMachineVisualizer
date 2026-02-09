/**
 * FlowDiagramVisualizer Component (Refactored with SOLID Principles)
 * 
 * NOW: Clean, focused entry point that composes providers and layout
 * BEFORE: 419 lines of modal management, state orchestration, and UI rendering
 * 
 * Improvements:
 * - Reduced from 419 lines to ~40 lines (90% reduction!)
 * - Single Responsibility: Only provides tour and context
 * - Clear separation of concerns
 * - Easy to test and maintain
 * - Ready for TypeScript migration
 */

import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { FlowDiagramProvider } from './context/FlowDiagramContext';
import FlowDiagramLayout from './components/FlowDiagramLayout';
import { TourProvider } from './TourProvider';
import { migrateFromLocalStorage } from '@/utils/storageWrapper';

/**
 * Main Flow Diagram Visualizer component
 * Provides context and tour functionality, delegates layout to child components
 * 
 * @param {Object} props
 * @param {Function} props.onChangeMode - Callback for changing application mode
 */
const FlowDiagramVisualizer = ({ onChangeMode }) => {
  /**
   * Run one-time migration from localStorage to IndexedDB on mount
   */
  useEffect(() => {
    const runMigration = async () => {
      try {
        await migrateFromLocalStorage();
      } catch (error) {
        console.error('[FlowDiagramVisualizer] Migration error:', error);
      }
    };
    runMigration();
  }, []);

  return (
    <TourProvider>
      <FlowDiagramProvider storageKey="flowDiagramData">
        <FlowDiagramLayout onChangeMode={onChangeMode} />
      </FlowDiagramProvider>
    </TourProvider>
  );
};

FlowDiagramVisualizer.propTypes = {
  onChangeMode: PropTypes.func.isRequired,
};

export default FlowDiagramVisualizer;
