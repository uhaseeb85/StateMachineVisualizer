import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { X, Download, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

const GenerateFlowDiagramModal = ({ 
  isOpen, 
  onClose, 
  rootElement, 
  steps, 
  connections 
}) => {
  const [generatedSteps, setGeneratedSteps] = useState([]);
  const [generatedConnections, setGeneratedConnections] = useState([]);
  const [isGenerating, setIsGenerating] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const diagramRef = useRef(null);

  // Simplified debugging to check if the diagram is being generated
  const [debug, setDebug] = useState("");

  useEffect(() => {
    if (isOpen && rootElement) {
      setIsGenerating(true);
      // Set a longer timeout to ensure the modal is fully rendered
      setTimeout(() => {
        try {
          generateFlowDiagram();
        } catch (err) {
          setDebug(`Error generating diagram: ${err.message}`);
          setIsGenerating(false);
        }
      }, 500);
    }
  }, [isOpen, rootElement]);

  // Auto-center the diagram when generated
  useEffect(() => {
    if (!isGenerating && generatedSteps.length > 0 && containerRef.current) {
      centerDiagram();
    }
  }, [isGenerating, generatedSteps]);

  // Function to center the diagram in the container
  const centerDiagram = () => {
    if (!containerRef.current || !diagramRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const diagramRect = diagramRef.current.getBoundingClientRect();
    
    // Calculate the center position
    setPan({
      x: (containerRect.width / 2) - (diagramRect.width / 2 / zoom),
      y: 100
    });
  };

  // Function to fit diagram to view
  const fitToView = () => {
    if (!containerRef.current || !diagramRef.current || generatedSteps.length === 0) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const diagramRect = diagramRef.current.getBoundingClientRect();
    
    // Calculate zoom needed to fit the diagram
    const horizontalZoom = (containerRect.width * 0.9) / diagramRect.width;
    const verticalZoom = (containerRect.height * 0.8) / diagramRect.height;
    
    // Use the smaller of the two to ensure entire diagram fits
    const newZoom = Math.min(horizontalZoom, verticalZoom, 1);
    
    setZoom(newZoom);
    
    // Center with the new zoom
    setTimeout(() => centerDiagram(), 50);
  };

  const generateFlowDiagram = () => {
    if (!rootElement || !steps.length) {
      setDebug("No root element or steps found");
      setIsGenerating(false);
      return;
    }
    
    try {
      // Start with the root element
      const startId = rootElement.id;
      
      // Track visited steps and their connections to avoid cycles
      const visited = new Set();
      const result = [];
      const relevantConnections = [];
      
      // Use a queue for breadth-first traversal
      const queue = [startId];
      
      // Add the root element to our result
      const rootStep = steps.find(step => step.id === startId);
      if (rootStep) {
        result.push(rootStep);
        visited.add(startId);
      }
      
      // Breadth-first traversal to find all reachable steps
      while (queue.length > 0) {
        const currentId = queue.shift();
        
        // Find successful and failed connections from this step
        const outgoingConnections = connections.filter(conn => conn.fromStepId === currentId);
        
        // Add these connections to our result
        outgoingConnections.forEach(conn => {
          relevantConnections.push(conn);
          
          // If we haven't visited the target step yet, add it to the queue
          if (!visited.has(conn.toStepId)) {
            visited.add(conn.toStepId);
            queue.push(conn.toStepId);
            
            // Find and add the target step to our result
            const targetStep = steps.find(step => step.id === conn.toStepId);
            if (targetStep) {
              result.push(targetStep);
            }
          }
        });
        
        // Also explore child steps and add them
        const childSteps = steps.filter(step => step.parentId === currentId);
        
        childSteps.forEach(childStep => {
          if (!visited.has(childStep.id)) {
            visited.add(childStep.id);
            queue.push(childStep.id);
            result.push(childStep);
          }
        });
      }
      
      setDebug(`Found ${result.length} steps and ${relevantConnections.length} connections`);
      setGeneratedSteps(result);
      setGeneratedConnections(relevantConnections);
      setIsGenerating(false);
    } catch (err) {
      setDebug(`Error in flow generation: ${err.message}`);
      setIsGenerating(false);
    }
  };

  // Function to get a step by its ID
  const getStepById = (id) => steps.find(step => step.id === id);

  // Function to check if a step is a child of another step
  const isChild = (step) => step.parentId !== null;

  // Handle export of generated diagram to HTML
  const handleExport = () => {
    // Generate an HTML representation of the diagram
    const nodePositions = calculateNodePositions();
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flow Diagram: ${rootElement.name}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      background-color: #f3f4f6;
      margin: 0;
      padding: 0;
    }
    .diagram-container {
      position: relative;
      margin: 20px auto;
      padding: 40px;
      overflow: auto;
      min-height: 800px;
      width: 90%;
      max-width: 1800px;
      height: 90vh;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .diagram-title {
      text-align: center;
      margin-bottom: 20px;
      color: #1f2937;
      font-size: 24px;
      font-weight: 600;
    }
    .node {
      position: absolute;
      width: 180px;
      height: 56px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      border: 2px solid;
      font-weight: 500;
      text-align: center;
      overflow: hidden;
      z-index: 2;
    }
    .node-root {
      background-color: #1d4ed8;
      color: white;
      border-color: #1e40af;
      font-weight: bold;
    }
    .node-parent {
      background-color: #7e22ce;
      color: white;
      border-color: #6b21a8;
    }
    .node-child {
      background-color: white;
      color: #1f2937;
      border-color: #d1d5db;
    }
    .node-default {
      background-color: #f9fafb;
      color: #1f2937;
      border-color: #d1d5db;
    }
    .child-indicator {
      position: absolute;
      top: 4px;
      left: 4px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: #9ca3af;
    }
    .connection {
      position: absolute;
      height: 2px;
      transform-origin: 0 0;
      z-index: 1;
    }
    .connection-success {
      background-color: #22c55e;
    }
    .connection-failure {
      background-color: #ef4444;
    }
    .connection-label {
      position: absolute;
      padding: 4px 8px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: bold;
      transform: translate(-50%, -50%);
      z-index: 2;
    }
    .label-success {
      background-color: #dcfce7;
      color: #166534;
    }
    .label-failure {
      background-color: #fee2e2;
      color: #991b1b;
    }
    .diagram-info {
      text-align: center;
      margin-top: 20px;
      color: #6b7280;
      font-size: 14px;
    }
    @media (prefers-color-scheme: dark) {
      body {
        background-color: #1f2937;
        color: #f9fafb;
      }
      .diagram-container {
        background-color: #111827;
      }
      .diagram-title {
        color: #f9fafb;
      }
      .node-child, .node-default {
        background-color: #374151;
        color: #f9fafb;
        border-color: #4b5563;
      }
    }
  </style>
</head>
<body>
  <div class="diagram-container">
    <h1 class="diagram-title">Flow Diagram: ${rootElement.name}</h1>
    
    <!-- Nodes -->
    ${generatedSteps.map(step => {
      const pos = nodePositions[step.id];
      if (!pos) return '';
      
      const isRootNode = step.id === rootElement.id;
      const hasChildren = generatedSteps.some(s => s.parentId === step.id);
      const isChildNode = isChild(step);
      
      let nodeClass = 'node ';
      if (isRootNode) {
        nodeClass += 'node-root';
      } else if (hasChildren) {
        nodeClass += 'node-parent';
      } else if (isChildNode) {
        nodeClass += 'node-child';
      } else {
        nodeClass += 'node-default';
      }
      
      return `
    <div class="${nodeClass}" style="left: ${pos.x + 500 - 90}px; top: ${pos.y + 100 - 28}px;">
      ${step.name}
      ${isChildNode ? '<div class="child-indicator"></div>' : ''}
    </div>`;
    }).join('')}
    
    <!-- Connections -->
    ${generatedConnections.map(conn => {
      const fromPos = nodePositions[conn.fromStepId];
      const toPos = nodePositions[conn.toStepId];
      
      if (!fromPos || !toPos) return '';
      
      const isSuccess = conn.type === 'success';
      const connectionClass = `connection ${isSuccess ? 'connection-success' : 'connection-failure'}`;
      const labelClass = `connection-label ${isSuccess ? 'label-success' : 'label-failure'}`;
      
      // Calculate connection properties
      const lineLength = Math.sqrt(
        Math.pow(toPos.x - fromPos.x, 2) + 
        Math.pow(toPos.y - fromPos.y, 2)
      );
      
      const angle = Math.atan2(
        toPos.y - fromPos.y,
        toPos.x - fromPos.x
      ) * 180 / Math.PI;
      
      // Calculate midpoint for label
      const midPointX = (fromPos.x + toPos.x) / 2;
      const midPointY = (fromPos.y + toPos.y) / 2;
      
      return `
    <div class="${connectionClass}" style="width: ${lineLength}px; left: ${fromPos.x + 500}px; top: ${fromPos.y + 100 + 30}px; transform: rotate(${angle}deg);"></div>
    <div class="${labelClass}" style="left: ${midPointX + 500}px; top: ${midPointY + 100}px;">
      ${isSuccess ? 'Success' : 'Failure'}
    </div>`;
    }).join('')}
    
    <div class="diagram-info">
      This diagram contains ${generatedSteps.length} steps and ${generatedConnections.length} connections.
      <br>Generated on ${new Date().toLocaleString()}
    </div>
  </div>
</body>
</html>
    `;
    
    // Create download link
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flow_diagram_${rootElement.name}.html`;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
    }, 100);
  };

  // Handle mouse down for panning
  const handleMouseDown = (e) => {
    if (e.button === 0) { // Left mouse button
      setIsDragging(true);
      setDragStart({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y
      });
    }
  };

  // Handle mouse move for panning
  const handleMouseMove = (e) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  // Handle mouse up to stop panning
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle zoom in
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  };

  // Handle zoom out
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };

  // Calculate node positions - simplified layout algorithm
  const calculateNodePositions = () => {
    if (!generatedSteps || generatedSteps.length === 0) return {};
    
    const nodeWidth = 180;
    const nodeHeight = 60;
    const horizontalGap = 100;
    const verticalGap = 80;
    
    // Organize steps into levels
    const levels = {};
    
    // First - organize by parent-child relationship and connections
    generatedSteps.forEach(step => {
      let level = 0;
      
      if (step.id === rootElement.id) {
        // Root node is always at level 0
        level = 0;
      } else if (step.parentId) {
        // Child steps go one level below their parent
        const parent = generatedSteps.find(s => s.id === step.parentId);
        level = parent ? parent._level + 1 : 1;
      } else {
        // Non-child steps that are connected to something else
        // Find if any connection points to this step
        const incomingConnection = generatedConnections.find(conn => conn.toStepId === step.id);
        if (incomingConnection) {
          const sourceStep = generatedSteps.find(s => s.id === incomingConnection.fromStepId);
          level = sourceStep ? sourceStep._level + 1 : 1;
        } else {
          level = 1; // Default level if we can't determine the relationship
        }
      }
      
      // Store level in step for easy access
      step._level = level;
      
      // Add to level organization
      if (!levels[level]) levels[level] = [];
      levels[level].push(step);
    });
    
    // Second - calculate positions based on levels
    const nodePositions = {};
    
    // Process each level
    Object.keys(levels).sort((a, b) => parseInt(a) - parseInt(b)).forEach(level => {
      const levelSteps = levels[level];
      
      // Calculate x positions for this level
      const levelWidth = levelSteps.length * nodeWidth + (levelSteps.length - 1) * horizontalGap;
      const startX = -levelWidth / 2 + nodeWidth / 2;
      
      levelSteps.forEach((step, index) => {
        const x = startX + index * (nodeWidth + horizontalGap);
        const y = parseInt(level) * (nodeHeight + verticalGap) + 50;
        
        nodePositions[step.id] = { x, y };
      });
    });
    
    return nodePositions;
  };

  if (!isOpen) return null;

  // Calculate node positions for the diagram
  const nodePositions = !isGenerating && generatedSteps.length > 0 ? calculateNodePositions() : {};

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-[90%] h-[90vh] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Flow Diagram: Starting from {rootElement.name}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleZoomIn}
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleZoomOut}
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              onClick={fitToView}
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              title="Fit to View"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button 
              onClick={handleExport}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 h-8 px-2"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
            <Button 
              variant="ghost" 
              className="h-8 w-8 p-0" 
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Content */}
        <div 
          className="flex-1 overflow-hidden relative bg-gray-50 dark:bg-gray-800"
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">Generating flow diagram...</p>
            </div>
          ) : (
            <>
              {generatedSteps.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    No steps found in the flow. Please ensure your root step has connections.
                  </p>
                  {debug && <p className="text-sm text-red-500 mt-4">{debug}</p>}
                </div>
              ) : (
                // Diagram container
                <div className="w-full h-full overflow-auto">
                  <div 
                    ref={diagramRef}
                    className="relative"
                    style={{
                      transform: `scale(${zoom})`,
                      transformOrigin: 'center top',
                      marginLeft: pan.x,
                      marginTop: pan.y,
                      minHeight: '800px',
                      minWidth: '1200px',
                      height: '100%',
                      width: '100%'
                    }}
                  >
                    {/* Draw connections as div elements */}
                    {generatedConnections.map(conn => {
                      const fromPos = nodePositions[conn.fromStepId];
                      const toPos = nodePositions[conn.toStepId];
                      
                      if (!fromPos || !toPos) return null;
                      
                      const isSuccess = conn.type === 'success';
                      const color = isSuccess ? 'bg-green-500' : 'bg-red-500';
                      
                      // Calculate straight line connection (simplification)
                      const lineLength = Math.sqrt(
                        Math.pow(toPos.x - fromPos.x, 2) + 
                        Math.pow(toPos.y - fromPos.y, 2)
                      );
                      
                      const angle = Math.atan2(
                        toPos.y - fromPos.y,
                        toPos.x - fromPos.x
                      ) * 180 / Math.PI;
                      
                      // Calculate midpoint for label
                      const midPointX = (fromPos.x + toPos.x) / 2;
                      const midPointY = (fromPos.y + toPos.y) / 2;
                      
                      return (
                        <div key={`${conn.fromStepId}-${conn.toStepId}-${conn.type}`} className="absolute pointer-events-none">
                          {/* Line */}
                          <div 
                            className={`${color} h-0.5 absolute`}
                            style={{
                              width: `${lineLength}px`,
                              left: `${fromPos.x}px`,
                              top: `${fromPos.y + 30}px`,
                              transformOrigin: '0 0',
                              transform: `rotate(${angle}deg)`,
                              zIndex: 1
                            }}
                          />
                          
                          {/* Label */}
                          <div 
                            className={`absolute px-2 py-1 rounded-full text-xs font-bold ${
                              isSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                            style={{
                              left: `${midPointX}px`,
                              top: `${midPointY}px`,
                              transform: 'translate(-50%, -50%)',
                              zIndex: 2
                            }}
                          >
                            {isSuccess ? 'Success' : 'Failure'}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Draw nodes as div elements */}
                    {generatedSteps.map(step => {
                      const pos = nodePositions[step.id];
                      if (!pos) return null;
                      
                      const isRootNode = step.id === rootElement.id;
                      const hasChildren = generatedSteps.some(s => s.parentId === step.id);
                      
                      // Different styles based on node type
                      let bgColor, textColor, borderColor;
                      
                      if (isRootNode) {
                        bgColor = 'bg-blue-700';
                        textColor = 'text-white';
                        borderColor = 'border-blue-800';
                      } else if (hasChildren) {
                        bgColor = 'bg-purple-700';
                        textColor = 'text-white';
                        borderColor = 'border-purple-800';
                      } else if (isChild(step)) {
                        bgColor = 'bg-white dark:bg-gray-700';
                        textColor = 'text-gray-900 dark:text-gray-100';
                        borderColor = 'border-gray-300 dark:border-gray-600';
                      } else {
                        bgColor = 'bg-gray-50 dark:bg-gray-800';
                        textColor = 'text-gray-900 dark:text-gray-100';
                        borderColor = 'border-gray-300 dark:border-gray-600';
                      }
                      
                      return (
                        <div 
                          key={step.id}
                          className={`absolute w-44 h-14 rounded-lg border-2 ${bgColor} ${textColor} ${borderColor} shadow-md flex flex-col items-center justify-center px-2 overflow-hidden`}
                          style={{
                            left: `${pos.x - 88}px`,
                            top: `${pos.y - 28}px`,
                            zIndex: 10
                          }}
                        >
                          <div className={`text-sm font-medium truncate w-full text-center ${isRootNode ? 'font-bold' : ''}`}>
                            {step.name}
                          </div>
                          
                          {isChild(step) && (
                            <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {!isGenerating && generatedSteps.length > 0 ? 
              `Diagram contains ${generatedSteps.length} steps and ${generatedConnections.length} connections` : ''}
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

GenerateFlowDiagramModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  rootElement: PropTypes.object,
  steps: PropTypes.array.isRequired,
  connections: PropTypes.array.isRequired
};

export default GenerateFlowDiagramModal; 