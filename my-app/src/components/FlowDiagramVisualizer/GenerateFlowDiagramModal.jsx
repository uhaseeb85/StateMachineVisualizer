/**
 * GenerateFlowDiagramModal.jsx
 * 
 * This component creates a modal that displays a visual flow diagram of the steps and connections,
 * starting from a selected root element. It uses ReactFlow for the interactive diagram rendering
 * and the dagre library for automatic graph layout.
 * 
 * The diagram represents steps as nodes and connections as edges, with different visual styles
 * applied based on node types (root, parent, child).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  getRectOfNodes,
  getTransformForBounds,
  Panel,
} from 'reactflow';
import dagre from '@dagrejs/dagre';
import StepNode from './CustomNodes/StepNode';
import 'reactflow/dist/style.css';
import { toPng } from 'html-to-image';
import { toSvg } from 'html-to-image';

// Define dimensions for nodes in the flow diagram
const nodeWidth = 405;
const nodeHeight = 90;

// Initialize the dagre graph for layout calculations
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

// Register custom node types for ReactFlow
const nodeTypes = {
  stepNode: StepNode // Use our custom StepNode component for rendering nodes
};

/**
 * Automatically layouts nodes and edges in the flow diagram using the dagre library
 * 
 * @param {Array} nodes - Array of node objects for the flow diagram
 * @param {Array} edges - Array of edge objects for the flow diagram
 * @param {string} direction - Direction of the flow ('TB' = top to bottom, 'LR' = left to right)
 * @returns {Object} Object containing the positioned nodes and edges
 */
const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  // Configure graph layout settings
  dagreGraph.setGraph({ 
    rankdir: direction,
    nodesep: 180, // Increased for wider nodes
    ranksep: 150, // Keep the same vertical spacing
    edgesep: 80, // Increased for better edge routing with wider nodes
  });

  // Add nodes to the dagre graph with their dimensions
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  // Add edges to the dagre graph
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate the layout using dagre
  dagre.layout(dagreGraph);

  // Return the nodes with calculated positions and unchanged edges
  return {
    nodes: nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - nodeWidth / 2,
          y: nodeWithPosition.y - nodeHeight / 2,
        },
      };
    }),
    edges,
  };
};

/**
 * Finds all nodes that are connected to the root node through connections
 * This ensures we only display relevant nodes in the diagram
 * 
 * @param {string} rootId - ID of the root step 
 * @param {Array} allNodes - All available steps
 * @param {Array} allConnections - All connections between steps
 * @returns {Array} Array of nodes that are connected to the root node
 */
const findConnectedNodes = (rootId, allNodes, allConnections) => {
  const connectedNodes = new Set([rootId]);
  let hasNewNodes = true;

  // Traverse the graph starting from the root node until no new nodes are found
  while (hasNewNodes) {
    hasNewNodes = false;
    allConnections.forEach(conn => {
      if (connectedNodes.has(conn.fromStepId) && !connectedNodes.has(conn.toStepId)) {
        connectedNodes.add(conn.toStepId);
        hasNewNodes = true;
      }
    });
  }

  // Return only the nodes that are connected to the root
  return allNodes.filter(node => connectedNodes.has(node.id));
};

/**
 * Helper function to download the image data URI
 * @param {string} dataUrl - The base64 encoded image data
 * @param {string} name - The desired filename for the download
 */
function downloadImage(dataUrl, name) {
  const a = document.createElement('a');
  a.setAttribute('download', name);
  a.setAttribute('href', dataUrl);
  a.click();
}

// Define image dimensions and padding for export
const imageWidth = 1920;
const imageHeight = 1080;
const imagePadding = 20; // Padding around the diagram in the exported image

/**
 * Inner content component for the flow diagram
 * Handles the actual ReactFlow diagram rendering and node/edge creation
 * 
 * @param {Object} props Component props
 * @param {Object} props.rootElement The root step to start the diagram from
 * @param {Array} props.steps All steps in the flow
 * @param {Array} props.connections All connections between steps
 * @param {Function} props.onClose Function to close the modal
 */
const FlowDiagramContent = ({ 
  rootElement, 
  steps, 
  connections,
  onClose 
}) => {
  // Use ReactFlow hooks to manage nodes and edges state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isGenerating, setIsGenerating] = useState(true);
  const [isExporting, setIsExporting] = useState(false); // New state for export loading
  const { getNodes, fitView, setViewport, screenToFlowPosition, getViewport } = useReactFlow(); // Get getNodes from useReactFlow
  const componentRef = useRef();

  /**
   * Determines the styling for a node based on its type
   * 
   * @param {string} type - Node type ('root', 'parent', 'child', or default)
   * @returns {Object} The CSS styles to apply to the node
   */
  const getNodeStyle = (type) => {
    switch (type) {
      case 'root':
        return {
          background: '#1d4ed8',
          color: 'white',
          border: '2px solid #1e40af',
          fontWeight: 'bold',
        };
      case 'parent':
        return {
          background: '#7e22ce',
          color: 'white',
          border: '2px solid #6b21a8',
        };
      case 'child':
        return {
          background: 'white',
          color: '#1f2937',
          border: '2px solid #d1d5db',
        };
      default:
        return {
          background: '#f9fafb',
          color: '#1f2937',
          border: '2px solid #d1d5db',
        };
    }
  };

  /**
   * Effect hook to generate the flow diagram when the rootElement changes
   * This transforms the steps and connections into ReactFlow nodes and edges
   */
  useEffect(() => {
    if (rootElement) {
      setIsGenerating(true);
      
      try {
        // Get only nodes connected to the root element
        const connectedSteps = findConnectedNodes(rootElement.id, steps, connections);
        
        // Create ReactFlow nodes from connected steps
        const flowNodes = connectedSteps.map(step => {
          // Determine node type for styling
          const isRootNode = step.id === rootElement.id;
          const hasChildren = connectedSteps.some(s => s.parentId === step.id);
          const isChildNode = step.parentId !== null;
          
          let type = 'default';
          if (isRootNode) type = 'root';
          else if (hasChildren) type = 'parent';
          else if (isChildNode) type = 'child';
          
          // Create the node object for ReactFlow
          return {
            id: step.id,
            type: 'stepNode', // Use our custom node type
            data: { 
              label: step.name,
              type,
            },
            style: {
              width: nodeWidth,
              height: nodeHeight, // Use fixed nodeHeight
            },
            position: { x: 0, y: 0 }, // Initial position, will be set by dagre layout
          };
        });

        // Filter connections to only include those between connected nodes
        const connectedNodeIds = new Set(connectedSteps.map(step => step.id));
        const flowEdges = connections
          .filter(conn => 
            connectedNodeIds.has(conn.fromStepId) && 
            connectedNodeIds.has(conn.toStepId)
          )
          .map(conn => ({
            id: `${conn.fromStepId}-${conn.toStepId}-${conn.type}`,
            source: conn.fromStepId,
            target: conn.toStepId,
            type: 'smoothstep',
            animated: false,
            style: {
              stroke: conn.type === 'success' ? '#22c55e' : '#ef4444', // Green for success, red for failure
              strokeWidth: 2,
            },
            // Configure edge routing for better visualization
            sourceHandle: 'bottom',
            targetHandle: 'top',
            // Options for smoother curves
            pathOptions: { 
              offset: 25,
              borderRadius: 8
            },
            markerEnd: {
              type: 'arrow', // Add arrow at the end of the edge
            },
          }));

        // Apply automatic layout with dagre
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
          flowNodes,
          flowEdges,
          'TB' // Top to Bottom direction
        );

        // Update the state with positioned nodes and edges
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
        setIsGenerating(false);
      } catch (err) {
        console.error('Error generating diagram:', err);
        setIsGenerating(false);
      }
    }
  }, [rootElement, steps, connections, setNodes, setEdges]);

  /**
   * Handles exporting the current flow diagram as a PNG image
   */
  const onExport = useCallback(() => {
    const nodes = getNodes();
    if (nodes.length === 0) {
      console.warn('No nodes to export.');
      return;
    }

    setIsExporting(true);
    
    // First fit the view properly
    fitView({
      padding: 0.2,
      includeHiddenNodes: false,
      duration: 500
    });
    
    // Create a function to perform the actual export after view is fitted
    const performExport = () => {
      // Get the react-flow container
      const reactFlowContainer = document.querySelector('.react-flow');
      
      if (!reactFlowContainer) {
        console.error('React flow container not found');
        setIsExporting(false);
        return;
      }
      
      // Hide UI elements that shouldn't be in the export
      const elementsToHide = [
        ...reactFlowContainer.querySelectorAll('.react-flow__controls'),
        ...reactFlowContainer.querySelectorAll('.react-flow__minimap'),
        ...reactFlowContainer.querySelectorAll('.react-flow__attribution'),
        ...reactFlowContainer.querySelectorAll('.export-button-container')
      ];
      
      // Store original visibility
      const originalVisibility = elementsToHide.map(el => el.style.display);
      
      // Hide elements
      elementsToHide.forEach(el => {
        el.style.display = 'none';
      });
      
      try {
        // Use the html-to-image library with the right options for this specific case
        toPng(reactFlowContainer, {
          backgroundColor: '#ffffff',
          width: reactFlowContainer.offsetWidth,
          height: reactFlowContainer.offsetHeight,
          style: {
            width: `${reactFlowContainer.offsetWidth}px`,
            height: `${reactFlowContainer.offsetHeight}px`,
          },
          pixelRatio: 2,
          quality: 1,
          cacheBust: true,
        })
        .then(dataUrl => {
          // Restore visibility of elements
          elementsToHide.forEach((el, i) => {
            el.style.display = originalVisibility[i] || '';
          });
          
          // Download the image
          downloadImage(dataUrl, `flow-diagram-${rootElement?.name || 'export'}.png`);
          setIsExporting(false);
        })
        .catch(error => {
          console.error('Export failed:', error);
          
          // Restore visibility even on error
          elementsToHide.forEach((el, i) => {
            el.style.display = originalVisibility[i] || '';
          });
          
          setIsExporting(false);
          window.alert('Failed to export the diagram. Please try again.');
        });
      } catch (error) {
        console.error('Error during export preparation:', error);
        
        // Restore visibility even on error
        elementsToHide.forEach((el, i) => {
          el.style.display = originalVisibility[i] || '';
        });
        
        setIsExporting(false);
        window.alert('Failed to export the diagram. Please try again.');
      }
    };
    
    // Wait for fitView to complete
    setTimeout(performExport, 600);
  }, [getNodes, rootElement?.name, fitView]);

  // Show loading indicator while generating the diagram
  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">Generating flow diagram...</p>
      </div>
    );
  }

  // Render the ReactFlow diagram
  return (
    <div style={{ width: '100%', height: '100%' }} ref={componentRef}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
      >
        <Controls /> {/* Zoom and pan controls */}
        <MiniMap /> {/* Mini overview map */}
        <Background variant="dots" gap={12} size={1} /> {/* Dotted background grid */}
        
        {/* Export Button Container */}
        <div 
          className="export-button-container absolute top-4 left-4 z-50" // Moved to left side and increased z-index
        >
          <Button 
            onClick={onExport} 
            variant="default" // Changed from outline to default for more visibility
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md flex items-center gap-1" // Enhanced styling
            disabled={isExporting} // Disable button while exporting
          >
            {isExporting ? (
              <>
                <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                Exporting...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Export PNG
              </>
            )}
          </Button>
        </div>
      </ReactFlow>
    </div>
  );
};

/**
 * Main modal component that wraps the flow diagram content
 * Handles the modal display, header, and footer UI
 * 
 * @param {Object} props Component props
 * @param {boolean} props.isOpen Whether the modal is open or not
 * @param {Function} props.onClose Function to close the modal
 * @param {Object} props.rootElement The root step to start the diagram from
 * @param {Array} props.steps All steps in the flow
 * @param {Array} props.connections All connections between steps
 */
const GenerateFlowDiagramModal = ({ 
  isOpen, 
  onClose, 
  rootElement, 
  steps, 
  connections 
}) => {
  // Don't render anything if the modal is not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-[90%] h-[90vh] max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Flow Diagram: Starting from {rootElement?.name}
          </h2>
          <Button 
            variant="ghost" 
            className="h-8 w-8 p-0" 
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Modal Content - Flow Diagram */}
        <div className="flex-1 overflow-hidden relative bg-gray-50 dark:bg-gray-800" style={{ minHeight: '500px' }}>
          <ReactFlowProvider>
            <FlowDiagramContent
              rootElement={rootElement}
              steps={steps}
              connections={connections}
              onClose={onClose}
            />
          </ReactFlowProvider>
        </div>
        
        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {steps.length > 0 ? 
              `Diagram contains ${steps.length} steps and ${connections.length} connections` : ''}
          </div>
          <Button 
            onClick={onClose}
            variant="default"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

// PropTypes for component type checking
FlowDiagramContent.propTypes = {
  rootElement: PropTypes.object,
  steps: PropTypes.array.isRequired,
  connections: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
};

GenerateFlowDiagramModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  rootElement: PropTypes.object,
  steps: PropTypes.array.isRequired,
  connections: PropTypes.array.isRequired
};

export default GenerateFlowDiagramModal; 