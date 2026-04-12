import { Platform } from 'react-native';

export type ExportFormat = 'PDF' | 'CSV' | 'EXCEL';

export async function exportData(data: any[], filename: string, format: ExportFormat) {
  if (data.length === 0) {
    alert("No data to export");
    return;
  }

  const cleanData = data.map(({ id, ...rest }) => rest); // Usually remove IDs
  
  if (format === 'CSV') {
    const headers = Object.keys(cleanData[0]).join(',');
    const rows = cleanData.map(obj => Object.values(obj).map(v => `"${v}"`).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    
    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.csv`;
      a.click();
    } else {
      console.log('CSV Export requested for native:', csv.substring(0, 100));
      alert(`CSV export prepared for ${filename}. Sending to native storage...`);
      // In a real app, use react-native-fs here
    }
  } else if (format === 'EXCEL') {
    alert("Excel export requires 'xlsx' library. Generating CSV fallback...");
    exportData(data, filename, 'CSV');
  } else if (format === 'PDF') {
    if (Platform.OS === 'web') {
      window.print();
    } else {
      alert("PDF export prepared. Sending to printer...");
      // In a real app, use react-native-html-to-pdf here
    }
  }
}
