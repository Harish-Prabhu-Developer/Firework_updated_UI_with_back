import React from 'react';
import { Modal, View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Button } from './Button';
import { X } from 'lucide-react-native';
import { cn } from '../../lib/utils';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Dialog({ open, onOpenChange, title, description, children, footer, className }: DialogProps) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={() => onOpenChange(false)}
    >
      <View className="flex-1 bg-black/50 justify-end md:justify-center items-center p-0 md:p-6">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className={cn("w-full max-w-lg", className)}
        >
          <View className="bg-card w-full rounded-t-2xl md:rounded-2xl shadow-xl overflow-hidden max-h-[90vh]">
            <View className="p-4 border-b border-border">
               <View className="flex-row justify-between items-center">
                  <Text className="text-lg font-bold text-foreground">{title}</Text>
                  <Pressable onPress={() => onOpenChange(false)} className="p-1">
                    <X size={20} color="#64748b" />
                  </Pressable>
               </View>
               {description && <Text className="text-xs text-muted-foreground mt-1">{description}</Text>}
            </View>
            
            <ScrollView className="p-4">
              {children}
              <View className="h-10" />
            </ScrollView>
            
            {footer && (
              <View className="p-4 border-t border-border flex-row justify-end gap-3 bg-muted/30">
                {footer}
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
