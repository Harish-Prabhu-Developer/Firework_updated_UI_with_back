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
}

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
}: Props<T>) => {
  const { showTable, isDesktop } = useResponsive();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(PAGE_SIZE_DEFAULT);

  const safeData = Array.isArray(data) ? data : [];
  const totalPages = perPage === 999999 ? 1 : Math.max(1, Math.ceil(safeData.length / perPage));
  const safePerPage = perPage === 999999 ? safeData.length : perPage;
  const paged = safeData.slice((page - 1) * safePerPage, page * safePerPage);

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
    <View style={((Platform.OS === 'web' && !isDesktop) || Platform.OS === 'android') ? { paddingBottom: 110 } : {}}>
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
        perPage={perPage}
        onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
      />

      {showTable ? (
        <View className="bg-white rounded-2xl border border-border overflow-hidden">
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
        <View className="px-1">
          <CardView
            data={paged}
            selectedIds={selectedIds}
            onSelectRow={onSelectRow}
            idKey={idKey}
            loading={loading}
            emptyText={emptyText}
            renderCard={renderCard ?? defaultRenderCard}
          />
        </View>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        total={safeData.length}
        perPage={perPage === 999999 ? safeData.length : perPage}
        onPageChange={setPage}
      />
    </View>
  );
};
