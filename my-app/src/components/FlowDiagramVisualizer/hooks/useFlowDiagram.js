import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import Papa from 'papaparse';

const useFlowDiagram = (storageKey) => {
  const [steps, setSteps] = useState([]);
  const [connections, setConnections] = useState([]);

  useEffect(() => {
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      try {
        const { steps: savedSteps, connections: savedConnections } = JSON.parse(savedData);
        setSteps(savedSteps);
        setConnections(savedConnections);
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    }
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ steps, connections }));
  }, [steps, connections, storageKey]);

  const addStep = (stepData) => {
    const newStep = {
      id: uuidv4(),
      ...stepData,
      position: stepData.position || { x: 0, y: 0 },
    };
    setSteps((prev) => [...prev, newStep]);
    return newStep.id;
  };

  const updateStep = (id, updates) => {
    setSteps((prev) =>
      prev.map((step) =>
        step.id === id ? { ...step, ...updates } : step
      )
    );
  };

  const removeStep = (id) => {
    setSteps((prev) => prev.filter((step) => step.id !== id));
    setConnections((prev) =>
      prev.filter(
        (conn) => conn.fromStepId !== id && conn.toStepId !== id
      )
    );
  };

  const addConnection = (fromStepId, toStepId, type) => {
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

    // Check if step already has this type of connection
    const hasExistingTypeConnection = connections.some(
      (conn) => conn.fromStepId === fromStepId && conn.type === type
    );

    if (hasExistingTypeConnection) {
      toast.error(`Step already has a ${type} path`);
      return false;
    }

    setConnections((prev) => [
      ...prev,
      { fromStepId, toStepId, type }
    ]);
    return true;
  };

  const removeConnection = (fromStepId, toStepId, type) => {
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
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          try {
            const newSteps = [];
            const newConnections = [];
            
            results.data.forEach(row => {
              if (row['Step ID'] && row['Step Name']) {
                newSteps.push({
                  id: row['Step ID'],
                  name: row['Step Name'],
                  description: row['Description'] || '',
                  expectedResponse: row['Expected Response'] || '',
                  position: { x: 0, y: 0 } // Default position
                });

                if (row['Success Step ID']) {
                  newConnections.push({
                    fromStepId: row['Step ID'],
                    toStepId: row['Success Step ID'],
                    type: 'success'
                  });
                }

                if (row['Failure Step ID']) {
                  newConnections.push({
                    fromStepId: row['Step ID'],
                    toStepId: row['Failure Step ID'],
                    type: 'failure'
                  });
                }
              }
            });

            setSteps(newSteps);
            setConnections(newConnections);
            resolve();
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => reject(error)
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
  };
};

export default useFlowDiagram; 