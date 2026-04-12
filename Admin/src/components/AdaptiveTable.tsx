import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, useWindowDimensions, Platform, StyleSheet } from 'react-native';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Checkbox } from './ui/Checkbox';
import {
  Search,
  Trash2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react-native';
import { cn } from '../lib/utils';
import { Card } from './ui/Card';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  mobileHide?: boolean;
}

interface AdaptiveTableProps<T extends { id: string }> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchKeys?: string[];
  onBulkDelete?: (ids: string[]) => void;
  renderMobileCard?: (item: T, selected: boolean, onSelect: () => void) => React.ReactNode;
  renderCardHeader?: (item: T) => React.ReactNode;
  renderCardBody?: (item: T) => React.ReactNode;
  renderCardFooter?: (item: T) => React.ReactNode;
  filterComponent?: React.ReactNode;
  onRowPress?: (item: T) => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

export function AdaptiveTable<T extends { id: string }>({
  data,
  columns,
  searchPlaceholder = 'Search...',
  searchKeys = [],
  onBulkDelete,
  renderMobileCard,
  renderCardHeader,
  renderCardBody,
  renderCardFooter,
  filterComponent,
  onRowPress,
  selectedIds,
  onSelectionChange,
}: AdaptiveTableProps<T>) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [search, setSearch] = useState('');
  const [internalSelected, setInternalSelected] = useState<Set<string>>(new Set());

  const selected = useMemo(() => {
    return selectedIds ? new Set(selectedIds) : internalSelected;
  }, [selectedIds, internalSelected]);

  const updateSelected = (next: Set<string>) => {
    if (onSelectionChange) {
      onSelectionChange(Array.from(next));
    } else {
      setInternalSelected(next);
    }
  };

  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const filtered = useMemo(() => {
    let result = data;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((item) =>
        searchKeys.some((key) => {
          const val = (item as Record<string, unknown>)[key];
          return val != null && String(val).toLowerCase().includes(q);
        })
      );
    }
    if (sortKey) {
      result = [...result].sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[sortKey];
        const bVal = (b as Record<string, unknown>)[sortKey];
        const cmp = String(aVal ?? '').localeCompare(String(bVal ?? ''), undefined, { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return result;
  }, [data, search, searchKeys, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const allSelected = paged.length > 0 && paged.every((i) => selected.has(i.id));

  const toggleAll = () => {
    if (allSelected) updateSelected(new Set());
    else updateSelected(new Set(paged.map((i) => i.id)));
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    updateSelected(next);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  // ── Desktop table header ──────────────────────────────────────────────
  const renderHeader = () => (
    <View style={styles.tableHeader}>
      <View style={{ width: 40, justifyContent: 'center' }}>
        <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
      </View>
      {columns.map((col) => (
        <View
          key={col.key}
          style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 8 }}
        >
          {col.sortable ? (
            <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} onPress={() => handleSort(col.key)}>
              <Text style={styles.tableHeaderText}>{col.label}</Text>
              <ArrowUpDown size={11} color="#94a3b8" />
            </Pressable>
          ) : (
            <Text style={styles.tableHeaderText}>{col.label}</Text>
          )}
        </View>
      ))}
    </View>
  );

  const renderRow = (item: T) => (
    <Pressable
      key={item.id}
      style={({ pressed }) => [styles.tableRow, pressed && { backgroundColor: '#f8fafc' }]}
      onPress={() => onRowPress?.(item)}
    >
      <View style={{ width: 40, justifyContent: 'center' }}>
        <Checkbox checked={selected.has(item.id)} onCheckedChange={() => toggleOne(item.id)} />
      </View>
      {columns.map((col) => (
        <View key={col.key} style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 8 }}>
          {col.render ? col.render(item) : (
            <Text style={styles.cellText} numberOfLines={1}>
              {String((item as Record<string, unknown>)[col.key] ?? '')}
            </Text>
          )}
        </View>
      ))}
    </Pressable>
  );

  // ── Mobile card ───────────────────────────────────────────────────────
  const renderMobileItem = (item: T) => {
    if (renderMobileCard) {
      return renderMobileCard(item, selected.has(item.id), () => toggleOne(item.id));
    }

    const isSelected = selected.has(item.id);

    return (
      <Pressable
        key={item.id}
        onPress={() => onRowPress?.(item)}
        style={({ pressed }) => [
          styles.card,
          isSelected && styles.cardSelected,
          pressed && { opacity: 0.97, transform: [{ scale: 0.99 }] },
        ]}
      >
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            {renderCardHeader ? renderCardHeader(item) : (
              columns.slice(0, 2).map((col, idx) => (
                <View key={col.key} style={idx === 0 ? { marginBottom: 2 } : {}}>
                  <Text style={idx === 0 ? styles.cardTitle : styles.cardSubtitle}>
                    {col.render
                      ? col.render(item)
                      : String((item as Record<string, unknown>)[col.key] ?? '')}
                  </Text>
                </View>
              ))
            )}
          </View>
          <Pressable
            onPress={() => toggleOne(item.id)}
            hitSlop={10}
            style={[styles.checkboxWrap, isSelected && styles.checkboxWrapActive]}
          >
            <Checkbox checked={isSelected} onCheckedChange={() => toggleOne(item.id)} />
          </Pressable>
        </View>

        {/* Card Body */}
        {renderCardBody && (
          <View style={styles.cardBody}>
            {renderCardBody(item)}
          </View>
        )}

        {/* Card Footer / Actions */}
        {renderCardFooter && (
          <View style={styles.cardFooter}>
            {renderCardFooter(item)}
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* ── Toolbar ── */}
      <View style={styles.toolbar}>
        {/* Search */}
        <View style={styles.searchBar}>
          <Search size={16} color="#94a3b8" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChangeText={(v) => { setSearch(v); setPage(1); }}
            className="flex-1 border-0 bg-transparent h-10 px-2 text-sm"
            containerClassName="flex-1"
          />
        </View>

        {/* Filters */}
        {filterComponent && <View style={{ marginTop: 10 }}>{filterComponent}</View>}

        {/* Bulk delete bar */}
        {selected.size > 0 && (
          <View style={styles.bulkBar}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.bulkCount}>
                <Text style={styles.bulkCountText}>{selected.size}</Text>
              </View>
              <Text style={styles.bulkLabel}>items selected</Text>
            </View>
            {onBulkDelete && (
              <Pressable
                style={({ pressed }) => [styles.bulkDeleteBtn, pressed && { opacity: 0.8 }]}
                onPress={() => { onBulkDelete(Array.from(selected)); updateSelected(new Set()); }}
              >
                <Trash2 size={14} color="#fff" />
                <Text style={styles.bulkDeleteText}>Delete</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* ── Content ── */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 8 }}>
        {isMobile ? (
          <View style={{ paddingHorizontal: 14, paddingTop: 4, paddingBottom: 16 }}>
            {paged.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyTitle}>No records found</Text>
                <Text style={styles.emptySubtitle}>Try adjusting your search or filters</Text>
              </View>
            ) : (
              paged.map(renderMobileItem)
            )}
          </View>
        ) : (
          <View style={{ marginHorizontal: 16, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, backgroundColor: '#fff', overflow: 'hidden' }}>
            {renderHeader()}
            <View>
              {paged.map(renderRow)}
              {paged.length === 0 && (
                <View style={{ paddingVertical: 80, alignItems: 'center' }}>
                  <Text style={{ color: '#94a3b8' }}>No records found</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Pagination ── */}
      <View style={styles.pagination}>
        <Text style={styles.paginationInfo}>
          {filtered.length === 0
            ? 'No results'
            : `${(page - 1) * perPage + 1}–${Math.min(page * perPage, filtered.length)} of ${filtered.length}`}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Pressable
            style={({ pressed }) => [styles.pageBtn, page === 1 && styles.pageBtnDisabled, pressed && { opacity: 0.7 }]}
            onPress={() => setPage(1)}
            disabled={page === 1}
          >
            <ChevronsLeft size={15} color={page === 1 ? '#cbd5e1' : '#475569'} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.pageBtn, page === 1 && styles.pageBtnDisabled, pressed && { opacity: 0.7 }]}
            onPress={() => setPage(page - 1)}
            disabled={page === 1}
          >
            <ChevronLeft size={15} color={page === 1 ? '#cbd5e1' : '#475569'} />
          </Pressable>

          <View style={styles.pageIndicator}>
            <Text style={styles.pageIndicatorText}>{page} / {totalPages}</Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.pageBtn, page === totalPages && styles.pageBtnDisabled, pressed && { opacity: 0.7 }]}
            onPress={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            <ChevronRight size={15} color={page === totalPages ? '#cbd5e1' : '#475569'} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.pageBtn, page === totalPages && styles.pageBtnDisabled, pressed && { opacity: 0.7 }]}
            onPress={() => setPage(totalPages)}
            disabled={page === totalPages}
          >
            <ChevronsRight size={15} color={page === totalPages ? '#cbd5e1' : '#475569'} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Toolbar ─────────────────────────────────────────────
  toolbar: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...(Platform.OS === 'android' ? { elevation: 1 } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
    }),
  },
  bulkBar: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  bulkCount: {
    backgroundColor: '#2563eb',
    borderRadius: 20,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulkCountText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  bulkLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e40af',
  },
  bulkDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ef4444',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  bulkDeleteText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Mobile Card ──────────────────────────────────────────
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e8edf2',
    overflow: 'hidden',
    ...(Platform.OS === 'android' ? { elevation: 3 } : {
      shadowColor: '#64748b',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    }),
  },
  cardSelected: {
    borderColor: '#6366f1',
    borderWidth: 1.5,
    ...(Platform.OS === 'android' ? { elevation: 5 } : {
      shadowColor: '#6366f1',
      shadowOpacity: 0.2,
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  checkboxWrap: {
    padding: 4,
    borderRadius: 8,
  },
  checkboxWrapActive: {
    backgroundColor: '#eff6ff',
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#fafafa',
  },

  // ── Desktop table ────────────────────────────────────────
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  cellText: {
    fontSize: 14,
    color: '#1e293b',
  },

  // ── Empty state ──────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94a3b8',
  },

  // ── Pagination ───────────────────────────────────────────
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  paginationInfo: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  pageBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageBtnDisabled: {
    borderColor: '#f1f5f9',
    backgroundColor: '#fafafa',
  },
  pageIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  pageIndicatorText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
});
