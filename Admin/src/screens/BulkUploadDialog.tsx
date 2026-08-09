import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  ScrollView,
} from 'react-native';
import {
  Download,
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Save,
  X,
} from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FormModal } from '../components/modals/FormModal';
import { Select } from '../components/ui/Select';
import { useToast } from '../hooks/useToast';
import api from '../api/api';
import { LightColors as colors } from '../styles/colors';
import { Radius, Fonts } from '../styles/globalStyles';

interface ParsedRow {
  productCode: string;
  name: string;
  description: string;
  mrp: string;
  productDiscount: string;
  stock: string;
  tag: string;
  unit: string;
  perQty: string;
  status: string;
  image: string;
}

interface BulkResult {
  message?: string;
  uploaded: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}

const REQUIRED_HEADERS = ['name', 'description', 'mrp', 'stock', 'unit', 'perQty', 'status'];
const OPTIONAL_HEADERS = ['productCode', 'productDiscount', 'tag', 'image'];
const ALL_EXPECTED = [...REQUIRED_HEADERS, ...OPTIONAL_HEADERS];

const TEMPLATE_HEADERS = ALL_EXPECTED.join(',');
const TEMPLATE_EXAMPLE = 'Atom Bomb,High sound cracker,100,50,Box,2,Active,,,,';

const categoryUi = {
  foreground: '#153027',
  mutedForeground: '#667a70',
  card: '#ffffff',
  muted: '#f3f0eb',
  border: '#e6dfd7',
  primary: '#276741',
  primarySoft: '#e8f2ec',
  primaryForeground: '#faf9f6',
  destructive: '#dc2626',
  destructiveSoft: '#fee2e2',
  success: '#16803c',
  successSoft: '#e8f7ee',
  warning: '#b45309',
  warningSoft: '#fff4de',
};

const downloadTemplate = () => {
  const csv = `\uFEFF${TEMPLATE_HEADERS}\n${TEMPLATE_EXAMPLE}`;
  if (Platform.OS === 'web') {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product-bulk-upload-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
};

const pickCSVFile = (): Promise<string | null> =>
  new Promise(resolve => {
    if (Platform.OS !== 'web') {
      resolve(null);
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) { resolve(null); return; }
      const text = await file.text();
      resolve(text);
    };
    input.click();
  });

export const parseCSV = (text: string): ParsedRow[] => {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === ',' && !inQuotes) { values.push(current); current = ''; }
      else { current += ch; }
    }
    values.push(current);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h.trim()] = (values[i] ?? '').trim().replace(/^"|"$/g, '');
    });
    return row as unknown as ParsedRow;
  });
};

const validateHeaders = (headers: string[]): string | null => {
  const normalized = headers.map(h => h.trim().toLowerCase());
  const required = REQUIRED_HEADERS.map(h => h.toLowerCase());
  const optional = OPTIONAL_HEADERS.map(h => h.toLowerCase());
  const expected = [...required, ...optional];

  if (normalized.length < required.length) {
    return 'Invalid template format. Please download and use the Product Bulk Upload Template.';
  }
  const missing = required.filter(r => !normalized.includes(r));
  if (missing.length > 0) {
    return 'Invalid template format. Please download and use the Product Bulk Upload Template.';
  }
  const unknown = normalized.filter(h => !expected.includes(h));
  if (unknown.length > 0) {
    return 'Invalid template format. Please download and use the Product Bulk Upload Template.';
  }
  return null;
};

const validateRows = (rows: ParsedRow[]): string[] => {
  const errors: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;
    const errs: string[] = [];
    if (!row.name?.trim()) errs.push(`Row ${rowNum}: Product Name is required`);
    const mrp = parseFloat(row.mrp ?? '');
    if (isNaN(mrp) || mrp <= 0) errs.push(`Row ${rowNum}: MRP must be greater than 0`);
    if (row.productDiscount) {
      const disc = parseFloat(row.productDiscount);
      if (isNaN(disc) || disc < 0 || disc > 100) errs.push(`Row ${rowNum}: Product Discount must be between 0 and 100`);
    }
    const stock = parseInt(row.stock ?? '0', 10);
    if (isNaN(stock) || stock < 0) errs.push(`Row ${rowNum}: Stock must be 0 or greater`);
    errors.push(...errs);
  }
  return errors;
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function BulkUploadDialog({ open, onClose }: Props) {
  const toast = useToast();
  const qc = useQueryClient();
  const [categoryId, setCategoryId] = useState('');
  const [csvText, setCsvText] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [headersValid, setHeadersValid] = useState(true);
  const [headerError, setHeaderError] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);

  const catsQuery = useQuery<any[]>({
    queryKey: ['categories-list'],
    queryFn: async () => {
      const { data: res } = await api.get('/categories?limit=999999&isActive=true');
      const list = [res, res?.data, res?.data?.data].find(Array.isArray);
      return list ?? [];
    },
    staleTime: 0,
  });

  const prevOpen = useRef(open);
  useEffect(() => {
    if (open && !prevOpen.current) {
      catsQuery.refetch();
    }
    prevOpen.current = open;
  }, [open]);

  const reset = useCallback(() => {
    setCategoryId('');
    setCsvText(null);
    setParsedRows([]);
    setHeadersValid(true);
    setHeaderError(null);
    setRowErrors([]);
    setLoading(false);
    setResult(null);
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleDownloadTemplate = () => {
    downloadTemplate();
    toast.success('Template downloaded');
  };

  const handlePickFile = async () => {
    const text = await pickCSVFile();
    if (!text) return;
    setCsvText(text);

    const lines = text.trim().split('\n').filter(Boolean);
    if (lines.length < 2) {
      setHeaderError('Empty CSV file');
      setHeadersValid(false);
      return;
    }

    const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const headerErr = validateHeaders(rawHeaders);
    if (headerErr) {
      setHeaderError(headerErr);
      setHeadersValid(false);
      setParsedRows([]);
      toast.error(headerErr);
      return;
    }

    setHeadersValid(true);
    setHeaderError(null);
    const rows = parseCSV(text);
    setParsedRows(rows);

    const rErrors = validateRows(rows);
    setRowErrors(rErrors);
    if (rErrors.length > 0) {
      toast.warn(`${rErrors.length} validation error(s) found`);
    } else {
      toast.success(`${rows.length} rows parsed successfully`);
    }
  };

  const handleUpload = async () => {
    if (!categoryId) {
      toast.warn('Please select a category');
      return;
    }
    if (!headersValid || parsedRows.length === 0) {
      toast.warn('No valid data to upload');
      return;
    }
    if (rowErrors.length > 0) {
      toast.warn('Please fix validation errors before uploading');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/products/bulk-import', {
        categoryId,
        products: parsedRows,
      });
      if (data.success) {
        setResult(data);
        toast.success(data.message || `Uploaded ${data.uploaded} products`);
        qc.invalidateQueries({ queryKey: ['products', 'list'] });
      } else {
        toast.error(data.msg || 'Upload failed');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.msg || err?.message || 'Upload failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const catOptions = (catsQuery.data ?? []).map((c: any) => ({ label: c.name, value: c.id }));

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      maxWidth={600}
      title={
        <View className="flex-row items-center" style={{ gap: 8 }}>
          <View style={{ backgroundColor: categoryUi.primarySoft, padding: 8, borderRadius: Radius.md }}>
            <Upload size={20} color={categoryUi.primary} strokeWidth={2.75} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: categoryUi.foreground, fontFamily: Fonts.display }}>
            Bulk Product Upload
          </Text>
        </View>
      }
      footer={
        result ? (
          <TouchableOpacity
            onPress={handleClose}
            className="px-6 py-2 flex-row items-center justify-center"
            style={{ borderRadius: Radius.lg, backgroundColor: categoryUi.primary, alignSelf: 'flex-end' }}
          >
            <X size={16} color={categoryUi.primaryForeground} style={{ marginRight: 8 }} />
            <Text style={{ color: categoryUi.primaryForeground, fontSize: 14, fontWeight: '700', fontFamily: Fonts.body }}>Close</Text>
          </TouchableOpacity>
        ) : (
          <View className="flex-row justify-end" style={{ gap: 12 }}>
            <TouchableOpacity
              onPress={handleClose}
              disabled={loading}
              className="px-4 py-2 border items-center justify-center"
              style={{ borderRadius: Radius.lg, borderColor: categoryUi.border, opacity: loading ? 0.5 : 1 }}
            >
              <Text style={{ color: categoryUi.foreground, fontSize: 14, fontWeight: '600', fontFamily: Fonts.body }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleUpload}
              disabled={loading || !headersValid || parsedRows.length === 0 || rowErrors.length > 0}
              className="px-6 py-2 flex-row items-center justify-center"
              style={{ borderRadius: Radius.lg, backgroundColor: categoryUi.primary, opacity: (loading || !headersValid || parsedRows.length === 0 || rowErrors.length > 0) ? 0.5 : 1 }}
            >
              <Save size={16} color={categoryUi.primaryForeground} style={{ marginRight: 8 }} />
              <Text style={{ color: categoryUi.primaryForeground, fontSize: 14, fontWeight: '700', fontFamily: Fonts.body }}>
                {loading ? 'Uploading...' : 'Upload'}
              </Text>
            </TouchableOpacity>
          </View>
        )
      }
    >
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {result ? (
          <View style={{ gap: 16, paddingVertical: 8 }}>
            <View
              style={{
                backgroundColor: result.uploaded > 0 ? categoryUi.successSoft : categoryUi.warningSoft,
                padding: 20,
                borderRadius: Radius.xl,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: result.uploaded > 0 ? '#bde8cc' : '#f4d49e',
              }}
            >
              {result.uploaded > 0 ? (
                <CheckCircle size={48} color={categoryUi.success} />
              ) : (
                <AlertTriangle size={48} color={categoryUi.warning} />
              )}
              <Text style={{ fontSize: 16, fontWeight: '800', color: categoryUi.foreground, marginTop: 12, fontFamily: Fonts.body }}>
                {result.message || 'Upload completed'}
              </Text>
            </View>

            <View className="flex-row" style={{ gap: 12 }}>
              <View className="flex-1 items-center p-4" style={{ borderRadius: Radius.lg, backgroundColor: categoryUi.successSoft }}>
                <Text style={{ fontSize: 28, fontWeight: '900', color: categoryUi.success, fontFamily: Fonts.display }}>{result.uploaded}</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: categoryUi.mutedForeground, fontFamily: Fonts.body }}>Uploaded</Text>
              </View>
              <View className="flex-1 items-center p-4" style={{ borderRadius: Radius.lg, backgroundColor: categoryUi.warningSoft }}>
                <Text style={{ fontSize: 28, fontWeight: '900', color: categoryUi.warning, fontFamily: Fonts.display }}>{result.skipped}</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: categoryUi.mutedForeground, fontFamily: Fonts.body }}>Skipped</Text>
              </View>
              <View className="flex-1 items-center p-4" style={{ borderRadius: Radius.lg, backgroundColor: result.errors.length > 0 ? categoryUi.destructiveSoft : categoryUi.successSoft }}>
                <Text style={{ fontSize: 28, fontWeight: '900', color: result.errors.length > 0 ? categoryUi.destructive : categoryUi.success, fontFamily: Fonts.display }}>{result.errors.length}</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: categoryUi.mutedForeground, fontFamily: Fonts.body }}>Errors</Text>
              </View>
            </View>

            {result.errors.length > 0 && (
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: categoryUi.foreground, fontFamily: Fonts.body }}>Error Details</Text>
                {result.errors.map((e, i) => (
                  <View key={i} className="flex-row items-start" style={{ gap: 6 }}>
                    <XCircle size={14} color={categoryUi.destructive} style={{ marginTop: 2 }} />
                    <Text style={{ fontSize: 12, color: categoryUi.destructive, fontFamily: Fonts.body }}>
                      Row {e.row}: {e.reason}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={{ gap: 20, paddingVertical: 8 }}>
            {/* Step 1: Download Template */}
            <View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: categoryUi.foreground, marginBottom: 8, fontFamily: Fonts.body }}>
                Step 1: Download Template
              </Text>
              <TouchableOpacity
                onPress={handleDownloadTemplate}
                className="flex-row items-center justify-center px-4 py-3"
                style={{ borderRadius: Radius.lg, borderWidth: 1, borderColor: categoryUi.border, backgroundColor: categoryUi.card, gap: 8 }}
              >
                <Download size={18} color={categoryUi.primary} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: categoryUi.primary, fontFamily: Fonts.body }}>
                  Download Product Bulk Upload Template
                </Text>
              </TouchableOpacity>
            </View>

            {/* Step 2: Select Category */}
            <View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: categoryUi.foreground, marginBottom: 8, fontFamily: Fonts.body }}>
                Step 2: Select Category
              </Text>
              <Select
                label="Select Category *"
                required
                value={categoryId}
                onValueChange={setCategoryId}
                options={catOptions}
                placeholder="Please select a category"
              />
            </View>

            {/* Step 3: Upload File */}
            <View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: categoryUi.foreground, marginBottom: 8, fontFamily: Fonts.body }}>
                Step 3: Upload Completed Template
              </Text>
              <TouchableOpacity
                onPress={handlePickFile}
                className="flex-row items-center justify-center px-4 py-3"
                style={{ borderRadius: Radius.lg, borderWidth: 1, borderColor: categoryUi.border, backgroundColor: categoryUi.card, gap: 8 }}
              >
                <Upload size={18} color={categoryUi.primary} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: categoryUi.primary, fontFamily: Fonts.body }}>
                  {csvText ? (parsedRows.length > 0 ? `${parsedRows.length} rows loaded` : 'Change file') : 'Choose CSV File'}
                </Text>
              </TouchableOpacity>

              {csvText && (
                <View style={{ marginTop: 8, padding: 12, borderRadius: Radius.lg, backgroundColor: categoryUi.primarySoft }}>
                  <View className="flex-row items-center" style={{ gap: 6 }}>
                    <FileText size={16} color={categoryUi.primary} />
                    <Text style={{ fontSize: 12, fontWeight: '600', color: categoryUi.primary, fontFamily: Fonts.body }}>
                      {parsedRows.length} product(s) detected
                    </Text>
                  </View>
                </View>
              )}

              {!headersValid && headerError && (
                <View className="flex-row items-start" style={{ marginTop: 8, gap: 6 }}>
                  <XCircle size={14} color={categoryUi.destructive} style={{ marginTop: 2 }} />
                  <Text style={{ fontSize: 12, color: categoryUi.destructive, fontFamily: Fonts.body }}>{headerError}</Text>
                </View>
              )}
            </View>

            {/* Preview */}
            {parsedRows.length > 0 && (
              <View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: categoryUi.foreground, marginBottom: 8, fontFamily: Fonts.body }}>
                  Preview (first 10 rows)
                </Text>
                <View style={{ borderRadius: Radius.lg, borderWidth: 1, borderColor: categoryUi.border, overflow: 'hidden' }}>
                  <View className="flex-row bg-muted px-3 py-2" style={{ borderBottomWidth: 1, borderBottomColor: categoryUi.border }}>
                    {['Code', 'Name', 'MRP', 'Discount%', 'Stock'].map(h => (
                      <Text key={h} style={{ flex: 1, fontSize: 10, fontWeight: '800', color: categoryUi.mutedForeground, fontFamily: Fonts.body, textTransform: 'uppercase' }}>{h}</Text>
                    ))}
                  </View>
                  {parsedRows.slice(0, 10).map((row, i) => (
                    <View key={i} className="flex-row px-3 py-2" style={{ borderBottomWidth: i < Math.min(parsedRows.length, 10) - 1 ? 1 : 0, borderBottomColor: categoryUi.border }}>
                      <Text style={{ flex: 1, fontSize: 12, color: categoryUi.foreground, fontFamily: Fonts.body }} numberOfLines={1}>{row.productCode}</Text>
                      <Text style={{ flex: 1, fontSize: 12, color: categoryUi.foreground, fontFamily: Fonts.body }} numberOfLines={1}>{row.name}</Text>
                      <Text style={{ flex: 1, fontSize: 12, color: categoryUi.foreground, fontFamily: Fonts.body }}>₹{row.mrp}</Text>
                      <Text style={{ flex: 1, fontSize: 12, color: categoryUi.success, fontFamily: Fonts.body }}>{row.productDiscount ? `${row.productDiscount}%` : '-'}</Text>
                      <Text style={{ flex: 1, fontSize: 12, color: categoryUi.foreground, fontFamily: Fonts.body }}>{row.stock}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Validation Errors */}
            {rowErrors.length > 0 && (
              <View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: categoryUi.destructive, marginBottom: 8, fontFamily: Fonts.body }}>
                  {rowErrors.length} Validation Error(s)
                </Text>
                {rowErrors.slice(0, 10).map((err, i) => (
                  <View key={i} className="flex-row items-start" style={{ marginBottom: 4, gap: 6 }}>
                    <XCircle size={12} color={categoryUi.destructive} style={{ marginTop: 3 }} />
                    <Text style={{ fontSize: 12, color: categoryUi.destructive, fontFamily: Fonts.body }}>{err}</Text>
                  </View>
                ))}
                {rowErrors.length > 10 && (
                  <Text style={{ fontSize: 11, color: categoryUi.mutedForeground, fontFamily: Fonts.body }}>...and {rowErrors.length - 10} more</Text>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </FormModal>
  );
}
