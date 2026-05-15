import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { ChevronLeft, ChevronRight, List } from 'lucide-react-native';
import { useResponsive } from '../../hooks/useResponsive';

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
  const maxVisiblePages = isMobile ? 3 : 5;
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  const pages: (number | '...')[] = [];
  if (totalPages <= maxVisiblePages) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    const halfWindow = Math.floor(maxVisiblePages / 2);
    const startPage = Math.max(1, Math.min(page - halfWindow, totalPages - maxVisiblePages + 1));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) pages.push('...');
    }
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
  }

  const Btn = ({ children, onPress, active, disabled, wide }: any) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`h-9 flex-row items-center justify-center rounded-lg border mx-0.5
        ${active ? 'bg-primary border-primary' : 'bg-white border-border'}
        ${disabled ? 'opacity-40' : 'active:opacity-70'}`}
      style={{ width: wide ? (isNarrow ? 44 : 68) : 36 }}
    >
      {children}
    </TouchableOpacity>
  );

  return (
    <View
      style={[
        {
          width: '100%',
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          paddingHorizontal: isNarrow ? 10 : 16,
          paddingTop: 10,
          paddingBottom: Platform.OS === 'ios' ? 24 : 12,
          // Web: border all sides; native: only top border (it sits flush at bottom)
          ...(Platform.OS === 'web'
            ? {
              borderWidth: 1,
              borderColor: '#e2e8f0',
              borderRadius: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
            }
            : {
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -3 },
              shadowOpacity: 0.08,
              shadowRadius: 10,
            }),
        },
        isDesktop
          ? { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }
          : { alignItems: 'center', gap: 8 },
      ]}
    >
      {/* Record count */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: isDesktop ? 0 : 6 }}>
        <List size={15} color="#64748b" />
        <Text
          className="text-xs text-muted-foreground font-medium"
          numberOfLines={1}
        >
          {total === 0 ? 'No records found' : `Showing ${from}–${to} of ${total}`}
        </Text>
      </View>

      {/* Page buttons */}
      {totalPages > 1 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'nowrap' }}>
          <Btn onPress={() => onPageChange(page - 1)} disabled={page === 1} wide>
            <ChevronLeft size={14} color={page === 1 ? '#cbd5e1' : '#64748b'} />
            {!isNarrow && (
              <Text className="text-xs font-semibold text-muted-foreground ml-1">Prev</Text>
            )}
          </Btn>

          {pages.map((p, i) =>
            p === '...' ? (
              <Text key={`dot-${i}`} className="text-muted-foreground px-1 text-sm">
                …
              </Text>
            ) : (
              <Btn key={p} onPress={() => onPageChange(p as number)} active={p === page}>
                <Text className={`text-xs font-bold ${p === page ? 'text-white' : 'text-foreground'}`}>
                  {p}
                </Text>
              </Btn>
            )
          )}

          <Btn onPress={() => onPageChange(page + 1)} disabled={page === totalPages} wide>
            {!isNarrow && (
              <Text className="text-xs font-semibold text-foreground mr-1">Next</Text>
            )}
            <ChevronRight size={14} color={page === totalPages ? '#cbd5e1' : '#111827'} />
          </Btn>
        </View>
      )}
    </View>
  );
};