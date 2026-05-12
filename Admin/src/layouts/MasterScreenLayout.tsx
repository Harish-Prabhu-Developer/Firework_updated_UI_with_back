import React, { ReactNode } from 'react';
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
}

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
}: Props) => {
  const { width, isMobile, isTablet, isDesktop } = useResponsive();

  const isNarrow = width < 390;
  const horizontalPadding = isNarrow ? 12 : isMobile ? 16 : isTablet ? 24 : 32;
  const topPadding = isMobile ? 16 : 32;
  const bottomPadding = isMobile ? 40 : 48;

  const header = (
    <View
      className={`${isMobile ? 'flex-col' : 'flex-row'} items-start justify-between`}
      style={{ marginBottom: isMobile ? 24 : 32, gap: isMobile ? 16 : 24 }}
    >
      <View style={{ flex: isMobile ? undefined : 1, width: isMobile ? '100%' : 'auto' }}>
        <View className="flex-row items-center mb-1">
          {/* Breadcrumb style indicator could go here if needed */}
        </View>
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
      </View>

      <View
        className="flex-row items-center"
        style={{
          gap: 12,
          width: isMobile ? '100%' : 'auto',
          justifyContent: isMobile ? 'flex-start' : 'flex-end',
          flexWrap: 'wrap'
        }}
      >
        {extraHeaderContent}
        {onExport && (
          <TouchableOpacity
            onPress={onExport}
            activeOpacity={0.7}
            className="flex-row items-center justify-center bg-white px-5 h-11 border border-border"
            style={{
              borderRadius: Radius.lg,
              minWidth: isMobile ? 100 : 120,
            }}
          >
            <Download size={18} color={iconColors.mutedForeground} strokeWidth={2} />
            <Text style={{ color: colors.mutedForeground, fontSize: 14, fontWeight: '700', marginLeft: 8, fontFamily: Fonts.body }}>
              {exportLabel}
            </Text>
          </TouchableOpacity>
        )}
        {onAddNew ? (
          <TouchableOpacity
            onPress={onAddNew}
            activeOpacity={0.8}
            className="flex-row items-center justify-center bg-primary px-5 h-11"
            style={{
              borderRadius: Radius.lg,
              minWidth: isMobile ? 140 : 160,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Plus size={18} color={iconColors.primaryForeground} strokeWidth={2.5} />
            <Text style={{ color: colors.primaryForeground, fontSize: 14, fontWeight: '800', marginLeft: 8, fontFamily: Fonts.body }}>
              {addNewLabel.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
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
        paddingBottom: bottomPadding,
      }}
    >
      {header}
      {children}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      {scrollable ? (
        <ScrollView
          style={Platform.OS === 'web' ? ({ flex: 1, height: '100%' } as any) : { flex: 1 }}
          contentContainerStyle={{ minHeight: '100%' }}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          {body}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{body}</View>
      )}

    </View>
  );
};
