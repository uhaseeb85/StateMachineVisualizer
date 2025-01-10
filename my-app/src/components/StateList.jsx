import React from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';

const StateList = ({ states, selectedState, onSelectState, onDeleteState }) => {
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold mb-4">States</h2>
      {states.length === 0 ? (
        <p className="text-sm text-muted-foreground">No states added yet</p>
      ) : (
        <div className="space-y-2">
          {states.map((state) => (
            <Card
              key={state.id}
              className={`p-3 cursor-pointer hover:bg-accent ${
                selectedState?.id === state.id ? 'bg-accent' : ''
              }`}
              onClick={() => onSelectState(state)}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{state.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent state selection when clicking delete
                    onDeleteState(state.id);
                  }}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StateList;
  