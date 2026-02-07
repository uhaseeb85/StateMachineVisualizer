# Copilot Instructions for StateMachineVisualizer

These notes capture project-specific context so AI agents can be productive immediately.

## Overview

- Single-page React app (Vite 6) under [my-app](my-app) with four modes: State Machine Visualizer, Flow Diagram Visualizer, Log Analyzer, and AI Log Analysis.
- Entry stack: [my-app/src/main.jsx](my-app/src/main.jsx) mounts [my-app/src/components/App.jsx](my-app/src/components/App.jsx), which gates mode selection and theme context.
- Styling is Tailwind-first with shadcn/radix primitives; animations via Framer Motion, icons via Lucide.
- Active branch: `flow_to_graph_csv` (PR #135) - adds state machine CSV conversion with step classification, aliases, and validation.

## Repository Layout

- Feature areas live in [my-app/src/components](my-app/src/components):
  - [StateMachineVisualizer](my-app/src/components/StateMachineVisualizer) (state/rule panels, simulation, path finder, change log, comparer)
  - [FlowDiagramVisualizer](my-app/src/components/FlowDiagramVisualizer) (ReactFlow nodes/edges, auto-layout, path finder, simulation, compare tools, **Convert to State Machine CSV**)
  - [LogAnalyzer](my-app/src/components/LogAnalyzer) (local file + Splunk analysis, regex worker, pattern dictionaries)
  - [AiLogAnalysis](my-app/src/components/AiLogAnalysis) (chat-style UI, streaming, API settings)
- Key new components:
  - [ConvertToStateMachineModal.jsx](my-app/src/components/FlowDiagramVisualizer/ConvertToStateMachineModal.jsx) - main conversion UI with tabs for preview, root selection, classification rules, and step classification
  - [ConvertToStateMachineWelcomeModal.jsx](my-app/src/components/FlowDiagramVisualizer/ConvertToStateMachineWelcomeModal.jsx) - onboarding modal with feature explanations
- Shared UI primitives in [my-app/src/components/ui](my-app/src/components/ui) (includes new [label.jsx](my-app/src/components/ui/label.jsx)); shared utilities in [my-app/src/utils](my-app/src/utils) and [my-app/src/lib](my-app/src/lib).
- Static assets/workers live in [my-app/public](my-app/public) (e.g., regex worker) and [my-app/src/assets](my-app/src/assets).

## Build, Run, Test

- Install: `npm install` from [my-app](my-app).
- Dev server: `npm run dev` (Vite at http://localhost:5173).
- Lint: `npm run lint` (ESLint 9 config at [my-app/eslint.config.js](my-app/eslint.config.js)).
- Production builds:
  - `npm run build` (default Vite build)
  - `npm run build:tomcat` (sets `DEPLOYMENT_ENV=tomcat` via cross-env for Tomcat-friendly output)
  - `npm run build:vercel` (alias of build for Vercel rewrites in [vercel.json](vercel.json))
- CI/CD: [Jenkinsfile](Jenkinsfile#L1) installs deps, runs `npm run build:tomcat`, and copies `dist` into `%TOMCAT_HOME%/webapps/visualizer` (Windows agent).

## Key Patterns & Conventions

- Mode separation: each mode has its own container component and supporting hooks/utilities; keep cross-mode coupling minimal.
- State management: custom hooks (e.g., `useStateMachine`, `useFlowDiagram`, `useStepDictionary`, `useAiStreaming`) own feature state; persist to IndexedDB via `storageWrapper` where applicable.
- Import/Export: CSV parsing via PapaParse; Excel via exceljs/xlsx-js-style; preserve unknown columns on round trips. State machines expect columns "Source Node", "Destination Node", "Rule List"; flow diagrams use at least "Source Node" and "Destination Node".
- Flow-to-State-Machine conversion: new feature to export flow diagrams as state machine CSV format with step classification (state/rule/behavior), aliases, root step selection, customizable classification rules, validation, and inline editing.
- Step properties: all steps now include `alias` (optional, for stable exports) and `type` (state/rule/behavior). Aliases fallback to step name if empty; types default to 'state'.
- Step dictionary: Flow Diagram Visualizer includes a step dictionary feature (`useStepDictionary` hook) that stores step names, types, and aliases. Provides auto-suggestions when creating steps via `StepNameAutocomplete` component, auto-applies type/alias from dictionary, auto-updates when steps are created/modified, and supports CSV/Excel import/export via `StepDictionaryModal`.
- Graph rendering: Flow diagrams use ReactFlow with Dagre auto-layout; state machines use custom graph utilities and html2canvas/html-to-image for exports.
- UI: favor shadcn/radix dialog/dropdown/tabs components; Tailwind utility classes; minimal inline styles.
- Theming: `ThemeProvider` toggles light/dark; remember preference in storage; ensure components respect theme tokens.
- Tours & UX: React Joyride powers guided tours; ensure new features add tour steps where relevant.

## Integrations & External Services

- Splunk: client settings (server URL, token, index) stored locally; Splunk search handled via helpers in [my-app/src/api/splunk.js](my-app/src/api/splunk.js) and LogAnalyzer utils/workers.
- AI Log Analysis: uses @xenova/transformers client-side; chunking/streaming handled in [AiLogAnalysis](my-app/src/components/AiLogAnalysis) hooks and utils.

## Deployment Notes

- Tomcat deployment is static: Jenkins build copies `dist` and generates minimal `context.xml`/`web.xml`. Ensure SPA rewrites (404 -> index.html) remain intact.
- Vercel uses rewrite to `/` in [vercel.json](vercel.json); avoid server-only APIs.

## When Editing

- Mirror existing directory/module boundaries when adding features to a mode.
- Keep import/export formats backward compatible; avoid dropping extra CSV/Excel columns.
- Preserve storage keys and change-log behaviors to avoid breaking persisted user data.
- When adding new step properties: ensure they appear in all relevant components (CreateStepOverlay, EditStepOverlay, InlineStepCreator, SimulationStepCard, StepPanel). Also update the step dictionary (`dictionaryHook.upsertEntry()`) when step name, type, or alias changes.
- Step type and alias: all steps now support `type` (state/rule/behavior) and optional `alias` fields. Use these fields in conversion logic and maintain them across edits/imports.
- Classification rules: stored in `useFlowDiagram` state and persisted to IndexedDB alongside steps/connections; customize/extend via ConvertToStateMachineModal's Classification Rules tab.
- Step dictionary management: accessible via purple "Dictionary" button in TopActionBar; stores step metadata (name, type, alias) in IndexedDB; provides autocomplete in all step creation/edit forms; supports bulk sync from current diagram, CSV/Excel import/export.

If anything here is unclear or missing, ask for specifics and we can refine this guide.
