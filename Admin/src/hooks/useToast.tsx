import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import Animated, { 
  FadeInUp, 
  FadeOutUp, 
  Layout, 
  SlideInUp, 
  SlideOutUp 
} from 'react-native-reanimated';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const insets = useSafeAreaInsets();

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 3.5 seconds
    setTimeout(() => removeToast(id), 3500);
  }, [removeToast]);

  const toastInterface = {
    success: (msg: string) => addToast(msg, 'success'),
    error: (msg: string) => addToast(msg, 'error'),
    info: (msg: string) => addToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={{ toast: toastInterface }}>
      {children}
      <View
        style={{
          position: 'absolute',
          top: Platform.OS === 'ios' ? insets.top + 10 : insets.top + 20,
          left: 0,
          right: 0,
          zIndex: 9999,
          alignItems: 'center',
        }}
        pointerEvents="box-none"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={() => removeToast(t.id)} />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

const ToastItem = ({ toast, onRemove }: { toast: Toast, onRemove: () => void }) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return (
          <View className="bg-toast-success/10 rounded-full p-1.5">
            <CheckCircle2 size={20} color="hsl(var(--toast-success))" />
          </View>
        );
      case 'error':
        return (
          <View className="bg-toast-error/10 rounded-full p-1.5">
            <AlertCircle size={20} color="hsl(var(--toast-error))" />
          </View>
        );
      case 'info':
      default:
        return (
          <View className="bg-primary/10 rounded-full p-1.5">
            <Info size={20} color="hsl(var(--primary))" />
          </View>
        );
    }
  };

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(12).stiffness(100)}
      exiting={FadeOutUp.duration(200)}
      layout={Layout.springify().damping(15)}
      className="bg-toast-bg shadow-xl rounded-2xl px-5 py-3.5 flex-row items-center mb-3 mx-4 border border-border"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 6,
        maxWidth: 400,
        width: '90%',
      }}
    >
      {getIcon()}
      <View className="flex-1 ml-3 mr-2">
        <Text 
          className="text-foreground font-medium text-[15px] leading-tight" 
          numberOfLines={3}
        >
          {toast.message}
        </Text>
      </View>
      <Pressable 
        onPress={onRemove} 
        className="p-1 active:opacity-50"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <X size={16} color="#94a3b8" />
      </Pressable>
    </Animated.View>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
};
