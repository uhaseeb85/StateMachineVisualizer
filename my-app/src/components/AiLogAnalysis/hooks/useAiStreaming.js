import { useState } from 'react';
import { toast } from 'sonner';

/**
 * Custom hook for handling AI streaming responses
 * @param {Function} addStatusLogFunc Function to add status logs 
 * @returns {Object} Streaming state and control functions
 */
const useAiStreaming = (addStatusLogFunc) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Simulates streaming response in demo mode
   * @param {string} response The complete response to stream
   * @param {Function} updateChatHistory Function to update chat history
   */
  const simulateStreamingResponse = async (response, updateChatHistory) => {
    // Ensure we have a valid response string
    if (!response || typeof response !== 'string') {
      console.error("Invalid response provided to simulateStreamingResponse:", response);
      const errorResponse = "I apologize, but I encountered an error generating a response. Please try again.";
      
      // Add error message to chat history
      updateChatHistory(prev => [...prev, {
        role: 'assistant',
        content: errorResponse,
        timestamp: new Date().toISOString(),
        isError: true
      }]);
      
      setLoading(false);
      return;
    }
    
    const safeResponse = response.trim();
    console.log("Simulating streaming response - length:", safeResponse.length);
    
    setIsStreaming(true);
    setLoading(true);
    setStreamedResponse('');
    
    try {
      // Add initial streaming message to chat history
      updateChatHistory(prev => [...prev, {
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        streaming: true
      }]);
      
      // Split into chunks with slight delays
      const chunks = Math.min(10, Math.ceil(safeResponse.length / 20)); // Adjust chunk size based on content length
      const chunkSize = Math.ceil(safeResponse.length / chunks);
      
      for (let i = 0; i < safeResponse.length; i += chunkSize) {
        if (!isStreaming) {
          console.log("Streaming was cancelled");
          break; // Stop if streaming was cancelled
        }
        
        const chunk = safeResponse.substring(i, i + chunkSize);
        
        // Short delay between chunks
        await new Promise(resolve => setTimeout(resolve, 100)); 
        
        setStreamedResponse(prev => prev + chunk);
        
        // Update the streaming message in chat history
        updateChatHistory(prev => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0 && updated[lastIndex].streaming) {
            updated[lastIndex] = {
              ...updated[lastIndex],
              content: (updated[lastIndex].content || '') + chunk
            };
          }
          return updated;
        });
      }
      
      // Mark streaming as complete
      setIsStreaming(false);
      setLoading(false);
      
      // Update the message to no longer be streaming
      updateChatHistory(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0 && updated[lastIndex].streaming) {
          updated[lastIndex] = {
            ...updated[lastIndex],
            content: safeResponse, // Ensure final content is complete
            streaming: false
          };
        }
        return updated;
      });
      
      addStatusLogFunc('Completed demo response');
    } catch (error) {
      console.error("Error in streaming simulation:", error);
      
      // Add error message to chat history
      updateChatHistory(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0 && updated[lastIndex].streaming) {
          updated[lastIndex] = {
            ...updated[lastIndex],
            content: "I apologize, but I encountered an error while generating the response. Please try again.",
            streaming: false,
            isError: true
          };
        }
        return updated;
      });
      
      setIsStreaming(false);
      setLoading(false);
      addStatusLogFunc('Error in demo response simulation', true);
    }
  };

  /**
   * Stops streaming in progress
   * @param {Function} updateChatHistory Function to update chat history
   */
  const stopStreaming = (updateChatHistory) => {
    if (isStreaming) {
      setIsStreaming(false);
      setLoading(false);
      addStatusLogFunc('Streaming response stopped by user');
      
      // Update the streaming message in chat history to mark it as no longer streaming
      updateChatHistory(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0 && updated[lastIndex].role === 'assistant' && updated[lastIndex].streaming) {
          updated[lastIndex] = {
            ...updated[lastIndex],
            streaming: false,
            content: updated[lastIndex].content + " [Stopped]"
          };
        }
        return updated;
      });
    }
  };

  return {
    isStreaming,
    setIsStreaming,
    streamedResponse,
    setStreamedResponse,
    loading,
    setLoading,
    simulateStreamingResponse,
    stopStreaming
  };
};

export default useAiStreaming; 