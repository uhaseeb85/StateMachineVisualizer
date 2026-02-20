/**
 * Flow Diagram Context
 * Provides flow diagram state and operations to all child components
 * 
 * SOLID Principle: Dependency Inversion - Components depend on context, not implementation
 * Single Responsibility - Only provides state, doesn't manage it directly
 */
import { createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import useFlowDiagram from '../hooks/useFlowDiagram';
import useStepDictionary from '../hooks/useStepDictionary';

/**
 * Context for flow diagram state and operations
 */
const FlowDiagramContext = createContext(null);

/**
 * Provider component that wraps the application
 * Initializes and provides all flow diagram functionality
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @param {string} [props.storageKey='flowDiagramData'] - Storage key for persistence
 */
export const FlowDiagramProvider = ({ children, storageKey = 'flowDiagramData' }) => {
  // Initialize main flow diagram hook
  const flowDiagram = useFlowDiagram(storageKey);
  
  // Initialize step dictionary hook
  const stepDictionary = useStepDictionary();

  // Combine all functionality into single context value
  const value = {
    // Flow diagram state and operations
    ...flowDiagram,
    
    // Step dictionary (maintained separately for reusability)
    dictionaryHook: stepDictionary,
    stepDictionary: stepDictionary, // Alias for clearer naming
  };

  return (
    <FlowDiagramContext.Provider value={value}>
      {children}
    </FlowDiagramContext.Provider>
  );
};

FlowDiagramProvider.propTypes = {
  children: PropTypes.node.isRequired,
  storageKey: PropTypes.string,
};

/**
 * Hook to access flow diagram context
 * Throws error if used outside provider (fail-fast principle)
 * 
 * @returns {Object} Flow diagram context value
 * @throws {Error} If used outside FlowDiagramProvider
 */
export const useFlowDiagramContext = () => {
  const context = useContext(FlowDiagramContext);
  
  if (!context) {
    throw new Error(
      'useFlowDiagramContext must be used within FlowDiagramProvider. ' +
      'Wrap your component tree with <FlowDiagramProvider>.'
    );
  }
  
  return context;
};

/**
 * Higher-order component that provides flow diagram context
 * Useful for class components or special wrapping scenarios
 * 
 * @param {React.Component} Component - Component to wrap
 * @returns {React.Component} Wrapped component with context as props
 */
export const withFlowDiagramContext = (Component) => {
  const WrappedComponent = (props) => {
    const context = useFlowDiagramContext();
    return <Component {...props} flowDiagram={context} />;
  };
  
  WrappedComponent.displayName = `withFlowDiagramContext(${Component.displayName || Component.name || 'Component'})`;
  
  return WrappedComponent;
};

export default FlowDiagramContext;
