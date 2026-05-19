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

  const CHECKBOX_WIDTH = 50;

  // Each column gets its explicit width; columns without a width get an equal share
  // of remaining space — but we never let them go below 100 px.
  const fixedTotal = columns.reduce((acc, col) => acc + (col.width ?? 0), 0);
  const flexCols = columns.filter(c => !c.width).length;

  // Total table width = checkbox col + all column widths (min 120 for flex cols)
  const minColWidth = 120;
  const minTableWidth =
    (onSelectAll ? CHECKBOX_WIDTH : 0) +
    columns.reduce((acc, col) => acc + (col.width ?? minColWidth), 0);
  const wrapTextStyle = {
    flexShrink: 1,
    flexWrap: 'wrap' as const,
    minWidth: 0,
    maxWidth: '100%' as const,
  };
  const webWrapStyle = {
    wordBreak: 'break-word',
    overflowWrap: 'anywhere',
  } as any;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator
      scrollEventThrottle={16}
      decelerationRate="fast"
      contentContainerStyle={{ minWidth: '100%', flexGrow: 1 }}
    >
      <View style={{ minWidth: minTableWidth, width: '100%' }}>
        {/* ── Header ─────────────────────────────────────────── */}
        <View style={{ flexDirection: 'row', backgroundColor: '#f8fafc', borderBottomWidth: 2, borderBottomColor: colors.border, alignItems: 'center' }}>
          {onSelectAll && (
            <TouchableOpacity
              onPress={() => onSelectAll(!allSelected)}
              style={{ width: CHECKBOX_WIDTH, height: 48, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <View
                style={{
                  width: 16, height: 16, borderRadius: 4, borderWidth: 2,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: allSelected ? colors.primary : someSelected ? colors.primary + '66' : 'white',
                  borderColor: (allSelected || someSelected) ? colors.primary : '#cbd5e1',
                }}
              >
                {(allSelected || someSelected) && (
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: '900', lineHeight: 12 }}>
                    {allSelected ? '✓' : '–'}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}

          {columns.map((col) => (
            <TouchableOpacity
              key={col.key}
              style={{
                width: col.width ?? minColWidth,
                flexShrink: 0,
                paddingHorizontal: 16,
                paddingVertical: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent:
                  col.align === 'right' ? 'flex-end' :
                    col.align === 'center' ? 'center' : 'flex-start',
              }}
              onPress={() => col.sortable && onSort?.(col.key)}
              disabled={!col.sortable}
            >
              <Text
                style={{
                  fontFamily: Fonts.display,
                  fontSize: 11,
                  fontWeight: '900',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  ...wrapTextStyle,
                  ...webWrapStyle,
                }}
              >
                {col.label}
              </Text>
              {col.sortable && (
                <View style={{ marginLeft: 4 }}>
                  {sortKey === col.key
                    ? sortDir === 'asc'
                      ? <ChevronUp size={12} color={colors.primary} />
                      : <ChevronDown size={12} color={colors.primary} />
                    : <ChevronDown size={12} color="#cbd5e1" />}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Rows ───────────────────────────────────────────── */}
        {loading ? (
          <View style={{ paddingVertical: 48, alignItems: 'center', backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ fontFamily: Fonts.body, color: colors.mutedForeground, fontSize: 14 }}>Loading data…</Text>
          </View>
        ) : data.length === 0 ? (
          <View style={{ paddingVertical: 48, alignItems: 'center', backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ fontFamily: Fonts.body, color: colors.mutedForeground, fontSize: 14 }}>{emptyText}</Text>
          </View>
        ) : (
          data.map((row, idx) => {
            const id = row[idKey];
            const isSelected = selectedIds?.has(id) ?? false;
            return (
              <View
                key={id ?? idx}
                style={{
                  flexDirection: 'row',
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                  alignItems: 'center',
                  backgroundColor: isSelected
                    ? colors.primary + '0D'
                    : idx % 2 === 0
                      ? 'white'
                      : '#f8fafc55',
                }}
              >
                {onSelectRow && (
                  <TouchableOpacity
                    onPress={() => onSelectRow(id)}
                    style={{ width: CHECKBOX_WIDTH, height: 56, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  >
                    <View
                      style={{
                        width: 16, height: 16, borderRadius: 4, borderWidth: 2,
                        alignItems: 'center', justifyContent: 'center',
                        backgroundColor: isSelected ? colors.primary : 'white',
                        borderColor: isSelected ? colors.primary : '#cbd5e1',
                      }}
                    >
                      {isSelected && (
                        <Text style={{ color: 'white', fontSize: 10, fontWeight: '900', lineHeight: 12 }}>✓</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )}

                {columns.map(col => (
                  <View
                    key={col.key}
                    style={{
                      width: col.width ?? minColWidth,
                      flexShrink: 0,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      alignItems:
                        col.align === 'right' ? 'flex-end' :
                          col.align === 'center' ? 'center' : 'flex-start',
                      overflow: 'visible',
                    }}
                  >
                    {col.render
                      ? (
                        <View
                          style={{
                            maxWidth: '100%',
                            minWidth: 0,
                            flexShrink: 1,
                            alignItems:
                              col.align === 'right' ? 'flex-end' :
                                col.align === 'center' ? 'center' : 'flex-start',
                          }}
                        >
                          {col.render(row, idx)}
                        </View>
                      )
                      : (
                        <Text
                          style={{
                            fontFamily: Fonts.body,
                            fontSize: 14,
                            color: colors.foreground,
                            ...wrapTextStyle,
                            ...webWrapStyle,
                          }}
                        >
                          {String(row[col.key] ?? '')}
                        </Text>
                      )}
                  </View>
                ))}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
};
