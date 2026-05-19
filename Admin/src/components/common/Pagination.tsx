import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { ChevronLeft, ChevronRight, List } from 'lucide-react-native';
import { useResponsive } from '../../hooks/useResponsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  page: number;
  totalPages: number;
  total: number;
  perPage: number;
  onPageChange: (p: number) => void;
}

export const Pagination = ({ page, totalPages, total, perPage, onPageChange }: Props) => {
  const { width, isMobile, isDesktop } = useResponsive();
  const isNarrow = width < 390;
  const maxVisible = isMobile ? 3 : 5;
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  const insets = useSafeAreaInsets();

  // Build page number list with ellipsis
  const pages: (number | '...')[] = [];
  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    const half = Math.floor(maxVisible / 2);
    const start = Math.max(1, Math.min(page - half, totalPages - maxVisible + 1));
    const end = Math.min(totalPages, start + maxVisible - 1);
    if (start > 1) { pages.push(1); if (start > 2) pages.push('...'); }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) { if (end < totalPages - 1) pages.push('...'); pages.push(totalPages); }
  }

  const Btn = ({
    children,
    onPress,
    active,
    disabled,
    wide,
  }: {
    children: React.ReactNode;
    onPress: () => void;
    active?: boolean;
    disabled?: boolean;
    wide?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={{
        height: 34,
        width: wide ? (isNarrow ? 46 : 66) : 34,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        borderWidth: 1,
        marginHorizontal: 2,
        borderColor: active ? colors.primary : '#e2e8f0',
        backgroundColor: active ? colors.primary : 'white',
        opacity: disabled ? 0.38 : 1,
      }}
    >
      {children}
    </TouchableOpacity>
  );

  // Inline color tokens (avoid importing the whole file just for this component)
  const colors = {
    primary: 'hsl(145, 45%, 28%)',
    muted: '#64748b',
    disabledArrow: '#cbd5e1',
    activeArrow: '#111827',
  } as const;

  return (
    <View
      style={[
        {
          width: '100%',
          backgroundColor: 'white',
          paddingHorizontal: isNarrow ? 10 : 16,
          paddingTop: 10,
          marginBottom: insets.bottom,
          // Extra bottom padding for iOS home indicator; Android gets 12
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
        },
        // Elevation / shadow — platform-specific
        Platform.OS === 'android'
          ? { elevation: 12 }
          : Platform.OS === 'ios'
            ? {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -3 },
              shadowOpacity: 0.08,
              shadowRadius: 10,
            }
            : {
              // Web: box-shadow upward
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
            },
        // Layout: side-by-side on desktop, stacked on mobile
        isDesktop
          ? { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }
          : { alignItems: 'center' },
      ]}
    >
      {/* ── Record count label ───────────────────────────────── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginBottom: isDesktop ? 0 : 8,
        }}
      >
        <List size={14} color={colors.muted} />
        <Text
          style={{ fontSize: 12, fontWeight: '500', color: colors.muted }}
          numberOfLines={1}
        >
          {total === 0
            ? 'No records found'
            : `Showing ${from}–${to} of ${total} records`}
        </Text>
      </View>

      {/* ── Page buttons ─────────────────────────────────────── */}
      {totalPages > 1 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap' }}>
          {/* Prev */}
          <Btn onPress={() => onPageChange(page - 1)} disabled={page === 1} wide>
            <ChevronLeft size={13} color={page === 1 ? colors.disabledArrow : colors.muted} />
            {!isNarrow && (
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.muted, marginLeft: 2 }}>
                Prev
              </Text>
            )}
          </Btn>

          {/* Page numbers */}
          {pages.map((p, i) =>
            p === '...' ? (
              <Text
                key={`dot-${i}`}
                style={{ fontSize: 13, color: colors.muted, marginHorizontal: 3 }}
              >
                …
              </Text>
            ) : (
              <Btn
                key={p}
                onPress={() => onPageChange(p as number)}
                active={p === page}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '800',
                    color: p === page ? 'white' : '#1e293b',
                  }}
                >
                  {p}
                </Text>
              </Btn>
            )
          )}

          {/* Next */}
          <Btn onPress={() => onPageChange(page + 1)} disabled={page === totalPages} wide>
            {!isNarrow && (
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#1e293b', marginRight: 2 }}>
                Next
              </Text>
            )}
            <ChevronRight size={13} color={page === totalPages ? colors.disabledArrow : colors.activeArrow} />
          </Btn>
        </View>
      )}
    </View>
  );
};