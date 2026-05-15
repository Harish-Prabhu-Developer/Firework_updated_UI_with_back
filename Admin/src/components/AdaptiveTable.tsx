import React, { useEffect, useState } from 'react';
import { View, Platform } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { TableView, Column } from './table/TableView';
import { CardView } from './card/CardView';
import { Pagination } from './common/Pagination';
import { Toolbar, ToolbarFilter } from './common/Toolbar';
import { ParsedCSVRow } from '../utils/importUtils';

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
  showPagination?: boolean;
  externalPerPage?: number;
  onExternalPerPageChange?: (n: number) => void;
}

// Height reserved at the bottom so scrollable content isn't hidden behind the fixed bar
const PAGINATION_BAR_HEIGHT = Platform.OS === 'ios' ? 88 : Platform.OS === 'web' ? 68 : 72;

const PAGE_SIZE_DEFAULT = 10;

export const AdaptiveTable = <T extends Record<string, any>>({
  data, columns, idKey = 'id', loading, emptyText,
  searchValue, onSearchChange,
  filters, filterValues, onFilterChange,
  onAddNew, addNewLabel,
  selectedIds, onSelectAll, onSelectRow, onBulkDelete,
  exportColumns, exportData, exportTitle, exportFilename,
  onImport, showImport,
  renderCardHeader, renderCardBody, renderCardFooter, renderCard,
  extraToolbarActions,
  showPagination = true,
  externalPerPage,
  onExternalPerPageChange,
}: Props<T>) => {
  const { showTable, isMobile, isTablet } = useResponsive();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(PAGE_SIZE_DEFAULT);
  const toolbarPerPage = showPagination ? perPage : externalPerPage;
  const handleToolbarPerPageChange = showPagination
    ? (n: number) => { setPerPage(n); setPage(1); }
    : onExternalPerPageChange;

  const safeData = Array.isArray(data) ? data : [];
  const totalPages = perPage === 999999 ? 1 : Math.max(1, Math.ceil(safeData.length / perPage));
  const safePerPage = perPage === 999999 ? safeData.length : perPage;
  const paged = showPagination
    ? safeData.slice((page - 1) * safePerPage, page * safePerPage)
    : safeData;

  useEffect(() => {
    setPage(1);
  }, [data.length]);

  const defaultRenderCard = (item: T, _isSelected: boolean) => (
    <View className="p-4">
      {renderCardHeader?.(item)}
      {renderCardBody?.(item)}
      {renderCardFooter?.(item)}
    </View>
  );

  return (
    // flex:1 + relative so the fixed bar is positioned within this container
    <View style={{ flex: 1, position: 'relative' }}>

      {/* ── Scrollable content area ── */}
      <View
        style={{
          // Leave room at the bottom so the last card/row isn't hidden under the pagination bar
          paddingBottom: showPagination ? PAGINATION_BAR_HEIGHT : (isMobile ? 24 : isTablet ? 28 : 0),
        }}
      >
        <Toolbar
          search={searchValue}
          onSearchChange={(v) => { onSearchChange(v); setPage(1); }}
          filters={filters}
          filterValues={filterValues}
          onFilterChange={(k, v) => { onFilterChange?.(k, v); setPage(1); }}
          onAddNew={onAddNew}
          addNewLabel={addNewLabel}
          selectedCount={selectedIds?.size ?? 0}
          onBulkDelete={onBulkDelete}
          exportColumns={exportColumns ?? columns.filter(c => c.key !== 'actions').map(c => ({ key: c.key, label: c.label }))}
          exportData={exportData ?? data}
          exportTitle={exportTitle}
          exportFilename={exportFilename}
          onImport={onImport}
          showImport={showImport}
          extraActions={extraToolbarActions}
        perPage={toolbarPerPage}
        onPerPageChange={handleToolbarPerPageChange}
      />

        {showTable ? (
          <View className="bg-white rounded-2xl border border-border">
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
      </View>

      {/* ── Fixed pagination bar pinned to the bottom ── */}
      {showPagination && (
        <View
          style={
            Platform.OS === 'web'
              ? {
                // On web: sticky within the scroll container
                position: 'sticky' as any,
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 10,
                backgroundColor: 'white',
              }
              : {
                // On Android / iOS: absolute inside this View
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 10,
              }
          }
        >
          <Pagination
            page={page}
            totalPages={totalPages}
            total={safeData.length}
            perPage={perPage === 999999 ? safeData.length : perPage}
            onPageChange={setPage}
          />
        </View>
      )}
    </View>
  );
};
