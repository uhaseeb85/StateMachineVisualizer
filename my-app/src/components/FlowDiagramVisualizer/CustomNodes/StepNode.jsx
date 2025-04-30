/**
 * StepNode.jsx
 * 
 * This file defines a custom node component for use in the ReactFlow diagram.
 * It represents steps in the flow diagram and handles displaying step information,
 * screenshots, and provides interactive features like image navigation and zooming.
 */

import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { ChevronLeft, ChevronRight, X, Download } from 'lucide-react';

/**
 * StepNode Component
 * 
 * A custom node type for ReactFlow that displays step information with screenshots.
 * Supports multiple features:
 * - Multiple image display with navigation
 * - Image zoom modal
 * - Download functionality
 * - Different styling based on node type (root, parent, child)
 * - Captions for screenshots
 * 
 * @param {Object} props - Component props
 * @param {Object} props.data - Node data containing label, type, and image information
 * @param {string} props.data.label - Display text for the node
 * @param {string} props.data.type - Type of node (root, parent, child, default)
 * @param {Array} props.data.imageUrls - Array of image URLs to display
 * @param {Array} props.data.imageCaptions - Array of captions for images
 * @param {boolean} props.isConnectable - Whether the node can be connected to other nodes
 * @returns {React.ReactElement} The rendered node component
 */
const StepNode = ({ data, isConnectable }) => {
  const { label, type, imageUrls = [], imageCaptions = [] } = data;
  // Track the currently displayed image in the carousel
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // Control visibility of the image zoom modal
  const [showZoomModal, setShowZoomModal] = useState(false);
  
  // Handle backward compatibility with older data format (single imageUrl)
  const images = Array.isArray(imageUrls) ? imageUrls : 
                (data.imageUrl ? [data.imageUrl] : []);
  
  // Ensure captions array matches images array length
  const captions = Array.isArray(imageCaptions) ? imageCaptions :
                  (imageCaptions ? [imageCaptions] : Array(images.length).fill(''));
  
  const hasImages = images.length > 0;
  const hasMultipleImages = images.length > 1;
  
  /**
   * Navigate to the next image in the carousel
   * @param {Event} e - Click event
   */
  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };
  
  /**
   * Navigate to the previous image in the carousel
   * @param {Event} e - Click event
   */
  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };
  
  /**
   * Open the modal to display the current image at full size
   * @param {Event} e - Click event
   */
  const openZoomModal = (e) => {
    e.stopPropagation();
    setShowZoomModal(true);
  };
  
  /**
   * Close the zoom modal
   * @param {Event} e - Click event
   */
  const closeZoomModal = (e) => {
    if (e) e.stopPropagation();
    setShowZoomModal(false);
  };

  /**
   * Download the currently displayed image
   * Uses the caption as filename if available
   * @param {Event} e - Click event
   */
  const downloadImage = (e) => {
    e.stopPropagation();
    
    // Get current image URL
    const imageUrl = images[currentImageIndex];
    if (!imageUrl) return;
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = imageUrl;
    
    // Create a filename from caption or default name
    const caption = captions[currentImageIndex] || '';
    const fileName = caption ? 
      `${caption.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png` : 
      `screenshot_${currentImageIndex + 1}.png`;
    
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  /**
   * Get styling for the node based on its type
   * Different node types have different visual appearances:
   * - root: Blue (primary step)
   * - parent: Purple (has child steps)
   * - child: White with border (sub-step)
   * - default: Light gray
   * 
   * @returns {Object} CSS style object
   */
  const getNodeStyle = () => {
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

  // Get caption for the currently displayed image
  const currentCaption = captions[currentImageIndex] || '';

  return (
    <>
      {/* Main node container */}
      <div
        className="rounded-md flex flex-col overflow-hidden"
        style={{
          ...getNodeStyle(),
          width: '100%',
          height: '100%',
        }}
      >
        {/* Connection point at the top of the node (for incoming connections) */}
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
          className="w-2 h-2"
        />
        
        {/* Node content container */}
        <div className="p-3 flex-1 flex flex-col">
          {/* Node label (step name) */}
          <div className="font-medium text-center mb-1 overflow-hidden" style={{ 
            wordWrap: 'break-word', 
            hyphens: 'auto',
            maxHeight: '60px',  // Allow for more vertical space
            overflowY: 'auto'   // Add scrolling for very long names
          }}>
            {label}
          </div>
          
          {/* Image display section */}
          {hasImages && (
            <div className="flex-1 overflow-hidden rounded-sm relative">
              {/* Main image */}
              <img 
                src={images[currentImageIndex]} 
                alt={currentCaption || `${label} - Screenshot ${currentImageIndex + 1}`} 
                className="w-full h-full object-cover cursor-pointer"
                style={{ maxHeight: '120px' }}
                onClick={openZoomModal}
              />
              
              {/* Caption overlay for the current image */}
              {currentCaption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 truncate">
                  {currentCaption}
                </div>
              )}
              
              {/* Image counter indicator (e.g., "1/3") */}
              {hasMultipleImages && (
                <div 
                  className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded-full"
                >
                  {currentImageIndex + 1}/{images.length}
                </div>
              )}
              
              {/* Left/right navigation buttons for image carousel */}
              {hasMultipleImages && (
                <>
                  <button 
                    className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-0.5 rounded-r-md"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button 
                    className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-0.5 rounded-l-md"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        
        {/* Connection point at the bottom of the node (for outgoing connections) */}
        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={isConnectable}
          className="w-2 h-2"
        />
      </div>
      
      {/* Zoom Modal - Displayed when an image is clicked */}
      {showZoomModal && hasImages && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={closeZoomModal}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg p-2 max-w-[90%] max-h-[90%] relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button 
              className="absolute top-2 right-2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full z-10"
              onClick={closeZoomModal}
            >
              <X className="h-4 w-4" />
            </button>
            
            {/* Download button */}
            <button 
              className="absolute top-2 left-2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full z-10"
              onClick={downloadImage}
            >
              <Download className="h-4 w-4" />
            </button>
            
            {/* Full-size image container */}
            <div className="overflow-auto max-h-[80vh] flex items-center justify-center">
              <img 
                src={images[currentImageIndex]} 
                alt={currentCaption || `${label} - Screenshot ${currentImageIndex + 1}`} 
                className="max-w-full max-h-[80vh] object-contain"
              />
            </div>
            
            {/* Caption display */}
            {currentCaption && (
              <div className="py-2 px-3 text-sm text-center">
                {currentCaption}
              </div>
            )}
            
            {/* Navigation controls for zoom modal */}
            {hasMultipleImages && (
              <div className="flex justify-center items-center mt-2 gap-2">
                <button 
                  className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 p-2 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage(e);
                  }}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-sm">
                  {currentImageIndex + 1} / {images.length}
                </span>
                <button 
                  className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 p-2 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage(e);
                  }}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

// Memoize the component to prevent unnecessary re-renders in the ReactFlow canvas
export default memo(StepNode); 