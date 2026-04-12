import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Platform } from 'react-native';

interface ExportColumn {
  key: string;
  label: string;
}

async function saveFile(content: any, filename: string, type: string) {
  const RNFS = require('react-native-fs');
  const path = `${RNFS.DownloadDirectoryPath}/${filename}`;
  try {
    if (type.includes('text') || type.includes('csv')) {
      await RNFS.writeFile(path, content, 'utf8');
    } else {
      await RNFS.writeFile(path, content, 'base64');
    }
    console.log('File saved to:', path);
    alert(`File saved to Downloads: ${filename}`);
  } catch (err) {
    console.error('Error saving file:', err);
    alert("Failed to save file to device.");
  }
}

export function exportToCsv<T>(data: T[], columns: ExportColumn[], filename: string) {
  const headers = columns.map((c) => c.label);
  const rows = data.map((item) =>
    columns.map((c) => {
      const val = (item as Record<string, unknown>)[c.key];
      return val != null ? String(val) : "";
    })
  );
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
  saveFile(csv, `${filename}.csv`, "text/csv");
}

export function exportToExcel<T>(data: T[], columns: ExportColumn[], filename: string) {
  const headers = columns.map((c) => c.label);
  const rows = data.map((item) =>
    columns.map((c) => {
      const val = (item as Record<string, unknown>)[c.key];
      return val != null ? (typeof val === "number" ? val : String(val)) : "";
    })
  );
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws["!cols"] = columns.map((c) => ({ wch: Math.max(c.label.length, 15) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  saveFile(wbout, `${filename}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}

export function exportToPdf<T>(data: T[], columns: ExportColumn[], filename: string, title?: string) {
  const doc = new jsPDF();
  if (title) {
    doc.setFontSize(16);
    doc.text(title, 14, 15);
  }
  const headers = columns.map((c) => c.label);
  const rows = data.map((item) =>
    columns.map((c) => {
      const val = (item as Record<string, unknown>)[c.key];
      return val != null ? String(val) : "";
    })
  );
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: title ? 22 : 14,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [79, 70, 229] },
  });
  const pdfBase64 = doc.output('datauristring').split(',')[1];
  saveFile(pdfBase64, `${filename}.pdf`, "application/pdf");
}

export function parseImportFile(file: any): Promise<Record<string, string>[][]> {
  return new Promise((resolve, reject) => {
    const fileName = file.name || file.uri?.split('/').pop() || 'file';
    const ext = fileName.split(".").pop()?.toLowerCase();
    
    const RNFS = require('react-native-fs');
    if (ext === "csv") {
      RNFS.readFile(file.uri, 'utf8').then((text: string) => {
        const lines = text.split("\n").filter((l) => l.trim());
        if (lines.length < 2) { resolve([]); return; }
        const headers = parseCsvLine(lines[0]);
        const rows = lines.slice(1).map((line) => {
          const vals = parseCsvLine(line);
          const row: Record<string, string> = {};
          headers.forEach((h, i) => { row[h] = vals[i] || ""; });
          return row;
        });
        resolve([rows]);
      }).catch(reject);
    } else if (ext === "xlsx" || ext === "xls") {
      RNFS.readFile(file.uri, 'base64').then((base64: string) => {
        const wb = XLSX.read(base64, { type: "base64" });
        const sheets = wb.SheetNames.map((name: string) => {
          const ws = wb.Sheets[name];
          return XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });
        });
        resolve(sheets);
      }).catch(reject);
    } else {
      reject(new Error("Unsupported file format."));
    }
  });
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') { inQuotes = !inQuotes; }
    else if (char === "," && !inQuotes) { result.push(current.trim()); current = ""; }
    else { current += char; }
  }
  result.push(current.trim());
  return result;
}
