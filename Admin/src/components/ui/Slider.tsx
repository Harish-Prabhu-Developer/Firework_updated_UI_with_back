import React from 'react';
import { View, Text } from 'react-native';
import { cn } from '../../lib/utils';

// Simplified Slider for Native (Mock since interactive slider usually requires a library like @react-native-community/slider)
export function Slider({ value, min = 0, max = 100, step = 1, onValueChange, className }: any) {
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <View className={cn("h-10 justify-center w-full", className)}>
      <View className="h-1.5 w-full bg-muted rounded-full relative">
        <View 
          className="h-full bg-primary rounded-full" 
          style={{ width: `${percentage}%` }} 
        />
        <View 
          className="absolute h-4 w-4 rounded-full bg-white border-2 border-primary -top-1.5 shadow-sm"
          style={{ left: `${percentage}%`, marginLeft: -8 }}
        />
      </View>
    </View>
  );
}
