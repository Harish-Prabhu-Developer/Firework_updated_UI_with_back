import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, ScrollView, TextInput } from 'react-native';
import { FormModal } from './FormModal';
import { Upload, FileText, AlertCircle, Check, Plus, Trash2, X } from 'lucide-react-native';
import { pickAndParseCSV, ParsedCSVRow } from '../../utils/importUtils';

interface Props {
  open: boolean;
  onClose: () => void;
  onImport: (rows: ParsedCSVRow[]) => void;
  templateColumns?: { key: string; label: string }[];
  entityName?: string;
}

export const ImportCsvModal = ({ open, onClose, onImport, templateColumns, entityName = 'records' }: Props) => {
  const [rows, setRows] = useState<ParsedCSVRow[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setRows([]);
      setError('');
    }
  }, [open]);

  const handlePick = async () => {
    setLoading(true);
    setError('');
    try {
      const parsedRows = await pickAndParseCSV();
      if (parsedRows) setRows(parsedRows);
    } catch (e: any) {
      setError(e?.message || 'Failed to read CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRow = () => {
    const newRow: ParsedCSVRow = {};
    const cols = templateColumns || (rows.length > 0 ? Object.keys(rows[0]).map(k => ({ key: k, label: k })) : []);
    cols.forEach(c => { newRow[c.key] = ''; });
    setRows([...rows, newRow]);
  };

  const handleRemoveRow = (index: number) => {
    const newRows = [...rows];
    newRows.splice(index, 1);
    setRows(newRows);
  };

  const handleUpdateRow = (index: number, key: string, value: string) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [key]: value };
    setRows(newRows);
  };

  const handleConfirm = () => {
    if (rows.length > 0) {
      onImport(rows);
      onClose();
    }
  };

  const downloadTemplate = () => {
    if (!templateColumns || Platform.OS !== 'web') return;
    const csv = templateColumns.map(c => c.label).join(',') + '\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${entityName}-template.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const columns = templateColumns || (rows.length > 0 ? Object.keys(rows[0]).map(k => ({ key: k, label: k })) : []);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={
        <View className="flex-row items-center" style={{ gap: 8 }}>
          <Upload size={20} color="#111827" />
          <Text className="text-xl font-bold">Import CSV - Review & Edit</Text>
        </View>
      }
      footer={
        <View className="flex-row justify-end">
          <TouchableOpacity
            onPress={onClose}
            className="px-4 py-2 border border-border flex-row items-center"
            style={{ borderRadius: 12, gap: 8 }}
          >
            <X size={16} color="#111827" />
            <Text className="text-sm font-medium text-foreground">Discard</Text>
          </TouchableOpacity>
        </View>
      }
    >
      <View className="flex-1">
        {/* Template download & Pick */}
        {!rows.length ? (
          <View className="gap-4">
            {templateColumns && Platform.OS === 'web' && (
              <TouchableOpacity onPress={downloadTemplate} className="flex-row items-center gap-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                <FileText size={16} color="#4f46e5" />
                <Text className="text-sm font-semibold text-indigo-700 flex-1">Download CSV Template</Text>
                <Text className="text-xs text-indigo-500">→</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handlePick}
              disabled={loading}
              className="border-2 border-dashed border-border rounded-2xl py-10 items-center justify-center gap-3 bg-slate-50/50"
            >
              <View className="w-16 h-16 rounded-full bg-indigo-50 items-center justify-center">
                <Upload size={28} color="#4f46e5" />
              </View>
              <Text className="font-bold text-foreground text-base">
                {loading ? 'Reading file…' : 'Click to select CSV'}
              </Text>
              <Text className="text-xs text-muted-foreground">Only .csv files are supported</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="gap-4">
            <View className="flex-row flex-wrap gap-3">
              <TouchableOpacity
                onPress={handleAddRow}
                className="bg-gray-200 px-4 py-1.5 flex-row items-center"
                style={{ borderRadius: 12, gap: 4 }}
              >
                <Plus size={14} color="#374151" />
                <Text className="text-sm font-semibold text-gray-700">Add Row</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirm}
                className="bg-primary px-5 py-1.5 flex-row items-center"
                style={{ borderRadius: 12, gap: 4 }}
              >
                <Check size={14} color="white" />
                <Text className="text-sm font-semibold text-white">Confirm Import</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="border border-border rounded-xl overflow-hidden bg-white">
                {/* Table Header */}
                <View className="flex-row bg-gray-100 border-b border-border">
                  {columns.map(col => (
                    <View key={col.key} className="w-40 px-3 py-3 border-r border-border/50">
                      <Text className="text-sm font-bold text-gray-700">{col.label}</Text>
                    </View>
                  ))}
                  <View className="w-20 px-3 py-3 items-center">
                    <Text className="text-sm font-bold text-gray-700">Action</Text>
                  </View>
                </View>

                {/* Table Body */}
                <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                  {rows.map((row, rowIndex) => (
                    <View key={rowIndex} className="flex-row border-b border-border/50 bg-white">
                      {columns.map(col => (
                        <View key={col.key} className="w-40 px-2 py-2 border-r border-border/50">
                          <TextInput
                            value={row[col.key] ?? ''}
                            onChangeText={(v) => handleUpdateRow(rowIndex, col.key, v)}
                            placeholder={col.label}
                            className="text-sm text-foreground p-1"
                            style={{ outline: 'none' } as any}
                          />
                        </View>
                      ))}
                      <View className="w-20 px-2 py-2 items-center justify-center">
                        <TouchableOpacity onPress={() => handleRemoveRow(rowIndex)}>
                          <Trash2 size={16} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>
          </View>
        )}

        {/* Error */}
        {error ? (
          <View className="flex-row items-center gap-2 mt-4 p-3 bg-red-50 rounded-xl border border-red-100">
            <AlertCircle size={16} color="#ef4444" />
            <Text className="text-sm text-red-600 font-medium flex-1">{error}</Text>
          </View>
        ) : null}
      </View>
    </FormModal>
  );
};
