/**
 * Worker Service for LLM Operations
 * 
 * This service manages the lifecycle of web workers for LLM operations,
 * providing a clean interface for the rest of the application.
 */

class WorkerService {
  constructor() {
    this.llmWorker = null;
    this.callbacks = new Map();
    this.isInitialized = false;
    this.modelInfo = null;
    this.initializationAttempts = 0;
    this.maxRetries = 3;
  }

  /**
   * Initialize the LLM worker
   * @param {Object} options - Worker initialization options
   * @param {function} progressCallback - Callback for progress updates
   * @returns {Promise} - Resolves when worker is initialized
   */
  initializeLLMWorker(options = {}, progressCallback = null) {
    return new Promise((resolve, reject) => {
      try {
        // Store model info for progress reporting
        this.modelInfo = {
          modelKey: options.modelKey,
          progressCallback
        };
        
        // Create worker if not exists
        if (!this.llmWorker) {
          // First report connecting
          if (progressCallback) {
            progressCallback({
              progress: 0.01,
              text: 'Initializing WebLLM worker...'
            });
          }
          
          // Use a direct worker creation approach for better compatibility
          try {
            // Attempt to create the worker
            const workerContent = `
              importScripts('https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm/dist/mlc-web-llm.js');
              importScripts('https://cdn.jsdelivr.net/npm/localforage@1.10.0/dist/localforage.min.js');
              importScripts('${window.location.origin}/src/workers/llm.worker.js');
            `;
            const blob = new Blob([workerContent], { type: 'application/javascript' });
            this.llmWorker = new Worker(URL.createObjectURL(blob));
          } catch (error) {
            console.error("Error creating worker with blob:", error);
            // Fallback to direct script loading
            const script = document.createElement('script');
            script.src = '/src/workers/llm.worker.js';
            document.head.appendChild(script);
            this.llmWorker = new Worker('/src/workers/llm.worker.js');
          }
          
          if (progressCallback) {
            progressCallback({
              progress: 0.02,
              text: 'WebLLM worker created, establishing connection...'
            });
          }
          
          // Set up message handler
          this.llmWorker.onmessage = (event) => {
            const { type, data, error } = event.data;
            
            if (type === 'error') {
              console.warn("Worker error:", error);
              
              if (this.callbacks.has('error')) {
                this.callbacks.get('error')(error);
              }
              
              // If error during initialization, handle retries
              if (!this.isInitialized) {
                this.initializationAttempts++;
                
                if (this.initializationAttempts < this.maxRetries) {
                  // Try again with a delay
                  if (progressCallback) {
                    progressCallback({
                      progress: 0.05,
                      text: `Retrying initialization (attempt ${this.initializationAttempts + 1}/${this.maxRetries})...`
                    });
                  }
                  
                  setTimeout(() => {
                    // Use more direct URL approach on retry
                    const directOptions = {
                      ...options,
                      directUrl: true
                    };
                    this.llmWorker.postMessage({
                      type: 'initialize',
                      data: directOptions
                    });
                  }, 2000);
                  return;
                }
                
                reject(error);
              }
              return;
            }
            
            if (type === 'progress' && progressCallback) {
              // Add more context to progress messages
              let messageText = data.text;
              const progressValue = data.progress;
              
              // Enhance progress message with more context
              if (progressValue < 0.05) {
                messageText = `Downloading model configuration and tokenizer...`;
              } else if (progressValue < 0.1) {
                messageText = `Model metadata downloaded, preparing to download weights...`;
              } else if (progressValue >= 0.1 && progressValue < 0.95) {
                const pct = Math.round(progressValue * 100);
                const modelSize = options.modelKey === 'TINYLLAMA' ? '~500MB' : '~1.2GB';
                messageText = `Downloading model weights (${modelSize}): ${pct}%`;
              } else {
                messageText = `Finalizing model setup...`;
              }
              
              progressCallback({
                progress: data.progress,
                text: messageText
              });
            }
            
            if (type === 'initialized') {
              this.isInitialized = true;
              this.initializationAttempts = 0;
              
              if (progressCallback) {
                progressCallback({
                  progress: 1.0,
                  text: 'Model loaded and ready'
                });
              }
              
              resolve(true);
            }
            
            if (type === 'inference_result') {
              if (this.callbacks.has('inference_result')) {
                this.callbacks.get('inference_result')(data);
              }
            }
            
            // Call any registered callback for this message type
            if (this.callbacks.has(type)) {
              this.callbacks.get(type)(data);
            }
          };
          
          // Handle worker errors
          this.llmWorker.onerror = (error) => {
            console.error('Worker error:', error);
            if (progressCallback) {
              progressCallback({
                progress: 0,
                text: `Error in WebLLM worker: ${error.message || 'Unknown error'}`
              });
            }
            
            // Handle retry logic
            this.initializationAttempts++;
            if (this.initializationAttempts < this.maxRetries) {
              if (progressCallback) {
                progressCallback({
                  progress: 0.05,
                  text: `Retrying after error (attempt ${this.initializationAttempts + 1}/${this.maxRetries})...`
                });
              }
              
              // Try again with a delay
              setTimeout(() => {
                this.llmWorker.postMessage({
                  type: 'initialize',
                  data: options
                });
              }, 2000);
            } else {
              reject(error);
            }
          };
        }
        
        // Wait a moment before sending initialization to allow worker to fully setup
        setTimeout(() => {
          // Report that we're about to start model initialization
          if (progressCallback) {
            progressCallback({
              progress: 0.03,
              text: 'Starting WebLLM initialization...'
            });
          }
          
          // Use local model path if provided
          const finalOptions = { ...options };
          if (options.localModelPath) {
            if (progressCallback) {
              progressCallback({
                progress: 0.04,
                text: `Using locally bundled model from ${options.localModelPath}`
              });
            }
          }
          
          // Send initialization message
          this.llmWorker.postMessage({
            type: 'initialize',
            data: finalOptions
          });
        }, 500);
      } catch (error) {
        console.error('Failed to initialize LLM worker:', error);
        if (progressCallback) {
          progressCallback({
            progress: 0,
            text: `Failed to initialize WebLLM worker: ${error.message}`
          });
        }
        reject(error);
      }
    });
  }

  /**
   * Register a callback for a specific message type
   * @param {string} type - Message type
   * @param {function} callback - Callback function
   */
  on(type, callback) {
    this.callbacks.set(type, callback);
  }

  /**
   * Remove a callback
   * @param {string} type - Message type
   */
  off(type) {
    this.callbacks.delete(type);
  }

  /**
   * Run LLM inference
   * @param {string} prompt - User prompt
   * @param {Array} context - RAG context
   * @returns {Promise} - Resolves with inference result
   */
  runInference(prompt, context = []) {
    return new Promise((resolve, reject) => {
      if (!this.isInitialized) {
        reject(new Error('Worker not initialized. Call initializeLLMWorker() first.'));
        return;
      }
      
      const inferenceCallback = (result) => {
        // Cleanup the callback to avoid memory leaks
        this.off('inference_result');
        resolve(result);
      };
      
      // Register callback to receive results
      this.on('inference_result', inferenceCallback);
      
      // Register error callback
      this.on('error', (error) => {
        this.off('inference_result');
        this.off('error');
        reject(new Error(error));
      });
      
      // Send query to worker
      this.llmWorker.postMessage({
        type: 'query',
        data: {
          prompt,
          context
        }
      });
    });
  }

  /**
   * Set system prompt for the LLM
   * @param {string} prompt - System prompt
   */
  setSystemPrompt(prompt) {
    if (!this.llmWorker) {
      throw new Error('Worker not initialized');
    }
    
    this.llmWorker.postMessage({
      type: 'set_system_prompt',
      data: {
        prompt
      }
    });
  }

  /**
   * Terminate the worker
   */
  terminate() {
    if (this.llmWorker) {
      this.llmWorker.terminate();
      this.llmWorker = null;
      this.isInitialized = false;
      this.callbacks.clear();
    }
  }
}

// Export singleton instance
const workerService = new WorkerService();
export default workerService; 