import { Platform, PermissionsAndroid, Alert } from 'react-native';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import RNFS from '../shims/react-native-fs';
import ReactNativeBlobUtil from '../shims/react-native-blob-util';

/* ── Android storage permission ─────────────────── */
export const requestAndroidStoragePermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;
  try {
    // Check if already granted
    const check = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
    if (check) return true;

    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        title: 'Storage Permission',
        message: 'Crackers Kingdom needs storage access to save export files to your device.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      }
    );

    // On Android 13+, WRITE_EXTERNAL_STORAGE might not be granted but is also not needed for downloads
    if (granted === PermissionsAndroid.RESULTS.GRANTED || (Platform.OS === 'android' && Platform.Version >= 33)) {
      return true;
    }
    
    return false;
  } catch (err) {
    console.warn('Storage permission error:', err);
    return true; // Fallback to true to allow the attempt
  }
};

/* ── Web download helper ────────────────────────── */
const downloadOnWeb = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

/* ── Android file save (Blob Util + Download Manager) ────────── */
const saveOnAndroid = async (data: string, filename: string, encoding: 'base64' | 'utf8' = 'utf8') => {
  const hasPermission = await requestAndroidStoragePermission();
  if (!hasPermission) {
    Alert.alert('Permission Denied', 'Storage permission is required to save files.');
    return;
  }
  try {
    const { fs, android } = ReactNativeBlobUtil;
    const path = `${fs.dirs.DownloadDir}/${filename}`;
    
    // 1. Create the file
    await fs.createFile(path, data, encoding);
    
    // 2. Add to Download Manager to show notification
    const mime = filename.endsWith('.pdf') ? 'application/pdf' : 
                 filename.endsWith('.csv') ? 'text/csv' : 
                 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    if (android) {
      android.addCompleteDownload({
        title: filename,
        description: 'Report generated successfully',
        mime: mime,
        path: path,
        showNotification: true,
      });
    }

    Alert.alert('Saved!', `File saved to Downloads:\n${filename}`);
  } catch (err: any) {
    Alert.alert('Save Failed', err?.message || 'Could not save file.');
  }
};

/* ── Export as CSV ──────────────────────────────── */
export const exportCSV = async (
  data: Record<string, any>[],
  columns: { key: string; label: string }[],
  filename = 'export'
) => {
  const header = columns.map(c => c.label).join(',');
  const rows = data.map(row =>
    columns.map(c => {
      const val = row[c.key] ?? '';
      const str = String(val).replace(/"/g, '""');
      return str.includes(',') ? `"${str}"` : str;
    }).join(',')
  );
  const csv = [header, ...rows].join('\n');

  if (Platform.OS === 'web') {
    downloadOnWeb(new Blob([csv], { type: 'text/csv' }), `${filename}.csv`);
  } else {
    await saveOnAndroid(csv, `${filename}.csv`, 'utf8');
  }
};

/* ── Export as Excel ────────────────────────────── */
export const exportExcel = async (
  data: Record<string, any>[],
  columns: { key: string; label: string }[],
  filename = 'export'
) => {
  const wsData = [
    columns.map(c => c.label),
    ...data.map(row => columns.map(c => row[c.key] ?? '')),
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

  if (Platform.OS === 'web') {
    XLSX.writeFile(wb, `${filename}.xlsx`);
  } else {
    const base64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
    await saveOnAndroid(base64, `${filename}.xlsx`, 'base64');
  }
};

/* ── Export as PDF ──────────────────────────────── */
export const exportPDF = async (
  data: Record<string, any>[],
  columns: { key: string; label: string }[],
  title = 'Report',
  filename = 'export'
) => {
  const doc = new jsPDF({ orientation: 'landscape' });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 18);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 25);

  autoTable(doc, {
    startY: 30,
    head: [columns.map(c => c.label)],
    body: data.map(row => columns.map(c => String(row[c.key] ?? ''))),
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [238, 242, 255] },
    margin: { left: 14, right: 14 },
  });

  if (Platform.OS === 'web') {
    doc.save(`${filename}.pdf`);
  } else {
    const base64 = doc.output('datauristring').split(',')[1];
    await saveOnAndroid(base64, `${filename}.pdf`, 'base64');
  }
};
