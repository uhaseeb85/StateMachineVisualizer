import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Plus, 
  Download, 
  FileDown, 
  AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import ExcelJS from 'exceljs';
import storage from '@/utils/storageWrapper';

const DictionaryManagementModal = ({
  isOpen,
  onClose,
  initialTab = 'states',
  ruleDictionary,
  setRuleDictionary,
  stateDictionary,
  setStateDictionary,
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [editingKey, setEditingKey] = useState(null);
  const [editingData, setEditingData] = useState({ key: '', description: '' });
  const [isAdding, setIsAdding] = useState(false);

  // Sync activeTab when initialTab changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const currentDictionary = activeTab === 'states' ? stateDictionary : ruleDictionary;
  const setCurrentDictionary = activeTab === 'states' ? setStateDictionary : setRuleDictionary;
  const storageKey = activeTab === 'states' ? 'stateDictionary' : 'ruleDictionary';
  const itemLabel = activeTab === 'states' ? 'State' : 'Rule';
  const keyHeader = activeTab === 'states' ? 'state' : 'rule';

  // Convert dictionary object to sorted array for display
  const dictionaryArray = Object.entries(currentDictionary || {})
    .map(([key, description]) => ({ key, description }))
    .sort((a, b) => a.key.localeCompare(b.key));

  const handleEditStart = (item) => {
    setEditingKey(item.key);
    setEditingData({ ...item });
    setIsAdding(false);
  };

  const handleEditCancel = () => {
    setEditingKey(null);
    setEditingData({ key: '', description: '' });
    setIsAdding(false);
  };

  const handleSave = async () => {
    if (!editingData.key.trim()) {
      toast.error(`${itemLabel} name cannot be empty`);
      return;
    }

    const newDict = { ...currentDictionary };

    // If we're renaming an existing key or adding a new one
    if (editingKey && editingKey !== editingData.key) {
      delete newDict[editingKey];
    }

    // Check for duplicates if adding or renaming
    if ((isAdding || editingKey !== editingData.key) && newDict[editingData.key.trim()]) {
      toast.error(`${itemLabel} "${editingData.key.trim()}" already exists`);
      return;
    }

    newDict[editingData.key.trim()] = editingData.description;
    
    setCurrentDictionary(newDict);
    await storage.setItem(storageKey, newDict);
    
    toast.success(`${itemLabel} saved successfully`);
    handleEditCancel();
  };

  const handleDelete = async (key) => {
    const newDict = { ...currentDictionary };
    delete newDict[key];
    
    setCurrentDictionary(newDict);
    await storage.setItem(storageKey, newDict);
    
    toast.success(`${itemLabel} deleted`);
  };

  const handleAddStart = () => {
    setEditingKey('NEW_ENTRY');
    setEditingData({ key: '', description: '' });
    setIsAdding(true);
  };

  const handleClearAll = async () => {
    if (window.confirm(`Are you sure you want to clear the entire ${activeTab === 'states' ? 'state' : 'rule'} dictionary?`)) {
      setCurrentDictionary({});
      await storage.setItem(storageKey, {});
      toast.success(`${itemLabel} dictionary cleared`);
    }
  };

  const handleExport = async () => {
    const fileName = window.prompt(`Enter filename for ${activeTab} dictionary:`, `${activeTab}_dictionary`);
    if (fileName === null) return; // Cancelled

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(activeTab === 'states' ? 'States' : 'Rules');
      
      worksheet.columns = [
        { header: keyHeader, key: 'key', width: 30 },
        { header: 'description', key: 'description', width: 50 },
      ];

      // Styling header
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      dictionaryArray.forEach(item => {
        worksheet.addRow(item);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName || (activeTab + '_dictionary')}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      
      toast.success('Dictionary exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export dictionary');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Template');
      
      worksheet.columns = [
        { header: keyHeader, key: 'key', width: 30 },
        { header: 'description', key: 'description', width: 50 },
      ];

      worksheet.getRow(1).font = { bold: true };
      
      // Sample data
      if (activeTab === 'states') {
        worksheet.addRow({ key: 'InitialState', description: 'The starting point of the application flow.' });
        worksheet.addRow({ key: 'Authenticated', description: 'User has successfully logged in.' });
      } else {
        worksheet.addRow({ key: 'LoginSuccess', description: 'Triggered when credentials are valid.' });
        worksheet.addRow({ key: 'LogoutRequested', description: 'Triggered when user clicks logout.' });
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${activeTab}_dictionary_template.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      
      toast.success('Template downloaded');
    } catch (error) {
      console.error('Template error:', error);
      toast.error('Failed to download template');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-gray-950">
        <DialogHeader className="p-6 pb-2 border-b shrink-0">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <FileDown className="w-6 h-6 text-blue-500" />
            Dictionary Management
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto flex flex-col p-6 pt-2 min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="w-fit mb-4 bg-gray-100 dark:bg-gray-800 shrink-0">
              <TabsTrigger value="states" className="px-6">State Dictionary</TabsTrigger>
              <TabsTrigger value="rules" className="px-6">Rule Dictionary</TabsTrigger>
            </TabsList>

            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {dictionaryArray.length} entries in {activeTab} dictionary
                </div>
                <Button 
                  onClick={handleAddStart} 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  disabled={!!editingKey}
                >
                  <Plus className="w-4 h-4" />
                  Add Entry
                </Button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto border rounded-lg">
                <Table>
                  <TableHeader className="sticky top-0 bg-gray-50 dark:bg-gray-900 z-10">
                    <TableRow>
                      <TableHead className="w-[30%] capitalize">{keyHeader}</TableHead>
                      <TableHead className="w-[55%]">Description</TableHead>
                      <TableHead className="w-[15%] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isAdding && (
                      <TableRow className="bg-blue-50/50 dark:bg-blue-900/20">
                        <TableCell>
                          <Input 
                            value={editingData.key}
                            onChange={(e) => setEditingData({ ...editingData, key: e.target.value })}
                            placeholder={`Enter ${itemLabel} name`}
                            autoFocus
                          />
                        </TableCell>
                        <TableCell>
                          <Textarea 
                            value={editingData.description}
                            onChange={(e) => setEditingData({ ...editingData, description: e.target.value })}
                            placeholder="Enter description"
                            rows={1}
                            className="min-h-[40px] resize-y"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={handleSave}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleEditCancel}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                    
                    {dictionaryArray.length === 0 && !isAdding ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-32 text-center text-gray-500 italic">
                          No entries found in this dictionary. Load a file or add an entry.
                        </TableCell>
                      </TableRow>
                    ) : (
                      dictionaryArray.map((item) => (
                        <TableRow key={item.key} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                          <TableCell className="font-medium">
                            {editingKey === item.key ? (
                              <Input 
                                value={editingData.key}
                                onChange={(e) => setEditingData({ ...editingData, key: e.target.value })}
                              />
                            ) : item.key}
                          </TableCell>
                          <TableCell className="text-gray-600 dark:text-gray-400">
                            {editingKey === item.key ? (
                              <Textarea 
                                value={editingData.description}
                                onChange={(e) => setEditingData({ ...editingData, description: e.target.value })}
                                className="min-h-[40px] resize-y"
                              />
                            ) : item.description}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end items-center gap-1">
                              {editingKey === item.key ? (
                                <>
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={handleSave}>
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleEditCancel}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-8 w-8 text-blue-600 hover:bg-blue-50" 
                                    onClick={() => handleEditStart(item)}
                                    disabled={!!editingKey}
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-8 w-8 text-red-600 hover:bg-red-50" 
                                    onClick={() => handleDelete(item.key)}
                                    disabled={!!editingKey}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </Tabs>
        </div>

        <DialogFooter className="p-6 pt-2 border-t shrink-0 flex items-center justify-between sm:justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleDownloadTemplate}>
              <Download className="w-4 h-4" />
              Download Template
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleExport} disabled={dictionaryArray.length === 0}>
              <FileDown className="w-4 h-4" />
              Export to Excel
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleClearAll} disabled={dictionaryArray.length === 0}>
              Clear All
            </Button>
            <Button onClick={onClose} variant="outline" size="sm" className="px-6">
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

DictionaryManagementModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialTab: PropTypes.string,
  ruleDictionary: PropTypes.object,
  setRuleDictionary: PropTypes.func.isRequired,
  stateDictionary: PropTypes.object,
  setStateDictionary: PropTypes.func.isRequired,
};

export default DictionaryManagementModal;
