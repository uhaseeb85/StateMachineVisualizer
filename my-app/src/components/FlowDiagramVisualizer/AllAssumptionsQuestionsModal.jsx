/**
 * AllAssumptionsQuestionsModal.jsx
 * 
 * This modal displays all assumptions and questions across all steps and sub-steps in the flow diagram.
 * Features include:
 * - Organized view of assumptions and questions by step
 * - Filtering options
 * - Export to Excel functionality
 */

import PropTypes from 'prop-types';
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, HelpCircle, FileSpreadsheet, Search, X } from 'lucide-react';
import * as XLSX from 'xlsx';

/**
 * AllAssumptionsQuestionsModal Component
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to close the modal
 * @param {Array} props.steps - All steps in the flow diagram
 */
const AllAssumptionsQuestionsModal = ({ isOpen, onClose, steps }) => {
    const [activeTab, setActiveTab] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Process steps to extract all assumptions and questions
    const { allItems, assumptions, questions, stepMap } = useMemo(() => {
        const stepMap = new Map();
        const allItems = [];
        const assumptions = [];
        const questions = [];

        // Helper function to get the full path of a step (including parent steps)
        const getStepPath = (step) => {
            let path = [step.name];
            let currentStep = step;

            while (currentStep.parentId) {
                const parentStep = steps.find(s => s.id === currentStep.parentId);
                if (parentStep) {
                    path.unshift(parentStep.name);
                    currentStep = parentStep;
                } else {
                    break;
                }
            }

            return path.join(" → ");
        };

        // Process all steps
        steps.forEach(step => {
            const stepPath = getStepPath(step);
            stepMap.set(step.id, { name: step.name, path: stepPath });

            // Process assumptions
            if (step.assumptions && step.assumptions.length > 0) {
                step.assumptions.forEach((assumption, index) => {
                    const item = {
                        type: 'assumption',
                        content: assumption,
                        stepId: step.id,
                        stepName: step.name,
                        stepPath,
                        index: index + 1
                    };
                    allItems.push(item);
                    assumptions.push(item);
                });
            }

            // Process questions
            if (step.questions && step.questions.length > 0) {
                step.questions.forEach((question, index) => {
                    const item = {
                        type: 'question',
                        content: question,
                        stepId: step.id,
                        stepName: step.name,
                        stepPath,
                        index: index + 1
                    };
                    allItems.push(item);
                    questions.push(item);
                });
            }
        });

        return { allItems, assumptions, questions, stepMap };
    }, [steps]);

    // Filter items based on search query
    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) {
            switch (activeTab) {
                case "assumptions": return assumptions;
                case "questions": return questions;
                default: return allItems;
            }
        }

        const query = searchQuery.toLowerCase();
        const items = activeTab === "assumptions" ? assumptions :
            activeTab === "questions" ? questions :
                allItems;

        return items.filter(item =>
            item.content.toLowerCase().includes(query) ||
            item.stepName.toLowerCase().includes(query) ||
            item.stepPath.toLowerCase().includes(query)
        );
    }, [allItems, assumptions, questions, activeTab, searchQuery]);

    // Group items by step for better organization
    const groupedItems = useMemo(() => {
        const grouped = new Map();

        filteredItems.forEach(item => {
            if (!grouped.has(item.stepId)) {
                grouped.set(item.stepId, {
                    stepName: item.stepName,
                    stepPath: item.stepPath,
                    assumptions: [],
                    questions: []
                });
            }

            const stepGroup = grouped.get(item.stepId);
            if (item.type === 'assumption') {
                stepGroup.assumptions.push(item);
            } else {
                stepGroup.questions.push(item);
            }
        });

        return Array.from(grouped.values());
    }, [filteredItems]);

    // Export to Excel
    const handleExportExcel = () => {
        // Prepare data for Excel export
        const excelData = [];

        // Add header row
        excelData.push(['Step', 'Type', 'Content']);

        // Add data rows
        filteredItems.forEach(item => {
            excelData.push([
                item.stepPath,
                item.type === 'assumption' ? 'Assumption' : 'Question',
                item.content
            ]);
        });

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(excelData);

        // Set column widths
        ws['!cols'] = [
            { wch: 40 }, // Step column
            { wch: 15 }, // Type column
            { wch: 60 }  // Content column
        ];

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Assumptions & Questions');

        // Generate filename
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `flow-diagram-assumptions-questions-${timestamp}.xlsx`;

        // Save the file
        XLSX.writeFile(wb, filename);
    };

    // Clear search query
    const handleClearSearch = () => {
        setSearchQuery("");
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[90vw] max-w-[1000px] h-[80vh] max-h-[800px] flex flex-col bg-white dark:bg-gray-900">
                <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <div className="flex justify-between items-center">
                        <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
                            <ClipboardList className="h-6 w-6 text-amber-600" />
                            <span>All Assumptions & Questions</span>
                        </DialogTitle>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExportExcel}
                                disabled={filteredItems.length === 0}
                                className="flex items-center gap-1"
                            >
                                <FileSpreadsheet className="h-4 w-4" />
                                <span>Export Excel</span>
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 flex flex-col overflow-hidden py-4">
                    {/* Search and Filter Controls */}
                    <div className="flex items-center gap-4 mb-4 px-1">
                        <div className="relative flex-1">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search assumptions and questions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8 pr-8"
                            />
                            {searchQuery && (
                                <button
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    onClick={handleClearSearch}
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
                            <TabsList className="grid grid-cols-3">
                                <TabsTrigger value="all">All ({allItems.length})</TabsTrigger>
                                <TabsTrigger value="assumptions">Assumptions ({assumptions.length})</TabsTrigger>
                                <TabsTrigger value="questions">Questions ({questions.length})</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto pr-2">
                        {filteredItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                <ClipboardList className="h-12 w-12 mb-2 opacity-30" />
                                <p>No items found</p>
                                {searchQuery && (
                                    <p className="text-sm mt-1">Try adjusting your search query</p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {groupedItems.map((group, groupIndex) => (
                                    <div key={groupIndex} className="border rounded-lg overflow-hidden">
                                        {/* Step Header */}
                                        <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                                            <h3 className="font-medium">{group.stepPath}</h3>
                                        </div>

                                        {/* Step Content */}
                                        <div className="p-4 space-y-4">
                                            {/* Assumptions */}
                                            {(activeTab === "all" || activeTab === "assumptions") && group.assumptions.length > 0 && (
                                                <div className="space-y-2">
                                                    <h4 className="text-sm font-medium flex items-center gap-1 text-green-700 dark:text-green-400">
                                                        <ClipboardList className="h-4 w-4" />
                                                        <span>Assumptions</span>
                                                    </h4>
                                                    <ul className="space-y-1 pl-6 list-disc">
                                                        {group.assumptions.map((item, i) => (
                                                            <li key={i} className="text-green-800 dark:text-green-300">
                                                                <span>{item.content}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Questions */}
                                            {(activeTab === "all" || activeTab === "questions") && group.questions.length > 0 && (
                                                <div className="space-y-2">
                                                    <h4 className="text-sm font-medium flex items-center gap-1 text-blue-700 dark:text-blue-400">
                                                        <HelpCircle className="h-4 w-4" />
                                                        <span>Questions</span>
                                                    </h4>
                                                    <ul className="space-y-1 pl-6 list-disc">
                                                        {group.questions.map((item, i) => (
                                                            <li key={i} className="text-blue-800 dark:text-blue-300">
                                                                <span>{item.content}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex justify-between w-full">
                        <div className="text-sm text-gray-500">
                            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} found
                        </div>
                        <Button onClick={onClose}>Close</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

AllAssumptionsQuestionsModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    steps: PropTypes.array.isRequired
};

export default AllAssumptionsQuestionsModal;