import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

export const Camera = ({ style, onReadCode, scanBarcode }) => {
  const [isReady, setIsReady] = useState(false);
  const scannerRef = useRef(null);
  const containerId = "qr-reader-web-shim";

  useEffect(() => {
    let isMounted = true;
    
    const initScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        await new Promise(resolve => setTimeout(resolve, 600));
        if (!isMounted) return;

        scannerRef.current = new Html5Qrcode(containerId);
        
        await scannerRef.current.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (scanBarcode) {
              onReadCode?.({ nativeEvent: { codeStringValue: decodedText } });
            }
          },
          () => {} 
        );
        
        if (isMounted) setIsReady(true);
      } catch (err) {
        console.error("Web Camera Shim Error:", err);
      }
    };

    initScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <View style={[style, { backgroundColor: '#000', overflow: 'hidden' }]}>
      <style dangerouslySetInnerHTML={{ __html: `
        #${containerId} video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
        #${containerId} {
          border: none !important;
        }
      `}} />
      <div id={containerId} style={{ width: '100%', height: '100%' }} />
      {!isReady && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: '#020617' }}>
          <ActivityIndicator color="#ef4444" size="large" />
          <Text style={{ color: 'rgba(255,255,255,0.6)', marginTop: 16, fontWeight: '600' }}>Initializing Lens...</Text>
        </View>
      )}
    </View>
  );
};

export default { Camera };
