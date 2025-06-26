/**
 * ConversationView Component
 * Renders audio transcriptions in a conversation format with speaker identification
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Headphones, 
  AlertTriangle 
} from 'lucide-react';
import { DEMO_CONVERSATION } from '../../constants';

const ConversationView = ({ transcription, showDemo = false }) => {
  // Use demo conversation if no transcription provided or in demo mode
  const conversation = showDemo || !transcription ? DEMO_CONVERSATION : parseTranscription(transcription);

  return (
    <div className="space-y-3">
      {conversation.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`flex gap-3 ${item.speaker === 'Customer' ? 'flex-row-reverse' : ''}`}
        >
          <SpeakerAvatar speaker={item.speaker} />
          <MessageBubble 
            speaker={item.speaker}
            message={item.message}
            timestamp={item.timestamp}
            suspicious={item.suspicious}
          />
        </motion.div>
      ))}
    </div>
  );
};

/**
 * Speaker Avatar Component
 */
const SpeakerAvatar = ({ speaker }) => {
  const isAgent = speaker === 'Agent';
  
  return (
    <div className={`p-2 rounded-full ${
      isAgent ? 'bg-blue-500/20' : 'bg-green-500/20'
    }`}>
      {isAgent ? (
        <Headphones className="w-4 h-4 text-blue-400" />
      ) : (
        <User className="w-4 h-4 text-green-400" />
      )}
    </div>
  );
};

/**
 * Message Bubble Component
 */
const MessageBubble = ({ speaker, message, timestamp, suspicious }) => {
  const isAgent = speaker === 'Agent';
  const isCustomer = speaker === 'Customer';
  
  return (
    <div className={`flex-1 max-w-md ${isCustomer ? 'text-right' : ''}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-medium text-white">{speaker}</span>
        <span className="text-xs text-gray-400">{timestamp}</span>
        {suspicious && (
          <AlertTriangle className="w-3 h-3 text-red-400" />
        )}
      </div>
      <div className={`p-3 rounded-lg ${
        isAgent 
          ? 'bg-blue-500/10 border border-blue-500/30' 
          : 'bg-green-500/10 border border-green-500/30'
      } ${suspicious ? 'ring-1 ring-red-500/50' : ''}`}>
        <p className="text-white text-sm">{message}</p>
        {suspicious && (
          <SuspiciousIndicator />
        )}
      </div>
    </div>
  );
};

/**
 * Suspicious Activity Indicator
 */
const SuspiciousIndicator = () => (
  <div className="mt-2 flex items-center gap-1">
    <AlertTriangle className="w-3 h-3 text-red-400" />
    <span className="text-xs text-red-400">Suspicious phrase detected</span>
  </div>
);

/**
 * Parse raw transcription text into conversation format
 * This is a fallback for non-demo transcriptions
 */
const parseTranscription = (transcription) => {
  if (!transcription) return [];
  
  // Try to parse structured transcription
  const lines = transcription.split('\n').filter(line => line.trim());
  
  return lines.map((line, index) => {
    // Try to extract timestamp and speaker from format like "[00:05] Speaker: message"
    const timestampMatch = line.match(/\[(\d+:\d+)\]/);
    const speakerMatch = line.match(/\]\s*([^:]+):\s*(.+)/);
    
    const timestamp = timestampMatch ? timestampMatch[1] : `00:${index.toString().padStart(2, '0')}`;
    const speaker = speakerMatch ? speakerMatch[1].trim() : (index % 2 === 0 ? 'Agent' : 'Customer');
    const message = speakerMatch ? speakerMatch[2].trim() : line.replace(/\[.*?\]\s*/, '');
    
    return {
      speaker,
      message,
      timestamp,
      suspicious: false // Could be enhanced with actual analysis
    };
  });
};

export default ConversationView; 