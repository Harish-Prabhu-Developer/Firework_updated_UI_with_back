import { Platform, PermissionsAndroid, Alert } from 'react-native';
import RNFS from '../shims/react-native-fs';

export interface ParsedCSVRow {
  [key: string]: string;
}

/* ── Parse CSV string into typed rows ───────────── */
export const parseCSV = (text: string): ParsedCSVRow[] => {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const values = line.match(/(".*?"|[^,]+|(?<=,)(?=,))/g) ?? line.split(',');
    const row: ParsedCSVRow = {};
    headers.forEach((h, i) => {
      row[h] = (values[i] ?? '').trim().replace(/^"|"$/g, '');
    });
    return row;
  });
};

/* ── Android read permission ────────────────────── */
const requestAndroidReadPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      {
        title: 'Storage Permission',
        message: 'Crackers Kingdom needs storage access to import files.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
};

/* ── Web file picker ────────────────────────────── */
const pickFileOnWeb = (): Promise<string | null> =>
  new Promise(resolve => {
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

/* ── Android file picker ────────────────────────── */
const pickFileOnAndroid = async (): Promise<string | null> => {
  const hasPermission = await requestAndroidReadPermission();
  if (!hasPermission) {
    Alert.alert('Permission Denied', 'Storage permission is required to import files.');
    return null;
  }
  try {
    // Using @react-native-documents/picker
    const DocumentPicker = require('@react-native-documents/picker');
    const [result] = await DocumentPicker.pick({ type: ['text/comma-separated-values', 'text/csv'] });
    const content = await RNFS.readFile(result.uri, 'utf8');
    return content;
  } catch (err: any) {
    if (!err?.message?.includes('cancel')) {
      Alert.alert('Import Failed', err?.message || 'Could not read file.');
    }
    return null;
  }
};

/* ── Public API ─────────────────────────────────── */
export const pickAndParseCSV = async (): Promise<ParsedCSVRow[] | null> => {
  const text = Platform.OS === 'web'
    ? await pickFileOnWeb()
    : await pickFileOnAndroid();

  if (!text) return null;
  const rows = parseCSV(text);
  if (rows.length === 0) {
    Alert.alert('Empty File', 'No data rows found in the CSV file.');
    return null;
  }
  return rows;
};
