import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { cn } from '../../lib/utils';

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function AccordionItem({ title, children, className }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View className={cn("border-b border-border", className)}>
      <Pressable 
        onPress={() => setIsOpen(!isOpen)}
        className="flex-row items-center justify-between py-4"
      >
        <Text className="text-sm font-medium text-foreground">{title}</Text>
        {isOpen ? (
          <ChevronUp size={16} color="#64748b" />
        ) : (
          <ChevronDown size={16} color="#64748b" />
        )}
      </Pressable>
      {isOpen && (
        <View className="pb-4 animate-in fade-in slide-in-from-top-1">
          {children}
        </View>
      )}
    </View>
  );
}

export function Accordion({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <View className={className}>
      {children}
    </View>
  );
}
