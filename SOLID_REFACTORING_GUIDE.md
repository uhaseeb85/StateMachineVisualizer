# SOLID Refactoring Implementation Guide

## 📚 Overview

This guide provides step-by-step instructions to complete the SOLID refactoring of StateMachineVisualizer. **Phase 1 is complete**, and **Phase 2 is 60% complete**. This document will help you finish the remaining work.

---

## ✅ What's Already Done

### Phase 1: Service Architecture (100% Complete)
- ✅ All service interfaces and implementations created
- ✅ Dependency injection context (ServicesProvider) established
- ✅ File parsing services with Strategy pattern
- ✅ Export services with Strategy pattern
- ✅ Storage and notification services abstracted

### Phase 2: Decompose God Objects (60% Complete)
- ✅ useStateMachine split into 7 focused hooks
- ✅ useStateMachineOrchestrator provides unified interface
- ✅ Change log, theme, and validation services created
- ✅ ExportDialog and ModalManager components extracted
- ✅ Storage keys centralized
- ✅ Business logic services for rules (RuleNavigationService, RuleDescriptionParser)

---

## 🎯 How to Complete the Remaining Work

### Phase 2: Complete Component Decomposition (40% Remaining)

#### Step 1: Update index.jsx to Use New Orchestrator Hook

**File**: [my-app/src/components/StateMachineVisualizer/index.jsx](my-app/src/components/StateMachineVisualizer/index.jsx)

**Current**: Uses old `useStateMachine` hook  
**Target**: Use new `useStateMachineOrchestrator` hook

```javascript
// BEFORE (line 36)
import useStateMachine from './hooks/useStateMachine';

// AFTER
import useStateMachineOrchestrator from './hooks/useStateMachineOrchestrator';

// BEFORE (line 62)
const {
  states,
  setStates,
  // ... 20+ values
} = useStateMachine();

// AFTER
const {
  states,
  setStates,
  // ... same interface, but using new implementation
} = useStateMachineOrchestrator();
```

**Verification**: Run `npm run build` and check for errors. The interface is identical, so no other changes needed.

---

#### Step 2: Integrate ModalManager Component

**File**: [my-app/src/components/StateMachineVisualizer/index.jsx](my-app/src/components/StateMachineVisualizer/index.jsx)

**Location**: Lines 521-832 (replace individual modal components)

**Before**:
```javascript
{/* Simulation Modal */}
<SimulationModal ... />

{/* Path Finder Modal */}
<PathFinderModal ... />

// ... 7 more modals
```

**After**:
```javascript
import ModalManager from './components/ModalManager';

// In JSX:
<ModalManager
  // Visibility states
  showSimulation={showSimulation}
  showPathFinder={showPathFinder}
  showUserGuide={showUserGuide}
  showChangeLog={showChangeLog}
  showSplunkConfig={showSplunkConfig}
  showGraphSplitter={showGraphSplitter}
  showStateMachineComparer={showStateMachineComparer}
  showExportDialog={showExportDialog}
  showImportConfirm={showImportConfirm}
  
  // Close handlers
  onCloseSimulation={() => setShowSimulation(false)}
  onClosePathFinder={() => setShowPathFinder(false)}
  onCloseUserGuide={() => setShowUserGuide(false)}
  onCloseChangeLog={() => setShowChangeLog(false)}
  onCloseSplunkConfig={() => setShowSplunkConfig(false)}
  onCloseGraphSplitter={() => setShowGraphSplitter(false)}
  onCloseStateMachineComparer={() => setShowStateMachineComparer(false)}
  onCloseExportDialog={() => setShowExportDialog(false)}
  onCloseImportConfirm={() => setShowImportConfirm(false)}
  
  // Props for each modal
  simulationProps={{
    states,
    simulationState,
    startSimulation,
    // ... other simulation props
  }}
  pathFinderProps={{ states }}
  changeLogProps={{ changeLog, setChangeLog }}
  graphSplitterProps={{ states, setStates, addToChangeLog }}
  comparerProps={{ states }}
  exportDialogProps={{
    filename: exportFileName,
    onFilenameChange: setExportFileName,
    onConfirm: () => {
      // export logic
      setShowExportDialog(false);
    }
  }}
  importConfirmProps={{
    fileName: importFileName,
    isDuplicate: isDuplicateName,
    onConfirm: () => {
      // import logic
      setShowImportConfirm(false);
    }
  }}
/>
```

**Benefit**: Reduces index.jsx by ~300 lines

---

#### Step 3: Extract RulesPanel Sub-Components (HIGHEST PRIORITY)

**Current**: RulesPanel.jsx (851 lines)  
**Target**: <300 lines main component + sub-components

##### 3a. Create RulesList Component

**File**: [my-app/src/components/StateMachineVisualizer/components/RulesPanel/RulesList.jsx](my-app/src/components/StateMachineVisualizer/components/RulesPanel/RulesList.jsx)

**Extract from**: RulesPanel.jsx lines 185-270

```javascript
/**
 * RulesList.jsx - Displays list of rules for a state
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Trash2, Copy, Plus, MoveUp, MoveDown } from 'lucide-react';
import { Button } from "@/components/ui/button";

const RulesList = ({ 
  rules, 
  selectedRuleId,
  onSelectRule,
  onDeleteRule,
  onCopyRule,
  onMoveUp,
  onMoveDown,
  onInsertBefore,
  onInsertAfter,
  onTargetStateClick
}) => {
  return (
    <div className="space-y-2">
      {rules.map((rule, index) => (
        <div 
          key={rule.id}
          className={`rule-item ${selectedRuleId === rule.id ? 'selected' : ''}`}
        >
          {/* Rule display content */}
          {/* Action buttons */}
        </div>
      ))}
    </div>
  );
};

export default RulesList;
```

##### 3b. Create RuleEditor Component

**File**: [my-app/src/components/StateMachineVisualizer/components/RulesPanel/RuleEditor.jsx](my-app/src/components/StateMachineVisualizer/components/RulesPanel/RuleEditor.jsx)

**Extract from**: RulesPanel.jsx lines 291-475

```javascript
/**
 * RuleEditor.jsx - Form for editing a single rule
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const RuleEditor = ({ 
  rule,
  onChange,
  onSave,
  onCancel,
  states,
  dictionary
}) => {
  return (
    <div className="rule-editor">
      {/* Condition input */}
      {/* Target state select */}
      {/* Priority input */}
      {/* Action buttons */}
    </div>
  );
};

export default RuleEditor;
```

##### 3c. Create RuleToolbar Component

**File**: [my-app/src/components/StateMachineVisualizer/components/RulesPanel/RuleToolbar.jsx](my-app/src/components/StateMachineVisualizer/components/RulesPanel/RuleToolbar.jsx)

**Extract from**: RulesPanel.jsx lines 476-600

```javascript
/**
 * RuleToolbar.jsx - Toolbar for rule operations
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Plus, Upload, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";

const RuleToolbar = ({ 
  onAddRule,
  onImportDictionary,
  onExportDictionary,
  hasRules
}) => {
  return (
    <div className="rule-toolbar flex gap-2">
      <Button onClick={onAddRule}>
        <Plus /> Add Rule
      </Button>
      {/* Other toolbar buttons */}
    </div>
  );
};

export default RuleToolbar;
```

##### 3d. Refactor RulesPanel to Use Sub-Components

**File**: [my-app/src/components/StateMachineVisualizer/RulesPanel.jsx](my-app/src/components/StateMachineVisualizer/RulesPanel.jsx)

```javascript
// Add imports
import RulesList from './components/RulesPanel/RulesList';
import RuleEditor from './components/RulesPanel/RuleEditor';
import RuleToolbar from './components/RulesPanel/RuleToolbar';
import { getRuleNavigationService } from './services/rules/RuleNavigationService';
import { getRuleDescriptionParser } from './services/rules/RuleDescriptionParser';

const RulesPanel = ({ /* props */ }) => {
  // Use services
  const navigationService = getRuleNavigationService();
  const parserService = getRuleDescriptionParser();

  // ... existing state and logic ...

  // Replace inline JSX with components
  return (
    <div className="rules-panel">
      <RuleToolbar
        onAddRule={addRule}
        onImportDictionary={handleImportDictionary}
        onExportDictionary={handleExportDictionary}
        hasRules={selectedState?.rules?.length > 0}
      />
      
      <RulesList
        rules={selectedState?.rules || []}
        selectedRuleId={selectedRuleId}
        onSelectRule={setSelectedRuleId}
        onDeleteRule={deleteRule}
        onCopyRule={copyRule}
        onMoveUp={moveRuleUp}
        onMoveDown={moveRuleDown}
        onInsertBefore={insertRuleBefore}
        onInsertAfter={insertRuleAfter}
        onTargetStateClick={(rulId) => {
          // Use navigation service
          const rule = navigationService.getRuleById(selectedState, ruleId);
          const targetState = navigationService.getTargetState(states, rule);
          if (targetState) {
            onStateSelect(targetState.id);
          }
        }}
      />
      
      {editingRuleId && (
        <RuleEditor
          rule={/* ... */}
          onChange={updateEditingRule}
          onSave={saveRule}
          onCancel={cancelEdit}
          states={states}
          dictionary={loadedDictionary}
        />
      )}
    </div>
  );
};
```

**Verification**: Test rule CRUD operations, dictionary import/export, and navigation

---

#### Step 4: Extract PathFinderModal Sub-Components

**Current**: PathFinderModal.jsx (1034 lines)  
**Target**: <300 lines main component + sub-components

##### 4a. Create PathSearchForm Component

**File**: [my-app/src/components/StateMachineVisualizer/components/PathFinder/PathSearchForm.jsx](my-app/src/components/StateMachineVisualizer/components/PathFinder/PathSearchForm.jsx)

```javascript
/**
 * PathSearchForm.jsx - Input form for source and target states
 */
const PathSearchForm = ({ 
  sourceState,
  targetState,
  onSourceChange,
  onTargetChange,
  onSearch,
  states
}) => {
  // Source/target selection UI
};
```

##### 4b. Create PathResultsView Component

**File**: [my-app/src/components/StateMachineVisualizer/components/PathFinder/PathResultsView.jsx](my-app/src/components/StateMachineVisualizer/components/PathFinder/PathResultsView.jsx)

```javascript
/**
 * PathResultsView.jsx - Display found paths
 */
const PathResultsView = ({ 
  paths,
  onSelectPath,
  selectedPath
}) => {
  // Path visualization
};
```

##### 4c. Create PathFindingService

**File**: [my-app/src/components/StateMachineVisualizer/services/pathfinding/PathFindingService.js](my-app/src/components/StateMachineVisualizer/services/pathfinding/PathFindingService.js)

```javascript
/**
 * PathFindingService.js - Graph traversal algorithms
 */
export class PathFindingService {
  /**
   * Find all paths between two states (BFS/DFS)
   */
  findPaths(states, sourceId, targetId, options = {}) {
    // Breadth-first search implementation
    // Returns array of paths
  }

  /**
   * Find shortest path (Dijkstra/BFS)
   */
  findShortestPath(states, sourceId, targetId) {
    // BFS for unweighted graph
  }

  /**
   * Check if path exists
   */
  pathExists(states, sourceId, targetId) {
    // Quick reachability check
  }
}
```

##### 4d. Refactor PathFinderModal

```javascript
import PathSearchForm from './components/PathFinder/PathSearchForm';
import PathResultsView from './components/PathFinder/PathResultsView';
import { getPathFindingService } from './services/pathfinding/PathFindingService';

const PathFinderModal = ({ isOpen, onClose, states }) => {
  const pathService = getPathFindingService();
  
  const handleSearch = () => {
    const paths = pathService.findPaths(states, sourceId, targetId);
    setPaths(paths);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <PathSearchForm /* props */ />
      <PathResultsView paths={paths} />
    </Dialog>
  );
};
```

---

#### Step 5: Extract StateMachineComparer Sub-Components

**Current**: StateMachineComparer.jsx (1206 lines)  
**Target**: <300 lines main component + sub-components

Follow same pattern as PathFinder:
1. Create `ComparisonView.jsx` - Display comparison table
2. Create `FileSelector.jsx` - File selection UI
3. Create `DiffRenderer.jsx` - Diff visualization
4. Create `StateComparisonService.js` - Diff algorithm

---

#### Step 6: Extract GraphSplitterModal Sub-Components

**Current**: GraphSplitterModal.jsx (1037 lines)  
**Target**: <300 lines main component + sub-components

Follow same pattern:
1. Create `SplitConfigForm.jsx` - Split criteria inputs
2. Create `PreviewPanel.jsx` - Preview resulting graphs
3. Create `SubgraphList.jsx` - Display subgraphs
4. Create `GraphSplittingService.js` - Graph partition algorithms

---

### Phase 3: Apply Interface Segregation (ISP)

#### Step 7: Create Focused Hook Groups

##### For RulesPanel:

**File**: [my-app/src/components/StateMachineVisualizer/hooks/useRuleOperations.js](my-app/src/components/StateMachineVisualizer/hooks/useRuleOperations.js)

```javascript
/**
 * useRuleOperations.js - Rule CRUD operations only
 */
export const useRuleOperations = (states, setStates) => {
  const addRule = (stateId, rule) => { /* ... */ };
  const updateRule = (stateId, ruleId, updates) => { /* ... */ };
  const deleteRule = (stateId, ruleId) => { /* ... */ };
  const copyRule = (stateId, ruleId) => { /* ... */ };
  const moveRule = (stateId, ruleId, direction) => { /* ... */ };

  return { addRule, updateRule, deleteRule, copyRule, moveRule };
};
```

**File**: [my-app/src/components/StateMachineVisualizer/hooks/useRuleDictionary.js](my-app/src/components/StateMachineVisualizer/hooks/useRuleDictionary.js)

```javascript
/**
 * useRuleDictionary.js - Dictionary management only
 */
export const useRuleDictionary = () => {
  const [dictionary, setDictionary] = useState({});
  
  const loadDictionary = async () => { /* ... */ };  const saveDictionary = async () => { /* ... */ };
  const importDictionary = (file) => { /* ... */ };
  const exportDictionary = () => { /* ... */ };

  return { dictionary, loadDictionary, saveDictionary, importDictionary, exportDictionary };
};
```

Then update RulesPanel:

```javascript
// BEFORE (9 props)
const RulesPanel = ({
  states, selectedState, onStateSelect, setStates,
  loadedDictionary, setLoadedDictionary,
  addToChangeLog, loadedStateDictionary, withUndoCapture
}) => { /* ... */ };

// AFTER (3 focused interfaces)
const RulesPanel = ({ stateProps, dictionaryProps, navigationProps }) => {
  const { states, selectedState } = stateProps;
  const { dictionary, loadDictionary } = dictionaryProps;
  const { navigateToState } = navigationProps;
  
  // Use focused hooks internally
  const ruleOps = useRuleOperations(states, setStates);
  const changeLog = useChangeLog();
  
  // Component logic...
};
```

**Benefit**: Components depend only on interfaces they actually use (ISP)

---

### Phase 4: Migrate All Components to Services

#### Step 8: Update All Components to Use Storage Keys

**Find and Replace** across all files:

```javascript
// BEFORE
'ivrFlow'
'stateMachineCurrentFileName'
'changeLog'
'darkMode'
'stateMachine_undoStack'
'ruleDictionary'

// AFTER
import { STORAGE_KEYS } from './constants/storageKeys';

STORAGE_KEYS.IVR_FLOW
STORAGE_KEYS.CURRENT_FILE_NAME
STORAGE_KEYS.CHANGE_LOG
STORAGE_KEYS.DARK_MODE
STORAGE_KEYS.UNDO_STACK
STORAGE_KEYS.RULE_DICTIONARY
```

#### Step 9: Replace Direct Storage Calls with Service

**Find Pattern**:
```javascript
import storage from '@/utils/storageWrapper';
const data = await storage.getItem('key');
```

**Replace With**:
```javascript
import { useStorage } from '../context/ServicesContext';
const storage = useStorage();
const data = await storage.getItem(STORAGE_KEYS.KEY);
```

#### Step 10: Replace Direct Toast Calls with Service

**Find Pattern**:
```javascript
import { toast } from 'sonner';
toast.success('Message');
```

**Replace With**:
```javascript
import { useNotification } from '../context/ServicesContext';
const notification = useNotification();
notification.success('Message');
```

---

### Phase 5: Testing & Cleanup

#### Step 11: Create Unit Tests

**File**: [my-app/src/components/StateMachineVisualizer/services/__tests__/DataValidationService.test.js](my-app/src/components/StateMachineVisualizer/services/__tests__/DataValidationService.test.js)

```javascript
import { DataValidationService } from '../validation/DataValidationService';

describe('DataValidationService', () => {
  let service;

  beforeEach(() => {
    service = new DataValidationService();
  });

  test('validateExcelData - valid data', () => {
    const rows = [
      { 'Source Node': 'A', 'Destination Node': 'B', 'Rule List': 'rule1' }
    ];
    const result = service.validateExcelData(rows);
    expect(result.sourceNodeIndex).toBeDefined();
  });

  test('validateExcelData - missing columns', () => {
    const rows = [{ 'Source': 'A' }];
    expect(() => service.validateExcelData(rows)).toThrow('Missing required column');
  });
});
```

Create similar tests for:
- ExportService
- FileParserRegistry
- RuleNavigationService
- RuleDescriptionParser
- PathFindingService

#### Step 12: Integration Testing

**Test Checklist**:
- [ ] Import CSV file
- [ ] Import Excel file
- [ ] Export to CSV
- [ ] Export to Excel
- [ ] Add state
- [ ] Edit state
- [ ] Delete state (with references - should fail)
- [ ] Add rule
- [ ] Edit rule
- [ ] Delete rule
- [ ] Undo operation
- [ ] Redo operation
- [ ] Save to storage
- [ ] Load from storage
- [ ] Change theme
- [ ] View change log
- [ ] Find path between states
- [ ] Compare state machines
- [ ] Split graph
- [ ] Simulate flow

#### Step 13: Remove Deprecated Code

**Files to Remove**:
- [ ] `hooks/useStateMachine.js` (replaced by orchestrator)
- [ ] Old parseExcelFile logic from utils.js (use FileParserRegistry instead)

**Files to Update**:
- [ ] Remove duplicate export logic from index.jsx (lines 190-477)
- [ ] Clean up unused imports

---

## 🏁 Completion Checklist

### Phase 2: Component Decomposition
- [x] Create focused hooks (7/7 complete)
- [x] Create orchestrator hook
- [x] Create ExportDialog component
- [x] Create ModalManager component
- [x] Create business logic services
- [ ] Update index.jsx to use new hooks
- [ ] Integrate ModalManager
- [ ] Extract RulesPanel sub-components (3 components)
- [ ] Extract PathFinderModal sub-components (3 components + service)
- [ ] Extract StateMachineComparer sub-components (3 components + service)
- [ ] Extract GraphSplitterModal sub-components (3 components + service)

### Phase 3: Interface Segregation
- [ ] Create useRuleOperations hook
- [ ] Create useRuleDictionary hook
- [ ] Create useStateNavigation hook
- [ ] Create useModalManager hook
- [ ] Create useFileOperations hook
- [ ] Create useToolActions hook
- [ ] Update components to use focused interfaces

### Phase 4: Service Migration
- [ ] Migrate all files to STORAGE_KEYS constants
- [ ] Replace direct storage calls with useStorage()
- [ ] Replace direct toast calls with useNotification()
- [ ] Update all components to use services

### Phase 5: Testing & Cleanup
- [ ] Write unit tests for services
- [ ] Run integration tests
- [ ] Remove old useStateMachine.js
- [ ] Remove duplicate code from index.jsx
- [ ] Update documentation

---

## 📊 Expected Outcomes

### Code Size Reduction
| Component | Before | Target | Reduction |
|-----------|--------|--------|-----------|
| index.jsx | 858 | <300 | 65% |
| RulesPanel.jsx | 851 | <300 | 65% |
| PathFinderModal.jsx | 1034 | <300 | 71% |
| StateMachineComparer.jsx | 1206 | <300 | 75% |
| GraphSplitterModal.jsx | 1037 | <300 | 71% |

### SOLID Compliance
- ✅ **SRP**: Every class/hook has one responsibility
- ✅ **OCP**: New parsers/exporters added without modification
- ✅ **LSP**: N/A (no inheritance)
- ✅ **ISP**: Components depend on focused interfaces  
- ✅ **DIP**: All components use injected services

### Testability
- ✅ Services mockable for unit tests
- ✅ Hooks testable in isolation
- ✅ Components testable with mock services

---

## 🆘 Troubleshooting

### Build Errors

**Error**: Cannot find module  
**Solution**: Check import paths use `@/` alias correctly

**Error**: Hook used outside provider  
**Solution**: Ensure component wrapped with `<ServicesProvider>`

### Runtime Errors

**Error**: Storage not working  
**Solution**: Check IndexedDB is enabled in browser

**Error**: useStorage() returns undefined  
**Solution**: Ensure ServicesProvider wraps component tree

### Testing

**Run Tests**: `npm test`  
**Run Build**: `npm run build`  
**Run Dev**: `npm run dev`

---

## 📚 Reference

### Key Files Created
- `context/ServicesContext.jsx` - Dependency injection
- `hooks/useStateMachineOrchestrator.js` - Main hook
- `services/` - 13 service classes
- `constants/storageKeys.js` - Storage keys

### Design Patterns Used
- **Strategy Pattern**: File parsing, export
- **Singleton Pattern**: Service instances
- **Dependency Injection**: Services via context
- **Facade Pattern**: Orchestrator hook
- **Registry Pattern**: Parser/exporter registration

---

## ✨ Success Criteria

Refactoring is complete when:
1. ✅ All files build without errors
2. ✅ All existing features work correctly
3. ✅ No component exceeds 300 lines
4. ✅ No direct storage/toast imports
5. ✅ All tests pass
6. ✅ SOLID principles satisfied

Good luck completing the refactoring! 🚀
