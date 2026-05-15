import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ChevronUp, ChevronDown } from 'lucide-react-native';
import { Fonts } from '../../styles/globalStyles';
import { LightColors as colors } from '../../styles/colors';

export interface Column<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: number;
  render?: (item: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface Props<T> {
  data: T[];
  columns: Column<T>[];
  selectedIds?: Set<string>;
  onSelectAll?: (all: boolean) => void;
  onSelectRow?: (id: string) => void;
  idKey?: string;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  emptyText?: string;
  loading?: boolean;
  showTable?: boolean;
}

export const TableView = <T extends Record<string, any>>({
  data, columns,
  selectedIds, onSelectAll, onSelectRow,
  idKey = 'id',
  sortKey, sortDir, onSort,
  emptyText = 'No records found.',
  loading,
}: Props<T>) => {
  const allSelected = data.length > 0 && data.every(r => selectedIds?.has(r[idKey]));
  const someSelected = !allSelected && data.some(r => selectedIds?.has(r[idKey]));

  // Calculate the total minimum width needed to prevent overlapping
  const minTableWidth = columns.reduce((acc, col) => acc + (col.width ?? 150), onSelectAll ? 50 : 0);

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator
      scrollEventThrottle={16}
      decelerationRate="fast"
      contentContainerStyle={{ minWidth: '100%' }}
    >
      <View style={{ width: minTableWidth }}>
        {/* Header */}
        <View className="flex-row bg-slate-50 border-b-2 border-border items-center">
          {onSelectAll && (
            <TouchableOpacity
              onPress={() => onSelectAll(!allSelected)}
              style={{ width: 50, height: 48, alignItems: 'center', justifyContent: 'center' }}
            >
              <View className={`w-4 h-4 rounded border-2 items-center justify-center
                ${allSelected ? 'bg-primary border-primary' : someSelected ? 'bg-primary/40 border-primary' : 'border-slate-300 bg-white'}`}>
                {(allSelected || someSelected) && (
                  <Text className="text-white text-[10px] font-black leading-none">{allSelected ? '✓' : '–'}</Text>
                )}
              </View>
            </TouchableOpacity>
          )}
          {columns.map((col) => {
            const isSmall = col.width && col.width < 100;
            return (
              <TouchableOpacity
                key={col.key}
                style={{ 
                  flexBasis: col.width ?? 150,
                  flexGrow: isSmall ? 0 : 1,
                  flexShrink: 0,
                  paddingHorizontal: 16, 
                  paddingVertical: 14,
                  alignItems: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start',
                }}
                onPress={() => col.sortable && onSort?.(col.key)}
                disabled={!col.sortable}
                className="flex-row items-center gap-1"
              >
                <Text style={{ fontFamily: Fonts.display }} className="text-[11px] font-black text-slate-500 uppercase tracking-wide">
                  {col.label}
                </Text>
                {col.sortable && (
                  <View className="ml-1">
                    {sortKey === col.key
                      ? sortDir === 'asc'
                        ? <ChevronUp size={12} color={colors.primary} />
                        : <ChevronDown size={12} color={colors.primary} />
                      : <ChevronDown size={12} color="#cbd5e1" />}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Rows */}
        {loading ? (
          <View className="py-12 items-center bg-white border-b border-border">
            <Text style={{ fontFamily: Fonts.body }} className="text-muted-foreground text-sm">Loading data…</Text>
          </View>
        ) : data.length === 0 ? (
          <View className="py-12 items-center bg-white border-b border-border">
            <Text style={{ fontFamily: Fonts.body }} className="text-muted-foreground text-sm">{emptyText}</Text>
          </View>
        ) : (
          data.map((row, idx) => {
            const id = row[idKey];
            const isSelected = selectedIds?.has(id) ?? false;
            return (
              <View
                key={id ?? idx}
                className={`flex-row border-b border-border items-center
                  ${isSelected ? 'bg-primary/5' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
              >
                {onSelectRow && (
                  <TouchableOpacity
                    onPress={() => onSelectRow(id)}
                    style={{ width: 50, height: 56, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <View className={`w-4 h-4 rounded border-2 items-center justify-center
                      ${isSelected ? 'bg-primary border-primary' : 'border-slate-300 bg-white'}`}>
                      {isSelected && <Text className="text-white text-[10px] font-black leading-none">✓</Text>}
                    </View>
                  </TouchableOpacity>
                )}
                {columns.map(col => {
                  const isSmall = col.width && col.width < 100;
                  return (
                    <View
                      key={col.key}
                      style={{
                        flexBasis: col.width ?? 150,
                        flexGrow: isSmall ? 0 : 1,
                        flexShrink: 0,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        alignItems: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start',
                      }}
                    >
                      {col.render
                        ? col.render(row, idx)
                        : <Text style={{ fontFamily: Fonts.body }} className="text-sm text-foreground" numberOfLines={2}>{String(row[col.key] ?? '')}</Text>}
                    </View>
                  );
                })}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
};
