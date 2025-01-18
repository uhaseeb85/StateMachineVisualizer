import React, { useState } from 'react';
import Joyride from 'react-joyride';
import { tourSteps } from './constants';

export const TourProvider = ({ children }) => {
  const [runTour, setRunTour] = useState(false);

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
            primaryColor: '#10B981',
            zIndex: 1000,
          },
        }}
        callback={({ status }) => {
          if (['finished', 'skipped'].includes(status)) {
            setRunTour(false);
          }
        }}
      />
      {React.cloneElement(children, { startTour })}
    </>
  );
}; 