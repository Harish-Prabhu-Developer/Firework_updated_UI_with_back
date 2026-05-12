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
import { ChevronLeft, ScanLine, Info, ShieldAlert } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LightColors as colors } from '../styles/colors';
import { globalStyles, Radius, Fonts } from '../styles/globalStyles';

// Dynamic import for Native Camera — Webpack alias handles web stub automatically
// See: webpack.config.js → resolve.alias → 'react-native-camera-kit'
let NativeCamera: any = null;

const { width } = Dimensions.get('window');
const SCAN_SIZE = 260;

export default function QrScan({ navigation, route }: any) {
  const { onScan } = route.params || {};
  const insets = useSafeAreaInsets();
  const [isWebReady, setIsWebReady] = useState(false);
  const [hasPermission, setHasPermission] = useState(Platform.OS === 'web');
  const [scannerActive, setScannerActive] = useState(true);

  // Animation for the laser line
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Lazy load native camera module only on Android at runtime
    if (Platform.OS === 'android') {
      try {
        NativeCamera = require('react-native-camera-kit').Camera;
      } catch (e) {
        console.warn('react-native-camera-kit not available');
      }
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

  /* ── Web Implementation ── */
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    let scanner: any = null;
    let isMounted = true;

    const loadWebScanner = async () => {
      try {
        // Ensure the DOM #qr-reader is fully mounted by React Native Web
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (!isMounted) return;

        // Dynamic import replaces require() for Vite compatibility
        const h5qr = await import('html5-qrcode');
        
        scanner = new h5qr.Html5QrcodeScanner('qr-reader', {
          fps: 10,
          qrbox: { width: SCAN_SIZE, height: SCAN_SIZE },
          aspectRatio: 1.0,
          supportedScanTypes: [h5qr.Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        }, false);

        scanner.render(
          (decodedText: string) => {
            if (scannerActive) {
              setScannerActive(false);
              scanner?.clear?.().catch(() => { });
              handleScanResult(decodedText);
            }
          },
          () => { /* Ignore frame scan errors */ }
        );
        
        if (isMounted) setIsWebReady(true);
      } catch (e) {
        console.error('Web Scanner initialization failed:', e);
      }
    };

    loadWebScanner();
    return () => {
      isMounted = false;
      try { scanner?.clear?.().catch(() => {}); } catch (_) { }
    };
  }, []);

  const handleScanResult = (result: string) => {
    // Basic validation for Order ID format (ORD-XXXXXX-XXX)
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} className="bg-slate-950">
      <StatusBar barStyle="light-content" />
      {/* Header - High Fidelity */}
      <View className="h-16 flex-row items-center px-4 bg-slate-950 border-b border-white/10">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ borderRadius: Radius.xl }}
          className="h-10 w-10 items-center justify-center bg-white/5 border border-white/10"
        >
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={{ fontFamily: Fonts.display }} className="ml-4 text-white text-lg font-black tracking-tight uppercase">Scan Order ID</Text>
      </View>

      <View style={styles.scannerWrapper}>
        {/* Web View */}
        {Platform.OS === 'web' && (
          <View style={StyleSheet.absoluteFillObject}>
            <div id="qr-reader" style={{ width: '100%', height: '100%', background: '#020617' }} />
            {!isWebReady && (
              <View className="flex-1 items-center justify-center gap-4">
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={{ fontFamily: Fonts.body }} className="text-white/60 font-medium">Initializing Optical Sensors...</Text>
              </View>
            )}
          </View>
        )}

        {/* Native View */}
        {Platform.OS !== 'web' && hasPermission && (
          <View style={StyleSheet.absoluteFillObject}>
            {NativeCamera ? (
              <NativeCamera
                style={StyleSheet.absoluteFillObject}
                scanBarcode={true}
                onReadCode={onReadCode}
                showFrame={false}
                frameColor="transparent"
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator color={colors.primary} size="large" />
              </View>
            )}
          </View>
        )}

        {/* Universal Overlay Overlay */}
        <View style={styles.overlay} pointerEvents="none">
          <View style={styles.topDim} />
          <View className="flex-row" style={{ height: SCAN_SIZE }}>
            <View style={styles.sideDim} />
            <View style={styles.focusFrame}>
              {/* Corner Brackets - Thick Industrial Style */}
              <View style={{ borderColor: colors.primary, borderTopLeftRadius: Radius['2xl'] }} className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4" />
              <View style={{ borderColor: colors.primary, borderTopRightRadius: Radius['2xl'] }} className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4" />
              <View style={{ borderColor: colors.primary, borderBottomLeftRadius: Radius['2xl'] }} className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4" />
              <View style={{ borderColor: colors.primary, borderBottomRightRadius: Radius['2xl'] }} className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4" />

              {/* Laser Animation */}
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

              <View className="mt-6 flex-row items-center gap-2 opacity-60">
                <Info size={14} color="white" />
                <Text style={{ fontFamily: Fonts.body }} className="text-white text-[11px] font-medium tracking-wide uppercase">Decodes Order Manifests</Text>
              </View>
            </View>
          </View>
        </View>

        {!hasPermission && Platform.OS !== 'web' && (
          <View className="flex-1 items-center justify-center px-12 gap-4">
            <View style={{ borderColor: 'rgba(239,68,68,0.2)' }} className="h-16 w-16 rounded-full bg-red-500/10 items-center justify-center border">
              <ShieldAlert size={32} color={colors.destructive} />
            </View>
            <Text style={{ fontFamily: Fonts.display }} className="text-white text-center font-bold text-lg">Camera Access Required</Text>
            <Text style={{ fontFamily: Fonts.body }} className="text-white/60 text-center text-sm">Please enable camera permissions in your device settings to scan orders.</Text>
            <TouchableOpacity
              onPress={requestCameraPermission}
              style={{ borderRadius: Radius.xl, backgroundColor: colors.primary }}
              className="mt-4 px-8 py-3"
            >
              <Text style={{ fontFamily: Fonts.body }} className="text-white font-bold">Grant Permission</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scannerWrapper: { flex: 1, backgroundColor: '#020617' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topDim: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.7)',
  },
  sideDim: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.7)',
  },
  focusFrame: {
    width: SCAN_SIZE,
    height: SCAN_SIZE,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  bottomDim: {
    backgroundColor: 'rgba(2, 6, 23, 0.7)',
  },
  laser: {
    height: 3,
    width: '100%',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
  },
});

