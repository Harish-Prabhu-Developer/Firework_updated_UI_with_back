import React, { ReactNode } from 'react';
import {
  View, Text, Modal, TouchableOpacity, Pressable,
  KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions,
} from 'react-native';
import { X } from 'lucide-react-native';

interface Props {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
  scrollable?: boolean;
}

export const FormModal = ({
  open, onClose, title, subtitle, children, footer,
  maxWidth = 640, scrollable = true,
}: Props) => {
  const { width, height } = useWindowDimensions();
  const isCompact = width < 480;
  const overlayPadding = isCompact ? 12 : 24;
  const modalWidth = Math.max(280, Math.min(width - overlayPadding * 2, maxWidth));
  const modalMaxHeight = Math.max(320, height - overlayPadding * 2);
  const horizontalPadding = isCompact ? 18 : 24;

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: overlayPadding }}
          onPress={onClose}
        >
          <Pressable onPress={e => e.stopPropagation?.()} style={{ width: modalWidth, maxWidth: '100%' }}>
            <View
              style={{
                width: '100%',
                maxHeight: modalMaxHeight,
                backgroundColor: 'white',
                borderRadius: isCompact ? 20 : 24,
                overflow: 'hidden',
                shadowColor: '#000', shadowOffset: { width: 0, height: 20 },
                shadowOpacity: 0.25, shadowRadius: 40, elevation: 20,
              }}
            >
              {/* Header */}
              <View
                className="flex-row items-center justify-between border-b border-border"
                style={{ paddingHorizontal: horizontalPadding, paddingVertical: isCompact ? 16 : 20 }}
              >
                <View className="flex-1">
                  {typeof title === 'string' ? (
                    <Text className="text-lg font-black text-foreground">{title}</Text>
                  ) : (
                    title
                  )}
                  {subtitle && <Text className="text-xs text-muted-foreground mt-0.5">{subtitle}</Text>}
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  className="w-9 h-9 rounded-full bg-muted items-center justify-center ml-3"
                >
                  <X size={18} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Body */}
              {scrollable ? (
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  style={{ maxHeight: modalMaxHeight - (footer ? 156 : 92) }}
                >
                  <View style={{ paddingHorizontal: horizontalPadding, paddingVertical: isCompact ? 16 : 20 }}>{children}</View>
                </ScrollView>
              ) : (
                <View style={{ paddingHorizontal: horizontalPadding, paddingVertical: isCompact ? 16 : 20 }}>{children}</View>
              )}

              {/* Footer */}
              {footer && (
                <View
                  className="border-t border-border bg-slate-50/50"
                  style={{ paddingHorizontal: horizontalPadding, paddingVertical: isCompact ? 14 : 16 }}
                >
                  {footer}
                </View>
              )}
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};
