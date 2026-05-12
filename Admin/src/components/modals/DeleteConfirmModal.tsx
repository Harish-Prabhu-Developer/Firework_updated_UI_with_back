import React from 'react';
import { View, Text, Modal, TouchableOpacity, Pressable, useWindowDimensions } from 'react-native';
import { AlertTriangle, Trash2 } from 'lucide-react-native';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  itemName?: string;
  count?: number;
  onConfirm: () => void;
  loading?: boolean;
}

export const DeleteConfirmModal = ({
  open, onOpenChange, itemName = 'item', count, onConfirm, loading,
}: Props) => {
  const label = count && count > 1 ? `${count} ${itemName}s` : `this ${itemName}`;
  const { width } = useWindowDimensions();
  const modalWidth = Math.max(280, Math.min(width - 32, 448)); // max-w-md = 448px

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => onOpenChange(false)}>
      <Pressable
        className="flex-1 bg-black/50 backdrop-blur-sm items-center justify-center px-4"
        onPress={() => onOpenChange(false)}
      >
        <Pressable onPress={e => e.stopPropagation?.()} style={{ width: modalWidth, maxWidth: '100%' }}>
          <View className="bg-white p-6 shadow-2xl" style={{ borderRadius: 16 }}>
            <View className="flex-row items-center gap-3 mb-4">
              <View className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle size={24} color="#ef4444" />
              </View>
              <Text className="text-xl font-bold text-foreground">Confirm Delete</Text>
            </View>

            <Text className="text-slate-600 mb-6 text-base">
              Are you sure you want to delete {label}?
            </Text>

            <View className="flex-row justify-end gap-3">
              <TouchableOpacity
                onPress={() => onOpenChange(false)}
                className="px-4 py-2 border border-border items-center justify-center"
                style={{ borderRadius: 12 }}
              >
                <Text className="text-sm font-medium text-foreground">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { onConfirm(); }}
                disabled={loading}
                className="px-4 py-2 bg-red-500 items-center justify-center flex-row gap-2"
                style={{ borderRadius: 12, opacity: loading ? 0.7 : 1 }}
              >
                <Trash2 size={16} color="white" />
                <Text className="text-sm font-bold text-white">{loading ? 'Deleting…' : 'Delete'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
