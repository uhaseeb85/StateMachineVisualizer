/**
 * INotificationService.js
 * 
 * Notification service interface for dependency injection.
 * Abstracts the notification mechanism (toast, alert, etc.)
 */

/* eslint-disable no-unused-vars */

/**
 * Notification service interface
 * @interface
 */
export class INotificationService {
  /**
   * Show a success notification
   * @param {string} message - Notification message
   * @param {object} options - Optional notification options
   * @returns {void}
   */
  success(_message, _options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Show an error notification
   * @param {string} message - Notification message
   * @param {object} options - Optional notification options
   * @returns {void}
   */
  error(_message, _options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Show an info notification
   * @param {string} message - Notification message
   * @param {object} options - Optional notification options
   * @returns {void}
   */
  info(_message, _options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Show a warning notification
   * @param {string} message - Notification message
   * @param {object} options - Optional notification options
   * @returns {void}
   */
  warning(_message, _options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Show a loading notification
   * @param {string} message - Notification message
   * @param {object} options - Optional notification options
   * @returns {string|number} Toast ID for dismissing
   */
  loading(_message, _options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Dismiss a notification
   * @param {string|number} toastId - Toast ID to dismiss
   * @returns {void}
   */
  dismiss(_toastId) {
    throw new Error('Method not implemented');
  }
}
