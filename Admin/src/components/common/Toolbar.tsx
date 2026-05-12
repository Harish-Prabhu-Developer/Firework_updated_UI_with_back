import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Platform, Pressable,
  Modal,
} from 'react-native';
import {
  Search, Download, Upload, Trash2, Plus, ChevronDown,
  FileText, Sheet, File, X, AlertCircle,
} from 'lucide-react-native';
import { exportCSV, exportExcel, exportPDF, requestAndroidStoragePermission } from '../../utils/exportUtils';
import { pickAndParseCSV, ParsedCSVRow } from '../../utils/importUtils';
import { Select } from '../ui/Select';
import { useResponsive } from '../../hooks/useResponsive';
import { LightColors as colors } from '../../styles/colors';
import { Radius, Fonts } from '../../styles/globalStyles';

interface FilterOption { label: string; value: string }

export interface ToolbarFilter {
  key: string;
  label: string;
  options: FilterOption[];
}

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  filters?: ToolbarFilter[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  onAddNew?: () => void;
  addNewLabel?: string;
  selectedCount?: number;
  onBulkDelete?: () => void;
  exportColumns?: { key: string; label: string }[];
  exportData?: Record<string, any>[];
  exportTitle?: string;
  exportFilename?: string;
  onImport?: (rows: ParsedCSVRow[]) => void;
  showImport?: boolean;
  extraActions?: React.ReactNode;
  perPage?: number;
  onPerPageChange?: (n: number) => void;
}

const PER_PAGE_OPTIONS = [
  { label: '5', value: '5' },
  { label: '10', value: '10' },
  { label: '25', value: '25' },
  { label: '50', value: '50' },
  { label: 'All', value: '999999' },
];

export const Toolbar = ({
  search, onSearchChange,
  filters = [], filterValues = {}, onFilterChange,
  onAddNew, addNewLabel = 'Add New',
  selectedCount = 0, onBulkDelete,
  exportColumns, exportData = [], exportTitle = 'Report', exportFilename = 'export',
  onImport, showImport = false,
  extraActions,
  perPage,
  onPerPageChange,
}: Props) => {
  const [exportOpen, setExportOpen] = useState(false);
  const { isMobile } = useResponsive();

  const handleExport = async (type: 'csv' | 'excel' | 'pdf') => {
    setExportOpen(false);
    if (!exportColumns) return;

    // Proactively request permission on Android
    const hasPermission = await requestAndroidStoragePermission();
    if (!hasPermission) return;

    if (type === 'csv') await exportCSV(exportData, exportColumns, exportFilename);
    if (type === 'excel') await exportExcel(exportData, exportColumns, exportFilename);
    if (type === 'pdf') await exportPDF(exportData, exportColumns, exportTitle, exportFilename);
  };

  const handleImport = async () => {
    const rows = await pickAndParseCSV();
    if (rows) onImport?.(rows);
  };

  return (
    <View
      className="bg-white border border-border rounded-xl p-4 mb-4 gap-3"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 1,
      }}
    >
      <View className="flex-row items-end gap-3 flex-wrap">
        {filters.map(f => (
          <View key={f.key} style={{ width: isMobile ? 94 : 140 }}>
            <Select
              label={f.label}
              value={filterValues[f.key] ?? ''}
              onValueChange={(v) => onFilterChange?.(f.key, v)}
              options={[{ label: 'All', value: '' }, ...f.options]}
            />
          </View>
        ))}

        <View className="flex-1 min-w-[160px]">
          <Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Search</Text>
          <View className="flex-row items-center bg-white border border-border rounded-xl px-3 h-11 gap-2">
            <Search size={16} color="#94a3b8" />
            <TextInput
              className="flex-1 text-sm text-foreground"
              placeholder="Search by name, slug"
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={onSearchChange}
              style={{ outline: 'none' } as any}
            />
            {search ? (
              <TouchableOpacity onPress={() => onSearchChange('')}>
                <X size={14} color="#94a3b8" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

      </View>

      <View className="flex-row items-end gap-2 flex-wrap">
        {perPage && onPerPageChange && (
          <View style={{ width: isMobile ? 72 : 96 }}>
            <Select
              label="Show"
              value={String(perPage)}
              onValueChange={(v) => onPerPageChange(Number(v))}
              options={PER_PAGE_OPTIONS}
            />
          </View>
        )}
        {selectedCount > 0 && onBulkDelete && (
          <TouchableOpacity
            onPress={onBulkDelete}
            className="flex-row items-center gap-1.5 bg-red-50 border border-red-200 rounded-xl px-3 h-10"
          >
            <Trash2 size={14} color="#ef4444" />
            <Text className="text-xs font-bold text-red-600">Delete ({selectedCount})</Text>
          </TouchableOpacity>
        )}

        {exportColumns && (
          <View className="relative">
            <TouchableOpacity
              onPress={() => setExportOpen(!exportOpen)}
              className="flex-row items-center gap-1.5 bg-white border border-border rounded-xl px-3 h-10"
            >
              <Download size={15} color="#111827" />
              <Text className="text-xs font-semibold text-foreground">Export</Text>
              <ChevronDown size={12} color="#64748b" />
            </TouchableOpacity>

            <Modal
              visible={exportOpen}
              transparent
              animationType="fade"
              onRequestClose={() => setExportOpen(false)}
            >
              <Pressable
                style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 }}
                onPress={() => setExportOpen(false)}
              >
                <Pressable onPress={e => e.stopPropagation?.()} style={{ width: '100%', maxWidth: 400 }}>
                  <View style={{ borderRadius: Radius.xxl }} className="bg-card overflow-hidden shadow-2xl border border-border">
                    <View className="px-5 py-4 border-b border-border bg-muted/30">
                      <Text style={{ fontFamily: Fonts.display, fontSize: 18 }} className="font-black text-foreground">
                        Export Options
                      </Text>
                      <Text style={{ fontFamily: Fonts.body }} className="text-xs text-muted-foreground mt-0.5">
                        Choose your preferred file format
                      </Text>
                    </View>
                    <View className="py-2">
                      {exportData.length > 0 ? (
                        [
                          { type: 'csv', label: 'Export CSV', icon: File, color: '#10b981' },
                          { type: 'excel', label: 'Export Excel', icon: Sheet, color: '#059669' },
                          { type: 'pdf', label: 'Export PDF', icon: FileText, color: '#4f46e5' },
                        ].map(({ type, label, icon: Icon, color }, idx, arr) => (
                          <TouchableOpacity
                            key={type}
                            activeOpacity={0.7}
                            onPress={() => handleExport(type as any)}
                            className="flex-row items-center gap-4 px-5 py-4"
                            style={{ borderBottomWidth: idx === arr.length - 1 ? 0 : 0.5, borderBottomColor: colors.border + '40' }}
                          >
                            <View style={{ backgroundColor: color + '15', width: 36, height: 36, borderRadius: Radius.lg }} className="items-center justify-center">
                              <Icon size={18} color={color} />
                            </View>
                            <Text style={{ fontFamily: Fonts.body }} className="text-[15px] font-semibold text-foreground">{label}</Text>
                          </TouchableOpacity>
                        ))
                      ) : (
                        <View className="py-12 items-center justify-center px-6">
                          <View className="bg-muted w-16 h-16 rounded-full items-center justify-center mb-4">
                            <AlertCircle size={32} color={colors.mutedForeground} />
                          </View>
                          <Text style={{ fontFamily: Fonts.display }} className="text-lg font-bold text-foreground mb-1">No Data</Text>
                          <Text style={{ fontFamily: Fonts.body }} className="text-sm text-muted-foreground text-center">There is no data available in this table to export at this time.</Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => setExportOpen(false)}
                      className="mx-4 mb-4 mt-2 bg-muted h-12 rounded-xl items-center justify-center"
                    >
                      <Text style={{ fontFamily: Fonts.body, fontWeight: '700' }} className="text-foreground">Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </Pressable>
              </Pressable>
            </Modal>
          </View>
        )}

        {showImport && onImport && (
          <TouchableOpacity
            onPress={handleImport}
            className="flex-row items-center gap-1.5 bg-white border border-border rounded-xl px-3 h-10"
          >
            <Upload size={15} color="#111827" />
            <Text className="text-xs font-semibold text-foreground">Import</Text>
          </TouchableOpacity>
        )}

        {extraActions}

        {onAddNew && (
          <TouchableOpacity
            onPress={onAddNew}
            className="flex-row items-center gap-1.5 bg-primary rounded-xl px-4 h-10"
          >
            <Plus size={16} color="white" />
            <Text className="text-xs font-bold text-white">{addNewLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
