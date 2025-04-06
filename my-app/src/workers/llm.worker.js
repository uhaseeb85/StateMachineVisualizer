/**
 * Web Worker for LLM operations
 * 
 * This worker handles heavy LLM operations in a separate thread
 * to avoid blocking the main UI thread.
 */

// Import dependencies
// Note: Web workers have their own context, so they need their own imports
importScripts('https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm/dist/mlc-web-llm.js');
importScripts('https://cdn.jsdelivr.net/npm/localforage@1.10.0/dist/localforage.min.js');

// Global references
let llm = null;
let isModelLoaded = false;
let systemPrompt = 'You are a helpful log analysis assistant. You help users understand their log data and identify issues.';

// Model configurations
const MODELS = {
  PHI2: {
    model: 'Phi-2',
    modelUrl: 'https://huggingface.co/mlc-ai/phi-2-onnx/resolve/main/',
    mlcUrl: 'https://models.webllm.mlc.ai/phi-2-q4f16_1-20231213-b5bec8.wasm',
    localModelPath: '/models/phi2/',
    contextLength: 2048,
  },
  TINYLLAMA: {
    model: 'TinyLlama-1.1B-Chat-v1.0',
    modelUrl: 'https://huggingface.co/mlc-ai/TinyLlama-1.1B-Chat-v1.0-onnx/resolve/main/',
    mlcUrl: 'https://models.webllm.mlc.ai/tinyllama-1.1b-chat-v1.0-q4f16_1-20240325-1ebf95.wasm',
    localModelPath: '/models/tinyllama/',
    contextLength: 2048,
  }
};

// Initialize the LLM
async function initializeLLM(options = {}) {
  try {
    const modelKey = options.modelKey || 'TINYLLAMA';
    const modelConfig = MODELS[modelKey];
    
    if (!modelConfig) {
      throw new Error(`Unknown model: ${modelKey}`);
    }
    
    // Determine model URL based on provided options
    let modelUrl;
    
    // First priority: Use local model path if specified in options
    if (options.localModelPath) {
      modelUrl = options.localModelPath;
      self.postMessage({
        type: 'progress',
        data: {
          progress: 0.05,
          text: `Using locally bundled model from ${options.localModelPath}...`
        }
      });
    }
    // Second priority: Use directUrl if set
    else if (options.directUrl) {
      modelUrl = modelConfig.mlcUrl;
      self.postMessage({
        type: 'progress',
        data: {
          progress: 0.05,
          text: 'Using direct model source from mlc.ai...'
        }
      });
    }
    // Last resort: Use model's original URL
    else {
      modelUrl = modelConfig.modelUrl;
    }
    
    // Enhanced options
    const llmOptions = {
      model: modelConfig.model,
      model_lib_url: modelUrl,
      // Improved cache settings for better reliability
      cache_dir: "/mlc-web-llm-cache",
      required_features: ["WebGPU"],
      max_prefill_seq_len: 4096,
      max_seq_len: 4096,
      max_total_seq_len: 4096,
      app_id: "web-llm-log-analyzer",
      download_concurrency: 3, // Reduce concurrency for better stability
    };
    
    // Log the configuration
    console.log("Creating LLM with options:", llmOptions);
    
    // Create LLM instance
    llm = new self.webllm.ChatModule(llmOptions);
    
    // Set progress callback
    llm.on_progress = (report) => {
      self.postMessage({
        type: 'progress',
        data: {
          progress: report.progress,
          text: `Loading model: ${Math.round(report.progress * 100)}%`
        }
      });
    };
    
    // Set error callback
    llm.on_error = (error) => {
      console.error("LLM Error:", error);
      self.postMessage({
        type: 'error',
        error: error.message || "Unknown error during model loading"
      });
    };
    
    // Load the model
    await llm.reload();
    isModelLoaded = true;
    
    self.postMessage({
      type: 'initialized',
      success: true
    });
  } catch (error) {
    console.error("LLM initialization error:", error);
    self.postMessage({
      type: 'error',
      error: `Model loading failed: ${error.message || "Unknown error"}`
    });
  }
}

// Run inference with the model
async function runInference(prompt, context = []) {
  if (!isModelLoaded) {
    self.postMessage({
      type: 'error',
      error: 'Model not loaded. Initialize first.'
    });
    return;
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
    const response = await llm.chatCompletion([
      { role: "system", content: systemPrompt },
      { role: "user", content: ragPrompt }
    ]);
    
    self.postMessage({
      type: 'inference_result',
      data: response.choices[0].message.content
    });
  } catch (error) {
    console.error("Inference error:", error);
    self.postMessage({
      type: 'error',
      error: `Inference failed: ${error.message}`
    });
  }
}

// Set system prompt
function setSystemPrompt(prompt) {
  systemPrompt = prompt;
  self.postMessage({
    type: 'system_prompt_updated'
  });
}

// Handle messages from the main thread
self.addEventListener('message', async (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'initialize':
      await initializeLLM(data);
      break;
    case 'query':
      await runInference(data.prompt, data.context);
      break;
    case 'set_system_prompt':
      setSystemPrompt(data.prompt);
      break;
    default:
      self.postMessage({
        type: 'error',
        error: `Unknown command: ${type}`
      });
  }
}); 