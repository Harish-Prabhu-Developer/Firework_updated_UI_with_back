import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { cn } from '../../lib/utils';

interface TabsProps {
  tabs: { key: string; label: string }[];
  activeTab: string;
  onTabChange: (key: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
  return (
    <View className={cn("border-b border-border flex-row", className)}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            className={cn(
              "px-4 py-3 border-b-2",
              activeTab === tab.key ? "border-primary" : "border-transparent"
            )}
          >
            <Text className={cn(
              "text-sm font-medium",
              activeTab === tab.key ? "text-primary" : "text-muted-foreground"
            )}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
