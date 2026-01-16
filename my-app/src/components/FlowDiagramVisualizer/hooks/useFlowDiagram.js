/**
 * Custom hook for managing a flow diagram's state and operations.
 * Handles steps, connections, and persistence of the diagram data.
 */

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import Papa from 'papaparse';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import storage from '@/utils/storageWrapper';
import useActionHistory, { EVENT_TYPES } from './useActionHistory';

/**
 * @param {string} storageKey - Key used for IndexedDB persistence
 * @returns {Object} Flow diagram management methods and state
 */
const useFlowDiagram = (storageKey) => {
  // State for managing steps and their connections in the flow diagram
  const [steps, setSteps] = useState([]);
  const [connections, setConnections] = useState([]);
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Track the currently imported file name
  const [currentFileName, setCurrentFileName] = useState(null);

  // Initialize action history tracking
  const {
    history: actionHistory,
    addEvent: addHistoryEvent,
    clearHistory: clearActionHistory,
    exportToExcel: exportHistoryToExcel,
    getEventCount,
    filterByType,
    searchHistory
  } = useActionHistory();

  /**
   * Effect hook to load saved diagram data from IndexedDB on component mount
   */
  useEffect(() => {
    const loadData = async () => {
      console.log('[useFlowDiagram] Starting data load for key:', storageKey);
      try {
        console.log('[useFlowDiagram] Fetching saved data...');
        const savedData = await storage.getItem(storageKey);
        const savedFileName = await storage.getItem(`${storageKey}_currentFileName`);
        
        console.log('[useFlowDiagram] Saved data:', savedData);
        console.log('[useFlowDiagram] Saved filename:', savedFileName);
        
        if (savedData) {
          const { steps: savedSteps, connections: savedConnections } = savedData;
          console.log('[useFlowDiagram] Loaded steps:', savedSteps?.length || 0);
          console.log('[useFlowDiagram] Loaded connections:', savedConnections?.length || 0);
          setSteps(savedSteps || []);
          setConnections(savedConnections || []);
        } else {
          console.log('[useFlowDiagram] No saved data found, initializing empty');
          setSteps([]);
          setConnections([]);
        }
        
        if (savedFileName) {
          setCurrentFileName(savedFileName);
        }
      } catch (error) {
        console.error('[useFlowDiagram] Error loading saved data:', error);
        // Initialize with empty arrays if there's an error
        setSteps([]);
        setConnections([]);
      } finally {
        console.log('[useFlowDiagram] Setting isLoading to false');
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [storageKey]);

  /**
   * Saves the current flow diagram state to IndexedDB
   * Shows a success notification upon completion
   */
  const saveFlow = async () => {
    try {
      console.log('Saving flow diagram data');
      await storage.setItem(storageKey, { steps, connections });
      
      setShowSaveNotification(true);
      setTimeout(() => setShowSaveNotification(false), 2000);
      toast.success('Flow diagram saved');
    } catch (error) {
      console.error('Error saving flow:', error);
      toast.error('Failed to save flow diagram');
    }
  };

  /**
   * Adds a new step to the flow diagram
   * @param {Object} stepData - Data for the new step
   * @param {string} stepData.name - Name of the step
   * @param {string} [stepData.description] - Description of the step
   * @param {Object} [stepData.position] - Position coordinates {x, y}
   * @param {boolean} [skipHistory] - Skip adding to history (for restore operations)
   * @returns {string} ID of the newly created step
   */
  const addStep = (stepData, skipHistory = false) => {
    console.log('Adding new step:', stepData);
    const newStep = {
      id: uuidv4(),
      ...stepData,
      position: stepData.position || { x: 0, y: 0 },
    };
    console.log('Created step with ID:', newStep.id);
    
    setSteps((prev) => {
      const snapshotBefore = { steps: prev, connections };
      const newSteps = [...prev, newStep];
      console.log('Updated steps array:', newSteps);
      
      // Save to IndexedDB after adding a step
      storage.setItem(storageKey, { steps: newSteps, connections }).catch(error => {
        console.error('Error saving to storage:', error);
      });

      // Track in history
      if (!skipHistory) {
        addHistoryEvent(
          EVENT_TYPES.STEP_ADDED,
          `Added step "${newStep.name}"`,
          `Created new step with ID: ${newStep.id}`,
          snapshotBefore
        );
      }
      
      return newSteps;
    });
    
    return newStep.id;
  };

  /**
   * Updates an existing step's properties
   * @param {string} id - ID of the step to update
   * @param {Object} updates - Object containing properties to update
   * @param {boolean} [skipHistory] - Skip adding to history (for restore operations)
   */
  const updateStep = (id, updates, skipHistory = false) => {
    console.log('useFlowDiagram.updateStep called with:', { id, updates });
    
    // Validate inputs
    if (!id || !updates) {
      console.error('Invalid id or updates:', { id, updates });
      return;
    }

    setSteps((prev) => {
      const snapshotBefore = { steps: prev, connections };
      // Find the step to update
      const stepToUpdate = prev.find(step => step.id === id);
      if (!stepToUpdate) {
        console.error('Step not found:', id);
        return prev;
      }

      // Create new steps array with the update
      const newSteps = prev.map((step) =>
        step.id === id ? { ...step, ...updates } : step
      );

      console.log('Updating steps from:', prev, 'to:', newSteps);

      // Save to IndexedDB after update
      storage.setItem(storageKey, { steps: newSteps, connections }).catch(error => {
        console.error('Error saving to storage:', error);
      });

      // Track in history - describe what changed
      if (!skipHistory) {
        const changeDetails = Object.keys(updates)
          .map(key => {
            if (key === 'position') return null; // Skip position changes to reduce noise
            const oldValue = stepToUpdate[key];
            const newValue = updates[key];
            if (oldValue !== newValue) {
              return `Changed ${key}`;
            }
            return null;
          })
          .filter(Boolean)
          .join(', ') || 'Updated step properties';

        addHistoryEvent(
          EVENT_TYPES.STEP_UPDATED,
          `Updated step "${stepToUpdate.name}"`,
          changeDetails,
          snapshotBefore
        );
      }

      return newSteps;
    });
  };

  /**
   * Removes a step and all its associated connections from the diagram
   * @param {string} id - ID of the step to remove
   * @param {boolean} [skipHistory] - Skip adding to history (for restore operations)
   */
  const removeStep = (id, skipHistory = false) => {
    console.log('Removing step:', id);
    
    setSteps((prevSteps) => {
      const snapshotBefore = { steps: prevSteps, connections };
      const stepToRemove = prevSteps.find(step => step.id === id);
      const newSteps = prevSteps.filter((step) => step.id !== id);
      
      // First update connections (remove any that reference this step)
      const newConnections = connections.filter(
        (conn) => conn.fromStepId !== id && conn.toStepId !== id
      );
      
      // Update connections state in the next tick
      setTimeout(() => {
        setConnections(newConnections);
      }, 0);
      
      // Save to IndexedDB after removing a step and its connections
      storage.setItem(storageKey, { 
        steps: newSteps, 
        connections: newConnections 
      }).catch(error => {
        console.error('Error saving to storage:', error);
      });

      // Track in history
      if (!skipHistory && stepToRemove) {
        const removedConnections = connections.filter(
          (conn) => conn.fromStepId === id || conn.toStepId === id
        ).length;
        addHistoryEvent(
          EVENT_TYPES.STEP_DELETED,
          `Deleted step "${stepToRemove.name}"`,
          `Removed step and ${removedConnections} associated connection(s)`,
          snapshotBefore
        );
      }
      
      return newSteps;
    });
  };

  // Track last connection to prevent duplicates
  let lastConnectionRequest = {
    fromStepId: null,
    toStepId: null,
    type: null,
    timestamp: 0
  };

  /**
   * Adds a connection between two steps
   * @param {string} fromStepId - ID of the source step
   * @param {string} toStepId - ID of the target step
   * @param {string} type - Type of connection ('success' or 'failure')
   * @param {boolean} [skipHistory] - Skip adding to history (for restore operations)
   * @returns {boolean} True if connection was added, false if it already exists
   */
  const addConnection = (fromStepId, toStepId, type, skipHistory = false) => {
    console.log('useFlowDiagram.addConnection CALLED with:', { fromStepId, toStepId, type });
    
    // Safeguard against duplicate requests within 500ms
    const now = Date.now();
    if (
      lastConnectionRequest.fromStepId === fromStepId &&
      lastConnectionRequest.toStepId === toStepId &&
      lastConnectionRequest.type === type &&
      now - lastConnectionRequest.timestamp < 500
    ) {
      console.log('Ignoring duplicate connection request (within 500ms)');
      return false;
    }
    
    // Update the last request
    lastConnectionRequest = {
      fromStepId,
      toStepId,
      type,
      timestamp: now
    };
    
    // Check if connection already exists
    const exists = connections.some(
      (conn) =>
        conn.fromStepId === fromStepId &&
        conn.toStepId === toStepId &&
        conn.type === type
    );

    if (exists) {
      console.log('Connection already exists, rejecting:', { fromStepId, toStepId, type });
      toast.error('Connection already exists');
      return false;
    }

    // Add a unique ID to each connection
    const newConnection = { 
      id: uuidv4(), 
      fromStepId, 
      toStepId, 
      type 
    };
    
    console.log('Adding new connection with ID:', newConnection.id);

    setConnections((prev) => {
      const snapshotBefore = { steps, connections: prev };
      console.log('Previous connections count:', prev.length);
      const newConnections = [...prev, newConnection];
      console.log('New connections count:', newConnections.length);
      
      // Save to IndexedDB after adding a connection
      storage.setItem(storageKey, { steps, connections: newConnections }).catch(error => {
        console.error('Error saving to storage:', error);
      });

      // Track in history
      if (!skipHistory) {
        const fromStep = steps.find(s => s.id === fromStepId);
        const toStep = steps.find(s => s.id === toStepId);
        addHistoryEvent(
          EVENT_TYPES.CONNECTION_ADDED,
          `Added ${type} connection`,
          `Connected "${fromStep?.name || fromStepId}" to "${toStep?.name || toStepId}"`,
          snapshotBefore
        );
      }
      
      return newConnections;
    });
    
    // Don't show success message here - let the component handle it
    console.log('Connection added successfully');
    return true;
  };

  /**
   * Removes a specific connection between steps
   * @param {string} fromStepId - ID of the source step
   * @param {string} toStepId - ID of the target step
   * @param {string} type - Type of connection to remove
   * @param {boolean} [skipHistory] - Skip adding to history (for restore operations)
   */
  const removeConnection = (fromStepId, toStepId, type, skipHistory = false) => {
    console.log('Removing connection:', { fromStepId, toStepId, type });
    setConnections((prev) => {
      const snapshotBefore = { steps, connections: prev };
      const newConnections = prev.filter(
        (conn) =>
          !(
            conn.fromStepId === fromStepId &&
            conn.toStepId === toStepId &&
            conn.type === type
          )
      );
      
      // Save to IndexedDB after removing a connection
      storage.setItem(storageKey, { steps, connections: newConnections }).catch(error => {
        console.error('Error saving to storage:', error);
      });

      // Track in history
      if (!skipHistory) {
        const fromStep = steps.find(s => s.id === fromStepId);
        const toStep = steps.find(s => s.id === toStepId);
        addHistoryEvent(
          EVENT_TYPES.CONNECTION_DELETED,
          `Removed ${type} connection`,
          `Disconnected "${fromStep?.name || fromStepId}" from "${toStep?.name || toStepId}"`,
          snapshotBefore
        );
      }
      
      return newConnections;
    });
  };

  /**
   * Clears all steps and connections from the diagram
   * @param {boolean} [skipHistory] - Skip adding to history (for restore operations)
   */
  const clearAll = (skipHistory = false) => {
    console.log('Clearing all data');
    
    const stepCount = steps.length;
    const connectionCount = connections.length;
    const snapshotBefore = { steps, connections };
    
    // Revoke all blob URLs to prevent memory leaks
    steps.forEach(step => {
      if (step.imageUrls && step.imageUrls.length > 0) {
        step.imageUrls.forEach(url => {
          // Only revoke blob URLs (not external URLs)
          if (url && url.startsWith('blob:')) {
            try {
              URL.revokeObjectURL(url);
              console.log('Revoked blob URL:', url);
            } catch (error) {
              console.error('Error revoking blob URL:', error);
            }
          }
        });
      }
      
      // Also check the legacy imageUrl property
      if (step.imageUrl && step.imageUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(step.imageUrl);
          console.log('Revoked legacy blob URL:', step.imageUrl);
        } catch (error) {
          console.error('Error revoking legacy blob URL:', error);
        }
      }
    });
    
    setSteps([]);
    setConnections([]);

    // Track in history
    if (!skipHistory) {
      addHistoryEvent(
        EVENT_TYPES.FLOW_CLEARED,
        'Cleared all data',
        `Removed ${stepCount} step(s) and ${connectionCount} connection(s)`,
        snapshotBefore
      );
    }
  };

  /**
   * Exports the flow diagram data as JSON (if no images) or ZIP (if images exist)
   * - JSON: Simple export with all step and connection information
   * - ZIP: Contains data.json and images/ directory with uploaded images
   */
  const exportData = async (fileName = null) => {
    try {
      // Use provided filename or generate default
      const baseFileName = fileName || 'flow_diagram_export';

      // Check if any step has uploaded images (blob URLs or data URLs)
      const hasUploadedImages = steps.some(step => {
        if (!step.imageUrls || step.imageUrls.length === 0) return false;
        
        return step.imageUrls.some(imageUrl => {
          // Check for uploaded images (blob URLs or data URLs)
          return imageUrl && (
            imageUrl.startsWith('blob:') || 
            imageUrl.startsWith('data:')
          );
        });
      });
      
      // If no uploaded images, export as JSON
      if (!hasUploadedImages) {
        const flowData = {
          steps: steps,
          connections: connections
        };
        
        const jsonBlob = new Blob([JSON.stringify(flowData, null, 2)], {
          type: 'application/json'
        });
        
        saveAs(jsonBlob, `${baseFileName}.json`);
        toast.success("Flow diagram exported as JSON successfully");
        return;
      }
      
      // If images exist, export as ZIP
      const zip = new JSZip();
      
      // Create an images folder in the zip
      const imagesFolder = zip.folder("images");
      
      // Track which images we've already added to avoid duplicates
      const processedImageUrls = new Map();
      
      // Process each step to find uploaded images that need to be included
      const processImagePromises = [];
      
      // Prepare a deep copy of steps with modified image paths for the export
      const exportSteps = await Promise.all(steps.map(async (step) => {
        const stepCopy = { ...step };
        
        // Skip if no images
        if (!step.imageUrls || step.imageUrls.length === 0) {
          return stepCopy;
        }
        
        // Process each image
        stepCopy.imageUrls = await Promise.all(step.imageUrls.map(async (imageUrl, index) => {
          // Skip external URLs (keep as is)
          if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            return imageUrl;
          }
          
          // For data URLs and blob URLs (uploaded images)
          try {
            // Check if we've already processed this image
            if (processedImageUrls.has(imageUrl)) {
              return processedImageUrls.get(imageUrl);
            }
            
            // For data URLs or blob URLs, we need to fetch and store the image
            const uniqueImageName = `image_${uuidv4()}.png`;
            const imagePath = `images/${uniqueImageName}`;
            
            // Fetch the image data
            const fetchPromise = fetch(imageUrl)
              .then(response => response.blob())
              .then(blob => {
                // Add to zip
                imagesFolder.file(uniqueImageName, blob);
                
                // Remember this mapping
                processedImageUrls.set(imageUrl, imagePath);
                
                return imagePath;
              });
              
            processImagePromises.push(fetchPromise);
            
            return await fetchPromise;
          } catch (error) {
            console.error('Error processing image:', error);
            return imageUrl; // Keep original URL if there's an error
          }
        }));
        
        return stepCopy;
      }));
      
      // Wait for all image processing to complete
      await Promise.all(processImagePromises);
      
      // Prepare the data.json with all flow information
      const flowData = {
        steps: exportSteps,
        connections: connections
      };
      
      // Add the JSON data to the zip
      zip.file("data.json", JSON.stringify(flowData, null, 2));
      
      // Generate and download the zip
      const zipBlob = await zip.generateAsync({type: "blob"});
      saveAs(zipBlob, `${baseFileName}.zip`);
      
      toast.success("Flow diagram exported as ZIP successfully");
    } catch (error) {
      console.error('Error exporting flow diagram:', error);
      toast.error('Error exporting flow diagram: ' + error.message);
    }
  };

  /**
   * Imports flow diagram data from a ZIP, JSON, or CSV file
   * Handles extraction of image files and restoring the flow structure
   * @param {File} file - ZIP, JSON, or CSV file to import
   * @returns {Promise} Resolves when import is complete
   */
  const importData = async (file) => {
    console.log('Starting import of file:', file.name);
    try {
      // Track the imported filename (remove extension)
      const fileName = file.name.replace(/\.[^/.]+$/, '');
      setCurrentFileName(fileName);
      await storage.setItem(`${storageKey}_currentFileName`, fileName);

      // Validate file type
      if (!file.name.endsWith('.zip') && !file.name.endsWith('.json') && !file.name.endsWith('.csv')) {
        throw new Error('Please upload a ZIP, JSON, or CSV file.');
      }
      
      // Handle legacy CSV import
      if (file.name.endsWith('.csv')) {
        const result = await importLegacyCsvData(file);
        if (result) {
          saveFlow();
        }
        return result;
      }
      
      // Handle JSON import
      if (file.name.endsWith('.json')) {
        const jsonText = await file.text();
        const flowData = JSON.parse(jsonText);
        
        if (!flowData.steps || !Array.isArray(flowData.steps)) {
          throw new Error('Invalid JSON format: Missing steps array');
        }
        
        // For JSON imports, all image URLs should be preserved as-is
        // (they should be external URLs since JSON exports don't include uploaded images)
        const processedSteps = flowData.steps.map(step => {
          // Ensure backward compatibility
          if (step.imageUrls && step.imageUrls.length > 0 && !step.imageUrl) {
            step.imageUrl = step.imageUrls[0];
          }
          return step;
        });
        
        const snapshotBefore = { steps, connections };

        // Update the flow diagram
        setSteps(processedSteps);
        setConnections(flowData.connections || []);
        
        saveFlow();

        // Track in history
        addHistoryEvent(
          EVENT_TYPES.FLOW_IMPORTED,
          `Imported flow from ${file.name}`,
          `Loaded ${processedSteps.length} step(s) and ${(flowData.connections || []).length} connection(s) from JSON`,
          snapshotBefore
        );
        
        toast.success(`Imported ${processedSteps.length} steps and ${(flowData.connections || []).length} connections from JSON`);
        return;
      }
      
      // Handle ZIP import
      const zip = new JSZip();
      const zipContents = await zip.loadAsync(file);
      
      // Check for data.json
      const dataFile = zipContents.file("data.json");
      if (!dataFile) {
        throw new Error('Invalid ZIP file: Missing data.json');
      }
      
      // Extract the JSON data
      const jsonContent = await dataFile.async("string");
      const flowData = JSON.parse(jsonContent);
      
      if (!flowData.steps || !Array.isArray(flowData.steps)) {
        throw new Error('Invalid data format: Missing steps array');
      }
      
      // Process steps to handle image paths
      const processedSteps = await Promise.all(flowData.steps.map(async (step) => {
        // Skip if no images
        if (!step.imageUrls || step.imageUrls.length === 0) {
          return step;
        }
        
        // Process each image URL
        step.imageUrls = await Promise.all(step.imageUrls.map(async (imagePath) => {
          // External URLs remain unchanged
          if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
          }
          
          // For images stored in the zip
          if (imagePath.startsWith('images/')) {
            const imageFileName = imagePath.replace('images/', '');
            const imageFile = zipContents.file(`images/${imageFileName}`);
            
            if (!imageFile) {
              console.error(`Image file not found in zip: ${imagePath}`);
              return ''; // Return empty if image not found
            }
            
            // Extract the image and create a blob URL
            const imageBlob = await imageFile.async("blob");
            return URL.createObjectURL(imageBlob);
          }
          
          return imagePath; // Return unchanged if not recognized
        }));
        
        // For backward compatibility
        if (step.imageUrls.length > 0) {
          step.imageUrl = step.imageUrls[0];
        }
        
        return step;
      }));
      
      const snapshotBefore = { steps, connections };

      // Update the flow diagram
      setSteps(processedSteps);
      setConnections(flowData.connections || []);
      
      saveFlow();

      // Track in history
      addHistoryEvent(
        EVENT_TYPES.FLOW_IMPORTED,
        `Imported flow from ${file.name}`,
        `Loaded ${processedSteps.length} step(s) and ${(flowData.connections || []).length} connection(s) from ZIP`,
        snapshotBefore
      );
      
      toast.success(`Imported ${processedSteps.length} steps and ${(flowData.connections || []).length} connections from ZIP`);
    } catch (error) {
      console.error('Error importing flow diagram:', error);
      toast.error('Error importing file: ' + error.message);
      throw error;
    }
  };

  /**
   * Legacy method to import from CSV format
   * @param {File} file - CSV file to import
   * @returns {Promise} Resolves when import is complete
   */
  const importLegacyCsvData = (file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          try {
            console.log('Parsed CSV results:', results);
            const newSteps = [];
            const newConnections = [];
            
            if (!results.data || results.data.length === 0) {
              console.error('No data found in CSV file');
              toast.error('No data found in CSV file');
              reject(new Error('No data found in CSV file'));
              return;
            }

            // Validate CSV headers
            const requiredHeaders = ['Step ID', 'Step Name'];
            const missingHeaders = requiredHeaders.filter(header => !results.meta.fields.includes(header));
            if (missingHeaders.length > 0) {
              console.error('Missing required headers:', missingHeaders);
              toast.error(`Missing required headers: ${missingHeaders.join(', ')}`);
              reject(new Error(`Missing required headers: ${missingHeaders.join(', ')}`));
              return;
            }

            // First pass: Create all steps
            results.data.forEach((row, index) => {
              if (row['Step ID'] && row['Step Name']) {
                // Process image URLs
                let imageUrls = null;
                if (row['Image URLs']) {
                  // Check if it contains multiple images
                  if (row['Image URLs'].includes('||IMAGE_DELIMITER||')) {
                    imageUrls = row['Image URLs'].split('||IMAGE_DELIMITER||');
                  } else {
                    // Single image
                    imageUrls = [row['Image URLs']];
                  }
                }
                
                // Process image captions
                let imageCaptions = null;
                if (row['Image Captions']) {
                  // Check if it contains multiple captions
                  if (row['Image Captions'].includes('||IMAGE_DELIMITER||')) {
                    imageCaptions = row['Image Captions'].split('||IMAGE_DELIMITER||');
                  } else {
                    // Single caption
                    imageCaptions = [row['Image Captions']];
                  }
                  
                  // Ensure captions array matches images array in length
                  if (imageUrls && imageCaptions) {
                    while (imageCaptions.length < imageUrls.length) {
                      imageCaptions.push('');
                    }
                    // Trim extra captions (should not happen but just in case)
                    if (imageCaptions.length > imageUrls.length) {
                      imageCaptions = imageCaptions.slice(0, imageUrls.length);
                    }
                  }
                }
                
                const newStep = {
                  id: row['Step ID'],
                  name: row['Step Name'],
                  description: row['Description'] || '',
                  expectedResponse: row['Expected Response'] || '',
                  imageUrls: imageUrls,
                  imageUrl: imageUrls ? imageUrls[0] : null, // For backward compatibility
                  imageCaptions: imageCaptions,
                  parentId: row['Parent Step ID'] || null,
                  position: { x: 0, y: 0 } // Default position
                };
                newSteps.push(newStep);
              }
            });

            // Second pass: Create connections
            results.data.forEach((row) => {
              if (!row['Step ID']) return;

              // Add success connection if exists
              if (row['Success Step ID']) {
                // Verify target step exists
                if (newSteps.some(s => s.id === row['Success Step ID'])) {
                  newConnections.push({
                    fromStepId: row['Step ID'],
                    toStepId: row['Success Step ID'],
                    type: 'success'
                  });
                }
              }

              // Add failure connection if exists
              if (row['Failure Step ID']) {
                // Verify target step exists
                if (newSteps.some(s => s.id === row['Failure Step ID'])) {
                  newConnections.push({
                    fromStepId: row['Step ID'],
                    toStepId: row['Failure Step ID'],
                    type: 'failure'
                  });
                }
              }
            });

            // Validate parent-child relationships
            newSteps.forEach(step => {
              if (step.parentId) {
                const parentExists = newSteps.some(s => s.id === step.parentId);
                if (!parentExists) {
                  console.warn(`Parent step ${step.parentId} not found for step ${step.name}, removing parent reference`);
                  step.parentId = null;
                }
              }
            });

            if (newSteps.length === 0) {
              console.error('No valid steps found in CSV');
              toast.error('No valid steps found in CSV');
              reject(new Error('No valid steps found in CSV'));
              return;
            }

            const snapshotBefore = { steps, connections };

            setSteps(newSteps);
            setConnections(newConnections);

            // Track in history (called from parent importData function)
            addHistoryEvent(
              EVENT_TYPES.FLOW_IMPORTED,
              'Imported flow from CSV',
              `Loaded ${newSteps.length} step(s) and ${newConnections.length} connection(s)`,
              snapshotBefore
            );

            toast.success(`Imported ${newSteps.length} steps and ${newConnections.length} connections`);
            resolve();
          } catch (error) {
            console.error('Error processing import:', error);
            toast.error('Error importing file: ' + error.message);
            reject(error);
          }
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          toast.error('Error parsing CSV file');
          reject(error);
        }
      });
    });
  };

  /**
   * Restores the diagram to a previous state from history
   * @param {string} eventId - ID of the history event to restore to
   */
  const restoreFromHistory = async (eventId) => {
    const event = actionHistory.find(e => e.id === eventId);
    if (!event || !event.snapshot) {
      toast.error('Cannot restore: event not found');
      return false;
    }

    try {
      const snapshotBefore = { steps, connections };

      // Restore the snapshot
      setSteps(event.snapshot.steps);
      setConnections(event.snapshot.connections);

      // Save to IndexedDB
      await storage.setItem(storageKey, event.snapshot);

      // Add a restore event to history
      const restoreTime = new Date(event.timestamp).toLocaleString();
      addHistoryEvent(
        EVENT_TYPES.FLOW_RESTORED,
        `Restored to previous state`,
        `Restored to checkpoint from ${restoreTime}`,
        snapshotBefore
      );

      toast.success('Flow diagram restored successfully');
      return true;
    } catch (error) {
      console.error('Error restoring from history:', error);
      toast.error('Failed to restore: ' + error.message);
      return false;
    }
  };

  // Return the hook's public interface
  return {
    steps,
    connections,
    isLoading,
    addStep,
    updateStep,
    removeStep,
    addConnection,
    removeConnection,
    clearAll,
    importData,
    exportData,
    saveFlow,
    showSaveNotification,
    currentFileName,
    // Action history functionality
    actionHistory,
    clearActionHistory,
    exportHistoryToExcel,
    getEventCount,
    filterByType,
    searchHistory,
    restoreFromHistory
  };
};

export default useFlowDiagram;
