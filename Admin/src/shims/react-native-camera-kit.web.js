// src/shims/react-native-camera-kit.web.js
// Web shim — uses html5-qrcode under the hood.
// Exports `Camera` as a named export so that:
//   import { Camera } from 'react-native-camera-kit';
// works on web exactly as it does on native.

import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

const CONTAINER_ID = 'qr-reader-web-shim';

export const Camera = ({ style, onReadCode, scanBarcode }) => {
  const [status, setStatus] = useState('init'); // 'init' | 'ready' | 'error'
  const scannerRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const initScanner = async () => {
      try {
        // Ensure the DOM node exists before Html5Qrcode tries to find it
        await new Promise(resolve => setTimeout(resolve, 400));
        if (!mountedRef.current) return;

        const { Html5Qrcode } = await import('html5-qrcode');
        if (!mountedRef.current) return;

        // Clean up any leftover instance
        if (scannerRef.current) {
          try { await scannerRef.current.stop(); } catch (_) { }
        }

        scannerRef.current = new Html5Qrcode(CONTAINER_ID);

        await scannerRef.current.start(
          { facingMode: 'environment' },
          { fps: 15, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
          (decodedText) => {
            if (scanBarcode && mountedRef.current) {
              onReadCode?.({ nativeEvent: { codeStringValue: decodedText } });
            }
          },
          () => { /* ignore verbose QR errors */ }
        );

        if (mountedRef.current) setStatus('ready');
      } catch (err) {
        console.error('[CameraKit Web Shim]', err);
        if (mountedRef.current) setStatus('error');
      }
    };

    initScanner();

    return () => {
      mountedRef.current = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => { }).finally(() => {
          scannerRef.current = null;
        });
      }
    };
  }, []);

  return (
    <View style={[{ backgroundColor: '#000', overflow: 'hidden' }, style]}>
      {/* Inject CSS to make the html5-qrcode video fill the container */}
      <style dangerouslySetInnerHTML={{
        __html: `
          #${CONTAINER_ID} { width: 100%; height: 100%; border: none !important; }
          #${CONTAINER_ID} video { width: 100% !important; height: 100% !important; object-fit: cover !important; }
          #${CONTAINER_ID} img { display: none !important; }
        `
      }} />

      {/* The div that html5-qrcode mounts its video into */}
      <div id={CONTAINER_ID} style={{ width: '100%', height: '100%' }} />

      {/* Overlay while the camera is starting */}
      {status === 'init' && (
        <View style={{
          position: 'absolute', inset: 0,
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: '#020617',
        }}>
          <ActivityIndicator color="#22c55e" size="large" />
          <Text style={{ color: 'rgba(255,255,255,0.6)', marginTop: 16, fontWeight: '700', fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            Initializing Camera…
          </Text>
        </View>
      )}

      {/* Error state */}
      {status === 'error' && (
        <View style={{
          position: 'absolute', inset: 0,
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: '#020617', padding: 24,
        }}>
          <Text style={{ color: '#f87171', fontWeight: '700', fontSize: 14, textAlign: 'center', marginBottom: 8 }}>
            Camera unavailable
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center' }}>
            Allow camera access in your browser and reload the page.
          </Text>
        </View>
      )}
    </View>
  );
};

export default { Camera };