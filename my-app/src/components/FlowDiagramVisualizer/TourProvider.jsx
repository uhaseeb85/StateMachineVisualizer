import { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride';

const TourContext = createContext({
  startTour: () => null,
});

export const TourProvider = ({ children }) => {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    {
      target: '.theme-toggle',
      content: 'Toggle between light and dark mode for better visibility.',
      placement: 'bottom',
      disableBeacon: true
    },
    {
      target: '.getting-started-button',
      content: 'Start here to learn about all features and how to use them.',
      placement: 'bottom',
      disableBeacon: true
    },
    {
      target: '.save-action-button',
      content: 'Save your flow diagram to local storage.',
      placement: 'bottom',
      disableBeacon: true
    },
    {
      target: '.export-csv-button',
      content: 'Export your flow diagram as a CSV file.',
      placement: 'bottom',
      disableBeacon: true
    },
    {
      target: '.excel-import-button',
      content: 'Import flow diagrams from CSV files.',
      placement: 'bottom',
      disableBeacon: true
    },
    {
      target: '.find-paths-button',
      content: 'Find and analyze all possible paths in your flow diagram.',
      placement: 'bottom',
      disableBeacon: true
    },
    {
      target: '.simulation-button',
      content: 'Test your flow diagram with an interactive simulation.',
      placement: 'bottom',
      disableBeacon: true
    },
    {
      target: '.mode-switch-button',
      content: 'Switch between Flow Diagram Builder and State Machine Visualizer.',
      placement: 'bottom',
      disableBeacon: true
    },
  ];

  const handleJoyrideCallback = (data) => {
    const { action, index, status, type } = data;

    if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type)) {
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
    }

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
      setStepIndex(0);
    }
  };

  const startTour = () => {
    setRun(true);
    setStepIndex(0);
  };

  return (
    <TourContext.Provider value={{ startTour }}>
      <Joyride
        callback={handleJoyrideCallback}
        continuous
        hideCloseButton
        hideBackButton={false}
        run={run}
        scrollToFirstStep
        showProgress
        showSkipButton
        disableOverlayClose
        disableScrolling
        spotlightClicks
        steps={steps}
        stepIndex={stepIndex}
        styles={{
          options: {
            arrowColor: '#ffffff',
            backgroundColor: '#ffffff',
            overlayColor: 'rgba(0, 0, 0, 0.5)',
            primaryColor: '#3b82f6',
            textColor: '#333',
            zIndex: 1000,
          },
          spotlight: {
            backgroundColor: 'transparent',
          },
          tooltipContainer: {
            textAlign: 'left'
          },
          buttonNext: {
            backgroundColor: '#3b82f6',
            fontSize: 14,
            padding: '8px 16px'
          },
          buttonBack: {
            color: '#666',
            fontSize: 14,
            marginRight: 10
          },
          buttonSkip: {
            color: '#666',
            fontSize: 14
          }
        }}
      />
      {children}
    </TourContext.Provider>
  );
};

TourProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useTour = () => {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}; 