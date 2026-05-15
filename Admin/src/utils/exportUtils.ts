/**
 * exportUtils.ts — Production-grade export utility for Crackers Kingdom Admin
 *
 * Supports: CSV · Excel · PDF (client-side via jsPDF)
 * Android : Uses ReactNativeBlobUtil DownloadManager → shows in notification bar
 * Web     : Direct browser download via <a> tag / Blob URL
 * iOS     : Saves to Documents directory with share sheet
 *
 * PDF download from server (Orders / Invoices):
 *   Call downloadFile(url, filename) where url is the authenticated server endpoint.
 *
 * Only dependencies already in package.json are used.
 */

import { Platform, Alert, PermissionsAndroid } from 'react-native';
import { requestStorageWritePermission } from './permissionUtils';
import Toast from 'react-native-toast-message';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/* ─── Toast helpers ─────────────────────────────── */
const toast = {
  success: (msg: string) => Toast.show({ type: 'success', text1: msg }),
  error: (msg: string) => Toast.show({ type: 'error', text1: msg }),
  info: (msg: string) => Toast.show({ type: 'info', text1: msg }),
};

/* ─── Lazy native module loaders ────────────────── */
// These are only imported on native (Android/iOS) to avoid web bundle issues.
let ReactNativeBlobUtil: any = null;
let RNPrint: any = null;

if (Platform.OS !== 'web') {
  try {
    const mod = require('react-native-blob-util');
    ReactNativeBlobUtil = mod.default ?? mod;
  } catch (e) {
    console.warn('[exportUtils] react-native-blob-util not loaded:', e);
  }

  try {
    const mod = require('react-native-print');
    RNPrint = mod.default ?? mod;
  } catch (e) {
    console.warn('[exportUtils] react-native-print not loaded:', e);
  }
}

/* ─── Types ─────────────────────────────────────── */
export interface ExportColumn {
  key: string;
  label: string;
  render?: (item: any) => any;
}

/* ─── Android storage permission ────────────────── */
export const requestAndroidStoragePermission = requestStorageWritePermission;

/* ─── Web download helper ───────────────────────── */
const triggerWebDownload = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

/* ─── MIME resolver ─────────────────────────────── */
const mimeFor = (filename: string): string => {
  if (filename.endsWith('.pdf')) return 'application/pdf';
  if (filename.endsWith('.csv')) return 'text/csv';
  if (filename.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  return 'application/octet-stream';
};

/* ══════════════════════════════════════════════════
   EXPORT AS CSV
══════════════════════════════════════════════════ */
export const exportCSV = async (
  data: Record<string, any>[],
  columns: ExportColumn[],
  filename = 'export',
): Promise<void> => {
  try {
    const header = columns.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',');
    const rows = data.map(row =>
      columns.map(c => {
        const raw = c.render ? c.render(row) : row[c.key];
        const val = raw ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(','),
    );
    // BOM for Excel UTF-8 compatibility
    const csv = '\uFEFF' + [header, ...rows].join('\n');

    if (Platform.OS === 'web') {
      triggerWebDownload(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${filename}.csv`);
      toast.success(`${filename}.csv downloaded`);
      return;
    }

    await saveNativeFile(csv, `${filename}.csv`, 'utf8');
  } catch (err: any) {
    console.error('[exportCSV]', err);
    toast.error('CSV export failed');
  }
};

// Legacy alias used across the codebase
export const exportToCSV = exportCSV;

/* ══════════════════════════════════════════════════
   EXPORT AS EXCEL (.xlsx)
══════════════════════════════════════════════════ */
export const exportExcel = async (
  data: Record<string, any>[],
  columns: ExportColumn[],
  filename = 'export',
): Promise<void> => {
  try {
    const wsData = [
      columns.map(c => c.label),
      ...data.map(row =>
        columns.map(c => {
          const raw = c.render ? c.render(row) : row[c.key];
          return raw ?? '';
        }),
      ),
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    if (Platform.OS === 'web') {
      XLSX.writeFile(wb, `${filename}.xlsx`);
      toast.success(`${filename}.xlsx downloaded`);
      return;
    }

    // Native: encode to base64, save via BlobUtil
    const base64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
    await saveNativeBase64File(base64, `${filename}.xlsx`, mimeFor(`${filename}.xlsx`));
  } catch (err: any) {
    console.error('[exportExcel]', err);
    toast.error('Excel export failed');
  }
};

/* ══════════════════════════════════════════════════
   EXPORT AS PDF (client-side via jsPDF)
══════════════════════════════════════════════════ */
export const exportPDF = async (
  data: Record<string, any>[],
  columns: ExportColumn[],
  title = 'Report',
  filename = 'export',
): Promise<void> => {
  try {
    const doc = new jsPDF({ orientation: 'landscape' });

    // Header
    doc.setFontSize(18);
    doc.setTextColor(39, 103, 65); // primary green
    doc.text(title, 14, 18);

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 25);

    autoTable(doc, {
      startY: 30,
      head: [columns.map(c => c.label)],
      body: data.map(row =>
        columns.map(c => {
          const raw = c.render ? c.render(row) : row[c.key];
          return String(raw ?? '');
        }),
      ),
      headStyles: {
        fillColor: [39, 103, 65],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [245, 248, 246] },
      margin: { top: 30, left: 14, right: 14 },
    });

    if (Platform.OS === 'web') {
      doc.save(`${filename}.pdf`);
      toast.success(`${filename}.pdf downloaded`);
      return;
    }

    const base64 = doc.output('datauristring').split(',')[1];
    await saveNativeBase64File(base64, `${filename}.pdf`, 'application/pdf');
  } catch (err: any) {
    console.error('[exportPDF]', err);
    toast.error('PDF export failed');
  }
};

/* ══════════════════════════════════════════════════
   DOWNLOAD FILE  ← used by Order.tsx / BillHistory.tsx
   Handles both:
     • Data URIs (locally generated exports)
     • Network URLs (server-side PDF endpoints)
   Android: DownloadManager → notification bar entry
   iOS    : Save to Documents, open share sheet
   Web    : Anchor-tag download
══════════════════════════════════════════════════ */
export const downloadFile = async (
  url: string,
  filename: string,
): Promise<string | undefined> => {
  // 1. Sanitize filename to avoid filesystem issues with special characters
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const isDataUri = url.startsWith('data:');

  /* ── Web ──────────────────────────────────────── */
  if (Platform.OS === 'web') {
    if (isDataUri) {
      const res = await fetch(url);
      const blob = await res.blob();
      triggerWebDownload(blob, sanitizedFilename);
    } else {
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = sanitizedFilename;
      anchor.target = '_blank';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    }
    toast.success(`${sanitizedFilename} downloaded`);
    return;
  }

  /* ── Native (Android / iOS) ───────────────────── */
  if (!ReactNativeBlobUtil) {
    Alert.alert('Download Error', 'Native download module is not available.');
    return;
  }

  const hasPermission = await requestAndroidStoragePermission();
  if (!hasPermission) {
    Alert.alert(
      'Permission Denied',
      'Storage permission is required to save files. Please allow it in Settings.',
    );
    return;
  }

  const mime = mimeFor(sanitizedFilename);

  try {
    /* ── Data URI path (local export) ────────────── */
    if (isDataUri) {
      const base64Data = url.split(',')[1];
      const destPath = `${ReactNativeBlobUtil.fs.dirs.DownloadDir}/${sanitizedFilename}`;

      await ReactNativeBlobUtil.fs.writeFile(destPath, base64Data, 'base64');

      // Register with Android DownloadManager → appears in notification bar
      if (Platform.OS === 'android' && ReactNativeBlobUtil.android) {
        ReactNativeBlobUtil.android.addCompleteDownload({
          title: sanitizedFilename,
          description: 'Crackers Kingdom — file saved to Downloads',
          mime,
          path: destPath,
          showNotification: true,
          mediaScannable: true,
        });
      }

      toast.success(`Saved to Downloads: ${sanitizedFilename}`);
      return destPath;
    }

    /* ── Network URL path (server PDF) ──────────── */
    let authToken: string | null = null;
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      authToken = await AsyncStorage.getItem('accessToken');
    } catch {
      // Proceed without auth header if storage unavailable
    }

    const headers: Record<string, string> = {
      'Cache-Control': 'no-cache',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    toast.info(`Downloading ${sanitizedFilename}…`);

    /**
     * FIX: Instead of letting system DownloadManager fetch the URL directly (which often 
     * fails due to auth headers, self-signed certs, or cleartext/local-IP restrictions),
     * we fetch the file into the app's cache first, then register it.
     */
    const res = await ReactNativeBlobUtil.config({
      fileCache: true,
      trustSelfSigned: true,
      // On iOS, we want a persistent path in Documents for the share sheet
      path: Platform.OS === 'ios'
        ? `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/${sanitizedFilename}`
        : undefined,
    }).fetch('GET', url, headers);

    const tempPath = res.path();
    let finalPath = tempPath;

    if (Platform.OS === 'android') {
      finalPath = `${ReactNativeBlobUtil.fs.dirs.DownloadDir}/${sanitizedFilename}`;
      
      // Copy from cache to Downloads folder
      // Note: On Android 11+, writing to DownloadDir requires MANAGE_EXTERNAL_STORAGE 
      // or using MediaStore, but addCompleteDownload can handle files in app-accessible dirs too.
      // However, most users expect it in the actual Downloads folder.
      await ReactNativeBlobUtil.fs.cp(tempPath, finalPath);
      
      if (ReactNativeBlobUtil.android) {
        ReactNativeBlobUtil.android.addCompleteDownload({
          title: sanitizedFilename,
          description: 'Crackers Kingdom Admin — document download',
          mime,
          path: finalPath,
          showNotification: true,
          mediaScannable: true,
        });
      }
      
      // Cleanup cache
      await ReactNativeBlobUtil.fs.unlink(tempPath);
    }

    if (Platform.OS === 'ios' && RNPrint) {
      try {
        await RNPrint.print({ filePath: finalPath });
      } catch {
        toast.success(`Saved: ${sanitizedFilename}`);
      }
    } else {
      toast.success(`Download complete: ${sanitizedFilename}`);
    }

    return finalPath;
  } catch (err: any) {
    console.error('[downloadFile]', err);
    Alert.alert(
      'Download Failed',
      err?.message || 'Could not save the file. Please check your network or storage.',
    );
  }
};

/* ══════════════════════════════════════════════════
   INTERNAL HELPERS
══════════════════════════════════════════════════ */

/**
 * Save a UTF-8 text string natively (CSV).
 * Android : writes file + notifies DownloadManager
 * iOS     : writes to DocumentDir
 */
const saveNativeFile = async (
  content: string,
  filename: string,
  encoding: 'utf8' | 'base64' = 'utf8',
): Promise<void> => {
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  if (!ReactNativeBlobUtil) {
    Alert.alert('Error', 'Native file module unavailable.');
    return;
  }

  const hasPermission = await requestAndroidStoragePermission();
  if (!hasPermission) {
    Alert.alert('Permission Denied', 'Storage permission is required to save files.');
    return;
  }

  const mime = mimeFor(sanitizedFilename);
  const dir = Platform.OS === 'ios'
    ? ReactNativeBlobUtil.fs.dirs.DocumentDir
    : ReactNativeBlobUtil.fs.dirs.DownloadDir;
  const destPath = `${dir}/${sanitizedFilename}`;

  await ReactNativeBlobUtil.fs.writeFile(destPath, content, encoding);

  if (Platform.OS === 'android' && ReactNativeBlobUtil.android) {
    ReactNativeBlobUtil.android.addCompleteDownload({
      title: sanitizedFilename,
      description: 'Crackers Kingdom — export saved to Downloads',
      mime,
      path: destPath,
      showNotification: true,
      mediaScannable: true,
    });
  }

  toast.success(`Saved to Downloads: ${sanitizedFilename}`);
};

/**
 * Save a base64-encoded file natively (Excel / PDF).
 * Android: registers with DownloadManager for notification bar entry.
 */
const saveNativeBase64File = async (
  base64: string,
  filename: string,
  mime: string,
): Promise<void> => {
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  if (!ReactNativeBlobUtil) {
    Alert.alert('Error', 'Native file module unavailable.');
    return;
  }

  const hasPermission = await requestAndroidStoragePermission();
  if (!hasPermission) {
    Alert.alert('Permission Denied', 'Storage permission is required to save files.');
    return;
  }

  const dir = Platform.OS === 'ios'
    ? ReactNativeBlobUtil.fs.dirs.DocumentDir
    : ReactNativeBlobUtil.fs.dirs.DownloadDir;
  const destPath = `${dir}/${sanitizedFilename}`;

  await ReactNativeBlobUtil.fs.writeFile(destPath, base64, 'base64');

  if (Platform.OS === 'android' && ReactNativeBlobUtil.android) {
    ReactNativeBlobUtil.android.addCompleteDownload({
      title: sanitizedFilename,
      description: 'Crackers Kingdom — export saved to Downloads',
      mime,
      path: destPath,
      showNotification: true,
      mediaScannable: true,
    });
  }

  if (Platform.OS === 'ios' && RNPrint && mime === 'application/pdf') {
    try {
      await RNPrint.print({ filePath: destPath });
    } catch {
      toast.success(`Saved: ${sanitizedFilename}`);
    }
    return;
  }

  toast.success(`Saved to Downloads: ${sanitizedFilename}`);
};

/* ══════════════════════════════════════════════════
   PRINT (legacy / compatibility)
══════════════════════════════════════════════════ */
export const printData = async (
  title: string,
  data: Record<string, any>[],
  columns: ExportColumn[],
  format: 'print' | 'pdf' = 'print',
): Promise<void> => {
  if (format === 'pdf') {
    return exportPDF(data, columns, title);
  }

  if (Platform.OS !== 'web' && RNPrint) {
    // Build minimal HTML for printing
    const headerRow = columns.map(c => `<th>${c.label}</th>`).join('');
    const bodyRows = data.map(row =>
      `<tr>${columns.map(c => `<td>${row[c.key] ?? ''}</td>`).join('')}</tr>`,
    ).join('');

    const html = `
      <html><head><style>
        body { font-family: sans-serif; font-size: 12px; }
        h2 { color: #276741; }
        table { border-collapse: collapse; width: 100%; }
        th { background: #276741; color: white; padding: 6px 8px; text-align: left; }
        td { padding: 5px 8px; border-bottom: 1px solid #e0e0e0; }
        tr:nth-child(even) td { background: #f5f8f6; }
      </style></head><body>
        <h2>${title}</h2>
        <p style="color:#666">Generated: ${new Date().toLocaleString('en-IN')}</p>
        <table><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table>
      </body></html>`;

    try {
      await RNPrint.print({ html });
    } catch (err: any) {
      toast.error(err?.message || 'Print failed');
    }
    return;
  }

  // Web fallback: open print dialog
  if (Platform.OS === 'web') {
    window.print();
  }
};