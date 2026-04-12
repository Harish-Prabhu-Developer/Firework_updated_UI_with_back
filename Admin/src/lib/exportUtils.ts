import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface ExportColumn {
  key: string;
  label: string;
}

async function saveFile(content: any, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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
  XLSX.writeFile(wb, `${filename}.xlsx`);
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
  doc.save(`${filename}.pdf`);
}

export function parseImportFile(file: any): Promise<Record<string, string>[][]> {
  return new Promise((resolve, reject) => {
    const fileName = file.name || 'file';
    const ext = fileName.split(".").pop()?.toLowerCase();
    
    const reader = new FileReader();
    if (ext === "csv") {
      reader.onload = (e) => {
        const text = e.target?.result as string;
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
      };
      reader.readAsText(file);
    } else if (ext === "xlsx" || ext === "xls") {
      reader.onload = (e) => {
        const wb = XLSX.read(e.target?.result, { type: "array" });
        const sheets = wb.SheetNames.map((name: string) => {
          const ws = wb.Sheets[name];
          return XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });
        });
        resolve(sheets);
      };
      reader.readAsArrayBuffer(file);
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
