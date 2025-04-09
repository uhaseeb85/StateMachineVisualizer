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
    if (!response) {
      console.error("Empty response provided to simulateStreamingResponse");
      toast.error("Demo response failed - empty content");
      setLoading(false);
      return;
    }
    
    const safeResponse = response;
    console.log("Simulating streaming response - length:", safeResponse.length);
    
    setIsStreaming(true);
    setLoading(true);
    setStreamedResponse('');
    
    // Add a streaming message to chat history
    const streamingMessage = {
      role: 'assistant',
      content: ' ', // Initialize with a space to avoid empty content error
      timestamp: new Date().toISOString(),
      streaming: true
    };
    
    updateChatHistory(prev => [...prev, streamingMessage]);
    
    try {
      // Split into chunks with slight delays
      const chunks = 10; // Split into 10 chunks regardless of content
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
              content: updated[lastIndex].content + chunk
            };
          }
          return updated;
        });
      }
    } catch (error) {
      console.error("Error in streaming simulation:", error);
      toast.error("Demo simulation error: " + error.message);
      
      // If streaming fails, add the full response at once as a fallback
      updateChatHistory(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0 && updated[lastIndex].streaming) {
          updated[lastIndex] = {
            ...updated[lastIndex],
            content: safeResponse,
            streaming: false
          };
        }
        return updated;
      });
    } finally {
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
            streaming: false
          };
        }
        return updated;
      });
      
      addStatusLogFunc('Completed demo response');
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