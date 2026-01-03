/**
 * EditStepOverlay Component
 * Modal overlay for editing step details during simulation
 * Provides quick editing of name, description, assumptions, questions, and screenshots
 */

import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  X,
  Save,
  Plus,
  Pencil,
  Check,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * EditStepOverlay Component
 * @param {Object} props
 * @param {Object} props.step - The step to edit
 * @param {boolean} props.isOpen - Whether the overlay is open
 * @param {Function} props.onClose - Callback when overlay is closed
 * @param {Function} props.onSave - Callback when changes are saved
 */
const EditStepOverlay = ({ step, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: step?.name || '',
    description: step?.description || '',
    assumptions: step?.assumptions || [],
    questions: step?.questions || [],
    imageUrls: step?.imageUrls || [],
    imageCaptions: step?.imageCaptions || []
  });

  const [editingAssumptionIndex, setEditingAssumptionIndex] = useState(null);
  const [editedAssumption, setEditedAssumption] = useState('');
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
  const [editedQuestion, setEditedQuestion] = useState('');
  const [newAssumption, setNewAssumption] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  
  const fileInputRef = useRef(null);

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Step name cannot be empty');
      return;
    }

    onSave(step.id, formData);
    toast.success('Step updated successfully');
    onClose();
  };

  const handleAddAssumption = () => {
    if (newAssumption.trim()) {
      setFormData({
        ...formData,
        assumptions: [...formData.assumptions, newAssumption.trim()]
      });
      setNewAssumption('');
    }
  };

  const handleRemoveAssumption = (index) => {
    const updated = [...formData.assumptions];
    updated.splice(index, 1);
    setFormData({ ...formData, assumptions: updated });
  };

  const handleUpdateAssumption = (index) => {
    if (editedAssumption.trim()) {
      const updated = [...formData.assumptions];
      updated[index] = editedAssumption.trim();
      setFormData({ ...formData, assumptions: updated });
      setEditingAssumptionIndex(null);
    }
  };

  const handleAddQuestion = () => {
    if (newQuestion.trim()) {
      setFormData({
        ...formData,
        questions: [...formData.questions, newQuestion.trim()]
      });
      setNewQuestion('');
    }
  };

  const handleRemoveQuestion = (index) => {
    const updated = [...formData.questions];
    updated.splice(index, 1);
    setFormData({ ...formData, questions: updated });
  };

  const handleUpdateQuestion = (index) => {
    if (editedQuestion.trim()) {
      const updated = [...formData.questions];
      updated[index] = editedQuestion.trim();
      setFormData({ ...formData, questions: updated });
      setEditingQuestionIndex(null);
    }
  };

  const handleImageUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      if (!file.type.match('image.*')) {
        toast.error(`File "${file.name}" is not an image`);
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        toast.error(`Image "${file.name}" is larger than 2MB`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target.result;
        setFormData(prev => ({
          ...prev,
          imageUrls: [...prev.imageUrls, imageUrl],
          imageCaptions: [...prev.imageCaptions, '']
        }));
        toast.success('Screenshot added');
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index) => {
    const updatedImages = [...formData.imageUrls];
    const updatedCaptions = [...formData.imageCaptions];
    
    updatedImages.splice(index, 1);
    updatedCaptions.splice(index, 1);
    
    setFormData({
      ...formData,
      imageUrls: updatedImages,
      imageCaptions: updatedCaptions
    });
  };

  const handleUpdateCaption = (index, newCaption) => {
    const updatedCaptions = [...formData.imageCaptions];
    updatedCaptions[index] = newCaption;
    setFormData({ ...formData, imageCaptions: updatedCaptions });
  };

  if (!step) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Step: {step.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Step Name */}
          <div>
            <label className="text-sm font-medium mb-1 block">
              📝 Step Name
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter step name..."
              className="w-full"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium mb-1 block">
              📄 Description
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter step description..."
              className="w-full min-h-[80px]"
              rows={3}
            />
          </div>

          {/* Assumptions */}
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-semibold">💡 Assumptions ({formData.assumptions.length})</label>
            </div>
            <ul className="space-y-1 mb-2">
              {formData.assumptions.map((assumption, index) => (
                <li key={index} className="flex items-center gap-2 bg-green-100 dark:bg-green-800/40 rounded px-2 py-1">
                  {editingAssumptionIndex === index ? (
                    <>
                      <span className="font-semibold text-green-800 dark:text-green-200 min-w-[24px]">{index + 1}.</span>
                      <Input
                        value={editedAssumption}
                        onChange={(e) => setEditedAssumption(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateAssumption(index)}
                        className="flex-1 h-7 py-1"
                        autoFocus
                      />
                      <Button
                        size="icon"
                        className="h-6 w-6 bg-green-600 hover:bg-green-700"
                        onClick={() => handleUpdateAssumption(index)}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => setEditingAssumptionIndex(null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-green-800 dark:text-green-200 min-w-[24px]">{index + 1}.</span>
                      <span className="flex-1 text-sm">{assumption}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => {
                          setEditedAssumption(assumption);
                          setEditingAssumptionIndex(index);
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => handleRemoveAssumption(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <Input
                value={newAssumption}
                onChange={(e) => setNewAssumption(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddAssumption()}
                placeholder="Add assumption..."
                className="flex-1 h-8 text-sm"
              />
              <Button
                size="sm"
                className="h-8 bg-green-600 hover:bg-green-700"
                onClick={handleAddAssumption}
                disabled={!newAssumption.trim()}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Questions */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-semibold">❓ Questions ({formData.questions.length})</label>
            </div>
            <ul className="space-y-1 mb-2">
              {formData.questions.map((question, index) => (
                <li key={index} className="flex items-center gap-2 bg-blue-100 dark:bg-blue-800/40 rounded px-2 py-1">
                  {editingQuestionIndex === index ? (
                    <>
                      <span className="font-semibold text-blue-800 dark:text-blue-200 min-w-[24px]">{index + 1}.</span>
                      <Input
                        value={editedQuestion}
                        onChange={(e) => setEditedQuestion(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateQuestion(index)}
                        className="flex-1 h-7 py-1"
                        autoFocus
                      />
                      <Button
                        size="icon"
                        className="h-6 w-6 bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleUpdateQuestion(index)}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => setEditingQuestionIndex(null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-blue-800 dark:text-blue-200 min-w-[24px]">{index + 1}.</span>
                      <span className="flex-1 text-sm">{question}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => {
                          setEditedQuestion(question);
                          setEditingQuestionIndex(index);
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => handleRemoveQuestion(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <Input
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddQuestion()}
                placeholder="Add question..."
                className="flex-1 h-8 text-sm"
              />
              <Button
                size="sm"
                className="h-8 bg-blue-600 hover:bg-blue-700"
                onClick={handleAddQuestion}
                disabled={!newQuestion.trim()}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Screenshots */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              📸 Screenshots ({formData.imageUrls.length})
            </label>
            {formData.imageUrls.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 mb-2">
                {formData.imageUrls.map((imageUrl, index) => (
                  <div key={index} className="relative border rounded-md p-1 bg-gray-50 dark:bg-gray-800">
                    <img
                      src={imageUrl}
                      alt={formData.imageCaptions[index] || `Screenshot ${index + 1}`}
                      className="w-full h-24 object-cover rounded"
                    />
                    <Input
                      value={formData.imageCaptions[index] || ''}
                      onChange={(e) => handleUpdateCaption(index, e.target.value)}
                      placeholder="Caption..."
                      className="h-6 text-xs mt-1"
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2 h-6 w-6 rounded-full"
                      onClick={() => handleRemoveImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Add Screenshots
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

EditStepOverlay.propTypes = {
  step: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    assumptions: PropTypes.arrayOf(PropTypes.string),
    questions: PropTypes.arrayOf(PropTypes.string),
    imageUrls: PropTypes.arrayOf(PropTypes.string),
    imageCaptions: PropTypes.arrayOf(PropTypes.string)
  }),
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
};

export default EditStepOverlay;
