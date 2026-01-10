/**
 * AssumptionsInlineEditor Component
 * Inline assumptions management within expanded step cards
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Pencil, Check } from 'lucide-react';

/**
 * AssumptionsInlineEditor Component
 * @param {Object} props
 * @param {Array} props.assumptions - Array of assumption strings
 * @param {Function} props.onChange - Callback when assumptions change
 */
const AssumptionsInlineEditor = ({ assumptions = [], onChange }) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedValue, setEditedValue] = useState('');
  const [newAssumption, setNewAssumption] = useState('');

  const handleAdd = () => {
    if (newAssumption.trim()) {
      onChange([...assumptions, newAssumption.trim()]);
      setNewAssumption('');
    }
  };

  const handleRemove = (index) => {
    const updated = [...assumptions];
    updated.splice(index, 1);
    onChange(updated);
  };

  const handleUpdate = (index) => {
    if (editedValue.trim()) {
      const updated = [...assumptions];
      updated[index] = editedValue.trim();
      onChange(updated);
      setEditingIndex(null);
      setEditedValue('');
    }
  };

  const startEdit = (index) => {
    setEditedValue(assumptions[index]);
    setEditingIndex(index);
  };

  return (
    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
      <div className="flex items-center gap-2 mb-2">
        <h4 className="text-sm font-semibold">💡 Assumptions ({assumptions.length})</h4>
      </div>
      
      {assumptions.length > 0 && (
        <ul className="space-y-1 mb-2">
          {assumptions.map((assumption, index) => (
            <li key={index} className="flex items-center gap-2 bg-green-100 dark:bg-green-800/40 rounded px-2 py-1">
              {editingIndex === index ? (
                <>
                  <span className="font-semibold text-green-800 dark:text-green-200 min-w-[24px]">
                    {index + 1}.
                  </span>
                  <Input
                    value={editedValue}
                    onChange={(e) => setEditedValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdate(index);
                      if (e.key === 'Escape') setEditingIndex(null);
                    }}
                    className="flex-1 h-7 py-1"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    className="h-6 w-6 bg-green-600 hover:bg-green-700"
                    onClick={() => handleUpdate(index)}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => setEditingIndex(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="font-semibold text-green-800 dark:text-green-200 min-w-[24px]">
                    {index + 1}.
                  </span>
                  <span className="flex-1 text-sm">{assumption}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => startEdit(index)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => handleRemove(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      
      <div className="flex gap-2">
        <Input
          value={newAssumption}
          onChange={(e) => setNewAssumption(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Add assumption..."
          className="flex-1 h-8 text-sm"
        />
        <Button
          size="sm"
          className="h-8 bg-green-600 hover:bg-green-700"
          onClick={handleAdd}
          disabled={!newAssumption.trim()}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

AssumptionsInlineEditor.propTypes = {
  assumptions: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired
};

export default AssumptionsInlineEditor;
