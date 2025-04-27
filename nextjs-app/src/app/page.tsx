'use client';

import { useState } from 'react';
import { ThemeProvider } from '@/components/ThemeProvider';
import LandingPage from '@/components/LandingPage';
import dynamic from 'next/dynamic';

// Dynamically import components to avoid SSR issues with browser-specific code
const StateMachineVisualizer = dynamic(() => import('@/components/StateMachineVisualizer'), { ssr: false });
const FlowDiagramVisualizer = dynamic(() => import('@/components/FlowDiagramVisualizer'), { ssr: false });
const LogAnalyzer = dynamic(() => import('@/components/LogAnalyzer'), { ssr: false });
const AiLogAnalysis = dynamic(() => import('@/components/AiLogAnalysis'), { ssr: false });

const AppContent = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [mode, setMode] = useState<string | null>(null);

  const handleGetStarted = () => {
    if (typeof window !== 'undefined') {
      const selectedMode = localStorage.getItem('visualizer_mode');
      setMode(selectedMode);
      setShowLanding(false);
    }
  };

  const handleChangeModeClick = () => {
    setShowLanding(true);
  };

  const renderContent = () => {
    if (showLanding) {
      return <LandingPage onGetStarted={handleGetStarted} />;
    }

    if (mode === 'stateMachine') {
      return <StateMachineVisualizer onChangeMode={handleChangeModeClick} />;
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

export default function Home() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
