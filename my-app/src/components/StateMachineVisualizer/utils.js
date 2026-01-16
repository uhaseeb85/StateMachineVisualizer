import html2canvas from 'html2canvas';
import ExcelJS from 'exceljs';
import Papa from 'papaparse';

export const generateId = () => {
  return 'id_' + Math.random().toString(36).substr(2, 9);
};

export const exportToImage = async (element) => {
  try {
    const canvas = await html2canvas(element);
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error exporting to image:', error);
    throw error;
  }
};

export const parseExcelFile = async (file) => {
  return new Promise((resolve, reject) => {
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (fileExtension === 'csv') {
      // Handle CSV files with PapaParse
      Papa.parse(file, {
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn('CSV parsing warnings:', results.errors);
          }
          resolve(results.data);
        },
        error: (error) => {
          reject(error);
        },
        skipEmptyLines: true
      });
    } else {
      // Handle Excel files (xlsx, xls) with ExcelJS
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const buffer = e.target.result;
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(buffer);
          
          if (!workbook.worksheets || workbook.worksheets.length === 0) {
            throw new Error('Invalid file format');
          }

          const firstSheet = workbook.worksheets[0];
          if (!firstSheet) {
            throw new Error('No data found in the file');
          }

          const rows = [];
          firstSheet.eachRow((row) => {
            const rowData = [];
            row.eachCell({ includeEmpty: true }, (cell) => {
              rowData.push(cell.value || '');
            });
            rows.push(rowData);
          });

          resolve(rows);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    }
  });
};

export const validateExcelData = (rows) => {
  if (rows.length < 2) {
    throw new Error('File contains no data rows');
  }

  const headers = rows[0].map(h => h?.toString().trim().toLowerCase());
  
  const sourceNodeIndex = headers.findIndex(h => 
    h === 'source node' || h === 'source node '
  );
  const destNodeIndex = headers.findIndex(h => 
    h === 'destination node' || h === 'destination node '
  );
  const ruleListIndex = headers.findIndex(h => 
    h === 'rule list' || h === 'rule list '
  );

  if (sourceNodeIndex === -1 || destNodeIndex === -1 || ruleListIndex === -1) {
    throw new Error(
      'Missing required columns. Please ensure your file has: "Source Node", "Destination Node", and "Rule List"\n' +
      'Found columns: ' + headers.join(', ')
    );
  }

  return {
    sourceNodeIndex,
    destNodeIndex,
    ruleListIndex,
    headers
  };
};

/**
 * Sorts an array of rules by priority (ascending)
 * @param {Array} rules - Array of rule objects with priority property
 * @returns {Array} - Sorted array of rules
 */
export const sortRulesByPriority = (rules) => {
  if (!Array.isArray(rules)) return rules;
  
  return [...rules].sort((a, b) => {
    // Handle undefined, null values and convert to number if needed
    const priorityA = a.priority !== undefined && a.priority !== null ? Number(a.priority) : 50;
    const priorityB = b.priority !== undefined && b.priority !== null ? Number(b.priority) : 50;
    return priorityA - priorityB;
  });
}; 