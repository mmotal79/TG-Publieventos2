import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { UserRole } from '../types';

interface NotificationContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  decrementUnreadCount: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const isAdminOrManager = profile?.role === UserRole.ADMIN || profile?.role === UserRole.MANAGER;

  const refreshUnreadCount = useCallback(async () => {
    if (!isAdminOrManager) {
      setUnreadCount(0);
      return;
    }

    try {
      const res = await fetch('/api/landing/contact');
      if (res.ok) {
        const data = await res.json();
        const unread = data.filter((s: any) => !s.leido).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error("Error refreshing unread count:", error);
    }
  }, [isAdminOrManager]);

  const decrementUnreadCount = useCallback(() => {
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  useEffect(() => {
    if (isAdminOrManager) {
      refreshUnreadCount();
      
      // Auto-refresh every 3 minutes
      const interval = setInterval(refreshUnreadCount, 180000);
      return () => clearInterval(interval);
    } else {
      setUnreadCount(0);
    }
  }, [isAdminOrManager, refreshUnreadCount]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount, decrementUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
