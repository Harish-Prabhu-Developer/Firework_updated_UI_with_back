import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useResponsive } from '../hooks/useResponsive';
import { TableView, Column } from './table/TableView';
import { CardView } from './card/CardView';
import { Pagination } from './common/Pagination';
import { useMasterScreen } from '../layouts/MasterScreenLayout';
import { Toolbar, ToolbarFilter } from './common/Toolbar';
import { ParsedCSVRow } from '../utils/importUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props<T> {
  data: T[];
  columns: Column<T>[];
  idKey?: string;
  loading?: boolean;
  emptyText?: string;

  // Search
  searchValue: string;
  onSearchChange: (v: string) => void;

  // Filters
  filters?: ToolbarFilter[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;

  // Toolbar
  onAddNew?: () => void;
  addNewLabel?: string;
  selectedIds?: Set<string>;
  onSelectAll?: (all: boolean) => void;
  onSelectRow?: (id: string) => void;
  onBulkDelete?: () => void;

  // Export / Import
  exportColumns?: { key: string; label: string }[];
  exportData?: Record<string, any>[];
  exportTitle?: string;
  exportFilename?: string;
  onImport?: (rows: ParsedCSVRow[]) => void;
  showImport?: boolean;

  // Card rendering
  renderCardHeader?: (item: T) => React.ReactNode;
  renderCardBody?: (item: T) => React.ReactNode;
  renderCardFooter?: (item: T) => React.ReactNode;
  renderCard?: (item: T, isSelected: boolean) => React.ReactNode;

  // Extra toolbar content
  extraToolbarActions?: React.ReactNode;

  // Pagination
  /**
   * true  = AdaptiveTable manages internal pagination. The <Pagination> node is
   *         returned via `onPaginationRender` so the parent can place it in
   *         MasterScreenLayout's `stickyFooter` prop — keeping it truly pinned
   *         outside the ScrollView on every platform (Android included).
   *
   * false = Caller owns pagination externally (e.g. BillHistory server-side paging).
   */
  showPagination?: boolean;
  /**
   * Called whenever the internal pagination node changes.
   * Pass this to MasterScreenLayout's `stickyFooter` prop.
   *
   * @example
   * const [paginationNode, setPaginationNode] = useState<React.ReactNode>(null);
   * ...
   * <MasterScreenLayout stickyFooter={paginationNode}>
   *   <AdaptiveTable onPaginationRender={setPaginationNode} ... />
   * </MasterScreenLayout>
   */
  onPaginationRender?: (node: React.ReactNode | null) => void;

  // External (server-side) pagination helpers
  externalPerPage?: number;
  onExternalPerPageChange?: (n: number) => void;
}

const PAGE_SIZE_DEFAULT = 5;

export const AdaptiveTable = <T extends Record<string, any>>({
  data,
  columns,
  idKey = 'id',
  loading,
  emptyText,
  searchValue,
  onSearchChange,
  filters,
  filterValues,
  onFilterChange,
  onAddNew,
  addNewLabel,
  selectedIds,
  onSelectAll,
  onSelectRow,
  onBulkDelete,
  exportColumns,
  exportData,
  exportTitle,
  exportFilename,
  onImport,
  showImport,
  renderCardHeader,
  renderCardBody,
  renderCardFooter,
  renderCard,
  extraToolbarActions,
  showPagination = true,
  onPaginationRender,
  externalPerPage,
  onExternalPerPageChange,
}: Props<T>) => {
  const { showTable } = useResponsive();
  const isFocused = useIsFocused();
  const { setStickyFooter } = useMasterScreen();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(PAGE_SIZE_DEFAULT);
  const insets = useSafeAreaInsets();
  const safeData = Array.isArray(data) ? data : [];
  const effectivePP = perPage === 999999 ? safeData.length : perPage;
  const totalPages = Math.max(1, Math.ceil(safeData.length / effectivePP));
  const paged = showPagination
    ? safeData.slice((page - 1) * effectivePP, page * effectivePP)
    : safeData;

  // Reset to page 1 when data length changes (e.g. after search/filter)
  useEffect(() => { setPage(1); }, [safeData.length]);

  // Push the Pagination node to the parent whenever page/totalPages/perPage changes.
  // The parent should place this in MasterScreenLayout's `stickyFooter` so it is
  // rendered OUTSIDE the ScrollView — this is the only reliable way to keep it
  // fixed at the bottom on Android.
  useEffect(() => {
    const publishPagination = onPaginationRender ?? setStickyFooter;

    if (!showPagination || !isFocused) {
      publishPagination(null);
      return;
    }

    const node = (
      <Pagination
        page={page}
        totalPages={totalPages}
        total={safeData.length}
        perPage={effectivePP}
        onPageChange={setPage}
      />
    );
    publishPagination(node);

    return () => publishPagination(null);
  }, [
    showPagination,
    isFocused,
    onPaginationRender,
    setStickyFooter,
    page,
    totalPages,
    safeData.length,
    effectivePP,
  ]);

  const defaultRenderCard = (item: T, _isSelected: boolean) => (
    <View style={{ padding: 16 }}>
      {renderCardHeader?.(item)}
      {renderCardBody?.(item)}
      {renderCardFooter?.(item)}
    </View>
  );

  // Toolbar per-page controls
  const toolbarPerPage = showPagination ? perPage : externalPerPage;
  const handleToolbarPerPage = showPagination
    ? (n: number) => { setPerPage(n); setPage(1); }
    : onExternalPerPageChange;

  return (
    <View style={{ minWidth: 0, maxWidth: '100%' }}>
      {/* ── Toolbar ──────────────────────────────────────────── */}
      <Toolbar
        search={searchValue}
        onSearchChange={v => { onSearchChange(v); setPage(1); }}
        filters={filters}
        filterValues={filterValues}
        onFilterChange={(k, v) => { onFilterChange?.(k, v); setPage(1); }}
        onAddNew={onAddNew}
        addNewLabel={addNewLabel}
        selectedCount={selectedIds?.size ?? 0}
        onBulkDelete={onBulkDelete}
        exportColumns={
          exportColumns ??
          columns.filter(c => c.key !== 'actions').map(c => ({ key: c.key, label: c.label }))
        }
        exportData={exportData ?? data}
        exportTitle={exportTitle}
        exportFilename={exportFilename}
        onImport={onImport}
        showImport={showImport}
        extraActions={extraToolbarActions}
        perPage={toolbarPerPage}
        onPerPageChange={handleToolbarPerPage}
      />

      {/* ── Table or Card ─────────────────────────────────────── */}
      {showTable ? (
        <View
          style={{
            backgroundColor: 'white',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'hsl(40, 15%, 88%)',
            minWidth: 0,
            maxWidth: '100%',
            overflow: 'hidden',
          }}
        >
          <TableView
            data={paged}
            columns={columns}
            selectedIds={selectedIds}
            onSelectAll={onSelectAll}
            onSelectRow={onSelectRow}
            idKey={idKey}
            loading={loading}
            emptyText={emptyText}
            showTable={showTable}
          />
        </View>
      ) : (
        <CardView
          data={paged}
          selectedIds={selectedIds}
          onSelectRow={onSelectRow}
          idKey={idKey}
          loading={loading}
          emptyText={emptyText}
          renderCard={renderCard ?? defaultRenderCard}
        />
      )}

      {showPagination && !onPaginationRender ? <View style={{ height: 96, marginBottom: insets.bottom }} /> : null}
    </View>
  );
};
