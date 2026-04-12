import React from 'react';
import { Pressable, View } from 'react-native';
import { cn } from '../../lib/utils';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export function Switch({ checked, onCheckedChange, className, disabled }: SwitchProps) {
  return (
    <Pressable
      onPress={() => !disabled && onCheckedChange(!checked)}
      className={cn(
        "w-10 h-5 rounded-full p-1 transition-colors",
        checked ? "bg-primary" : "bg-muted",
        disabled && "opacity-50",
        className
      )}
    >
      <View 
        className={cn(
          "h-3 w-3 rounded-full bg-white transition-all",
          checked ? "ml-5" : "ml-0"
        )} 
      />
    </Pressable>
  );
}
