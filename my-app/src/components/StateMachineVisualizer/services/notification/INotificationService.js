/**
 * INotificationService.js
 * 
 * Notification service interface for dependency injection.
 * Abstracts the notification mechanism (toast, alert, etc.)
 */

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
  success(message, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Show an error notification
   * @param {string} message - Notification message
   * @param {object} options - Optional notification options
   * @returns {void}
   */
  error(message, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Show an info notification
   * @param {string} message - Notification message
   * @param {object} options - Optional notification options
   * @returns {void}
   */
  info(message, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Show a warning notification
   * @param {string} message - Notification message
   * @param {object} options - Optional notification options
   * @returns {void}
   */
  warning(message, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Show a loading notification
   * @param {string} message - Notification message
   * @param {object} options - Optional notification options
   * @returns {string|number} Toast ID for dismissing
   */
  loading(message, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Dismiss a notification
   * @param {string|number} toastId - Toast ID to dismiss
   * @returns {void}
   */
  dismiss(toastId) {
    throw new Error('Method not implemented');
  }
}
