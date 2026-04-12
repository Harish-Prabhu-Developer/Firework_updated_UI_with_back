import React from 'react';
import { Modal, View, Text, Pressable } from 'react-native';
import { Button } from './ui/Button';
import { Trash2, AlertTriangle } from 'lucide-react-native';

interface DeleteConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  itemName?: string;
}

export function DeleteConfirmModal({ open, onOpenChange, onConfirm, itemName = "item" }: DeleteConfirmModalProps) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => onOpenChange(false)}
    >
      <View className="flex-1 bg-black/50 items-center justify-center p-6">
        <View className="bg-card w-full max-w-md rounded-xl p-6 shadow-xl border border-border">
          <View className="h-12 w-12 rounded-full bg-destructive/10 items-center justify-center mb-4 self-center">
            <AlertTriangle size={24} color="#ef4444" />
          </View>
          
          <Text className="text-xl font-bold text-foreground text-center mb-2">Are you sure?</Text>
          <Text className="text-muted-foreground text-center mb-6">
            This action cannot be undone. This will permanently delete the {itemName} and all associated data.
          </Text>
          
          <View className="flex-row gap-3">
            <Button 
              className="flex-1" 
              variant="outline" 
              label="Cancel" 
              onPress={() => onOpenChange(false)} 
            />
            <Button 
              className="flex-1" 
              variant="destructive" 
              label="Delete" 
              onPress={onConfirm}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
