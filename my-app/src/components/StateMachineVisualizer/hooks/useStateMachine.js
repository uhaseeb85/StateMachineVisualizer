import { useState, useEffect } from 'react';
import { parseExcelFile, validateExcelData, generateId } from '../utils';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

export default function useStateMachine() {
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [changeLog, setChangeLog] = useState([]);

  // Load saved states and dark mode preference
  useEffect(() => {
    const savedFlow = localStorage.getItem('ivrFlow');
    if (savedFlow) {
      setStates(JSON.parse(savedFlow));
    }

    const darkModePreference = localStorage.getItem('darkMode');
    setIsDarkMode(darkModePreference === null ? false : darkModePreference === 'true');
  }, []);

  // Update dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('darkMode', isDarkMode);
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const saveFlow = () => {
    localStorage.setItem('ivrFlow', JSON.stringify(states));
    setShowSaveNotification(true);
    setTimeout(() => setShowSaveNotification(false), 2000);
    setChangeLog(prev => [...prev, `Saved state machine configuration`]);
  };

  const addState = (name) => {
    if (name.trim()) {
      const newState = {
        id: generateId(),
        name: name.trim(),
        rules: [],
      };
      setStates(prevStates => [...prevStates, newState]);
      setChangeLog(prev => [...prev, `Added state: ${name.trim()}`]);
    }
  };

  const deleteState = (stateId) => {
    const stateName = states.find(s => s.id === stateId)?.name;
    setStates(prevStates => prevStates.filter(state => state.id !== stateId));
    if (selectedState === stateId) {
      setSelectedState(null);
    }
    setChangeLog(prev => [...prev, `Deleted state: ${stateName || stateId}`]);
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (window.confirm('Are you sure you want to import? This will overwrite your current configuration.')) {
          setStates(importedData);
          localStorage.setItem('ivrFlow', JSON.stringify(importedData));
          alert('Configuration imported successfully!');
        }
      } catch (error) {
        alert('Error importing file. Please make sure it\'s a valid configuration file.');
        console.error('Import error:', error);
      }
    };
    reader.readAsText(file);
  };

  const handleExcelImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const rows = await parseExcelFile(file);
      const { sourceNodeIndex, destNodeIndex, ruleListIndex } = validateExcelData(rows);

      const stateMap = new Map();
      
      // Process data rows (skip header)
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row.some(cell => cell)) continue;

        const sourceNode = row[sourceNodeIndex]?.toString().trim();
        const destNode = row[destNodeIndex]?.toString().trim();
        const ruleList = row[ruleListIndex]?.toString().trim();

        if (!sourceNode || !destNode || !ruleList) {
          console.warn(`Skipping row ${i + 1} due to missing required data`);
          continue;
        }

        // Create states if they don't exist
        if (!stateMap.has(sourceNode)) {
          stateMap.set(sourceNode, {
            id: generateId(),
            name: sourceNode,
            rules: []
          });
        }
        if (!stateMap.has(destNode)) {
          stateMap.set(destNode, {
            id: generateId(),
            name: destNode,
            rules: []
          });
        }

        // Add rule
        const sourceState = stateMap.get(sourceNode);
        const targetState = stateMap.get(destNode);
        
        sourceState.rules.push({
          id: generateId(),
          condition: ruleList,
          nextState: targetState.id
        });
      }

      const newStates = Array.from(stateMap.values());
      if (newStates.length === 0) {
        throw new Error('No valid states could be created from the file');
      }

      setStates(newStates);
      alert(`Import successful! Created ${newStates.length} states.`);

    } catch (error) {
      console.error('Import error:', error);
      alert('Error importing file: ' + error.message);
    }
  };

  const exportConfiguration = () => {
    const defaultName = `state-machine-config-${new Date().toISOString().slice(0, 10)}`;
    const fileName = window.prompt('Enter file name:', defaultName);
    
    if (!fileName) return;
    
    const finalFileName = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
    const configuration = JSON.stringify(states, null, 2);
    const blob = new Blob([configuration], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRuleDictionaryImport = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      // Validate file extension
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (!['xlsx', 'xls'].includes(fileExtension)) {
        toast.error('Please upload a valid Excel file (.xlsx or .xls)');
        return;
      }

      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);

            // Validate sheet structure
            if (jsonData.length === 0) {
              toast.error('The Excel file is empty');
              reject(new Error('Empty file'));
              return;
            }

            // Check if required columns exist
            const firstRow = jsonData[0];
            if (!('rule name' in firstRow) || !('rule description' in firstRow)) {
              toast.error('Excel file must contain "rule name" and "rule description" columns');
              reject(new Error('Invalid columns'));
              return;
            }

            // Create a dictionary from the Excel data
            const ruleDictionary = {};
            let rulesUpdated = 0;
            let hasValidData = false;

            jsonData.forEach(row => {
              if (row['rule name'] && row['rule description']) {
                ruleDictionary[row['rule name']] = row['rule description'];
                rulesUpdated++;
                hasValidData = true;
              }
            });

            if (!hasValidData) {
              toast.error('No valid rules found in the Excel file');
              reject(new Error('No valid data'));
              return;
            }

            // Update states with rule descriptions
            const updatedStates = states.map(state => ({
              ...state,
              rules: state.rules.map(rule => ({
                ...rule,
                description: ruleDictionary[rule.name] || rule.description || ''
              }))
            }));

            setStates(updatedStates);
            toast.success(`Rule dictionary imported successfully! Updated ${rulesUpdated} rules.`);
            resolve(ruleDictionary); // Return the dictionary data
          } catch (error) {
            toast.error('Error processing Excel file: ' + error.message);
            reject(error);
          }
        };

        reader.onerror = () => {
          toast.error('Error reading the file');
          reject(new Error('File read error'));
        };

        reader.readAsArrayBuffer(file);
      });
    } catch (error) {
      console.error('Error importing rule dictionary:', error);
      toast.error(`Error importing rule dictionary: ${error.message}`);
      throw error;
    }
  };

  return {
    states,
    setStates,
    selectedState,
    setSelectedState,
    isDarkMode,
    toggleTheme,
    showSaveNotification,
    addState,
    deleteState,
    saveFlow,
    handleImport,
    handleExcelImport,
    exportConfiguration,
    handleRuleDictionaryImport,
    changeLog,
    setChangeLog
  };
} 