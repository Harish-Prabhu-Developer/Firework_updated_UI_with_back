import React from 'react';
import { View } from 'react-native';
import { cn } from '../../lib/utils';

interface ProgressProps {
  value: number; // 0 to 100
  className?: string;
}

export function Progress({ value, className }: ProgressProps) {
  return (
    <View className={cn("h-2 w-full bg-muted rounded-full overflow-hidden", className)}>
      <View 
        className="h-full bg-primary" 
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }} 
      />
    </View>
  );
}
