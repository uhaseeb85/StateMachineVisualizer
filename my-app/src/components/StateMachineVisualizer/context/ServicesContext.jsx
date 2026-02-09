/**
 * ServicesContext.jsx
 * 
 * React Context for dependency injection of services.
 * Provides storage, notification, and other services to components.
 */

import React, { createContext, useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import { IndexedDBStorageService } from '../services/storage/IndexedDBStorageService';
import { ToastNotificationService } from '../services/notification/ToastNotificationService';

/**
 * Services context
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
 * Hook to access all services
 * @returns {object} Services object with storage and notification services
 */
export const useServices = () => {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error('useServices must be used within a ServicesProvider');
  }
  return context;
};

/**
 * Hook to access storage service
 * @returns {IStorageService} Storage service instance
 */
export const useStorage = () => {
  const { storage } = useServices();
  return storage;
};

/**
 * Hook to access notification service
 * @returns {INotificationService} Notification service instance
 */
export const useNotification = () => {
  const { notification } = useServices();
  return notification;
};
