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

/**
 * @param {string} storageKey - Key used for localStorage persistence
 * @returns {Object} Flow diagram management methods and state
 */
const useFlowDiagram = (storageKey) => {
  // State for managing steps and their connections in the flow diagram
  const [steps, setSteps] = useState([]);
  const [connections, setConnections] = useState([]);
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  
  // State for managing file history
  const [currentFileName, setCurrentFileName] = useState('Untitled');
  const [fileHistory, setFileHistory] = useState([]);
  const MAX_HISTORY_SIZE = 10;

  /**
   * Effect hook to load saved diagram data from localStorage on component mount
   * and when storageKey changes
   */
  useEffect(() => {
    console.log('Loading data from storage key:', storageKey);
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      try {
        const { steps: savedSteps, connections: savedConnections } = JSON.parse(savedData);
        console.log('Loaded steps:', savedSteps);
        console.log('Loaded connections:', savedConnections);
        setSteps(savedSteps);
        setConnections(savedConnections);
      } catch (error) {
        console.error('Error loading saved data:', error);
        // Initialize with empty arrays if there's an error
        setSteps([]);
        setConnections([]);
      }
    }

    // Load file history from localStorage
    const savedHistory = localStorage.getItem('flowDiagramFileHistory');
    if (savedHistory) {
      try {
        setFileHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error loading file history:', error);
        setFileHistory([]);
      }
    }
  }, [storageKey]);

  /**
   * Updates the file history with a new filename
   * @param {string} fileName - Name of the file to add to history
   */
  const updateFileHistory = (fileName) => {
    if (!fileName) return;
    
    setFileHistory(prev => {
      // Remove the fileName if it already exists
      const filtered = prev.filter(name => name !== fileName);
      
      // Add the new fileName at the beginning
      const updated = [fileName, ...filtered].slice(0, MAX_HISTORY_SIZE);
      
      // Save to localStorage
      localStorage.setItem('flowDiagramFileHistory', JSON.stringify(updated));
      
      return updated;
    });
    
    setCurrentFileName(fileName);
  };

  /**
   * Removes a file from history if it's missing or deleted
   * @param {string} fileName - Name of the file to remove from history
   */
  const removeFileFromHistory = (fileName) => {
    setFileHistory(prev => {
      const updated = prev.filter(name => name !== fileName);
      localStorage.setItem('flowDiagramFileHistory', JSON.stringify(updated));
      return updated;
    });
    
    toast.error(`File "${fileName}" is no longer available.`);
  };

  /**
   * Checks if a file exists in localStorage
   * @param {string} fileName - Name of the file to check
   * @returns {boolean} True if the file exists, false otherwise
   */
  const checkFileExists = (fileName) => {
    const fileKey = `flowDiagram_${fileName}`;
    return localStorage.getItem(fileKey) !== null;
  };

  /**
   * Loads a file from history
   * @param {string} fileName - Name of the file to load
   * @returns {boolean} True if the file was loaded successfully, false otherwise
   */
  const loadFileFromHistory = (fileName) => {
    // First check if the file exists
    if (!checkFileExists(fileName)) {
      removeFileFromHistory(fileName);
      return false;
    }
    
    const fileKey = `flowDiagram_${fileName}`;
    const savedData = localStorage.getItem(fileKey);
    
    if (savedData) {
      try {
        const { steps: savedSteps, connections: savedConnections } = JSON.parse(savedData);
        setSteps(savedSteps);
        setConnections(savedConnections);
        setCurrentFileName(fileName);
        updateFileHistory(fileName);
        toast.success(`Loaded "${fileName}"`);
        return true;
      } catch (error) {
        console.error('Error loading file:', error);
        toast.error(`Error loading file: ${error.message}`);
        return false;
      }
    }
    
    return false;
  };

  /**
   * Saves the current flow diagram state to localStorage
   * Shows a success notification upon completion
   * @param {string} [fileName] - Optional file name for saving
   */
  const saveFlow = (fileName = currentFileName) => {
    console.log('Saving flow diagram data as:', fileName);
    
    if (fileName !== currentFileName) {
      setCurrentFileName(fileName);
    }
    
    updateFileHistory(fileName);
    
    const fileKey = `flowDiagram_${fileName}`;
    localStorage.setItem(fileKey, JSON.stringify({ steps, connections }));
    localStorage.setItem(storageKey, JSON.stringify({ steps, connections }));
    
    setShowSaveNotification(true);
    setTimeout(() => setShowSaveNotification(false), 2000);
    toast.success(`Flow diagram saved as "${fileName}"`);
  };

  /**
   * Adds a new step to the flow diagram
   * @param {Object} stepData - Data for the new step
   * @param {string} stepData.name - Name of the step
   * @param {string} [stepData.description] - Description of the step
   * @param {Object} [stepData.position] - Position coordinates {x, y}
   * @returns {string} ID of the newly created step
   */
  const addStep = (stepData) => {
    console.log('Adding new step:', stepData);
    const newStep = {
      id: uuidv4(),
      ...stepData,
      position: stepData.position || { x: 0, y: 0 },
    };
    console.log('Created step with ID:', newStep.id);
    
    let newStepId;
    setSteps((prev) => {
      const newSteps = [...prev, newStep];
      console.log('Updated steps array:', newSteps);
      
      // Save to localStorage after adding a step
      try {
        localStorage.setItem(storageKey, JSON.stringify({ steps: newSteps, connections }));
        console.log('Successfully saved to localStorage after adding step');
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
      
      return newSteps;
    });
    
    return newStep.id;
  };

  /**
   * Updates an existing step's properties
   * @param {string} id - ID of the step to update
   * @param {Object} updates - Object containing properties to update
   */
  const updateStep = (id, updates) => {
    console.log('useFlowDiagram.updateStep called with:', { id, updates });
    
    // Validate inputs
    if (!id || !updates) {
      console.error('Invalid id or updates:', { id, updates });
      return;
    }

    setSteps((prev) => {
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

      // Save to localStorage after update
      try {
        localStorage.setItem(storageKey, JSON.stringify({ steps: newSteps, connections }));
        console.log('Successfully saved to localStorage');
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }

      return newSteps;
    });
  };

  /**
   * Removes a step and all its associated connections from the diagram
   * @param {string} id - ID of the step to remove
   */
  const removeStep = (id) => {
    console.log('Removing step:', id);
    
    setSteps((prevSteps) => {
      const newSteps = prevSteps.filter((step) => step.id !== id);
      
      // First update connections (remove any that reference this step)
      const newConnections = connections.filter(
        (conn) => conn.fromStepId !== id && conn.toStepId !== id
      );
      
      // Update connections state in the next tick
      setTimeout(() => {
        setConnections(newConnections);
      }, 0);
      
      // Save to localStorage after removing a step and its connections
      try {
        localStorage.setItem(storageKey, JSON.stringify({ 
          steps: newSteps, 
          connections: newConnections 
        }));
        console.log('Successfully saved to localStorage after removing step and connections');
      } catch (error) {
        console.error('Error saving to localStorage:', error);
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
   * @returns {boolean} True if connection was added, false if it already exists
   */
  const addConnection = (fromStepId, toStepId, type) => {
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
      console.log('Previous connections count:', prev.length);
      const newConnections = [...prev, newConnection];
      console.log('New connections count:', newConnections.length);
      
      // Save to localStorage after adding a connection
      try {
        localStorage.setItem(storageKey, JSON.stringify({ steps, connections: newConnections }));
        console.log('Successfully saved to localStorage after adding connection');
      } catch (error) {
        console.error('Error saving to localStorage:', error);
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
   */
  const removeConnection = (fromStepId, toStepId, type) => {
    console.log('Removing connection:', { fromStepId, toStepId, type });
    setConnections((prev) => {
      const newConnections = prev.filter(
        (conn) =>
          !(
            conn.fromStepId === fromStepId &&
            conn.toStepId === toStepId &&
            conn.type === type
          )
      );
      
      // Save to localStorage after removing a connection
      try {
        localStorage.setItem(storageKey, JSON.stringify({ steps, connections: newConnections }));
        console.log('Successfully saved to localStorage after removing connection');
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
      
      return newConnections;
    });
  };

  /**
   * Clears all steps and connections from the diagram
   */
  const clearAll = () => {
    console.log('Clearing all data');
    
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
  };

  /**
   * Exports the flow diagram data to a ZIP file that contains:
   * - data.json: All step and connection information
   * - images/: Directory containing all uploaded images
   */
  const exportData = async () => {
    try {
      // Create a new zip file
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
      saveAs(zipBlob, "flow_diagram_export.zip");
      
      toast.success("Flow diagram exported successfully");
    } catch (error) {
      console.error('Error exporting flow diagram:', error);
      toast.error('Error exporting flow diagram: ' + error.message);
    }
  };

  /**
   * Imports flow diagram data from a ZIP file
   * Handles extraction of image files and restoring the flow structure
   * @param {File} file - ZIP file to import
   * @returns {Promise} Resolves when import is complete
   */
  const importData = async (file) => {
    console.log('Starting import of file:', file.name);
    try {
      // Validate file type
      if (!file.name.endsWith('.zip') && !file.name.endsWith('.csv')) {
        throw new Error('Please upload a ZIP or CSV file.');
      }
      
      // Get the file name without extension for history
      const fileName = file.name.split('.')[0] || 'Imported Flow';
      
      // Handle legacy CSV import
      if (file.name.endsWith('.csv')) {
        const result = await importLegacyCsvData(file);
        if (result) {
          updateFileHistory(fileName);
          setCurrentFileName(fileName);
          saveFlow(fileName);
        }
        return result;
      }
      
      // Extract the zip file
      const zip = new JSZip();
      const zipContents = await zip.loadAsync(file);
      
      // Check for data.json
      const dataFile = zipContents.file("data.json");
      if (!dataFile) {
        throw new Error('Invalid export file: Missing data.json');
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
      
      // Update the flow diagram
      setSteps(processedSteps);
      setConnections(flowData.connections || []);
      
      // Update file history and current file name
      updateFileHistory(fileName);
      setCurrentFileName(fileName);
      saveFlow(fileName);
      
      toast.success(`Imported ${processedSteps.length} steps and ${(flowData.connections || []).length} connections`);
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

            setSteps(newSteps);
            setConnections(newConnections);
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

  // Return the hook's public interface
  return {
    steps,
    connections,
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
    // New file history functionality
    currentFileName,
    fileHistory,
    loadFileFromHistory,
    checkFileExists,
    removeFileFromHistory
  };
};

export default useFlowDiagram; 