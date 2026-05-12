import React from 'react';
import { View, Image, Modal, TouchableOpacity, Pressable, Text, Dimensions } from 'react-native';
import { X, ZoomIn, Download } from 'lucide-react-native';

const { width: SW, height: SH } = Dimensions.get('window');

interface Props {
  open: boolean;
  uri?: string | null;
  onClose: () => void;
  name?: string;
}

export const ImagePreviewModal = ({ open, uri, onClose, name }: Props) => (
  <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable
      style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.80)', alignItems: 'center', justifyContent: 'center' }}
      onPress={onClose}
    >
      {/* Close button */}
      <TouchableOpacity
        style={{ position: 'absolute', top: 52, right: 20, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 10 }}
        onPress={onClose}
      >
        <X size={22} color="white" />
      </TouchableOpacity>

      {/* Image */}
      <Pressable onPress={e => e.stopPropagation?.()}>
        <View style={{ borderRadius: 20, overflow: 'hidden', maxWidth: SW - 40, maxHeight: SH * 0.75 }}>
          {uri ? (
            <Image
              source={{ uri }}
              style={{ width: SW - 40, height: SH * 0.65 }}
              resizeMode="contain"
            />
          ) : (
            <View style={{ width: 240, height: 200, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', borderRadius: 20 }}>
              <ZoomIn size={48} color="#475569" />
              <Text style={{ color: '#64748b', marginTop: 12, fontWeight: '600' }}>No image</Text>
            </View>
          )}
        </View>
        {name && (
          <Text style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 12, fontSize: 13, fontWeight: '600' }}>{name}</Text>
        )}
      </Pressable>
    </Pressable>
  </Modal>
);
