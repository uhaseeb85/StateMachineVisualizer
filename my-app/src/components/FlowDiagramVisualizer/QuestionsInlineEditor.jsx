/**
 * QuestionsInlineEditor Component
 * Inline questions management within expanded step cards
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Pencil, Check } from 'lucide-react';

/**
 * QuestionsInlineEditor Component
 * @param {Object} props
 * @param {Array} props.questions - Array of question strings
 * @param {Function} props.onChange - Callback when questions change
 */
const QuestionsInlineEditor = ({ questions = [], onChange }) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedValue, setEditedValue] = useState('');
  const [newQuestion, setNewQuestion] = useState('');

  const handleAdd = () => {
    if (newQuestion.trim()) {
      onChange([...questions, newQuestion.trim()]);
      setNewQuestion('');
    }
  };

  const handleRemove = (index) => {
    const updated = [...questions];
    updated.splice(index, 1);
    onChange(updated);
  };

  const handleUpdate = (index) => {
    if (editedValue.trim()) {
      const updated = [...questions];
      updated[index] = editedValue.trim();
      onChange(updated);
      setEditingIndex(null);
      setEditedValue('');
    }
  };

  const startEdit = (index) => {
    setEditedValue(questions[index]);
    setEditingIndex(index);
  };

  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
      <div className="flex items-center gap-2 mb-2">
        <h4 className="text-sm font-semibold">❓ Questions ({questions.length})</h4>
      </div>
      
      {questions.length > 0 && (
        <ul className="space-y-1 mb-2">
          {questions.map((question, index) => (
            <li key={index} className="flex items-center gap-2 bg-blue-100 dark:bg-blue-800/40 rounded px-2 py-1">
              {editingIndex === index ? (
                <>
                  <span className="font-semibold text-blue-800 dark:text-blue-200 min-w-[24px]">
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
                    className="h-6 w-6 bg-blue-600 hover:bg-blue-700"
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
                  <span className="font-semibold text-blue-800 dark:text-blue-200 min-w-[24px]">
                    {index + 1}.
                  </span>
                  <span className="flex-1 text-sm">{question}</span>
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
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Add question..."
          className="flex-1 h-8 text-sm"
        />
        <Button
          size="sm"
          className="h-8 bg-blue-600 hover:bg-blue-700"
          onClick={handleAdd}
          disabled={!newQuestion.trim()}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

QuestionsInlineEditor.propTypes = {
  questions: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired
};

export default QuestionsInlineEditor;
