// Web shim for react-native-webview
// Uses an iframe on web platform
import React, { forwardRef } from 'react';
import { View, StyleSheet } from 'react-native';

const WebView = forwardRef(({ source, style, ...props }, ref) => {
  const uri = typeof source === 'string' ? source : source?.uri || '';
  const html = source?.html || '';

  const iframeStyle = {
    width: '100%',
    height: '100%',
    border: 'none',
    ...(style || {}),
  };

  if (html) {
    return (
      <View style={style}>
        <iframe
          ref={ref}
          srcDoc={html}
          style={iframeStyle}
          allow="autoplay; fullscreen"
          allowFullScreen
          {...props}
        />
      </View>
    );
  }

  return (
    <View style={style}>
      <iframe
        ref={ref}
        src={uri}
        style={iframeStyle}
        allow="autoplay; fullscreen"
        allowFullScreen
        {...props}
      />
    </View>
  );
});

export { WebView };
export default WebView;
