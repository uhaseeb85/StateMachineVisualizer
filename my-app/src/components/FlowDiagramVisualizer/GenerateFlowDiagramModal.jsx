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
} from 'reactflow';
import dagre from '@dagrejs/dagre';
import 'reactflow/dist/style.css';

const nodeWidth = 180;
const nodeHeight = 60;

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

// Helper function for the layout
const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

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

// Helper function to find all nodes connected to root
const findConnectedNodes = (rootId, allNodes, allConnections) => {
  const connectedNodes = new Set([rootId]);
  let hasNewNodes = true;

  // Keep traversing until no new nodes are found
  while (hasNewNodes) {
    hasNewNodes = false;
    allConnections.forEach(conn => {
      if (connectedNodes.has(conn.fromStepId) && !connectedNodes.has(conn.toStepId)) {
        connectedNodes.add(conn.toStepId);
        hasNewNodes = true;
      }
    });
  }

  return allNodes.filter(node => connectedNodes.has(node.id));
};

const FlowDiagramContent = ({ 
  rootElement, 
  steps, 
  connections,
  onClose 
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isGenerating, setIsGenerating] = useState(true);
  const { fitView } = useReactFlow();
  const componentRef = useRef();

  // Custom node styles based on type
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

  useEffect(() => {
    if (rootElement) {
      setIsGenerating(true);
      
      try {
        // Get only connected nodes starting from root
        const connectedSteps = findConnectedNodes(rootElement.id, steps, connections);
        
        // Create nodes from connected steps
        const flowNodes = connectedSteps.map(step => {
          const isRootNode = step.id === rootElement.id;
          const hasChildren = connectedSteps.some(s => s.parentId === step.id);
          const isChildNode = step.parentId !== null;
          
          let type = 'default';
          if (isRootNode) type = 'root';
          else if (hasChildren) type = 'parent';
          else if (isChildNode) type = 'child';
          
          return {
            id: step.id,
            type: 'default',
            data: { 
              label: step.name,
              type,
            },
            style: {
              width: nodeWidth,
              height: nodeHeight,
              padding: '8px',
              borderRadius: '8px',
              ...getNodeStyle(type),
            },
            position: { x: 0, y: 0 }, // Will be set by dagre
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
              stroke: conn.type === 'success' ? '#22c55e' : '#ef4444',
              strokeWidth: 2,
            },
          }));

        // Apply layout
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
          flowNodes,
          flowEdges
        );

        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
        setIsGenerating(false);

        // Fit view after a short delay to ensure rendering is complete
        setTimeout(() => {
          fitView({ padding: 0.2 });
        }, 100);
      } catch (err) {
        console.error('Error generating diagram:', err);
        setIsGenerating(false);
      }
    }
  }, [rootElement, steps, connections, fitView]);

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">Generating flow diagram...</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%' }} ref={componentRef}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        attributionPosition="bottom-right"
      >
        <Controls />
        <MiniMap />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
};

const GenerateFlowDiagramModal = ({ 
  isOpen, 
  onClose, 
  rootElement, 
  steps, 
  connections 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-[90%] h-[90vh] max-h-[90vh] flex flex-col">
        {/* Header */}
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
        
        {/* Content */}
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
        
        {/* Footer */}
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