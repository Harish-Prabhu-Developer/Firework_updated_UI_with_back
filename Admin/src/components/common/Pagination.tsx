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
  const { isMobile, isDesktop } = useResponsive();
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  const pages: (number | '...')[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    const startPage = Math.max(1, Math.min(page - 2, totalPages - 4));
    const endPage = Math.min(totalPages, startPage + 4);
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
      style={{ width: wide ? 68 : 36 }}
    >
      {children}
    </TouchableOpacity>
  );

  return (
    <View
      className={`${!isDesktop ? 'items-center' : 'flex-row items-center justify-between'} gap-3 px-3 py-4 bg-white border border-border rounded-xl`}
      style={{
        marginTop: !isDesktop ? 0 : 16,
        ...(((Platform.OS === 'web' && !isDesktop) || Platform.OS === 'android') ? {
          position: (Platform.OS === 'web' ? 'st' : 'absolute') as any,
          bottom: Platform.OS === 'web' ? 40 : 25,
          left: 20,
          right: 20,
          zIndex: 999,
          backgroundColor: 'white',
          borderWidth: 1.5,
          borderColor: '#e2e8f0',
          alignSelf: 'center',
          maxWidth: Platform.OS === 'web' ? 600 : '100%',
        } : {}),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: ((Platform.OS === 'web' && !isDesktop) || Platform.OS === 'android') ? 8 : 4 },
        shadowOpacity: ((Platform.OS === 'web' && !isDesktop) || Platform.OS === 'android') ? 0.2 : 0.04,
        shadowRadius: ((Platform.OS === 'web' && !isDesktop) || Platform.OS === 'android') ? 24 : 14,
        elevation: ((Platform.OS === 'web' && !isDesktop) || Platform.OS === 'android') ? 12 : 1,
      }}
    >
      <View className="flex-row items-center gap-1.5">
        <List size={15} color="#64748b" />
        <Text className="text-xs text-muted-foreground font-medium">
          {total === 0 ? 'No records found' : `Showing ${from} to ${to} of ${total} records`}
        </Text>
      </View>

      {totalPages > 1 && (
        <View className="flex-row items-center justify-center flex-wrap">
          <Btn onPress={() => onPageChange(page - 1)} disabled={page === 1} wide>
            <ChevronLeft size={14} color={page === 1 ? '#cbd5e1' : '#64748b'} />
            <Text className="text-xs font-semibold text-muted-foreground ml-1">Prev</Text>
          </Btn>
          {pages.map((p, i) =>
            p === '...' ? (
              <Text key={`dot-${i}`} className="text-muted-foreground px-1 text-sm">...</Text>
            ) : (
              <Btn key={p} onPress={() => onPageChange(p as number)} active={p === page}>
                <Text className={`text-xs font-bold ${p === page ? 'text-white' : 'text-foreground'}`}>{p}</Text>
              </Btn>
            )
          )}
          <Btn onPress={() => onPageChange(page + 1)} disabled={page === totalPages} wide>
            <Text className="text-xs font-semibold text-foreground mr-1">Next</Text>
            <ChevronRight size={14} color={page === totalPages ? '#cbd5e1' : '#111827'} />
          </Btn>
        </View>
      )}
    </View>
  );
};
