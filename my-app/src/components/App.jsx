import { useState } from 'react';
import StateMachineVisualizer from './StateMachineVisualizer';
import LandingPage from './LandingPage';

const App = () => {
  const [showApp, setShowApp] = useState(false);

  return (
    <div>
      {showApp ? (
        <StateMachineVisualizer />
      ) : (
        <LandingPage onGetStarted={() => setShowApp(true)} />
      )}
    </div>
  );
};

export default App;
