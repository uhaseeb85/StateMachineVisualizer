/**
 * Tour Step Configurations
 * 
 * Defines the step-by-step guided tour for the State Machine Visualizer.
 * Each step includes:
 * - target: CSS selector for the element to highlight
 * - content: Description of the feature
 * - title: Step title with emoji
 * - placement: Tooltip placement relative to target
 * - disableBeacon: Whether to disable the pulsing beacon
 * 
 * Used by the TourProvider component to guide users through the application's features.
 * 
 * @type {Array<{
 *   target: string,
 *   content: string,
 *   title: string,
 *   placement: 'top'|'right'|'bottom'|'left'|'center',
 *   disableBeacon?: boolean
 * }>}
 */

export const tourSteps = [
  {
    target: '.find-paths-button',
    content: 'Find all possible paths between states! You can see which rules succeeded and failed at each transition.',
    title: '✨ Find Paths',
    placement: 'bottom',
    disableBeacon: true,
  },
  // Add more tour steps here as needed
];
