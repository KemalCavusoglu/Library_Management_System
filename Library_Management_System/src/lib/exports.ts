import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportColumn {
  header: string;
  accessor: (row: Record<string, unknown>) => string | number;
}

const downloadBlob = (data: Blob, filename: string) => {
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportToExcel = (
  columns: ExportColumn[],
  rows: Record<string, unknown>[],
  filename: string
) => {
  const header = columns.map((c) => c.header);
  const data = rows.map((r) => columns.map((c) => c.accessor(r)));
  const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
  ws['!cols'] = header.map((h) => ({ wch: Math.max(h.length + 2, 14) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rapor');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  downloadBlob(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    filename
  );
};

export const exportToPDF = (
  columns: ExportColumn[],
  rows: Record<string, unknown>[],
  filename: string,
  title: string
) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  doc.setFontSize(16);
  doc.text(title, 40, 40);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(
    `Oluşturulma: ${new Date().toLocaleString('tr-TR')}`,
    40,
    58
  );
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 72,
    head: [columns.map((c) => c.header)],
    body: rows.map((r) => columns.map((c) => String(c.accessor(r)))),
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [246, 247, 249] },
    margin: { left: 40, right: 40 },
  });

  doc.save(filename);
};
