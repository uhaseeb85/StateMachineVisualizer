/**
 * Custom hook for managing a flow diagram's state and operations.
 * Handles steps, connections, and persistence of the diagram data.
 */

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import Papa from 'papaparse';

/**
 * @param {string} storageKey - Key used for localStorage persistence
 * @returns {Object} Flow diagram management methods and state
 */
const useFlowDiagram = (storageKey) => {
  // State for managing steps and their connections in the flow diagram
  const [steps, setSteps] = useState([]);
  const [connections, setConnections] = useState([]);
  const [showSaveNotification, setShowSaveNotification] = useState(false);

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
  }, [storageKey]);

  /**
   * Saves the current flow diagram state to localStorage
   * Shows a success notification upon completion
   */
  const saveFlow = () => {
    console.log('Saving flow diagram data');
    localStorage.setItem(storageKey, JSON.stringify({ steps, connections }));
    setShowSaveNotification(true);
    setTimeout(() => setShowSaveNotification(false), 2000);
    toast.success('Flow diagram saved successfully');
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
    setSteps((prev) => {
      const newSteps = [...prev, newStep];
      console.log('Updated steps array:', newSteps);
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
    console.log('Updating step:', id, 'with:', updates);
    setSteps((prev) =>
      prev.map((step) =>
        step.id === id ? { ...step, ...updates } : step
      )
    );
  };

  /**
   * Removes a step and all its associated connections from the diagram
   * @param {string} id - ID of the step to remove
   */
  const removeStep = (id) => {
    console.log('Removing step:', id);
    setSteps((prev) => prev.filter((step) => step.id !== id));
    setConnections((prev) =>
      prev.filter(
        (conn) => conn.fromStepId !== id && conn.toStepId !== id
      )
    );
  };

  /**
   * Adds a connection between two steps
   * @param {string} fromStepId - ID of the source step
   * @param {string} toStepId - ID of the target step
   * @param {string} type - Type of connection ('success' or 'failure')
   * @returns {boolean} True if connection was added, false if it already exists
   */
  const addConnection = (fromStepId, toStepId, type) => {
    console.log('Adding connection:', { fromStepId, toStepId, type });
    // Check if connection already exists
    const exists = connections.some(
      (conn) =>
        conn.fromStepId === fromStepId &&
        conn.toStepId === toStepId &&
        conn.type === type
    );

    if (exists) {
      toast.error('Connection already exists');
      return false;
    }

    // Remove any existing connection of the same type
    const existingConnection = connections.find(
      (conn) => conn.fromStepId === fromStepId && conn.type === type
    );

    if (existingConnection) {
      setConnections((prev) =>
        prev.filter(
          (conn) =>
            !(
              conn.fromStepId === fromStepId &&
              conn.type === type
            )
        )
      );
    }

    setConnections((prev) => [
      ...prev,
      { fromStepId, toStepId, type }
    ]);
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
    setConnections((prev) =>
      prev.filter(
        (conn) =>
          !(
            conn.fromStepId === fromStepId &&
            conn.toStepId === toStepId &&
            conn.type === type
          )
      )
    );
  };

  /**
   * Clears all steps and connections from the diagram
   */
  const clearAll = () => {
    console.log('Clearing all data');
    setSteps([]);
    setConnections([]);
  };

  /**
   * Exports the flow diagram data to a CSV file
   * Includes step information and their success/failure connections
   */
  const exportData = () => {
    // Convert data to CSV format
    const csvData = steps.map(step => ({
      'Step ID': step.id,
      'Step Name': step.name,
      'Description': step.description,
      'Expected Response': step.expectedResponse,
      'Success Step ID': connections.find(c => c.fromStepId === step.id && c.type === 'success')?.toStepId || '',
      'Failure Step ID': connections.find(c => c.fromStepId === step.id && c.type === 'failure')?.toStepId || ''
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flow_diagram.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  /**
   * Imports flow diagram data from a CSV file
   * @param {File} file - CSV file to import
   * @returns {Promise} Resolves when import is complete, rejects on error
   */
  const importData = (file) => {
    console.log('Starting import of file:', file.name);
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

            console.log('Processing CSV rows...');
            results.data.forEach((row, index) => {
              console.log(`Processing row ${index + 1}:`, row);
              if (row['Step ID'] && row['Step Name']) {
                const newStep = {
                  id: row['Step ID'],
                  name: row['Step Name'],
                  description: row['Description'] || '',
                  expectedResponse: row['Expected Response'] || '',
                  position: { x: 0, y: 0 } // Default position
                };
                console.log('Created step:', newStep);
                newSteps.push(newStep);

                if (row['Success Step ID']) {
                  const successConnection = {
                    fromStepId: row['Step ID'],
                    toStepId: row['Success Step ID'],
                    type: 'success'
                  };
                  console.log('Created success connection:', successConnection);
                  newConnections.push(successConnection);
                }

                if (row['Failure Step ID']) {
                  const failureConnection = {
                    fromStepId: row['Step ID'],
                    toStepId: row['Failure Step ID'],
                    type: 'failure'
                  };
                  console.log('Created failure connection:', failureConnection);
                  newConnections.push(failureConnection);
                }
              } else {
                console.warn('Skipping invalid row:', row);
              }
            });

            console.log('Final imported steps:', newSteps);
            console.log('Final imported connections:', newConnections);

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
    showSaveNotification
  };
};

export default useFlowDiagram; 