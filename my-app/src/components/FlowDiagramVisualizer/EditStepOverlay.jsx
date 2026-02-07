/**
 * EditStepOverlay Component
 * Modal overlay for editing step details during simulation
 * Provides quick editing of name, description, assumptions, questions, and screenshots
 */

import { useEffect, useState, useRef } from 'react';
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
import StepNameAutocomplete from './StepNameAutocomplete';
import {
  X,
  Save,
  Plus,
  Pencil,
  Check,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Link as LinkIcon,
} from 'lucide-react';
import { toast } from 'sonner';

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
  reader.readAsDataURL(file);
});

/**
 * EditStepOverlay Component
 * @param {Object} props
 * @param {Object} props.step - The step to edit
 * @param {boolean} props.isOpen - Whether the overlay is open
 * @param {Function} props.onClose - Callback when overlay is closed
 * @param {Function} props.onSave - Callback when changes are saved
 * @param {Array} props.allSteps - All available steps (for displaying connection targets)
 * @param {Array} props.connections - All connections (to show existing connections)
 * @param {Function} props.onRemoveConnection - Callback to remove a connection
 * @param {Function} props.onAddConnection - Callback to add a new connection
 * @param {Function} props.onAddStep - Callback to add a new step
 */
const EditStepOverlay = ({ step, isOpen, onClose, onSave, allSteps = [], connections = [], onRemoveConnection, onAddConnection, onAddStep, dictionaryHook }) => {
  const [formData, setFormData] = useState({
    name: step?.name || '',
    alias: step?.alias || '',
    description: step?.description || '',
    type: step?.type || 'state',
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
  
  // Connection creator state
  const [showConnectionCreator, setShowConnectionCreator] = useState(false);
  const [newConnectionType, setNewConnectionType] = useState('success');
  const [newConnectionTarget, setNewConnectionTarget] = useState('');
  const [connectionMode, setConnectionMode] = useState('existing'); // 'existing' or 'create'
  const [newStepData, setNewStepData] = useState({
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

          {/* Alias */}
          <div>
            <label htmlFor="edit-step-alias" className="text-sm font-medium mb-1 block">
              🏷️ Alias
            </label>
            <Input
              id="edit-step-alias"
              value={formData.alias}
              onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
              placeholder="Optional (e.g., LOGIN_PAGE)"
              className="w-full"
            />
          </div>

          {/* Type */}
          <div>
            <div className="text-sm font-medium mb-2 block">🧩 Type</div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={formData.type === 'state' ? 'default' : 'outline'}
                onClick={() => setFormData({ ...formData, type: 'state' })}
                className="h-8 px-3"
              >
                State
              </Button>
              <Button
                type="button"
                size="sm"
                variant={formData.type === 'rule' ? 'default' : 'outline'}
                onClick={() => setFormData({ ...formData, type: 'rule' })}
                className="h-8 px-3"
              >
                Rule
              </Button>
              <Button
                type="button"
                size="sm"
                variant={formData.type === 'behavior' ? 'default' : 'outline'}
                onClick={() => setFormData({ ...formData, type: 'behavior' })}
                className="h-8 px-3"
              >
                Behavior
              </Button>
            </div>
          </div>
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

  const appendImage = (imageUrl) => {
    if (typeof imageUrl !== 'string') return;
    setFormData((prev) => ({
      ...prev,
      imageUrls: [...prev.imageUrls, imageUrl],
      imageCaptions: [...prev.imageCaptions, '']
    }));
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (!file.type.match('image.*')) {
        toast.error(`File "${file.name}" is not an image`);
        continue;
      }

      if (file.size > 2 * 1024 * 1024) {
        toast.error(`Image "${file.name}" is larger than 2MB`);
        continue;
      }

      try {
        const imageUrl = await readFileAsDataUrl(file);
        appendImage(imageUrl);
        toast.success('Screenshot added');
      } catch {
        toast.error(`Failed to upload "${file.name}"`);
      }
    }

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

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Step name cannot be empty');
      return;
    }

    // Save the step
    onSave(step.id, formData);

    // Update dictionary if name, type, alias, or description changed
    if (dictionaryHook && (
      formData.name !== step.name ||
      formData.type !== step.type ||
      formData.alias !== step.alias ||
      formData.description !== step.description
    )) {
      dictionaryHook.upsertEntry(
        formData.name.trim(),
        formData.type,
        formData.alias?.trim() || '',
        formData.description?.trim() || ''
      );
    }

    toast.success('Step updated successfully');
    onClose();
  };

  if (!step) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>Edit Step: {step.name}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 space-y-4 py-4">
          {/* Step Name */}
          <div>
            <label htmlFor="edit-step-name" className="text-sm font-medium mb-1 block">
              📝 Step Name
            </label>
            <StepNameAutocomplete
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              onSelect={(suggestion) => {
                setFormData({
                  ...formData,
                  name: suggestion.stepName,
                  type: suggestion.type,
                  alias: suggestion.alias || '',
                  description: suggestion.description || ''
                });
              }}
              dictionaryHook={dictionaryHook}
              placeholder="Enter step name..."
              className="w-full"
            />
          </div>

          {/* Alias */}
          <div>
            <label htmlFor="edit-step-alias" className="text-sm font-medium mb-1 block">
              🏷️ Alias
            </label>
            <Input
              id="edit-step-alias"
              value={formData.alias}
              onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
              placeholder="Optional (e.g., LOGIN_PAGE)"
              className="w-full"
            />
          </div>

          {/* Type */}
          <div>
            <div className="text-sm font-medium mb-2 block">🧩 Type</div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={formData.type === 'state' ? 'default' : 'outline'}
                onClick={() => setFormData({ ...formData, type: 'state' })}
                className="h-8 px-3"
              >
                State
              </Button>
              <Button
                type="button"
                size="sm"
                variant={formData.type === 'rule' ? 'default' : 'outline'}
                onClick={() => setFormData({ ...formData, type: 'rule' })}
                className="h-8 px-3"
              >
                Rule
              </Button>
              <Button
                type="button"
                size="sm"
                variant={formData.type === 'behavior' ? 'default' : 'outline'}
                onClick={() => setFormData({ ...formData, type: 'behavior' })}
                className="h-8 px-3"
              >
                Behavior
              </Button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="edit-step-description" className="text-sm font-medium mb-1 block">
              📄 Description
            </label>
            <Textarea
              id="edit-step-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter step description..."
              className="w-full min-h-[80px]"
              rows={3}
            />
          </div>

          {/* Connections Section */}
          {(connections.length > 0 || onAddConnection) && (onRemoveConnection || onAddConnection) && (
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <div className="text-sm font-semibold">🔗 Connections from this step</div>
                </div>
                {onAddConnection && !showConnectionCreator && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-purple-300 hover:bg-purple-100"
                    onClick={() => {
                      setShowConnectionCreator(true);
                      setNewConnectionType('success');
                      setNewConnectionTarget('');
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Connection
                  </Button>
                )}
              </div>

              {/* Inline Connection Creator */}
              {showConnectionCreator && onAddConnection && (
                <div className="mb-3 p-3 bg-white dark:bg-gray-800 rounded-lg border-2 border-purple-300 dark:border-purple-600">
               <div className="space-y-3">
                    {/* Connection Type Selector */}
                    <div>
                      <div className="text-xs font-medium mb-2 block">Connection Type:</div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant={newConnectionType === 'success' ? 'default' : 'outline'}
                          className={`h-10 flex items-center justify-center gap-1 ${
                            newConnectionType === 'success' 
                              ? 'bg-green-600 hover:bg-green-700' 
                              : 'border-green-200 hover:bg-green-50'
                          }`}
                          onClick={() => setNewConnectionType('success')}
                        >
                          <CheckCircle2 className={`h-4 w-4 ${
                            newConnectionType === 'success' ? 'text-white' : 'text-green-600'
                          }`} />
                          <span className={`text-xs ${
                            newConnectionType === 'success' ? 'text-white' : 'text-green-700'
                          }`}>
                            Success
                          </span>
                        </Button>
                        
                        <Button
                          size="sm"
                          variant={newConnectionType === 'failure' ? 'default' : 'outline'}
                          className={`h-10 flex items-center justify-center gap-1 ${
                            newConnectionType === 'failure' 
                              ? 'bg-red-600 hover:bg-red-700' 
                              : 'border-red-200 hover:bg-red-50'
                          }`}
                          onClick={() => setNewConnectionType('failure')}
                        >
                          <XCircle className={`h-4 w-4 ${
                            newConnectionType === 'failure' ? 'text-white' : 'text-red-600'
                          }`} />
                          <span className={`text-xs ${
                            newConnectionType === 'failure' ? 'text-white' : 'text-red-700'
                          }`}>
                            Failure
                          </span>
                        </Button>
                      </div>
                    </div>

                    {/* Mode Selector */}
                    <div>
                      <div className="text-xs font-medium mb-2 block">Target Mode:</div>
                      <div className="flex gap-4 mb-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="connectionMode"
                            value="existing"
                            checked={connectionMode === 'existing'}
                            onChange={(e) => {
                              setConnectionMode(e.target.value);
                              setNewStepData({ name: '', alias: '', description: '', parentId: '', type: 'state' });
                            }}
                            className="w-4 h-4 text-purple-600"
                          />
                          <span className="text-xs">Select Existing</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="connectionMode"
                            value="create"
                            checked={connectionMode === 'create'}
                            onChange={(e) => {
                              setConnectionMode(e.target.value);
                              setNewConnectionTarget('');
                            }}
                            className="w-4 h-4 text-purple-600"
                          />
                          <span className="text-xs">Create New</span>
                        </label>
                      </div>
                    </div>

                    {/* Existing Step Selector */}
                    {connectionMode === 'existing' && (
                      <div>
                        <label htmlFor="edit-step-connection-target" className="text-xs font-medium mb-1 block">Select Step:</label>
                        <select
                          id="edit-step-connection-target"
                          value={newConnectionTarget}
                          onChange={(e) => setNewConnectionTarget(e.target.value)}
                          className="w-full h-9 rounded-md border border-gray-300 dark:border-gray-600 
                                   bg-white dark:bg-gray-700 px-2 text-sm"
                        >
                          <option value="">Select target step...</option>
                          
                          {/* Root Steps */}
                          <optgroup label="Root Steps">
                            {allSteps
                              .filter(s => !s.parentId && s.id !== step.id)
                              .map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                          </optgroup>
                          
                          {/* Sub Steps */}
                          {allSteps.some(s => s.parentId) && (
                            <optgroup label="Sub Steps">
                              {allSteps
                                .filter(s => s.parentId && s.id !== step.id)
                                .map(s => {
                                  const parent = allSteps.find(p => p.id === s.parentId);
                                  return (
                                    <option key={s.id} value={s.id}>
                                      {s.name} (in {parent?.name || 'Unknown'})
                                    </option>
                                  );
                                })}
                            </optgroup>
                          )}
                        </select>
                      </div>
                    )}

                    {/* Create New Step Form */}
                    {connectionMode === 'create' && (
                      <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-600">
                        <div>
                          <label htmlFor="edit-step-create-name" className="text-xs font-medium mb-1 block">Step Name: *</label>
                          <Input
                            id="edit-step-create-name"
                            value={newStepData.name}
                            onChange={(e) => setNewStepData({ ...newStepData, name: e.target.value })}
                            placeholder="Enter new step name..."
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="edit-step-create-alias" className="text-xs font-medium mb-1 block">Alias:</label>
                          <Input
                            id="edit-step-create-alias"
                            value={newStepData.alias}
                            onChange={(e) => setNewStepData({ ...newStepData, alias: e.target.value })}
                            placeholder="Optional (e.g., LOGIN_PAGE)"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <div className="text-xs font-medium mb-2 block">Type:</div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant={newStepData.type === 'state' ? 'default' : 'outline'}
                              onClick={() => setNewStepData({ ...newStepData, type: 'state' })}
                              className="h-7 px-2 text-xs"
                            >
                              State
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={newStepData.type === 'rule' ? 'default' : 'outline'}
                              onClick={() => setNewStepData({ ...newStepData, type: 'rule' })}
                              className="h-7 px-2 text-xs"
                            >
                              Rule
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={newStepData.type === 'behavior' ? 'default' : 'outline'}
                              onClick={() => setNewStepData({ ...newStepData, type: 'behavior' })}
                              className="h-7 px-2 text-xs"
                            >
                              Behavior
                            </Button>
                          </div>
                        </div>
                        <div>
                          <label htmlFor="edit-step-create-description" className="text-xs font-medium mb-1 block">Description:</label>
                          <Textarea
                            id="edit-step-create-description"
                            value={newStepData.description}
                            onChange={(e) => setNewStepData({ ...newStepData, description: e.target.value })}
                            placeholder="Enter description (optional)..."
                            className="h-16 text-sm"
                            rows={2}
                          />
                        </div>
                        <div>
                          <label htmlFor="edit-step-create-parent" className="text-xs font-medium mb-1 block">Parent Step (optional):</label>
                          <select
                            id="edit-step-create-parent"
                            value={newStepData.parentId}
                            onChange={(e) => setNewStepData({ ...newStepData, parentId: e.target.value })}
                            className="w-full h-8 rounded-md border border-gray-300 dark:border-gray-600 
                                     bg-white dark:bg-gray-700 px-2 text-sm"
                          >
                            <option value="">None (Root Step)</option>
                            {allSteps
                              .filter(s => !s.parentId && s.id !== step.id)
                              .map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Preview */}
                    {(newConnectionTarget || (connectionMode === 'create' && newStepData.name)) && (
                      <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
                        <div className="text-gray-500 dark:text-gray-400 mb-1">Preview:</div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{step.name}</span>
                          <span className={newConnectionType === 'success' ? 'text-green-600' : 'text-red-600'}>
                            →
                          </span>
                          <span className="font-medium">
                            {connectionMode === 'existing'
                              ? allSteps.find(s => s.id === newConnectionTarget)?.name
                              : newStepData.name
                            }
                            {connectionMode === 'create' && <span className="text-purple-600 ml-1">(New)</span>}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          if (connectionMode === 'existing') {
                            // Existing step mode
                            if (!newConnectionTarget) {
                              toast.error('Please select a target step');
                              return;
                            }

                            // Check for duplicate
                            const exists = connections.some(
                              c => c.fromStepId === step.id && 
                                   c.toStepId === newConnectionTarget && 
                                   c.type === newConnectionType
                            );

                            if (exists) {
                              toast.error('This connection already exists');
                              return;
                            }

                            const result = onAddConnection(step.id, newConnectionTarget, newConnectionType);
                            if (result) {
                              const targetName = allSteps.find(s => s.id === newConnectionTarget)?.name;
                              toast.success(`Added ${newConnectionType} connection to ${targetName}`);
                              setShowConnectionCreator(false);
                              setNewConnectionTarget('');
                            }
                          } else {
                            // Create new step mode
                            if (!newStepData.name.trim()) {
                              toast.error('Step name is required');
                              return;
                            }

                            if (!onAddStep) {
                              toast.error('Cannot create new step - function not available');
                              return;
                            }

                            // Create the new step
                            const newStepId = onAddStep({
                              name: newStepData.name.trim(),
                              alias: newStepData.alias.trim() || undefined,
                              description: newStepData.description.trim(),
                              parentId: newStepData.parentId || null,
                              assumptions: [],
                              questions: [],
                              imageUrls: [],
                              imageCaptions: [],
                              type: newStepData.type
                            });

                            if (newStepId) {
                              // Create connection from current step to new step
                              onAddConnection(step.id, newStepId, newConnectionType);
                              toast.success(`Created "${newStepData.name}" and connected!`);
                              
                              // Reset form
                              setShowConnectionCreator(false);
                              setNewStepData({ name: '', alias: '', description: '', parentId: '', type: 'state' });
                              setConnectionMode('existing');
                            }
                          }
                        }}
                        disabled={connectionMode === 'existing' ? !newConnectionTarget : !newStepData.name.trim()}
                        className={`flex-1 ${
                          newConnectionType === 'success' 
                            ? 'bg-green-600 hover:bg-green-700' 
                            : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        <LinkIcon className="h-3 w-3 mr-1" />
                        {connectionMode === 'existing' ? 'Add Connection' : 'Create & Connect'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowConnectionCreator(false);
                          setNewConnectionTarget('');
                          setNewStepData({ name: '', alias: '', description: '', parentId: '', type: 'state' });
                          setConnectionMode('existing');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Success Connections */}
              {connections.some(c => c.fromStepId === step.id && c.type === 'success') && (
                <div className="mb-3">
                  <div className="text-xs font-medium text-green-700 dark:text-green-300 mb-1 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Success Paths:
                  </div>
                  <div className="space-y-1">
                    {connections
                      .filter(c => c.fromStepId === step.id && c.type === 'success')
                      .map((conn) => {
                        const targetStep = allSteps.find(s => s.id === conn.toStepId);
                        if (!targetStep) return null;
                        
                        return (
                          <div 
                            key={`success-${conn.fromStepId}-${conn.toStepId}`}
                            className="flex items-center justify-between px-2 py-1 bg-green-100 dark:bg-green-800/40 rounded text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                              <span>{targetStep.name}</span>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 hover:bg-green-200 dark:hover:bg-green-700"
                              onClick={() => {
                                onRemoveConnection(step.id, targetStep.id, 'success');
                                toast.success('Connection removed');
                              }}
                              title="Remove connection"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Failure Connections */}
              {connections.some(c => c.fromStepId === step.id && c.type === 'failure') && (
                <div>
                  <div className="text-xs font-medium text-red-700 dark:text-red-300 mb-1 flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    Failure Paths:
                  </div>
                  <div className="space-y-1">
                    {connections
                      .filter(c => c.fromStepId === step.id && c.type === 'failure')
                      .map((conn) => {
                        const targetStep = allSteps.find(s => s.id === conn.toStepId);
                        if (!targetStep) return null;
                        
                        return (
                          <div 
                            key={`failure-${conn.fromStepId}-${conn.toStepId}`}
                            className="flex items-center justify-between px-2 py-1 bg-red-100 dark:bg-red-800/40 rounded text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <XCircle className="h-3 w-3 text-red-600" />
                              <span>{targetStep.name}</span>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 hover:bg-red-200 dark:hover:bg-red-700"
                              onClick={() => {
                                onRemoveConnection(step.id, targetStep.id, 'failure');
                                toast.success('Connection removed');
                              }}
                              title="Remove connection"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* No connections message */}
              {!connections.some(c => c.fromStepId === step.id) && (
                <div className="text-xs text-gray-500 dark:text-gray-400 italic text-center py-2">
                  No connections from this step
                </div>
              )}
            </div>
          )}

          {/* Assumptions */}
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-sm font-semibold">💡 Assumptions ({formData.assumptions.length})</div>
            </div>
            <ul className="space-y-1 mb-2">
              {formData.assumptions.map((assumption, index) => (
                <li key={assumption} className="flex items-center gap-2 bg-green-100 dark:bg-green-800/40 rounded px-2 py-1">
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
              <div className="text-sm font-semibold">❓ Questions ({formData.questions.length})</div>
            </div>
            <ul className="space-y-1 mb-2">
              {formData.questions.map((question, index) => (
                <li key={question} className="flex items-center gap-2 bg-blue-100 dark:bg-blue-800/40 rounded px-2 py-1">
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
            <div className="text-sm font-medium mb-2 block">
              📸 Screenshots ({formData.imageUrls.length})
            </div>
            {formData.imageUrls.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 mb-2">
                {formData.imageUrls.map((imageUrl, index) => (
                  <div key={imageUrl} className="relative border rounded-md p-1 bg-gray-50 dark:bg-gray-800">
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

        <DialogFooter className="sticky bottom-0 shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] px-6 py-4 z-10">
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
    alias: PropTypes.string,
    description: PropTypes.string,
    type: PropTypes.oneOf(['state', 'rule', 'behavior']),
    assumptions: PropTypes.arrayOf(PropTypes.string),
    questions: PropTypes.arrayOf(PropTypes.string),
    imageUrls: PropTypes.arrayOf(PropTypes.string),
    imageCaptions: PropTypes.arrayOf(PropTypes.string)
  }),
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  allSteps: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    parentId: PropTypes.string
  })),
  connections: PropTypes.arrayOf(PropTypes.shape({
    fromStepId: PropTypes.string.isRequired,
    toStepId: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['success', 'failure']).isRequired
  })),
  onRemoveConnection: PropTypes.func,
  onAddConnection: PropTypes.func,
  onAddStep: PropTypes.func,
  dictionaryHook: PropTypes.object
};

export default EditStepOverlay;
