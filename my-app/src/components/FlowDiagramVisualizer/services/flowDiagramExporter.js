/**
 * Export service for flow diagrams
 * Handles all export formats (JSON, ZIP, CSV)
 * 
 * SOLID Principle: Single Responsibility - Only handles exports
 * Open/Closed Principle: Easy to add new export formats
 */
import Papa from 'papaparse';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

export class FlowDiagramExporter {
  /**
   * Export diagram to JSON format
   * @param {Array} steps - Flow diagram steps
   * @param {Array} connections - Flow diagram connections
   * @param {string} fileName - Name for the export file
   */
  async exportToJSON(steps, connections, fileName) {
    try {
      const data = {
        steps: steps.map(step => ({
          id: step.id,
          name: step.name,
          type: step.type,
          alias: step.alias,
          assumptions: step.assumptions,
          questions: step.questions,
          connections: step.connections,
          imageUrl: step.imageUrl,
          imageUrls: step.imageUrls,
        })),
        connections,
        exportDate: new Date().toISOString(),
        version: '1.0',
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      saveAs(blob, `${fileName}.json`);
      toast.success('Flow diagram exported as JSON successfully');
    } catch (error) {
      console.error('Error exporting to JSON:', error);
      toast.error('Error exporting to JSON: ' + error.message);
      throw error;
    }
  }

  /**
   * Export diagram to ZIP format (includes images)
   * @param {Array} steps - Flow diagram steps
   * @param {Array} connections - Flow diagram connections
   * @param {string} fileName - Name for the export file
   */
  async exportToZip(steps, connections, fileName) {
    try {
      const zip = new JSZip();
      const imagesFolder = zip.folder('images');
      const processedImageUrls = new Map();
      const processImagePromises = [];

      // Process steps and extract images
      const exportSteps = await Promise.all(steps.map(async (step) => {
        const stepCopy = { ...step };
        
        if (!step.imageUrls || step.imageUrls.length === 0) {
          return stepCopy;
        }
        
        stepCopy.imageUrls = await Promise.all(step.imageUrls.map(async (imageUrl) => {
          if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            return imageUrl;
          }
          
          try {
            if (processedImageUrls.has(imageUrl)) {
              return processedImageUrls.get(imageUrl);
            }
            
            const uniqueImageName = `image_${uuidv4()}.png`;
            const imagePath = `images/${uniqueImageName}`;
            
            const fetchPromise = fetch(imageUrl)
              .then(response => response.blob())
              .then(blob => {
                imagesFolder.file(uniqueImageName, blob);
                processedImageUrls.set(imageUrl, imagePath);
                return imagePath;
              });
              
            processImagePromises.push(fetchPromise);
            return await fetchPromise;
          } catch (error) {
            console.error('Error processing image:', error);
            return imageUrl;
          }
        }));
        
        return stepCopy;
      }));
      
      await Promise.all(processImagePromises);
      
      const flowData = {
        steps: exportSteps,
        connections,
      };
      
      zip.file('data.json', JSON.stringify(flowData, null, 2));
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `${fileName}.zip`);
      
      toast.success('Flow diagram exported as ZIP successfully');
    } catch (error) {
      console.error('Error exporting to ZIP:', error);
      toast.error('Error exporting to ZIP: ' + error.message);
      throw error;
    }
  }

  /**
   * Export diagram to CSV format
   * @param {Array} steps - Flow diagram steps
   * @param {Array} connections - Flow diagram connections
   * @param {string} fileName - Name for the export file
   */
  exportToCSV(steps, connections, fileName) {
    try {
      const csvData = connections.map(conn => {
        const fromStep = steps.find(s => s.id === conn.fromStepId);
        const toStep = steps.find(s => s.id === conn.toStepId);
        
        return {
          'Source Node': fromStep?.name || conn.fromStepId,
          'Destination Node': toStep?.name || conn.toStepId,
          'Connection Type': conn.type || 'default',
        };
      });

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `${fileName}.csv`);
      
      toast.success('Flow diagram exported as CSV successfully');
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      toast.error('Error exporting to CSV: ' + error.message);
      throw error;
    }
  }
}
