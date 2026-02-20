import PropTypes from 'prop-types';

/**
 * Component for rendering a single chat message
 */
const ChatMessage = ({ message, index }) => {
  // Safety check - if message is invalid, provide fallback
  if (!message || typeof message !== 'object') {
    console.error("Invalid message object at index", index);
    return (
      <div key={`error-${index}`} className="p-2 bg-red-100 text-red-700 rounded mb-2">
        Error rendering message: Invalid data
      </div>
    );
  }
  
  const isUser = message.role === 'user';
  const content = message.content || "(No content)";  // Safe fallback for content
  const formattedTime = message.timestamp ? 
    new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
    "Unknown time";
  
  // Determine message style based on role and error state
  let messageStyleClass;
  if (isUser) {
    messageStyleClass = 'bg-blue-500 text-white rounded-tr-none';
  } else if (message.isError) {
    messageStyleClass = 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-tl-none border border-red-200 dark:border-red-800';
  } else {
    messageStyleClass = 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-none';
  }
  
  return (
    <div className={`mb-4 ${isUser ? 'text-right' : 'text-left'}`}>
      <div className={`inline-block max-w-[80%] px-4 py-3 rounded-lg border ${isUser ? 'border-blue-300' : 'border-gray-300'}
        ${messageStyleClass}`}
      >
        <div className="font-medium text-sm mb-1">
          {isUser ? 'You' : 'AI Assistant'}
        </div>
        <div className="text-sm whitespace-pre-wrap">
          {content}
          {message.streaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-blue-300 dark:bg-blue-500 animate-pulse"></span>
          )}
        </div>
        <div className={`text-xs mt-1 ${isUser ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>
          {formattedTime}
        </div>
      </div>
    </div>
  );
};

ChatMessage.propTypes = {
  message: PropTypes.shape({
    role: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    timestamp: PropTypes.string,
    streaming: PropTypes.bool,
    isError: PropTypes.bool
  }).isRequired,
  index: PropTypes.number.isRequired
};

export default ChatMessage; 