/**
 * ServicesContext.jsx
 * 
 * React Context for dependency injection of services.
 * Provides storage, notification, and other services to components.
 */

import { createContext, useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import { IndexedDBStorageService } from '../services/storage/IndexedDBStorageService';
import { ToastNotificationService } from '../services/notification/ToastNotificationService';

/**
 * Services context instance
 */
const ServicesContext = createContext(null);

/**
 * Services provider component
 * Provides dependency injection for all services
 */
export const ServicesProvider = ({ children, storageService, notificationService }) => {
  const services = useMemo(() => {
    return {
      storage: storageService || new IndexedDBStorageService(),
      notification: notificationService || new ToastNotificationService()
    };
  }, [storageService, notificationService]);

  return (
    <ServicesContext.Provider value={services}>
      {children}
    </ServicesContext.Provider>
  );
};

ServicesProvider.propTypes = {
  children: PropTypes.node.isRequired,
  storageService: PropTypes.object,
  notificationService: PropTypes.object
};

/**
 * Hook to access storage service
 * @returns {Object} Storage service instance
 */
export const useStorage = () => {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error('useStorage must be used within ServicesProvider');
  }
  return context.storage;
};

/**
 * Hook to access notification service
 * @returns {Object} Notification service instance
 */
export const useNotification = () => {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error('useNotification must be used within ServicesProvider');
  }
  return context.notification;
};

export default ServicesContext;