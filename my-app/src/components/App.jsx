import { useState, useEffect } from 'react';
import StateMachineVisualizer from './StateMachineVisualizer';
import FlowDiagramVisualizer from './FlowDiagramVisualizer';
import LogAnalyzer from './LogAnalyzer';
import AiLogAnalysis from './AiLogAnalysis';
import LandingPage from './LandingPage';
import Dashboard from './Dashboard';
import Login from './Login';
import { ThemeProvider } from './ThemeProvider';

const AppContent = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [mode, setMode] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('auth_token');
    if (token) {
      setIsAuthenticated(true);
    }
    
    // Track component usage when mode changes
    if (mode) {
      const recordComponentUsage = async () => {
        try {
          await fetch('http://localhost:5001/api/component-usage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ component: mode })
          });
        } catch (error) {
          console.error('Failed to record component usage:', error);
        }
      };
      
      recordComponentUsage();
    }
  }, [mode]);

  const handleGetStarted = () => {
    const selectedMode = localStorage.getItem('visualizer_mode');
    setMode(selectedMode);
    setShowLanding(false);
  };

  const handleChangeModeClick = () => {
    setShowLanding(true);
  };

  const handleLoginClick = () => {
    setShowLogin(true);
    setShowLanding(false);
  };

  const handleLoginSuccess = (token) => {
    localStorage.setItem('auth_token', token);
    setIsAuthenticated(true);
    setShowLogin(false);
    setShowDashboard(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setShowDashboard(false);
    setShowLanding(true);
  };

  const handleDashboardClick = () => {
    if (isAuthenticated) {
      setShowDashboard(true);
      setShowLanding(false);
      setShowLogin(false);
    } else {
      setShowLogin(true);
      setShowLanding(false);
    }
  };

  const renderContent = () => {
    if (showLogin) {
      return <Login onLoginSuccess={handleLoginSuccess} onCancel={() => setShowLanding(true)} />;
    }

    if (showDashboard) {
      return <Dashboard onLogout={handleLogout} />;
    }

    if (showLanding) {
      return <LandingPage 
        onGetStarted={handleGetStarted} 
        onLoginClick={handleLoginClick}
        onDashboardClick={handleDashboardClick}
        isAuthenticated={isAuthenticated}
      />;
    }

    if (mode === 'stateMachine') {
      return <StateMachineVisualizer 
        onChangeMode={handleChangeModeClick} 
        onDashboardClick={handleDashboardClick}
        isAuthenticated={isAuthenticated}
      />;
    }

    if (mode === 'logAnalyzer') {
      return <LogAnalyzer 
        onChangeMode={handleChangeModeClick} 
        onDashboardClick={handleDashboardClick}
        isAuthenticated={isAuthenticated}
      />;
    }
    
    if (mode === 'aiLogAnalysis') {
      return <AiLogAnalysis 
        onChangeMode={handleChangeModeClick} 
        onDashboardClick={handleDashboardClick}
        isAuthenticated={isAuthenticated}
      />;
    }

    return <FlowDiagramVisualizer 
      onChangeMode={handleChangeModeClick} 
      onDashboardClick={handleDashboardClick}
      isAuthenticated={isAuthenticated}
    />;
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
