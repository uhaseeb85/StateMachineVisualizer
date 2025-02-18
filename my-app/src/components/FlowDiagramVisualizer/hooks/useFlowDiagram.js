import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import Papa from 'papaparse';

const useFlowDiagram = (storageKey) => {
  const [steps, setSteps] = useState([]);
  const [connections, setConnections] = useState([]);
  const [showSaveNotification, setShowSaveNotification] = useState(false);

  // Load data from localStorage
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

  // Save data to localStorage
  const saveFlow = () => {
    console.log('Saving flow diagram data');
    localStorage.setItem(storageKey, JSON.stringify({ steps, connections }));
    setShowSaveNotification(true);
    setTimeout(() => setShowSaveNotification(false), 2000);
    toast.success('Flow diagram saved successfully');
  };

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

  const updateStep = (id, updates) => {
    console.log('Updating step:', id, 'with:', updates);
    setSteps((prev) =>
      prev.map((step) =>
        step.id === id ? { ...step, ...updates } : step
      )
    );
  };

  const removeStep = (id) => {
    console.log('Removing step:', id);
    setSteps((prev) => prev.filter((step) => step.id !== id));
    setConnections((prev) =>
      prev.filter(
        (conn) => conn.fromStepId !== id && conn.toStepId !== id
      )
    );
  };

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

  const clearAll = () => {
    console.log('Clearing all data');
    setSteps([]);
    setConnections([]);
  };

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