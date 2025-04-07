import React, { useState, useEffect } from 'react';
import { Maximize2, X, Play } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { createPortal } from 'react-dom';

const AnimatedDemo = ({ mode }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [timestamp, setTimestamp] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  const getGifUrl = () => {
    let baseUrl;
    
    if (mode === 'stateMachine') {
      baseUrl = '/assets/state-machine-demo.gif';
    } else if (mode === 'flowDiagram') {
      baseUrl = '/assets/flow-diagram-demo.gif'; 
    } else if (mode === 'aiLogAnalysis') {
      baseUrl = '/assets/ai-log-analysis-demo.gif';
    } else {
      // Default fallback
      baseUrl = '/assets/flow-diagram-demo.gif';
    }
    
    return `${baseUrl}?t=${timestamp}`;
  };

  const handleToggleSize = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isExpanded) {
      setIsLoading(true);
      setProgress(0);
      setTimestamp(Date.now());
    }
    setIsExpanded(!isExpanded);
    document.body.style.overflow = isExpanded ? 'auto' : 'hidden';
  };

  // Simulate progress while loading
  useEffect(() => {
    let progressInterval;
    if (isLoading && isExpanded) {
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);
    }
    return () => clearInterval(progressInterval);
  }, [isLoading, isExpanded]);

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isExpanded) {
        handleToggleSize();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto';
    };
  }, [isExpanded]);

  // Add styles to head
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
      @keyframes slowGif {
        0% { opacity: 1; }
        49.9% { opacity: 1; }
        50% { opacity: 0.99999; }
        100% { opacity: 1; }
      }
      .slow-gif {
        animation: slowGif steps(1) 100ms infinite;
        animation-duration: 200%;
        animation-timing-function: steps(1);
      }
    `;
    document.head.appendChild(styleSheet);
    return () => styleSheet.remove();
  }, []);

  const renderModal = () => {
    return (
      <>
        {/* Modal Backdrop */}
        <div 
          className="fixed inset-0 bg-black/95 z-[9999]"
          onClick={handleToggleSize}
        />
        
        {/* Modal Content */}
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center"
          onClick={handleToggleSize}
        >
          <div 
            className="relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <Button
              onClick={handleToggleSize}
              className="absolute -top-12 right-0 text-white hover:text-white/80 
                       bg-transparent hover:bg-white/10"
              size="icon"
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Loading Indicator */}
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-lg">
                <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-white mt-4">Loading demo...</p>
              </div>
            )}

            {/* Image */}
            <img
              src={getGifUrl()}
              alt={`${mode === 'stateMachine' 
                ? 'State Machine' 
                : mode === 'flowDiagram' 
                  ? 'Flow Diagram' 
                  : 'AI Log Analysis'} Demo`}
              className="rounded-lg shadow-2xl slow-gif"
              style={{
                maxWidth: '90vw',
                maxHeight: '85vh',
                minWidth: '1024px',
                minHeight: '720px',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain'
              }}
              onLoad={() => {
                setIsLoading(false);
                setProgress(100);
              }}
            />
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      {/* Preview Container */}
      <div className="relative w-full h-[300px] rounded-lg overflow-hidden shadow-xl group">
        <img
          src={mode === 'stateMachine' 
            ? '/assets/state-machine-demo.gif'
            : mode === 'flowDiagram'
              ? '/assets/flow-diagram-demo.gif'
              : '/assets/ai-log-analysis-demo.gif'}
          alt={`${mode === 'stateMachine' 
            ? 'State Machine' 
            : mode === 'flowDiagram' 
              ? 'Flow Diagram' 
              : 'AI Log Analysis'} Demo`}
          className="w-full h-full object-cover object-center slow-gif"
        />
        {/* Darkening overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300" />
        
        {/* Centered Play Button Container */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <Button
            onClick={handleToggleSize}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full
                     transform transition-all duration-300 hover:scale-110
                     shadow-[0_0_20px_rgba(59,130,246,0.5)]
                     flex items-center gap-3 text-lg font-medium"
            size="lg"
          >
            <Play className="w-6 h-6" />
            Watch Demo
          </Button>
        </div>

        {/* Bottom gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Bottom text */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
          <span className="text-sm font-medium opacity-80">
            Click to view full demonstration
          </span>
          <Maximize2 className="w-5 h-5 opacity-60" />
        </div>
      </div>

      {/* Render Modal using Portal */}
      {isExpanded && createPortal(renderModal(), document.body)}
    </>
  );
};

export default AnimatedDemo; 