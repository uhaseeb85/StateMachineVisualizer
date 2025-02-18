import { useState, useEffect } from 'react';
import StateMachineVisualizer from './StateMachineVisualizer';
import FlowDiagramVisualizer from './FlowDiagramVisualizer';
import LandingPage from './LandingPage';
import ModeSelector from './ModeSelector';
import { ThemeProvider } from './ThemeProvider';

const STORAGE_KEY_MODE = 'visualizer_mode';

const AppContent = () => {
  const [showApp, setShowApp] = useState(false);
  const [mode, setMode] = useState(null);
  const [showModeSelector, setShowModeSelector] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem(STORAGE_KEY_MODE);
    if (savedMode) {
      setMode(savedMode);
    }
  }, []);

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode);
    localStorage.setItem(STORAGE_KEY_MODE, selectedMode);
    setShowModeSelector(false);
  };

  const handleChangeModeClick = () => {
    setShowModeSelector(true);
  };

  const renderContent = () => {
    if (!showApp) {
      return <LandingPage onGetStarted={() => {
        setShowApp(true);
        setShowModeSelector(true);
      }} />;
    }

    if (showModeSelector || !mode) {
      return <ModeSelector onSelect={handleModeSelect} currentMode={mode} />;
    }

    if (mode === 'stateMachine') {
      return <StateMachineVisualizer onChangeMode={handleChangeModeClick} />;
    }

    return <FlowDiagramVisualizer onChangeMode={handleChangeModeClick} />;
  };

  return (
    <div className="min-h-screen bg-background">
      {renderContent()}
    </div>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
