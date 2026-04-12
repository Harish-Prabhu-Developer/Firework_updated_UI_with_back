import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { cn } from '../../lib/utils';

interface BreadcrumbProps {
  items: { label: string; onPress?: () => void }[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <View className={cn("flex-row items-center gap-2", className)}>
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <Pressable onPress={item.onPress}>
            <Text className={cn(
               "text-xs font-medium",
               idx === items.length - 1 ? "text-foreground" : "text-muted-foreground"
            )}>
              {item.label}
            </Text>
          </Pressable>
          {idx < items.length - 1 && (
            <ChevronRight size={12} color="#94a3b8" />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}
