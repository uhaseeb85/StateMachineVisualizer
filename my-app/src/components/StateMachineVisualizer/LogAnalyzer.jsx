import React, { useState } from 'react';
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import * as XLSX from 'xlsx-js-style';

export default function LogAnalyzer({ onClose }) {
  const [sessionId, setSessionId] = useState('');
  const [logDictionary, setLogDictionary] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleDictionaryUpload = async (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);
      setLogDictionary(jsonData);
    };
    
    reader.readAsArrayBuffer(file);
  };

  const analyzeLogs = async () => {
    if (!sessionId || !logDictionary) return;
    
    setLoading(true);
    try {
      const config = JSON.parse(localStorage.getItem('splunkConfig'));
      
      // Fetch logs from Splunk
      const response = await fetch('/api/splunk/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config,
          sessionId,
          searchQuery: `index=${config.index} sessionId=${sessionId}`
        })
      });

      const logs = await response.json();
      
      // Compare logs with dictionary patterns
      const matches = logs.map(log => {
        const matchingPatterns = logDictionary.map(pattern => ({
          pattern: pattern['log pattern'],
          cause: pattern['potential cause'],
          similarity: calculateSimilarity(log.message, pattern['log pattern'])
        }))
        .filter(match => match.similarity > 0.7) // Filter matches above 70% similarity
        .sort((a, b) => b.similarity - a.similarity);

        return {
          log: log.message,
          matches: matchingPatterns
        };
      });

      setResults(matches);
    } catch (error) {
      console.error('Error analyzing logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Simple similarity calculation (you might want to use a more sophisticated algorithm)
  const calculateSimilarity = (str1, str2) => {
    const words1 = str1.toLowerCase().split(' ');
    const words2 = str2.toLowerCase().split(' ');
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl">
        <div className="p-6 space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Log Analysis
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Session ID
              </label>
              <Input
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="Enter session ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Log Dictionary
              </label>
              <Input
                type="file"
                onChange={handleDictionaryUpload}
                accept=".xlsx,.xls"
              />
            </div>

            <Button 
              onClick={analyzeLogs} 
              disabled={!sessionId || !logDictionary || loading}
            >
              {loading ? 'Analyzing...' : 'Analyze Logs'}
            </Button>

            {results.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Analysis Results</h3>
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <div key={index} className="border p-4 rounded-lg">
                      <p className="font-medium">Log:</p>
                      <p className="text-sm mb-2">{result.log}</p>
                      <p className="font-medium">Potential Causes:</p>
                      <ul className="list-disc list-inside">
                        {result.matches.map((match, i) => (
                          <li key={i} className="text-sm">
                            {match.cause} (Similarity: {(match.similarity * 100).toFixed(1)}%)
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 