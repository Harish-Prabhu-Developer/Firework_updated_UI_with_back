import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
  PermissionsAndroid,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { ChevronLeft, ScanLine, Info } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LightColors as colors } from '../styles/colors';
import { Radius, Fonts } from '../styles/globalStyles';
import { Camera } from 'react-native-camera-kit';

const { width } = Dimensions.get('window');
const SCAN_SIZE = 260;

export default function QrScan({ navigation, route }: any) {
  const { onScan } = route.params || {};
  const insets = useSafeAreaInsets();
  const [hasPermission, setHasPermission] = useState(Platform.OS === 'web');
  const [scannerActive, setScannerActive] = useState(true);

  // Animation for the laser line
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS === 'android') {
      requestCameraPermission();
    }

    // Start Laser Animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const requestCameraPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'Crackers Kingdom requires camera access to scan Order QR codes.',
          buttonPositive: 'Grant Access',
        },
      );
      setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('Permission Denied', 'Camera access is essential for QR scanning.');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const handleScanResult = (result: string) => {
    if (result.startsWith('ORD-') || result.length > 5) {
      onScan?.(result);
      navigation.goBack();
    } else {
      Alert.alert('Invalid QR', 'This does not appear to be a valid Order ID.');
      setScannerActive(true);
    }
  };

  const onReadCode = (event: any) => {
    if (!scannerActive) return;
    const code = event.nativeEvent.codeStringValue;
    if (code) {
      setScannerActive(false);
      handleScanResult(code);
    }
  };

  const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCAN_SIZE - 2],
  });

  // Type check for the Camera component to prevent crashes
  const IsCameraValid = typeof Camera === 'function' || (Camera && typeof (Camera as any).render === 'function');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} className="bg-slate-950">
      <StatusBar barStyle="light-content" />
      <View className="h-16 flex-row items-center px-4 bg-slate-950 border-b border-white/10">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ borderRadius: Radius.xl }}
          className="h-10 w-10 items-center justify-center bg-white/5 border border-white/10"
        >
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={{ fontFamily: Fonts.display }} className="ml-4 text-white text-lg font-black tracking-tight uppercase">Scan Order QR</Text>
      </View>

      <View style={styles.scannerWrapper}>
        {(hasPermission || Platform.OS === 'web') && (
          <View style={StyleSheet.absoluteFillObject}>
            {IsCameraValid ? (
              <Camera
                style={StyleSheet.absoluteFillObject}
                scanBarcode={true}
                onReadCode={onReadCode}
                showFrame={false}
              />
            ) : (
              <View className="flex-1 items-center justify-center bg-slate-900 px-10">
                <View className="p-6 bg-white/5 border border-white/10 rounded-3xl items-center gap-4">
                  <ActivityIndicator color={colors.primary} />
                  <Text className="text-white/60 text-center text-xs font-bold uppercase tracking-widest">
                    Initializing Optical Sensors...
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        <View style={styles.overlay} pointerEvents="none">
          <View style={styles.topDim} />
          <View className="flex-row" style={{ height: SCAN_SIZE }}>
            <View style={styles.sideDim} />
            <View style={styles.focusFrame}>
              <View style={{ borderColor: colors.primary, borderTopLeftRadius: Radius['2xl'] }} className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4" />
              <View style={{ borderColor: colors.primary, borderTopRightRadius: Radius['2xl'] }} className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4" />
              <View style={{ borderColor: colors.primary, borderBottomLeftRadius: Radius['2xl'] }} className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4" />
              <View style={{ borderColor: colors.primary, borderBottomRightRadius: Radius['2xl'] }} className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4" />
              <Animated.View
                style={[
                  styles.laser,
                  { transform: [{ translateY }], backgroundColor: colors.primary, shadowColor: colors.primary }
                ]}
              />
            </View>
            <View style={styles.sideDim} />
          </View>
          <View style={[styles.bottomDim, { flex: 1.5 }]}>
            <View className="mt-12 items-center px-8">
              <View style={{ borderRadius: Radius['2xl'], borderColor: 'rgba(255,255,255,0.1)' }} className="bg-white/10 px-4 py-3 border flex-row items-center gap-3">
                <ScanLine size={20} color={colors.primary} />
                <Text style={{ fontFamily: Fonts.body }} className="text-white text-sm font-bold">Align QR Code within the frame</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scannerWrapper: { flex: 1, backgroundColor: 'transparent' },
  overlay: { ...StyleSheet.absoluteFillObject },
  topDim: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.7)' },
  sideDim: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.7)' },
  focusFrame: { width: SCAN_SIZE, height: SCAN_SIZE, backgroundColor: 'transparent', overflow: 'hidden' },
  bottomDim: { backgroundColor: 'rgba(2, 6, 23, 0.7)' },
  laser: { height: 3, width: '100%', elevation: 10 },
});
