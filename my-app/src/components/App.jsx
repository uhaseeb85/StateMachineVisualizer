import { useState } from 'react';
import StateMachineVisualizer from './StateMachineVisualizer';
import FlowDiagramVisualizer from './FlowDiagramVisualizer';
import LogAnalyzer from './LogAnalyzer';
import AiLogAnalysis from './AiLogAnalysis';
import LandingPage from './LandingPage';
import { ThemeProvider } from './ThemeProvider';
import ErrorBoundary from './ErrorBoundary';

const AppContent = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [mode, setMode] = useState(null);

  const handleGetStarted = () => {
    const selectedMode = localStorage.getItem('visualizer_mode');
    setMode(selectedMode);
    setShowLanding(false);
  };

  const handleChangeModeClick = () => {
    setShowLanding(true);
  };

  const renderContent = () => {
    if (showLanding) {
      return <LandingPage onGetStarted={handleGetStarted} />;
    }

    if (mode === 'stateMachine') {
      return (
        <ErrorBoundary>
          <StateMachineVisualizer onChangeMode={handleChangeModeClick} />
        </ErrorBoundary>
      );
    }

    if (mode === 'logAnalyzer') {
      return <LogAnalyzer onChangeMode={handleChangeModeClick} />;
    }
    
    if (mode === 'aiLogAnalysis') {
      return <AiLogAnalysis onChangeMode={handleChangeModeClick} />;
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
