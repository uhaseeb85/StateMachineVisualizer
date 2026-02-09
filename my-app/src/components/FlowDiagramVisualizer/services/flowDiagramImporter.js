/**
 * Import service for flow diagrams
 * Handles all import formats (JSON, ZIP, CSV)
 * 
 * SOLID Principle: Single Responsibility - Only handles imports
 * Open/Closed Principle: Easy to add new import formats
 */
import JSZip from 'jszip';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

export class FlowDiagramImporter {
  /**
   * Import from JSON file
   * @param {File} file - JSON file to import
   * @returns {Promise<{steps: Array, connections: Array, classificationRules: Array|null}>}
   */
  async importFromJSON(file) {
    try {
      const jsonText = await file.text();
      const flowData = JSON.parse(jsonText);
      
      if (!flowData.steps || !Array.isArray(flowData.steps)) {
        throw new Error('Invalid JSON format: Missing steps array');
      }
      
      const processedSteps = flowData.steps.map(step => {
        if (step.imageUrls && step.imageUrls.length > 0 && !step.imageUrl) {
          step.imageUrl = step.imageUrls[0];
        }
        return step;
      });
      
      return {
        steps: processedSteps,
        connections: flowData.connections || [],
        classificationRules: flowData.classificationRules || null,
      };
    } catch (error) {
      console.error('Error importing JSON:', error);
      toast.error('Error importing JSON: ' + error.message);
      throw error;
    }
  }

  /**
   * Import from ZIP file (includes images)
   * @param {File} file - ZIP file to import
   * @returns {Promise<{steps: Array, connections: Array}>}
   */
  async importFromZip(file) {
    try {
      const zip = new JSZip();
      const zipContents = await zip.loadAsync(file);
      
      const dataFile = zipContents.file('data.json');
      if (!dataFile) {
        throw new Error('Invalid ZIP file: Missing data.json');
      }
      
      const jsonContent = await dataFile.async('string');
      const flowData = JSON.parse(jsonContent);
      
      if (!flowData.steps || !Array.isArray(flowData.steps)) {
        throw new Error('Invalid data format: Missing steps array');
      }
      
      const processedSteps = await Promise.all(flowData.steps.map(async (step) => {
        if (!step.imageUrls || step.imageUrls.length === 0) {
          return step;
        }
        
        step.imageUrls = await Promise.all(step.imageUrls.map(async (imagePath) => {
          if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
          }
          
          if (imagePath.startsWith('images/')) {
            const imageFileName = imagePath.replace('images/', '');
            const imageFile = zipContents.file(`images/${imageFileName}`);
            
            if (!imageFile) {
              console.error(`Image file not found in zip: ${imagePath}`);
              return '';
            }
            
            const imageBlob = await imageFile.async('blob');
            return URL.createObjectURL(imageBlob);
          }
          
          return imagePath;
        }));
        
        if (step.imageUrls.length > 0) {
          step.imageUrl = step.imageUrls[0];
        }
        
        return step;
      }));
      
      return {
        steps: processedSteps,
        connections: flowData.connections || [],
        classificationRules: flowData.classificationRules || null,
      };
    } catch (error) {
      console.error('Error importing ZIP:', error);
      toast.error('Error importing ZIP: ' + error.message);
      throw error;
    }
  }

  /**
   * Import from CSV file (legacy format)
   * @param {File} file - CSV file to import
   * @returns {Promise<{steps: Array, connections: Array}>}
   */
  async importFromCSV(file) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const stepMap = new Map();
            const connections = [];
            
            results.data.forEach(row => {
              const sourceName = row['Source Node'];
              const destName = row['Destination Node'];
              const connType = row['Connection Type'] || 'default';
              
              if (!sourceName || !destName) return;
              
              // Create or get source step
              if (!stepMap.has(sourceName)) {
                stepMap.set(sourceName, {
                  id: uuidv4(),
                  name: sourceName,
                  type: 'state',
                  assumptions: [],
                  questions: [],
                  connections: [],
                });
              }
              
              // Create or get destination step
              if (!stepMap.has(destName)) {
                stepMap.set(destName, {
                  id: uuidv4(),
                  name: destName,
                  type: 'state',
                  assumptions: [],
                  questions: [],
                  connections: [],
                });
              }
              
              const sourceStep = stepMap.get(sourceName);
              const destStep = stepMap.get(destName);
              
              connections.push({
                id: uuidv4(),
                fromStepId: sourceStep.id,
                toStepId: destStep.id,
                type: connType,
              });
            });
            
            resolve({
              steps: Array.from(stepMap.values()),
              connections,
              classificationRules: null,
            });
            
            toast.success(`Imported ${stepMap.size} steps and ${connections.length} connections from CSV`);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          toast.error('Error parsing CSV: ' + error.message);
          reject(error);
        },
      });
    });
  }

  /**
   * Determine file type and import accordingly
   * @param {File} file - File to import
   * @returns {Promise<{steps: Array, connections: Array, classificationRules: Array|null}>}
   */
  async import(file) {
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.json')) {
      return this.importFromJSON(file);
    } else if (fileName.endsWith('.zip')) {
      return this.importFromZip(file);
    } else if (fileName.endsWith('.csv')) {
      return this.importFromCSV(file);
    } else {
      throw new Error('Unsupported file type. Please use .json, .zip, or .csv files.');
    }
  }
}
