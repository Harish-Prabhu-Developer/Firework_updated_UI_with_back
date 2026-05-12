import React, { createContext, useContext, ReactNode } from 'react';
import Toast from 'react-native-toast-message';
import { parseApiError, isPermissionError } from '../api/api';

interface ToastContextType {
  success: (msg: string) => void;
  error:   (msg: string) => void;
  info:    (msg: string) => void;
  warn:    (msg: string) => void;
  /** Smart handler: shows 'warn' toast for 403, 'error' for everything else */
  apiError: (error: unknown, fallback?: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  success:  () => {},
  error:    () => {},
  info:     () => {},
  warn:     () => {},
  apiError: () => {},
});

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const show = (type: string, text1: string, text2?: string) =>
    Toast.show({ type, text1, text2, position: 'top', visibilityTime: 4000 });

  const success = (msg: string) => show('success', msg);
  const error   = (msg: string) => show('error',   msg);
  const info    = (msg: string) => show('info',    msg);
  const warn    = (msg: string) => show('info',    '⚠️  Permission Denied', msg);

  /**
   * Smart API error handler.
   * - 403 → amber warn toast with the server's specific message
   * - everything else → red error toast
   */
  const apiError = (err: unknown, fallback = 'Operation failed') => {
    const msg = parseApiError(err) || fallback;
    if (isPermissionError(err)) {
      warn(msg);
    } else {
      error(msg);
    }
  };

  return (
    <ToastContext.Provider value={{ success, error, info, warn, apiError }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
