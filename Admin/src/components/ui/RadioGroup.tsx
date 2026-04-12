import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { cn } from '../../lib/utils';

interface RadioGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function RadioGroup({ value, onValueChange, children, className }: RadioGroupProps) {
  return (
    <View className={cn("gap-3", className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          const radioChild = child as React.ReactElement<{ value: string }>;
          return React.cloneElement(radioChild, { 
            selected: value === radioChild.props.value,
            onPress: () => onValueChange(radioChild.props.value)
          } as any);
        }
        return child;
      })}
    </View>
  );
}

export function RadioGroupItem({ label, value, selected, onPress, className }: any) {
  return (
    <Pressable 
      onPress={onPress}
      className={cn("flex-row items-center gap-3", className)}
    >
      <View className={cn(
        "h-5 w-5 rounded-full border items-center justify-center",
        selected ? "border-primary" : "border-muted-foreground"
      )}>
        {selected && <View className="h-2.5 w-2.5 rounded-full bg-primary" />}
      </View>
      <Text className="text-sm text-foreground">{label}</Text>
    </Pressable>
  );
}
