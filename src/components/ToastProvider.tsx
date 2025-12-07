/**
 * Provider pour gérer les toasts globalement
 * Utilisé avec useToast hook
 */

'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastContainer, Toast, ToastType } from './Toast';

type ToastContextType = {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showConfirm: (message: string) => Promise<boolean>;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 5000) => {
    const id = Math.random().toString(36).substring(7);
    const newToast: Toast = { id, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, duration);
    }
  }, []);

  const showConfirm = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      // Pour l'instant, utiliser window.confirm en fallback
      // Dans le futur, créer un composant de confirmation accessible
      const result = window.confirm(message);
      resolve(result);
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, showConfirm }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

