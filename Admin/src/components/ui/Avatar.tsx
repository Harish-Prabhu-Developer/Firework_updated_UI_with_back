import React from 'react';
import { View, Image, Text } from 'react-native';
import { cn } from '../../lib/utils';

interface AvatarProps {
  src?: string;
  fallback: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ src, fallback, className, size = 'md' }: AvatarProps) {
  const sizeMap = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  };

  const textSizeMap = {
    sm: "text-[10px]",
    md: "text-sm",
    lg: "text-xl",
  };

  return (
    <View className={cn("rounded-full bg-muted items-center justify-center overflow-hidden border border-border", sizeMap[size], className)}>
      {src ? (
        <Image source={{ uri: src }} className="h-full w-full" resizeMode="cover" />
      ) : (
        <Text className={cn("font-bold text-muted-foreground", textSizeMap[size])}>
          {fallback.substring(0, 2).toUpperCase()}
        </Text>
      )}
    </View>
  );
}
