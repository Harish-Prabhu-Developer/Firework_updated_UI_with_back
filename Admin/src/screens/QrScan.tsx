// src/screens/QrScan.tsx
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
import { ChevronLeft, ScanLine } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LightColors as colors } from '../styles/colors';
import { Radius, Fonts } from '../styles/globalStyles';
import { Camera } from 'react-native-camera-kit';

const { width } = Dimensions.get('window');
const SCAN_SIZE = 260;

// On web, the Camera shim is a real React component — always valid.
// On native, do a runtime type-check to guard against initialisation failures.
const IS_WEB = Platform.OS === 'web';
const isCameraComponent = (c: any): boolean =>
  IS_WEB || typeof c === 'function' || (c && typeof (c as any).render === 'function');

export default function QrScan({ navigation, route }: any) {
  const { onScan } = route.params || {};
  const insets = useSafeAreaInsets();

  // On web the shim requests permission itself via the browser prompt,
  // so we can start as "granted". On Android we request manually.
  const [hasPermission, setHasPermission] = useState(IS_WEB);
  const [scannerActive, setScannerActive] = useState(true);

  // Laser animation
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS === 'android') {
      requestCameraPermission();
    }

    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(scanLineAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const code = event.nativeEvent?.codeStringValue;
    if (code) {
      setScannerActive(false);
      handleScanResult(code);
    }
  };

  const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCAN_SIZE - 2],
  });

  const showCamera = hasPermission && isCameraComponent(Camera);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: Fonts.display }]}>
          Scan Order QR
        </Text>
      </View>

      {/* ── Camera + overlay ── */}
      <View style={styles.scannerWrapper}>
        {showCamera ? (
          <Camera
            style={StyleSheet.absoluteFillObject}
            scanBarcode
            onReadCode={onReadCode}
            showFrame={false}
          />
        ) : (
          /* Permission not yet granted or camera unavailable */
          !hasPermission && Platform.OS !== 'web' ? (
            <View style={styles.permissionContainer}>
              <Text style={styles.permissionText}>
                Camera permission is required to scan QR codes.
              </Text>
              <TouchableOpacity onPress={requestCameraPermission} style={styles.permissionBtn}>
                <Text style={styles.permissionBtnText}>Grant Permission</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={[styles.loadingText, { fontFamily: Fonts.body }]}>
                Initialising camera…
              </Text>
            </View>
          )
        )}

        {/* Dark overlay + focus frame — shown when camera is active */}
        {showCamera && (
          <View style={styles.overlay} pointerEvents="none">
            {/* Top dim */}
            <View style={styles.topDim} />

            {/* Middle row: side dims + focus frame */}
            <View style={{ flexDirection: 'row', height: SCAN_SIZE }}>
              <View style={styles.sideDim} />

              {/* Focus frame */}
              <View style={styles.focusFrame}>
                {/* Corner brackets */}
                <View style={[styles.corner, styles.cornerTL, { borderColor: colors.primary }]} />
                <View style={[styles.corner, styles.cornerTR, { borderColor: colors.primary }]} />
                <View style={[styles.corner, styles.cornerBL, { borderColor: colors.primary }]} />
                <View style={[styles.corner, styles.cornerBR, { borderColor: colors.primary }]} />

                {/* Laser line */}
                <Animated.View
                  style={[
                    styles.laser,
                    {
                      transform: [{ translateY }],
                      backgroundColor: colors.primary,
                      shadowColor: colors.primary,
                    },
                  ]}
                />
              </View>

              <View style={styles.sideDim} />
            </View>

            {/* Bottom dim + hint */}
            <View style={[styles.bottomDim, { flex: 1.5 }]}>
              <View style={styles.hintContainer}>
                <View style={[styles.hintPill, { borderColor: 'rgba(255,255,255,0.1)' }]}>
                  <ScanLine size={20} color={colors.primary} />
                  <Text style={[styles.hintText, { fontFamily: Fonts.body }]}>
                    Align QR Code within the frame
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#020617',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    marginLeft: 14,
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scannerWrapper: {
    flex: 1,
    backgroundColor: '#020617',
  },
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
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    elevation: 10,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  // Corner brackets
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderWidth: 4,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: Radius['2xl'] ?? 12,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: Radius['2xl'] ?? 12,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: Radius['2xl'] ?? 12,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: Radius['2xl'] ?? 12,
  },
  hintContainer: {
    marginTop: 48,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  hintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius['2xl'] ?? 16,
  },
  hintText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },
  // Permission / loading fallback states
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  permissionText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  permissionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radius.lg,
  },
  permissionBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});