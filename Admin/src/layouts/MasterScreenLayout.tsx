import React, { ReactNode, createContext, useContext, useState, useMemo } from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Plus, Download } from 'lucide-react-native';
import { useResponsive } from '../hooks/useResponsive';
import { LightColors as colors } from '../styles/colors';
import { Radius, Fonts } from '../styles/globalStyles';

const iconColors = {
  primaryForeground: '#faf9f6',
  mutedForeground: '#667a70',
};

interface Props {
  title: string;
  subtitle?: string;
  module?: string;
  children: ReactNode;
  extraHeaderContent?: ReactNode;
  onAddNew?: () => void;
  addNewLabel?: string;
  onExport?: () => void;
  exportLabel?: string;
  scrollable?: boolean;
  bottomContentInset?: number;
  /**
   * Node rendered OUTSIDE and BELOW the ScrollView — always visible on every
   * platform (Android included). Pass the <Pagination /> node here so it stays
   * pinned at the bottom of the screen.
   */
  stickyFooter?: ReactNode;
}

export const MasterScreenContext = createContext({
  setStickyFooter: (node: ReactNode | null) => {},
});

export const useMasterScreen = () => useContext(MasterScreenContext);

export const MasterScreenLayout = ({
  title,
  subtitle,
  children,
  extraHeaderContent,
  onAddNew,
  addNewLabel = 'Add New',
  onExport,
  exportLabel = 'Export',
  scrollable = true,
  bottomContentInset = 0,
  stickyFooter,
}: Props) => {
  const { width, isMobile, isTablet, isDesktop } = useResponsive();
  const [internalStickyFooter, setInternalStickyFooter] = useState<ReactNode | null>(null);
  const contextValue = useMemo(() => ({ setStickyFooter: setInternalStickyFooter }), []);
  
  const finalStickyFooter = stickyFooter || internalStickyFooter;

  const isNarrow = width < 390;
  const horizontalPadding = isNarrow ? 12 : isMobile ? 16 : isTablet ? 24 : 32;
  const topPadding = isMobile ? 16 : 32;
  const bottomPadding = isMobile ? 40 : 48;

  const header = (
    <View style={{ marginBottom: isMobile ? 24 : 32 }}>
      {/* Title & Add Button Row */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.foreground,
              fontFamily: Fonts.display,
              fontSize: isNarrow ? 24 : isMobile ? 28 : 32,
              fontWeight: '900',
              letterSpacing: -0.5,
            }}
          >
            {title}
          </Text>
        </View>

        {onAddNew ? (
          <TouchableOpacity
            onPress={onAddNew}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.primary,
              paddingHorizontal: 20,
              height: 44,
              borderRadius: Radius.lg,
              minWidth: isMobile ? 120 : 160,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Plus size={18} color={iconColors.primaryForeground} strokeWidth={2.5} />
            <Text
              style={{
                color: iconColors.primaryForeground,
                fontSize: 13,
                fontWeight: '800',
                marginLeft: 6,
                fontFamily: Fonts.body,
              }}
            >
              {addNewLabel.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Subtitle */}
      {subtitle ? (
        <Text
          style={{
            color: colors.mutedForeground,
            fontFamily: Fonts.body,
            fontSize: isNarrow ? 13 : 14,
            marginTop: 4,
          }}
        >
          {subtitle}
        </Text>
      ) : null}

      {/* Extra Header Content (Filters, Export, etc.) */}
      {(extraHeaderContent || onExport) && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            width: '100%',
            justifyContent: 'flex-start',
            flexWrap: 'wrap',
            marginTop: 16,
          }}
        >
          {extraHeaderContent}
          {onExport && (
            <TouchableOpacity
              onPress={onExport}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'white',
                paddingHorizontal: 20,
                height: 44,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: Radius.lg,
                minWidth: isMobile ? 100 : 120,
              }}
            >
              <Download size={18} color={iconColors.mutedForeground} strokeWidth={2} />
              <Text
                style={{
                  color: colors.mutedForeground,
                  fontSize: 14,
                  fontWeight: '700',
                  marginLeft: 8,
                  fontFamily: Fonts.body,
                }}
              >
                {exportLabel}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  const body = (
    <View
      style={{
        width: '100%',
        maxWidth: 1600,
        alignSelf: 'center',
        paddingTop: topPadding,
        paddingHorizontal: horizontalPadding,
        // Only add bottom padding when there's no sticky footer eating that space
        paddingBottom: finalStickyFooter ? 8 : bottomPadding + bottomContentInset,
        flex: scrollable ? undefined : 1,
      }}
    >
      {header}
      {children}
    </View>
  );

  return (
    <MasterScreenContext.Provider value={contextValue}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

        {/* ── Scrollable content ──────────────────────────────── */}
      {scrollable ? (
        <ScrollView
          style={
            Platform.OS === 'web'
              ? ({ flex: 1, height: '100%' } as any)
              : { flex: 1 }
          }
          contentContainerStyle={{ minHeight: '100%' }}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          {body}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{body}</View>
      )}

      {/* ── Sticky footer (Pagination, etc.) ────────────────────
           Rendered OUTSIDE the ScrollView so it never scrolls away.
           Works on Android, iOS and Web.
      ─────────────────────────────────────────────────────────── */}
      {finalStickyFooter ? (
        <View
          style={{
            width: '100%',
            // Keep it above any bottom nav bar on Android
            ...(Platform.OS === 'android' ? { elevation: 8 } : {}),
          }}
        >
          {finalStickyFooter}
        </View>
      ) : null}
    </View>
    </MasterScreenContext.Provider>
  );
};
