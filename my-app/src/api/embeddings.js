/**
 * Embeddings Service for Client-Side RAG
 * 
 * Handles generating and storing text embeddings for vector search
 * using Transformers.js from Xenova.
 */

import { pipeline } from '@xenova/transformers';
import localforage from 'localforage';

// Initialize storage for embeddings
const embeddingStore = localforage.createInstance({
  name: 'logAnalyzerEmbeddings'
});

// Basic vector operations
const vectorOperations = {
  dotProduct: (a, b) => {
    return a.reduce((sum, val, i) => sum + val * b[i], 0);
  },
  magnitude: (vector) => {
    return Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  },
  cosineSimilarity: (a, b) => {
    const dotProduct = vectorOperations.dotProduct(a, b);
    const magnitudeA = vectorOperations.magnitude(a);
    const magnitudeB = vectorOperations.magnitude(b);
    return dotProduct / (magnitudeA * magnitudeB);
  }
};

class EmbeddingService {
  constructor() {
    this.embeddingModel = null;
    this.isModelLoaded = false;
    this.modelName = 'Xenova/all-MiniLM-L6-v2'; // Small and effective embedding model
    this.progressCallback = null;
    this.fallbackEmbeddingEnabled = false;
    this.localModelPath = '/models/embedding/'; // Path to bundled model
  }

  /**
   * Initialize the embedding model
   * @param {function} progressCallback - Callback for loading progress
   */
  async initialize(progressCallback = null) {
    this.progressCallback = progressCallback;
    
    try {
      if (progressCallback) {
        progressCallback({
          progress: 0.1,
          text: 'Preparing to download embedding model...'
        });
      }

      // Attempt to use local model first
      const useLocalModel = true; // Always prefer local model
      
      if (useLocalModel) {
        if (progressCallback) {
          progressCallback({
            progress: 0.15,
            text: 'Using locally bundled embedding model...'
          });
        }
      }

      // Custom pipeline options
      const pipelineOptions = {
        quantized: false, // Try without quantization to avoid JSON parse errors
        local_files_only: useLocalModel,
        model_path: useLocalModel ? this.localModelPath : undefined,
        progress_callback: (progress) => {
          if (progressCallback) {
            // Adjust progress to reflect download phase (20-80% of total progress)
            const scaledProgress = 0.2 + (progress.progress * 0.6);
            let progressText = 'Downloading embedding model...';
            
            if (progress.progress >= 0.9) {
              progressText = 'Finalizing embedding model setup...';
            } else if (progress.progress >= 0.5) {
              progressText = 'Processing embedding model weights...';
            }
            
            progressCallback({
              progress: scaledProgress,
              text: progressText
            });
          }
        }
      };

      // Try with a timeout to detect stalled downloads
      this.embeddingModel = await Promise.race([
        pipeline('feature-extraction', this.modelName, pipelineOptions),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Embedding model download timed out')), 30000);
        })
      ]);
      
      this.isModelLoaded = true;
      
      if (progressCallback) {
        progressCallback({
          progress: 1.0,
          text: 'Embedding model loaded successfully'
        });
      }
      
      return true;
    } catch (error) {
      console.error('Failed to initialize embedding model:', error);
      
      // If there's a JSON parse error or any other error, use the fallback
      return this.enableFallbackEmbedding(progressCallback);
    }
  }

  /**
   * Enable fallback embedding method
   * @param {function} progressCallback - Callback for progress updates
   * @returns {boolean} - Success indicator
   */
  enableFallbackEmbedding(progressCallback) {
    // Already enabled
    if (this.fallbackEmbeddingEnabled) {
      return true;
    }
    
    this.fallbackEmbeddingEnabled = true;
    
    if (progressCallback) {
      progressCallback({
        progress: 0.5,
        text: 'Using simplified fallback embeddings due to connection issues'
      });
    }
    
    // We'll just mark as loaded and use the fallback method
    this.isModelLoaded = true;
    
    if (progressCallback) {
      progressCallback({
        progress: 1.0,
        text: 'Fallback embedding initialized'
      });
    }
    
    return true;
  }

  /**
   * Test connection to the model server
   */
  async testConnection() {
    try {
      // First try a simple fetch to see if we can reach Hugging Face
      const response = await fetch('https://huggingface.co/api/ping', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        mode: 'cors',
        cache: 'no-cache',
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        timeout: 5000,
      });
      
      if (!response.ok) {
        console.warn(`Connection test failed with status: ${response.status}`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.warn('Connection test failed:', error);
      return false;
    }
  }

  /**
   * Generate embeddings for a text string
   * @param {string} text - Text to embed
   * @returns {Promise<Array>} - Embedding vector
   */
  async generateEmbedding(text) {
    if (!this.isModelLoaded) {
      throw new Error('Embedding model not loaded. Call initialize() first.');
    }
    
    try {
      // If using fallback method
      if (this.fallbackEmbeddingEnabled) {
        return this.generateSimpleEmbedding(text);
      }
      
      const result = await this.embeddingModel(text, {
        pooling: 'mean',
        normalize: true
      });
      
      // Extract the embedding vector from the output
      return Array.from(result.data);
    } catch (error) {
      console.error('Failed to generate embedding, using fallback:', error);
      
      // Enable fallback for all future calls
      this.fallbackEmbeddingEnabled = true;
      
      // Use fallback method if the model fails
      return this.generateSimpleEmbedding(text);
    }
  }

  /**
   * Generate a simple embedding vector as fallback
   * @param {string} text - Text to embed
   * @returns {Array} - Simple embedding vector
   */
  generateSimpleEmbedding(text) {
    // This is a very basic embedding approach - not for production
    // But it will work for simple log analysis cases
    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    const uniqueWords = [...new Set(words)];
    const vector = new Array(384).fill(0); // Match MiniLM dimension
    
    // Simple word hashing to generate vector
    uniqueWords.forEach(word => {
      const hash = [...word].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 384, 0);
      vector[hash] += 1;
    });
    
    // Normalize the vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map(val => val / (magnitude || 1));
  }

  /**
   * Split text into chunks for embedding
   * @param {string} text - Full text to split
   * @param {number} maxChunkSize - Maximum chunk size
   * @param {number} overlap - Number of characters to overlap
   * @returns {Array<Object>} - Array of chunk objects
   */
  chunkText(text, maxChunkSize = 512, overlap = 100) {
    const chunks = [];
    const lines = text.split('\n');
    let currentChunk = '';
    let chunkIndex = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // If adding this line would exceed max size, store chunk and start new one
      if (currentChunk.length + line.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push({
          id: `chunk-${chunkIndex}`,
          text: currentChunk,
          startLine: i - Math.ceil(currentChunk.split('\n').length),
          endLine: i,
        });
        
        // Determine text to keep for overlap
        const words = currentChunk.split(' ');
        let overlapText = '';
        let overlapSize = 0;
        
        // Take words from the end until we reach the overlap size
        for (let j = words.length - 1; j >= 0; j--) {
          if (overlapSize + words[j].length > overlap) break;
          overlapText = words[j] + ' ' + overlapText;
          overlapSize += words[j].length + 1;
        }
        
        currentChunk = overlapText;
        chunkIndex++;
      }
      
      currentChunk += (currentChunk ? '\n' : '') + line;
    }
    
    // Add the last chunk if there's any remaining text
    if (currentChunk.length > 0) {
      chunks.push({
        id: `chunk-${chunkIndex}`,
        text: currentChunk,
        startLine: lines.length - currentChunk.split('\n').length,
        endLine: lines.length,
      });
    }
    
    return chunks;
  }

  /**
   * Process a document and store its chunks with embeddings
   * @param {string} documentId - Unique document identifier
   * @param {string} text - Document text
   * @returns {Promise<boolean>} - Success indicator
   */
  async processAndStoreDocument(documentId, text) {
    if (!this.isModelLoaded) {
      await this.initialize();
    }
    
    // Get chunks
    const chunks = this.chunkText(text);
    const embeddedChunks = [];
    
    // Generate embeddings for each chunk
    for (const chunk of chunks) {
      const embedding = await this.generateEmbedding(chunk.text);
      embeddedChunks.push({
        ...chunk,
        embedding
      });
      
      // Report progress through callback if provided
      if (this.progressCallback) {
        const progress = 0.8 + (0.2 * (embeddedChunks.length / chunks.length));
        this.progressCallback({
          progress: Math.min(progress, 0.99),
          text: `Processing log chunks: ${embeddedChunks.length}/${chunks.length}`
        });
      }
    }
    
    // Store embedded chunks
    await embeddingStore.setItem(documentId, embeddedChunks);
    
    // Report complete
    if (this.progressCallback) {
      this.progressCallback({
        progress: 1.0,
        text: 'Document processing complete'
      });
    }
    
    return true;
  }

  /**
   * Perform semantic search against stored embeddings
   * @param {string} query - Search query
   * @param {number} topK - Number of results to return
   * @returns {Promise<Array>} - Ranked search results
   */
  async semanticSearch(query, topK = 3) {
    if (!this.isModelLoaded) {
      throw new Error('Embedding model not loaded. Call initialize() first.');
    }
    
    try {
      // Get query embedding
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Get all documents from store
      const keys = await embeddingStore.keys();
      let allChunks = [];
      
      for (const key of keys) {
        const documentChunks = await embeddingStore.getItem(key);
        allChunks = allChunks.concat(documentChunks);
      }
      
      // Calculate similarity scores
      const scoredChunks = allChunks.map(chunk => {
        const similarity = vectorOperations.cosineSimilarity(queryEmbedding, chunk.embedding);
        return {
          ...chunk,
          similarity
        };
      });
      
      // Sort by similarity and get top K
      return scoredChunks
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);
    } catch (error) {
      console.error('Semantic search error:', error);
      throw error;
    }
  }

  /**
   * Clear all embeddings from storage
   */
  async clearAllEmbeddings() {
    await embeddingStore.clear();
  }
}

// Export singleton instance
const embeddingService = new EmbeddingService();
export default embeddingService; 