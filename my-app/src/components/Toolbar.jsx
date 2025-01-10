import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

const Toolbar = ({ onAddState, onStartSimulation, onExport, onImport }) => {
  const [newStateName, setNewStateName] = useState('');

  const handleAddState = () => {
    if (newStateName.trim()) {
      onAddState(newStateName);
      setNewStateName('');
    }
  };

  return (
    <div className="flex items-center gap-4 mb-4">
      <div className="flex-1 flex items-center gap-2">
        <Input
          type="text"
          placeholder="Enter state name"
          value={newStateName}
          onChange={(e) => setNewStateName(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleAddState();
            }
          }}
        />
        <Button onClick={handleAddState}>Add State</Button>
      </div>
      <Button onClick={onStartSimulation}>Simulate</Button>
      <Button onClick={onExport}>Export</Button>
      <Button onClick={onImport}>Import</Button>
    </div>
  );
};

export default Toolbar;
