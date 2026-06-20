import { saveAs } from 'file-saver';
import XLSX from 'xlsx';

export const exportToExcel = (data: any[], fileName: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `${fileName}.xlsx`);
};

export const exportToPDF = (data: any[], fileName: string) => {
    const doc = new jsPDF();
    doc.text('Analytics Data', 10, 10);
    
    // Assuming data is an array of objects
    let y = 20;
    data.forEach(item => {
        doc.text(JSON.stringify(item), 10, y);
        y += 10;
    });

    doc.save(`${fileName}.pdf`);
};