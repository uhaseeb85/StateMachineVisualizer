/**
 * ConvertToStateMachineWelcomeModal.jsx
 * 
 * Welcome modal explaining Convert to State Machine CSV features
 * with tabs for different aspects of the conversion process.
 */
import { useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileSpreadsheet, Network, Sparkles, Book, Filter, Download } from 'lucide-react';

const ConvertToStateMachineWelcomeModal = ({ isOpen, onClose }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('flowDiagram_hideConvertWelcome', 'true');
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileSpreadsheet className="w-6 h-6" />
            Welcome to Convert to State Machine CSV
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="types">Step Types</TabsTrigger>
            <TabsTrigger value="classify">Classify</TabsTrigger>
            <TabsTrigger value="dictionaries">Dictionaries</TabsTrigger>
            <TabsTrigger value="filters">Filters</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="w-8 h-8 text-blue-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">What is CSV Conversion?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This feature converts your flow diagram into a state machine CSV format that can be
                  imported into other tools. The CSV contains rows with Source Nodes, Destination Nodes,
                  Rule Lists, Priority, and Operations.
                </p>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium mb-2">Key Features:</h4>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span><strong>Step Classification:</strong> Categorize steps as States, Rules, or Behaviors</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span><strong>Auto-Detection:</strong> Automatically classify steps based on keywords</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span><strong>Dictionaries:</strong> Map flow diagram names to state machine names</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span><strong>Root Selection:</strong> Choose which parts of your diagram to convert</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span><strong>Inline Editing:</strong> Edit the CSV preview before exporting</span>
                </li>
              </ul>
            </div>
          </TabsContent>

          {/* Step Types Tab */}
          <TabsContent value="types" className="space-y-4">
            <div className="flex items-start gap-3">
              <Network className="w-8 h-8 text-purple-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Understanding Step Types</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Steps are classified into three types, each serving a different purpose in the state machine:
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* State Type */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <h4 className="font-semibold">State (Default)</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Main flow nodes that appear as Source and Destination nodes in the CSV.
                  These represent the primary states in your state machine.
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 text-xs font-mono">
                  Examples: "Login Page", "Dashboard", "Profile Screen", "Checkout"
                </div>
              </div>

              {/* Rule Type */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-600 text-white">
                    RULE
                  </span>
                  <h4 className="font-semibold">Rule</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Conditions and validation logic that appear in the Rule List column. These determine
                  when transitions between states occur.
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 text-xs font-mono">
                  Examples: "is eligible for SSN", "has valid credentials", "can proceed", "should verify"
                </div>
              </div>

              {/* Behavior Type */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-600 text-white">
                    BEHAVIOR
                  </span>
                  <h4 className="font-semibold">Behavior</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Actions and outcomes that are <strong>skipped</strong> during CSV generation. These represent
                  user actions or system behaviors that occur between states but don't appear as nodes.
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 text-xs font-mono mb-2">
                  Examples: "customer enters SSN", "user clicks submit", "system provides confirmation"
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded p-2 text-xs">
                  <strong>⚠️ Important:</strong> If a behavior is directly connected to a state without a rule,
                  it will be flagged with <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">&#123;BEHAVIOR: ...&#125;</code> in the CSV.
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Classification Tab */}
          <TabsContent value="classify" className="space-y-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-8 h-8 text-amber-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Step Classification</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You can classify steps manually, use auto-detection, or customize detection rules to speed up the process.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Manual Classification */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span>Manual Classification</span>
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  In the <strong>Step Classification</strong> section, you'll see a table with all your steps.
                  Click the buttons next to each step to classify it:
                </p>
                <div className="flex items-center justify-center gap-2 mb-2 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <Button size="sm" className="h-7 px-3">State</Button>
                  <Button size="sm" className="h-7 px-3">Rule</Button>
                  <Button size="sm" className="h-7 px-3">Behavior</Button>
                </div>
              </div>

              {/* Custom Classification Rules */}
              <div className="border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 bg-indigo-50 dark:bg-indigo-950/30">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  ⚙️
                  <span>Customize Detection Rules</span>
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  The <strong>Classification Rules</strong> tab allows you to customize the keywords used for auto-detection. You can:
                </p>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>• Add or remove <strong>Behavior Keywords</strong> (e.g., "clicks", "enters")</li>
                  <li>• Add or remove <strong>Rule Keywords</strong> (e.g., "has", "verify")</li>
                  <li>• <strong>Export</strong> your custom rules as JSON for reuse</li>
                  <li>• <strong>Import</strong> previously saved rules</li>
                  <li>• <strong>Restore</strong> default built-in rules anytime</li>
                </ul>
              </div>

              {/* Auto-Detection */}
              <div className="border border-amber-200 dark:border-amber-800 rounded-lg p-4 bg-amber-50 dark:bg-amber-950/30">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Auto-Detection Rules</span>
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Click the <strong>"Auto-Detect Types"</strong> button to automatically classify steps based on
                  naming conventions:
                </p>
                <div className="space-y-3 mt-2 text-xs">
                  <div>
                    <strong className="text-blue-600 dark:text-blue-400">State Keywords & Rules:</strong>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 mt-1 font-mono">
                      • Starts with "ask" (e.g., "ask user for SSN")<br />
                      • ALL CAPS names (e.g., "DASHBOARD")<br />
                      • Keywords: page, screen, view, dashboard, modal, popup, tab, window
                    </div>
                  </div>
                  <div>
                    <strong className="text-amber-600 dark:text-amber-400">Behavior Keywords:</strong>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 mt-1 font-mono">
                      answers, choose, chooses, click, clicks, customer, enter, enters, input, inputs, provide, provides, response, select, selects, submit, submits, upload, uploads
                    </div>
                  </div>
                  <div>
                    <strong className="text-purple-600 dark:text-purple-400">Rule Keywords:</strong>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 mt-1 font-mono">
                      is eligible, has, can, should, verify, verifies, check, checks, validate, validates
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  The classification follows this order: Priority Rules (State) → State Keywords → Behavior Keywords → Rule Keywords.
                </p>
              </div>

              {/* Type Counts */}
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  The classification section shows counts: <strong>X States • Y Rules • Z Behaviors</strong>
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Dictionaries Tab */}
          <TabsContent value="dictionaries" className="space-y-4">
            <div className="flex items-start gap-3">
              <Book className="w-8 h-8 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Name Mapping Dictionaries</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Dictionaries map your flow diagram step names to cleaner state machine names in the CSV.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Why Use Dictionaries?</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Your flow diagram might have verbose descriptive names like "Customer enters Social Security Number",
                  but your state machine CSV might need shorter names like "ENTER_SSN" or "ProvideSSN".
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 rounded p-3 text-xs">
                  <strong>Example Mapping:</strong>
                  <div className="mt-2 space-y-1 font-mono">
                    <div>"Login Page" → "LOGIN"</div>
                    <div>"User Dashboard Screen" → "DASHBOARD"</div>
                    <div>"is eligible for benefits" → "CHECK_ELIGIBILITY"</div>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Two Dictionary Types</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span><strong>State Dictionary:</strong> Maps state-type steps to their CSV names</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 font-bold">•</span>
                    <span><strong>Rule Dictionary:</strong> Maps rule-type steps to their CSV names</span>
                  </li>
                </ul>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Note: Behaviors are excluded from both dictionaries since they don't appear in the CSV.
                </p>
              </div>

              <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-950/30">
                <h4 className="font-semibold mb-2">Managing Dictionaries</h4>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>• Add, edit, or delete entries directly in the table</li>
                  <li>• Import dictionary JSON files from previous sessions</li>
                  <li>• Export dictionaries to reuse across projects</li>
                  <li>• Dictionaries are automatically saved to browser storage</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          {/* Filters Tab */}
          <TabsContent value="filters" className="space-y-4">
            <div className="flex items-start gap-3">
              <Filter className="w-8 h-8 text-orange-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Root Steps Selection</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Control which parts of your flow diagram are included in the CSV conversion.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-semibold mb-2">What are Root Steps?</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Root steps are top-level steps without parents. In a hierarchical flow diagram,
                  selecting a root step includes it and all its children (substeps) in the conversion.
                </p>
              </div>

              <div className="border border-orange-200 dark:border-orange-800 rounded-lg p-4 bg-orange-50 dark:bg-orange-950/30">
                <h4 className="font-semibold mb-2">How to Use</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold">1.</span>
                    <span>Click the <strong>Root Steps Selection</strong> tab</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold">2.</span>
                    <span>Check/uncheck root steps to include/exclude them</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold">3.</span>
                    <span>Use "Select All" / "Deselect All" for bulk operations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold">4.</span>
                    <span>The "Descendants" column shows how many substeps each root has</span>
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <strong>💡 Tip:</strong> If your diagram has multiple independent flows, you can convert
                  them separately by selecting only the relevant root steps.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4">
            <div className="flex items-start gap-3">
              <Download className="w-8 h-8 text-indigo-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">CSV Preview & Export</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Review and edit the generated CSV before downloading.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-semibold mb-2">CSV Structure</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  The generated CSV contains these columns:
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 rounded p-3 text-xs font-mono space-y-1">
                  <div><strong>Source Node:</strong> Starting state</div>
                  <div><strong>Destination Node:</strong> Ending state</div>
                  <div><strong>Rule List:</strong> Conditions (or "TRUE" for direct connections)</div>
                  <div><strong>Priority:</strong> Order of rules (0, 1, 2...)</div>
                  <div><strong>Operation / Edge Effect:</strong> Optional notes</div>
                </div>
              </div>

              <div className="border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 bg-indigo-50 dark:bg-indigo-950/30">
                <h4 className="font-semibold mb-2">Inline Editing</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  The CSV preview table is fully editable:
                </p>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>• Click any cell to edit its value</li>
                  <li>• Make last-minute adjustments before export</li>
                  <li>• Changes only affect the export, not your flow diagram</li>
                </ul>
              </div>

              <div className="border border-amber-200 dark:border-amber-800 rounded-lg p-4 bg-amber-50 dark:bg-amber-950/30">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span>⚠️</span>
                  <span>Watch for Behavior Warnings</span>
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  If you see <code className="bg-amber-200 dark:bg-amber-800 px-1 rounded text-xs">&#123;BEHAVIOR: ...&#125;</code> in
                  the Rule List column, it means a behavior step was directly connected without a rule. You should:
                </p>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>1. Go back to classification and reclassify the behavior as a rule, or</li>
                  <li>2. Edit the cell to replace it with a proper rule name</li>
                </ul>
              </div>

              <div className="border border-green-200 dark:border-green-800 rounded-lg p-4 bg-green-50 dark:bg-green-950/30">
                <h4 className="font-semibold mb-2">Ready to Export?</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Click the <strong>"Export CSV"</strong> button to download your state machine CSV file.
                  The file will be named based on your current date/time.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="dont-show-again"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="dont-show-again" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
              Don't show this again
            </label>
          </div>
          <Button onClick={handleClose}>
            Got it!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

ConvertToStateMachineWelcomeModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default ConvertToStateMachineWelcomeModal;
