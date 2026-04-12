import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import { Dialog } from './Dialog';
import { cn } from '../../lib/utils';
import { Button } from './Button';

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
}

export function Select({ 
  value, 
  onValueChange, 
  options, 
  placeholder = "Select...", 
  label, 
  error,
  className 
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value);

  return (
    <View className={cn("gap-1.5", className)}>
      {label && <Text className="text-sm font-medium text-foreground ml-1">{label}</Text>}
      
      <Pressable 
        onPress={() => setOpen(true)}
        className={cn(
          "h-12 border rounded-xl px-4 flex-row items-center justify-between bg-card",
          error ? "border-destructive" : "border-border"
        )}
      >
        <Text className={cn(
          "text-sm",
          selectedOption ? "text-foreground" : "text-muted-foreground"
        )}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <ChevronDown size={18} color="#64748b" />
      </Pressable>

      {error && <Text className="text-[10px] text-destructive ml-1">{error}</Text>}

      <Dialog 
        open={open} 
        onOpenChange={setOpen} 
        title={label || "Select Option"}
      >
        <ScrollView className="max-h-[60vh] pb-10">
          {options.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => {
                onValueChange(opt.value);
                setOpen(false);
              }}
              className={cn(
                "flex-row items-center justify-between p-4 border-b border-border/50 active:bg-muted/50",
                value === opt.value && "bg-primary/5"
              )}
            >
              <Text className={cn(
                "text-sm",
                value === opt.value ? "text-primary font-bold" : "text-foreground"
              )}>
                {opt.label}
              </Text>
              {value === opt.value && <Check size={16} color="#4f46e5" />}
            </Pressable>
          ))}
        </ScrollView>
      </Dialog>
    </View>
  );
}
