/**
 * TourProvider Component
 * 
 * A wrapper component that provides guided tour functionality using react-joyride.
 * Features include:
 * - Step-by-step guided tour of the application
 * - Progress tracking
 * - Skip functionality
 * - Customized styling
 * - Automatic tour completion handling
 * 
 * The component injects a startTour function into its child component,
 * allowing the tour to be triggered from anywhere in the application.
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Joyride, { STATUS } from 'react-joyride';
import { tourSteps } from './constants';

export const TourProvider = ({ children }) => {
  // Tour state
  const [runTour, setRunTour] = useState(false);

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunTour(false);
    }
  };

  /**
   * Starts the guided tour
   * Injected into child components via cloneElement
   */
  const startTour = () => {
    setRunTour(true);
  };

  return (
    <>
      <Joyride
        steps={tourSteps}
        run={runTour}
        continuous={true}
        showProgress={true}
        showSkipButton={true}
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: '#3b82f6', // Tailwind blue-500
            zIndex: 1000,
            arrowColor: '#fff',
            backgroundColor: '#fff',
            overlayColor: 'rgba(0, 0, 0, 0.5)',
            textColor: '#374151', // Tailwind gray-700
          },
          tooltip: {
            padding: '1rem',
            borderRadius: '0.5rem',
          },
          buttonNext: {
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            borderRadius: '0.375rem',
          },
          buttonBack: {
            marginRight: '0.5rem',
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            borderRadius: '0.375rem',
          },
          buttonSkip: {
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            borderRadius: '0.375rem',
          },
        }}
      />
      {/* Inject startTour function into child component */}
      {React.cloneElement(children, { startTour })}
    </>
  );
};

TourProvider.propTypes = {
  // Single child component to wrap
  children: PropTypes.element.isRequired
};

export default TourProvider;
