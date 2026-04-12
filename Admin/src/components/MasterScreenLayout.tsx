import React, { useState } from 'react';
import { View, Text, Platform, StatusBar, StyleSheet, Pressable } from 'react-native';
import { Button } from './ui/Button';
import { Plus, Download, FileUp, FileText, FileSpreadsheet, FileBarChart } from 'lucide-react-native';
import { PermissionGuard } from '../hooks/usePermissions';
import { Dialog } from './ui/Dialog';
import { ImportModal } from './ImportModal';
import { Checkbox } from './ui/Checkbox';

interface MasterScreenLayoutProps {
  title: string;
  subtitle?: string;
  totalCount?: number;
  allSelected?: boolean;
  onToggleAll?: () => void;
  onAddNew?: () => void;
  onExport?: (format: 'PDF' | 'CSV' | 'EXCEL') => void;
  onImport?: (data: Record<string, string>[]) => void;
  importExpectedColumns?: { key: string; label: string }[];
  children: React.ReactNode;
  module: string;
}

export function MasterScreenLayout({
  title,
  subtitle,
  totalCount,
  allSelected,
  onToggleAll,
  onAddNew,
  onExport,
  onImport,
  importExpectedColumns,
  children,
  module,
}: MasterScreenLayoutProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Header ─────────────────────────────────── */}
      <View style={styles.header}>
        {/* Title row */}
        <View style={styles.titleRow}>
          <View style={styles.titleLeft}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.title}>{title}</Text>
              {totalCount !== undefined && (
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{totalCount}</Text>
                </View>
              )}
            </View>
            {subtitle && (
              <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
            )}
          </View>

          {/* Select All (mobile) */}
          {onToggleAll && (
            <Pressable style={styles.selectAllChip} onPress={onToggleAll}>
              <Checkbox checked={allSelected || false} onCheckedChange={onToggleAll} />
              <Text style={styles.selectAllText}>All</Text>
            </Pressable>
          )}
        </View>

        {/* ── Action buttons row ── */}
        <View style={styles.actionsRow}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {onExport && (
              <Pressable
                style={({ pressed }) => [styles.iconActionBtn, pressed && { opacity: 0.75 }]}
                onPress={() => setExportOpen(true)}
              >
                <Download size={17} color="#475569" />
              </Pressable>
            )}

            {onImport && importExpectedColumns && (
              <PermissionGuard module={module} action="Create">
                <Pressable
                  style={({ pressed }) => [styles.iconActionBtn, pressed && { opacity: 0.75 }]}
                  onPress={() => setImportOpen(true)}
                >
                  <FileUp size={17} color="#475569" />
                </Pressable>
              </PermissionGuard>
            )}
          </View>

          {onAddNew && (
            <PermissionGuard module={module} action="Create">
              <Pressable
                style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }]}
                onPress={onAddNew}
              >
                <Plus size={16} color="#fff" />
                <Text style={styles.addBtnText}>Add New</Text>
              </Pressable>
            </PermissionGuard>
          )}
        </View>
      </View>

      {/* ── Main content ── */}
      <View style={styles.content}>
        {children}
      </View>

      {/* ── Export dialog ── */}
      <Dialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        title="Export Data"
        description="Select your preferred format to download the current records."
      >
        <View style={{ gap: 10, paddingVertical: 8 }}>
          {/* PDF */}
          <Pressable
            style={({ pressed }) => [styles.exportOption, pressed && { opacity: 0.85 }]}
            onPress={() => { onExport?.('PDF'); setExportOpen(false); }}
          >
            <View style={[styles.exportIcon, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
              <FileText size={22} color="#ef4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.exportTitle}>PDF Document</Text>
              <Text style={styles.exportDesc}>Best for printing and sharing</Text>
            </View>
          </Pressable>

          {/* CSV */}
          <Pressable
            style={({ pressed }) => [styles.exportOption, pressed && { opacity: 0.85 }]}
            onPress={() => { onExport?.('CSV'); setExportOpen(false); }}
          >
            <View style={[styles.exportIcon, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
              <FileBarChart size={22} color="#10b981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.exportTitle}>CSV Spreadsheet</Text>
              <Text style={styles.exportDesc}>Raw data, ideal for bulk imports</Text>
            </View>
          </Pressable>

          {/* Excel */}
          <Pressable
            style={({ pressed }) => [styles.exportOption, pressed && { opacity: 0.85 }]}
            onPress={() => { onExport?.('EXCEL'); setExportOpen(false); }}
          >
            <View style={[styles.exportIcon, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
              <FileSpreadsheet size={22} color="#2563eb" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.exportTitle}>Excel Workbook</Text>
              <Text style={styles.exportDesc}>Full spreadsheet with structure</Text>
            </View>
          </Pressable>
        </View>
      </Dialog>

      {/* ── Import modal ── */}
      {onImport && importExpectedColumns && (
        <ImportModal
          open={importOpen}
          onOpenChange={setImportOpen}
          expectedColumns={importExpectedColumns}
          onImport={onImport}
          title={`Import ${title}`}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    ...(Platform.OS === 'android' ? { elevation: 2 } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
    }),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleLeft: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: '#eff6ff',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignSelf: 'flex-start',
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  selectAllChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginLeft: 8,
  },
  selectAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4f46e5',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    ...(Platform.OS === 'android' ? { elevation: 3 } : {
      shadowColor: '#4f46e5',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    }),
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  content: {
    flex: 1,
  },

  // ── Export dialog ────────────────────────────────────────
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fafafa',
  },
  exportIcon: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  exportTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  exportDesc: {
    fontSize: 12,
    color: '#94a3b8',
  },
});
