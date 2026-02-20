import { useRef } from 'react';
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Send, X, RefreshCw } from 'lucide-react';
import ChatMessage from './ChatMessage';

/**
 * Chat container component with messages and input field
 */
const ChatContainer = ({
  chatHistory,
  query,
  setQuery,
  handleQuerySubmit,
  clearResponse,
  loading,
  isStreaming,
  stopStreaming,
  demoMode
}) => {
  const chatContainerRef = useRef(null);

  return (
    <div className="flex flex-col h-full">
      {/* Chat messages container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg mb-4 overflow-y-auto p-4"
        style={{ height: "60vh", minHeight: "400px" }}
      >
        {chatHistory.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400 p-8">
              <Brain className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <p>Ask a question about your logs to get started</p>
            </div>
          </div>
        ) : (
          <div>
            {chatHistory.map((message, index) => (
              <ChatMessage key={index} message={message} index={index} />
            ))}
            {demoMode && (
              <div className="mt-2 p-2 rounded bg-amber-50 text-amber-700 text-sm">
                <p>Demo mode active - responses are simulated</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Query Input */}
      <div className="space-y-2">
        <Textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question about your logs..."
          className="min-h-[120px] resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleQuerySubmit();
            }
          }}
        />
        <div className="flex space-x-3">
          <Button 
            onClick={handleQuerySubmit}
            disabled={loading || !query.trim() || isStreaming}
            className="flex-1"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                {isStreaming ? 'Receiving response...' : 'Analyzing...'}
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send
              </>
            )}
          </Button>
          
          {isStreaming ? (
            <Button 
              variant="destructive" 
              onClick={stopStreaming}
              className="bg-red-500 hover:bg-red-600"
            >
              <X className="w-4 h-4 mr-2" />
              Stop
            </Button>
          ) : (
            <Button 
              variant="outline" 
              onClick={clearResponse}
              disabled={!query}
            >
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Press Shift+Enter for a new line. Press Enter to send.
        </p>
      </div>
    </div>
  );
};

ChatContainer.propTypes = {
  chatHistory: PropTypes.array.isRequired,
  query: PropTypes.string.isRequired,
  setQuery: PropTypes.func.isRequired,
  handleQuerySubmit: PropTypes.func.isRequired,
  clearResponse: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  isStreaming: PropTypes.bool.isRequired,
  stopStreaming: PropTypes.func.isRequired,
  demoMode: PropTypes.bool.isRequired
};

export default ChatContainer; 