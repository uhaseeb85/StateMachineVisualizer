import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import ExcelJS from 'exceljs';
import { Check, Download, Plus, RotateCcw, Search, Trash2, Upload, X } from 'lucide-react';

const DictionaryModal = ({
  isOpen,
  title,
  dictionary,
  onClose,
  onDictionaryChange,
  entryLabel = 'Entry',
  keyField = 'key',
  valueField = 'description',
  requiredHeaders = ['key', 'description'],
}) => {
  const [workingDict, setWorkingDict] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [editingKey, setEditingKey] = useState(null);
  const [editKeyValue, setEditKeyValue] = useState('');
  const [editValueValue, setEditValueValue] = useState('');
  const [lastAction, setLastAction] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setWorkingDict(dictionary || {});
    setLastAction(null);
  }, [dictionary]);

  const entries = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return Object.entries(workingDict)
      .filter(([k, v]) =>
        !term || k.toLowerCase().includes(term) || (v && String(v).toLowerCase().includes(term))
      )
      .sort((a, b) => a[0].localeCompare(b[0]));
  }, [workingDict, searchTerm]);

  const persistDictionary = async (nextDict, actionType = null, prevDict = null) => {
    setWorkingDict(nextDict);
    await onDictionaryChange(nextDict);
    if (actionType && prevDict) {
      setLastAction({ prevDict, actionType });
    }
  };

  const handleAdd = async () => {
    const key = newKey.trim();
    const value = newValue.trim();
    if (!key || !value) {
      toast.error(`Please provide both ${entryLabel.toLowerCase()} and description`);
      return;
    }
    if (workingDict[key] && editingKey !== key) {
      toast.error(`${entryLabel} "${key}" already exists`);
      return;
    }
    const nextDict = { ...workingDict, [key]: value };
    await persistDictionary(nextDict);
    setNewKey('');
    setNewValue('');
  };

  const startEdit = (key) => {
    setEditingKey(key);
    setEditKeyValue(key);
    setEditValueValue(workingDict[key] || '');
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditKeyValue('');
    setEditValueValue('');
  };

  const saveEdit = async () => {
    const trimmedKey = editKeyValue.trim();
    const trimmedValue = editValueValue.trim();
    if (!trimmedKey || !trimmedValue) {
      toast.error('Both fields are required');
      return;
    }
    if (trimmedKey !== editingKey && workingDict[trimmedKey]) {
      toast.error(`${entryLabel} "${trimmedKey}" already exists`);
      return;
    }
    const nextDict = { ...workingDict };
    delete nextDict[editingKey];
    nextDict[trimmedKey] = trimmedValue;
    await persistDictionary(nextDict);
    cancelEdit();
  };

  const handleDelete = async (key) => {
    const confirmed = window.confirm(`Delete ${entryLabel.toLowerCase()} "${key}"?`);
    if (!confirmed) return;
    const prevDict = { ...workingDict };
    const nextDict = { ...workingDict };
    delete nextDict[key];
    await persistDictionary(nextDict, 'delete', prevDict);
    toast.success(`${entryLabel} deleted`);
  };

  const handleClearAll = async () => {
    if (Object.keys(workingDict).length === 0) return;
    const confirmed = window.confirm(`Clear all ${entryLabel.toLowerCase()} entries?`);
    if (!confirmed) return;
    const prevDict = { ...workingDict };
    await persistDictionary({}, 'clear', prevDict);
    toast.success('All entries cleared');
  };

  const handleUndo = async () => {
    if (!lastAction) return;
    await persistDictionary(lastAction.prevDict);
    setLastAction(null);
    toast.success('Undo applied');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const parseHeaders = (headerRow) => headerRow.map((h) => (h ? String(h).trim().toLowerCase() : ''));

  const handleImport = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['xlsx', 'xls'].includes(ext)) {
        toast.error('Please upload a valid Excel file (.xlsx or .xls)');
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const buffer = e.target.result;
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(buffer);
          const sheet = workbook.worksheets[0];
          const rows = [];
          const headers = [];

          sheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) {
              row.eachCell((cell) => headers.push(cell.value));
            } else {
              const rowData = {};
              row.eachCell((cell, colNumber) => {
                rowData[headers[colNumber - 1]] = cell.value;
              });
              rows.push(rowData);
            }
          });

          if (rows.length === 0) {
            toast.error('The Excel file is empty');
            return;
          }

          const normalizedHeaders = parseHeaders(headers);
          const hasHeaders = requiredHeaders.every((h) => normalizedHeaders.includes(h));
          if (!hasHeaders) {
            toast.error(`Excel must contain columns: ${requiredHeaders.join(', ')}`);
            return;
          }

          const normalizedRows = rows.map((row) => {
            const keys = Object.keys(row);
            const normalizedRow = {};
            keys.forEach((k) => {
              normalizedRow[String(k).trim().toLowerCase()] = row[k];
            });
            return normalizedRow;
          });

          const nextDict = {};
          normalizedRows.forEach((row) => {
            const key = row[keyField];
            const value = row[valueField];
            if (key && value) {
              nextDict[String(key).trim()] = String(value).trim();
            }
          });

          if (Object.keys(nextDict).length === 0) {
            toast.error('No valid entries found in the Excel file');
            return;
          }

          const prevDict = { ...workingDict };
          await persistDictionary(nextDict, 'import', prevDict);
          toast.success(`Imported ${Object.keys(nextDict).length} entries`);
        } catch (err) {
          console.error('Import error:', err);
          toast.error(`Error processing Excel file: ${err.message}`);
        } finally {
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error importing dictionary:', error);
      toast.error(`Error importing dictionary: ${error.message}`);
    }
  };

  const handleExport = async () => {
    if (!entries.length) {
      toast.error('Nothing to export');
      return;
    }
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Dictionary');
      sheet.columns = [
        { header: requiredHeaders[0], key: 'key', width: 40 },
        { header: requiredHeaders[1], key: 'description', width: 80 },
      ];
      entries.forEach(([key, value]) => {
        sheet.addRow({ key, description: value });
      });
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/\s+/g, '_').toLowerCase()}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Exported dictionary');
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Error exporting dictionary: ${error.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-gray-900 w-[90%] h-[85vh] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Manage, search, import, and export {entryLabel.toLowerCase()} entries.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {lastAction && (
              <Button variant="outline" size="sm" onClick={handleUndo} className="gap-1" title="Undo last delete/clear/import">
                <RotateCcw className="h-4 w-4" />
                Undo
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-800 flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder={`Search ${entryLabel.toLowerCase()}s...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleImportClick} className="gap-1">
              <Upload className="h-4 w-4" />
              Import (Excel)
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImport}
            />
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-1">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="destructive" size="sm" onClick={handleClearAll} className="gap-1">
              <Trash2 className="h-4 w-4" />
              Clear All
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <div className="flex items-start gap-2">
            <Input
              placeholder={`${entryLabel} name`}
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="flex-1"
            />
            <textarea
              placeholder="Description"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="flex-[2] min-h-[60px] px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              rows={2}
            />
            <Button onClick={handleAdd} className="gap-1">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            {entries.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 dark:text-gray-400">No entries</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider w-[30%]">
                      {entryLabel}
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider w-[120px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {entries.map(([key, value]) => (
                    <tr key={key} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      {editingKey === key ? (
                        <>
                          <td className="px-3 py-2">
                            <Input
                              value={editKeyValue}
                              onChange={(e) => setEditKeyValue(e.target.value)}
                              className="w-full"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <textarea
                              value={editValueValue}
                              onChange={(e) => setEditValueValue(e.target.value)}
                              className="w-full min-h-[60px] px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                              rows={2}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-end gap-2">
                              <Button size="sm" onClick={saveEdit} className="gap-1">
                                <Check className="h-4 w-4" />
                                Save
                              </Button>
                              <Button size="sm" variant="ghost" onClick={cancelEdit}>
                                Cancel
                              </Button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-2">
                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{key}</p>
                          </td>
                          <td className="px-3 py-2">
                            <p className="text-sm text-gray-600 dark:text-gray-300 break-words">{value}</p>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => startEdit(key)}>
                                Edit
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDelete(key)} className="gap-1">
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </Button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

DictionaryModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  dictionary: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onDictionaryChange: PropTypes.func.isRequired,
  entryLabel: PropTypes.string,
  keyField: PropTypes.string,
  valueField: PropTypes.string,
  requiredHeaders: PropTypes.arrayOf(PropTypes.string),
};

export default DictionaryModal;
