import React from 'react';
import { Text } from 'react-native';
import { cn } from '../../lib/utils';

export function Label({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <Text className={cn("text-sm font-medium text-foreground", className)}>
      {children}
    </Text>
  );
}
