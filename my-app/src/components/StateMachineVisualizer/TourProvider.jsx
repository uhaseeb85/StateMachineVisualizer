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
import Joyride from 'react-joyride';
import { tourSteps } from './tourSteps';

export const TourProvider = ({ children }) => {
  // Tour state
  const [runTour, setRunTour] = useState(false);

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
        styles={{
          options: {
            primaryColor: '#10B981', // Tailwind emerald-500
            zIndex: 1000,
          },
        }}
        callback={({ status }) => {
          // Reset tour state when finished or skipped
          if (['finished', 'skipped'].includes(status)) {
            setRunTour(false);
          }
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
