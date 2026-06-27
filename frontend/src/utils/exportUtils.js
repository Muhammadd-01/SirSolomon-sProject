import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const exportToPDF = (data, columns, title, filename) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  doc.autoTable({
    startY: 30,
    head: [columns.map(c => c.header)],
    body: data.map(item => columns.map(c => item[c.key])),
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [5, 150, 105] } // emerald-600
  });
  
  doc.save(`${filename}.pdf`);
};

export const exportToExcel = (data, columns, filename) => {
  const exportData = data.map(item => {
    const row = {};
    columns.forEach(col => {
      row[col.header] = item[col.key];
    });
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportToCSV = (data, columns, filename) => {
  const headers = columns.map(c => c.header).join(',');
  const rows = data.map(item => {
    return columns.map(c => `"${item[c.key] || ''}"`).join(',');
  }).join('\n');
  
  const csv = `${headers}\n${rows}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
