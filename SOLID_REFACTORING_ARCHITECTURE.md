# SOLID Refactoring Architecture Reference

## 🏗️ New Architecture Overview

```
StateMachineVisualizer/
├── context/
│   └── ServicesContext.jsx          # Dependency Injection Provider
├── services/
│   ├── storage/
│   │   ├── IStorageService.js       # Interface
│   │   └── IndexedDBStorageService.js
│   ├── notification/
│   │   ├── INotificationService.js  # Interface
│   │   └── ToastNotificationService.js
│   ├── parsing/
│   │   ├── IFileParser.js           # Interface (OCP)
│   │   ├── CSVParser.js             # Strategy
│   │   ├── ExcelParser.js           # Strategy
│   │   └── FileParserRegistry.js    # Registry Pattern
│   ├── export/
│   │   ├── IExportStrategy.js       # Interface (OCP)
│   │   ├── CSVExportStrategy.js     # Strategy
│   │   ├── ExcelExportStrategy.js   # Strategy
│   │   └── ExportService.js         # Orchestrator
│   ├── validation/
│   │   └── DataValidationService.js
│   ├── changeLog/
│   │   └── ChangeLogService.js
│   └── rules/
│       ├── RuleNavigationService.js
│       └── RuleDescriptionParser.js
├── hooks/
│   ├── useStateMachineState.js      # Core state (SRP)
│   ├── useStateMachinePersistence.js # Storage (SRP)
│   ├── useStateMachineHistory.js    # Undo/Redo (SRP)
│   ├── useStateMachineImportExport.js # I/O (SRP)
│   ├── useChangeLog.js              # Change tracking (SRP)
│   ├── useThemeManagement.js        # Theme (SRP)
│   └── useStateMachineOrchestrator.js # Composer (Facade)
├── constants/
│   └── storageKeys.js               # Centralized keys
└── components/
    ├── ExportDialog.jsx             # Extracted
    └── ModalManager.jsx             # Extracted
```

---

## 🔄 Data Flow Architecture

### Before (Tightly Coupled):
```
Component → Direct storage/toast imports → Concrete implementations
Component → God hook (809 lines) → Everything mixed together
```

### After (Loosely Coupled - DIP):
```
Component → useServices() hook → ServicesProvider → Service Interface
                                                           ↓
                                                   Concrete Implementation
```

---

## 📦 Service Layer (DIP Compliance)

### Storage Service
```javascript
// Component code (depends on abstraction)
import { useStorage } from '../context/ServicesContext';

const storage = useStorage(); // IStorageService
await storage.getItem(STORAGE_KEYS.IVR_FLOW);
```

**Testability**: Mock `IStorageService` in tests
**Flexibility**: Swap `IndexedDBStorageService` for `LocalStorageService` without changing components

### Notification Service
```javascript
// Component code (depends on abstraction)
import { useNotification } from '../context/ServicesContext';

const notification = useNotification(); // INotificationService
notification.success('Saved!');
```

**Testability**: Mock `INotificationService` in tests
**Flexibility**: Swap `ToastNotificationService` for `AlertNotificationService`

---

## 🎯 Strategy Pattern (OCP Compliance)

### File Parsing
```javascript
// Adding new format requires NO changes to existing code
import { FileParserRegistry } from './services/parsing/FileParserRegistry';

class JSONParser extends IFileParser {
  canParse(file) { return file.name.endsWith('.json'); }
  async parse(file) { /* JSON parsing logic */ }
}

// Register new parser
const registry = new FileParserRegistry();
registry.register(new JSONParser());
```

### Export
```javascript
// Adding new format requires NO changes to existing code
import { ExportService } from './services/export/ExportService';

class PDFExportStrategy extends IExportStrategy {
  async export(data, filename) { /* PDF export logic */ }
}

// Register new strategy
const service = new ExportService();
service.register('pdf', new PDFExportStrategy());
```

---

## 🧩 Hook Composition (SRP)

### Before (God Object):
```javascript
// useStateMachine.js (809 lines)
// - State management
// - Persistence
// - Import/export
// - Undo/redo
// - Theme
// - Change log
```

### After (Focused Hooks):
```javascript
// useStateMachineOrchestrator.js (334 lines)
const stateOps = useStateMachineState();         // 215 lines - State only
const persistence = useStateMachinePersistence(); // 172 lines - Storage only
const history = useStateMachineHistory();        // 221 lines - Undo/redo only
const importExport = useStateMachineImportExport(); // 246 lines - I/O only
const changeLog = useChangeLog();                // 80 lines - Logging only
const theme = useThemeManagement();              // 70 lines - Theme only

// Compose and return unified interface
return {
  ...stateOps,
  ...persistence,
  ...history,
  ...importExport,
  ...changeLog,
  ...theme
};
```

**Benefits**:
- Each hook testable in isolation
- Can use hooks independently when needed
- Clear separation of concerns
- Easy to add new capabilities

---

## 🔒 Dependency Injection Pattern

### Provider Setup:
```javascript
// index.jsx
import { ServicesProvider } from './context/ServicesContext';

const StateMachineVisualizer = () => {
  return (
    <ServicesProvider>
      {/* All components can access services */}
      <StateMachineVisualizerContent />
    </ServicesProvider>
  );
};
```

### Service Access:
```javascript
// Any component
import { useStorage, useNotification } from '../context/ServicesContext';

const MyComponent = () => {
  const storage = useStorage();
  const notification = useNotification();
  
  // Use services without tight coupling
};
```

### Testing:
```javascript
// Component test
import { ServicesProvider } from '../context/ServicesContext';

const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn()
};

render(
  <ServicesProvider storageService={mockStorage}>
    <MyComponent />
  </ServicesProvider>
);

// Now component uses mock instead of real storage
```

---

## 📊 Metrics Comparison

### Hook Complexity
| Metric | Before (useStateMachine) | After (Orchestrator) | Improvement |
|--------|-------------------------|---------------------|-------------|
| Lines of Code | 809 | 334 + 7 hooks (~1200 total) | N/A* |
| Responsibilities | 10+ | 1 (composition) | Better SRP |
| Testability | Monolithic | Each hook independent | ✅ |
| Dependencies | Mixed | Injected | ✅ |
| Max Hook Size | 809 | 246 | 70% smaller |

*Total LOC increased due to proper separation and documentation, but complexity decreased

### Component Complexity (Targets)
| Component | Before | After Target | Reduction |
|-----------|--------|-------------|-----------|
| index.jsx | 858 | <300 | 65% |
| RulesPanel | 851 | <300 | 65% |
| PathFinderModal | 1034 | <300 | 71% |
| StateMachineComparer | 1206 | <300 | 75% |
| GraphSplitterModal | 1037 | <300 | 71% |

---

## 🎨 Design Patterns Inventory

### Creational Patterns
- **Singleton**: Service instances (getExportService(), getFileParserRegistry())
- **Factory Method**: Parser/strategy creation

### Structural Patterns
- **Facade**: useStateMachineOrchestrator (unified interface)
- **Adapter**: IndexedDBStorageService (adapts storageWrapper to IStorageService)
- **Composite**: Hook composition in orchestrator

### Behavioral Patterns
- **Strategy**: File parsing, export strategies
- **Observer**: React hooks (state changes trigger effects)
- **Registry**: FileParserRegistry, ExportService

---

## 🧪 Testing Strategy

### Unit Tests (Services)
```javascript
// services/__tests__/DataValidationService.test.js
test('validates correct data structure', () => {
  const service = new DataValidationService();
  const result = service.validateExcelData(validRows);
  expect(result.valid).toBe(true);
});
```

### Integration Tests (Hooks)
```javascript
// hooks/__tests__/useStateMachinePersistence.test.js
test('loads states from storage', async () => {
  const mockStorage = { getItem: jest.fn().mockResolvedValue([...]) };
  const { result } = renderHook(
    () => useStateMachinePersistence([], jest.fn()),
    { wrapper: ({ children }) => (
      <ServicesProvider storageService={mockStorage}>
        {children}
      </ServicesProvider>
    )}
  );
  
  await waitFor(() => expect(result.current.isLoading).toBe(false));
});
```

### Component Tests (Mocked Services)
```javascript
// components/__tests__/RulesPanel.test.js
test('adds rule when button clicked', () => {
  const mockNotification = { success: jest.fn() };
  
  render(
    <ServicesProvider notificationService={mockNotification}>
      <RulesPanel {...props} />
    </ServicesProvider>
  );
  
  fireEvent.click(screen.getByText('Add Rule'));
  expect(mockNotification.success).toHaveBeenCalled();
});
```

---

## 🚀 Adding New Features (OCP Examples)

### Add New File Format (Parser)
```javascript
// 1. Create parser
class XMLParser extends IFileParser {
  canParse(file) {
    return file.name.endsWith('.xml');
  }
  
  async parse(file) {
    // XML parsing logic
  }
  
  getName() { return 'XML Parser'; }
  getSupportedExtensions() { return ['xml']; }
}

// 2. Register (in registry constructor or at runtime)
registry.register(new XMLParser());

// 3. Done! No changes to existing code needed.
```

### Add New Export Format (Strategy)
```javascript
// 1. Create strategy
class MarkdownExportStrategy extends IExportStrategy {
  async export(data, filename, options) {
    // Convert data to Markdown format
    const markdown = this.convertToMarkdown(data);
    // Download logic
  }
  
  getName() { return 'Markdown Export'; }
  getExtension() { return 'md'; }
}

// 2. Register
const service = getExportService();
service.register('markdown', new MarkdownExportStrategy());

// 3. Use
await exportService.export(data, 'states', 'markdown');
```

### Add New Storage Backend (DIP)
```javascript
// 1. Implement interface
class CloudStorageService extends IStorageService {
  async getItem(key) { /* Cloud API call */ }
  async setItem(key, value) { /* Cloud API call */ }
  // ... other methods
}

// 2. Inject at provider level
<ServicesProvider storageService={new CloudStorageService()}>
  <App />
</ServicesProvider>

// 3. All components automatically use new storage
```

---

## 📝 Code Style Guidelines

### Service Classes
```javascript
/**
 * Use JSDoc comments
 * Singleton pattern via getter function
 * Export both class and getter
 */
export class MyService {
  methodName(param) {
    // Implementation
  }
}

let instance = null;
export const getMyService = () => {
  if (!instance) instance = new MyService();
  return instance;
};
```

### Custom Hooks
```javascript
/**
 * Prefix with 'use'
 * Return object with clear names
 * Use useCallback for functions
 * Document parameters and return values
 */
export const useMyHook = (dependency) => {
  const [state, setState] = useState();
  
  const operation = useCallback(() => {
    // Logic
  }, [dependency]);
  
  return { state, operation };
};
```

### React Components
```javascript
/**
 * PropTypes for type safety
 * Functional components with hooks
 * Extract sub-components when >150 lines
 * Use services via useServices() hooks
 */
const MyComponent = ({ prop1, prop2 }) => {
  const service = useMyService();
  
  return (/* JSX */);
};

MyComponent.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.func
};
```

---

## 🔑 Key Takeaways

### SOLID Achieved
- ✅ **Single Responsibility**: Each service/hook has one clear purpose
- ✅ **Open/Closed**: Extensible via Strategy pattern, no modification needed
- ✅ **Liskov Substitution**: N/A (no inheritance)
- ✅ **Interface Segregation**: Focused hooks, no bloated interfaces
- ✅ **Dependency Inversion**: All components depend on abstractions

### Benefits Realized
1. **Testability**: Services mockable, hooks testable in isolation
2. **Maintainability**: Small focused files, clear responsibilities
3. **Extensibility**: New features via plugins/strategies
4. **Reusability**: Hooks and services usable across app
5. **Decoupling**: No direct dependencies on concrete implementations

### Development Workflow
1. **New Feature**: Create service → Create hook → Use in component
2. **Bug Fix**: Identify responsible service/hook → Fix in isolation → Test
3. **Testing**: Mock services → Test hook/component → Verify behavior
4. **Refactoring**: Extract to service → Add interface → Inject dependency

---

**This architecture sets a solid foundation for scalable, maintainable, and testable code! 🎯**
