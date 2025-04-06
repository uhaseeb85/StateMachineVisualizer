/**
 * LLM Service for Client-Side RAG
 * 
 * Handles loading and inference with small LLMs in the browser
 * using WebLLM/ONNX runtime.
 */

import { ChatModule } from '@mlc-ai/web-llm';
import localforage from 'localforage';

// Initialize storage for embeddings and cache
const embeddingStore = localforage.createInstance({
  name: 'logAnalyzerEmbeddings'
});

const modelCache = localforage.createInstance({
  name: 'logAnalyzerModelCache'
});

// Model configurations
const MODELS = {
  PHI2: {
    model: 'Phi-2',
    modelUrl: 'https://huggingface.co/mlc-ai/phi-2-onnx/resolve/main/',
    contextLength: 2048,
  },
  TINYLLAMA: {
    model: 'TinyLlama-1.1B-Chat-v1.0',
    modelUrl: 'https://huggingface.co/mlc-ai/TinyLlama-1.1B-Chat-v1.0-onnx/resolve/main/',
    contextLength: 2048,
  }
};

class LLMService {
  constructor() {
    this.chat = null;
    this.modelConfig = null;
    this.isModelLoaded = false;
    this.progressCallback = null;
    this.systemPrompt = 'You are a helpful log analysis assistant. You help users understand their log data and identify issues.';
  }

  /**
   * Initialize the LLM with the specified model
   * @param {string} modelKey - Key of the model to load (PHI2 or TINYLLAMA)
   * @param {function} progressCallback - Callback for model loading progress
   */
  async initialize(modelKey = 'TINYLLAMA', progressCallback = null) {
    if (!MODELS[modelKey]) {
      throw new Error(`Unknown model: ${modelKey}`);
    }
    
    this.modelConfig = MODELS[modelKey];
    this.progressCallback = progressCallback;
    
    try {
      this.chat = new ChatModule({
        model: this.modelConfig.model,
        model_lib_url: this.modelConfig.modelUrl
      });
      
      if (progressCallback) {
        this.chat.on_progress = (report) => {
          progressCallback({
            progress: report.progress,
            text: `Loading model: ${Math.round(report.progress * 100)}%`
          });
        };
      }
      
      // Initialize the model
      await this.chat.reload();
      this.isModelLoaded = true;
      
      return true;
    } catch (error) {
      console.error('Failed to initialize LLM:', error);
      throw error;
    }
  }

  /**
   * Run inference with the loaded model
   * @param {string} prompt - User prompt
   * @param {array} context - RAG context chunks
   * @returns {Promise<string>} - Model response
   */
  async query(prompt, context = []) {
    if (!this.isModelLoaded) {
      throw new Error('Model not loaded. Call initialize() first.');
    }
    
    try {
      // Create RAG prompt with context
      let ragPrompt = prompt;
      if (context && context.length > 0) {
        const contextText = context.join('\n\n');
        ragPrompt = `
I need help analyzing the following log content:

CONTEXT:
${contextText}

USER QUERY:
${prompt}

Please analyze these logs and provide insights based on the context.
`;
      }
      
      // Run inference
      const response = await this.chat.chatCompletion([
        { role: "system", content: this.systemPrompt },
        { role: "user", content: ragPrompt }
      ]);
      
      return response.choices[0].message.content;
    } catch (error) {
      console.error('LLM inference failed:', error);
      throw error;
    }
  }
  
  /**
   * Set system prompt for the chat
   * @param {string} prompt - System prompt
   */
  setSystemPrompt(prompt) {
    this.systemPrompt = prompt;
  }
  
  /**
   * Check if the model is loaded
   * @returns {boolean} - Is model loaded
   */
  isLoaded() {
    return this.isModelLoaded;
  }
}

// Singleton instance
const llmService = new LLMService();
export default llmService; 