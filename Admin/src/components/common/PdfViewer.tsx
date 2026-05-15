import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { X, Download, ChevronLeft, FileText, AlertTriangle } from 'lucide-react-native';
import { LightColors as colors } from '../../styles/colors';
import { Fonts, Radius } from '../../styles/globalStyles';
import { useResponsive } from '../../hooks/useResponsive';
import { requestAndroidStoragePermission, downloadFile } from '../../utils/exportUtils';
import ReactNativeBlobUtil from '../../shims/react-native-blob-util';
import { API_URL } from '../../utils/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PdfViewerProps {
  uri: string;
  title?: string;
  onClose?: () => void;
}

export const PdfViewer = ({
  uri,
  title = 'Document Viewer',
  onClose,
}: PdfViewerProps) => {
  const { isMobile } = useResponsive();
  const [isLoading, setIsLoading] = React.useState(true);
  const insets = useSafeAreaInsets();
  const isLocalUri = (u: string) => {
    return u.includes('localhost') ||
      u.includes('10.78.254.247') || API_URL;
  };

  const isLocal = isLocalUri(uri);
  const isAndroid = Platform.OS === 'android';
  const isWebMobile = Platform.OS === 'web' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Google Docs Viewer doesn't work with local network IPs
  const displayUri = (isAndroid || isWebMobile) && !uri.startsWith('data:') && !uri.startsWith('file:') && !isLocal
    ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(uri)}`
    : uri;

  const handleDownload = async () => {
    const filename = title.endsWith('.pdf') ? title : `${title}.pdf`;
    await downloadFile(uri, filename);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      <View style={[styles.header, !isMobile && styles.headerDesktop]}>
        <View style={styles.headerLeft}>
          {onClose && (
            <Pressable onPress={onClose} style={styles.iconButton}>
              <ChevronLeft size={24} color={colors.foreground} />
            </Pressable>
          )}
          <View style={styles.titleContainer}>
            <FileText size={18} color={colors.primary} style={styles.titleIcon} />
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Pressable onPress={handleDownload} style={styles.actionButton}>
            <Download size={20} color={colors.foreground} />
            {!isMobile && <Text style={styles.actionText}>Download</Text>}
          </Pressable>
          {onClose && (
            <Pressable onPress={onClose} style={[styles.iconButton, styles.closeButton]}>
              <X size={20} color="white" />
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.content}>
        {Platform.OS === 'web' ? (
          <View style={styles.webContainer}>
            <iframe
              src={displayUri}
              style={{ width: '100%', height: '100%', border: 'none', borderRadius: 12 }}
              title={title}
              onLoad={() => setIsLoading(false)}
            />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            {isLocal && isAndroid ? (
              <View style={styles.localFallback}>
                <View style={styles.warningIcon}>
                  <AlertTriangle size={48} color="#d97706" />
                </View>
                <Text style={styles.warningTitle}>PREVIEW UNAVAILABLE</Text>
                <Text style={styles.warningText}>
                  PDF preview is disabled for local network IPs (10.x.x.x) on Android.
                  Please download the file to view it.
                </Text>
                <Pressable onPress={handleDownload} style={styles.downloadCallToAction}>
                  <Download size={20} color="white" />
                  <Text style={styles.downloadCallToActionText}>Download PDF Now</Text>
                </Pressable>
              </View>
            ) : (
              <WebView
                source={{ uri: displayUri }}
                style={styles.webview}
                onLoadStart={() => setIsLoading(true)}
                onLoadEnd={() => setIsLoading(false)}
                startInLoadingState={true}
                renderLoading={() => (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Loading PDF...</Text>
                  </View>
                )}
              />
            )}
          </View>
        )}

        {isLoading && Platform.OS === 'web' && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Preparing document...</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // paddingHorizontal: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    elevation: 4,
  },
  headerDesktop: { paddingHorizontal: 24, height: 72 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    maxWidth: '75%',
  },
  titleIcon: { marginRight: 8 },
  title: { fontSize: 15, fontWeight: '700', color: colors.foreground, fontFamily: Fonts.display },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  closeButton: { backgroundColor: colors.destructive, marginLeft: 4 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.xl,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  actionText: { fontSize: 14, fontWeight: '700', color: colors.foreground, fontFamily: Fonts.body },
  content: { flex: 1, padding: Platform.OS === 'web' ? 24 : 0 },
  webContainer: { flex: 1, backgroundColor: 'white', borderRadius: Radius.xl, overflow: 'hidden' },
  webview: { flex: 1, backgroundColor: 'transparent' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  loadingText: { marginTop: 16, fontSize: 15, fontWeight: '600', color: colors.mutedForeground, fontFamily: Fonts.body },
  localFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: 'white',
  },
  warningIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fffbeb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#92400e',
    fontFamily: Fonts.display,
    marginBottom: 12,
  },
  warningText: {
    fontSize: 14,
    color: '#b45309',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: Fonts.body,
    marginBottom: 32,
  },
  downloadCallToAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: Radius.xl,
    elevation: 4,
  },
  downloadCallToActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Fonts.body,
  },
});
