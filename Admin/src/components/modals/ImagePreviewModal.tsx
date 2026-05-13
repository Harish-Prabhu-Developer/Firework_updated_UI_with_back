import React from 'react';
import { View, Image, Modal, TouchableOpacity, Pressable, Text, Dimensions, Platform } from 'react-native';
import { X, ZoomIn, Film } from 'lucide-react-native';
import { WebView } from 'react-native-webview';

const { width: SW, height: SH } = Dimensions.get('window');

interface Props {
  open: boolean;
  uri?: string | null;
  onClose: () => void;
  name?: string;
  type?: 'image' | 'video';
}

const isVideo = (uri: string, type?: string) => {
  if (type === 'video') return true;
  return /\.(mp4|mov|m4v|webm)$/i.test(uri) || uri.includes('youtube.com') || uri.includes('youtu.be');
};

export const ImagePreviewModal = ({ open, uri, onClose, name, type }: Props) => {
  const showVideo = uri ? isVideo(uri, type) : false;

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' }}
        onPress={onClose}
      >
        {/* Header */}
        <View style={{ position: 'absolute', top: 40, left: 0, right: 0, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 100 }}>
          <View style={{ flex: 1 }}>
            {name && (
              <Text numberOfLines={1} style={{ color: 'white', fontSize: 16, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium' }}>
                {name.replace('\n', ' ')}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 8, marginLeft: 16 }}
            onPress={onClose}
          >
            <X size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <Pressable onPress={e => e.stopPropagation?.()} style={{ width: SW, height: SH * 0.7, alignItems: 'center', justifyContent: 'center' }}>
          {uri ? (
            showVideo ? (
              <View style={{ width: SW, height: SW * (9 / 16), backgroundColor: 'black' }}>
                <WebView
                  source={{ uri: uri.includes('youtube.com') && !uri.includes('embed') ? uri.replace('watch?v=', 'embed/') : uri }}
                  style={{ flex: 1, backgroundColor: 'black' }}
                  allowsFullscreenVideo
                  javaScriptEnabled
                />
              </View>
            ) : (
              <Image
                source={{ uri }}
                style={{ width: SW - 20, height: SH * 0.65 }}
                resizeMode="contain"
              />
            )
          ) : (
            <View style={{ width: 240, height: 200, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', borderRadius: 20 }}>
              <ZoomIn size={48} color="#475569" />
              <Text style={{ color: '#64748b', marginTop: 12, fontWeight: '600' }}>No content available</Text>
            </View>
          )}
        </Pressable>

        {/* Bottom indicator for video */}
        {showVideo && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20 }}>
            <Film size={16} color="rgba(255,255,255,0.5)" />
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600' }}>Video Preview</Text>
          </View>
        )}
      </Pressable>
    </Modal>
  );
};
