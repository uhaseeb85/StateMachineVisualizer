import React from 'react';
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download } from 'lucide-react';
import { downloadSampleDictionary } from './utils';
import { SAMPLE_PATTERNS } from './constants';

const DictionaryUpload = ({ 
  logDictionary, 
  handleDictionaryUpload, 
  clearDictionary 
}) => {
  return (
    <>
      {!logDictionary ? (
        <>
          <div className="mt-6 mb-4 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Log Dictionary
            </h3>
            <Button
              onClick={() => downloadSampleDictionary(SAMPLE_PATTERNS)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Sample
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Log Dictionary
            </label>
            <Input
              type="file"
              onChange={handleDictionaryUpload}
              accept=".csv"
              key={Date.now()}
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Upload a CSV file containing log patterns and analysis rules (see format above)
            </p>
          </div>
        </>
      ) : (
        <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div>
            <h3 className="text-sm font-semibold text-green-900 dark:text-green-200">
              Log Dictionary Loaded
            </h3>
            <p className="text-sm text-green-800 dark:text-green-300">
              {logDictionary.length} patterns available for analysis
            </p>
          </div>
          <Button
            onClick={clearDictionary}
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700"
          >
            Remove Dictionary
          </Button>
        </div>
      )}
    </>
  );
};

DictionaryUpload.propTypes = {
  logDictionary: PropTypes.array,
  handleDictionaryUpload: PropTypes.func.isRequired,
  clearDictionary: PropTypes.func.isRequired
};

export default DictionaryUpload; 