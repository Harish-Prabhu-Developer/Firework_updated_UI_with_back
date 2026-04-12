import React from 'react';
import { View, Text } from 'react-native';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react-native';
import { cn } from '../../lib/utils';

interface AlertProps {
  title?: string;
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'success' | 'info';
  className?: string;
}

export function Alert({ title, children, variant = 'default', className }: AlertProps) {
  const icons = {
    default: Info,
    destructive: XCircle,
    success: CheckCircle,
    info: Info,
  };
  
  const Icon = icons[variant];

  const variantStyles = {
    default: "bg-muted/50 border-muted text-foreground",
    destructive: "bg-destructive/10 border-destructive/20 text-destructive",
    success: "bg-green-100 border-green-200 text-green-800",
    info: "bg-blue-100 border-blue-200 text-blue-800",
  };

  const iconColors = {
    default: "#64748b",
    destructive: "#ef4444",
    success: "#16a34a",
    info: "#2563eb",
  };

  return (
    <View className={cn("border rounded-lg p-4 flex-row gap-3", variantStyles[variant], className)}>
      <Icon size={18} color={iconColors[variant]} />
      <View className="flex-1">
        {title && <Text className={cn("font-bold text-sm mb-1", variantStyles[variant])}>{title}</Text>}
        <Text className={cn("text-xs leading-5", variantStyles[variant])}>{children}</Text>
      </View>
    </View>
  );
}
