/**
 * ToastNotificationService.js
 * 
 * Concrete implementation of INotificationService using Sonner toast.
 */

import { toast } from 'sonner';
import { INotificationService } from './INotificationService';

/**
 * Toast notification service implementation using Sonner
 */
export class ToastNotificationService extends INotificationService {
  /**
   * Show a success notification
   * @param {string} message - Notification message
   * @param {object} options - Optional notification options
   * @returns {void}
   */
  success(message, options = {}) {
    toast.success(message, options);
  }

  /**
   * Show an error notification
   * @param {string} message - Notification message
   * @param {object} options - Optional notification options
   * @returns {void}
   */
  error(message, options = {}) {
    toast.error(message, options);
  }

  /**
   * Show an info notification
   * @param {string} message - Notification message
   * @param {object} options - Optional notification options
   * @returns {void}
   */
  info(message, options = {}) {
    toast.info(message, options);
  }

  /**
   * Show a warning notification
   * @param {string} message - Notification message
   * @param {object} options - Optional notification options
   * @returns {void}
   */
  warning(message, options = {}) {
    toast.warning(message, options);
  }

  /**
   * Show a loading notification
   * @param {string} message - Notification message
   * @param {object} options - Optional notification options
   * @returns {string|number} Toast ID for dismissing
   */
  loading(message, options = {}) {
    return toast.loading(message, options);
  }

  /**
   * Dismiss a notification
   * @param {string|number} toastId - Toast ID to dismiss
   * @returns {void}
   */
  dismiss(toastId) {
    toast.dismiss(toastId);
  }
}
