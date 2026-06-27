import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Common helper for headers
const buildHeader = (doc, title, subtitle) => {
  doc
    .fillColor('#1e3a8a') // Navy primary
    .fontSize(24)
    .text("Sir Solomon's School", { align: 'center' })
    .fillColor('#4b5563')
    .fontSize(12)
    .text('123 Education Lane, Learning City, PK', { align: 'center' })
    .text('Phone: +92 300 1234567 | Email: info@sirsolomons.edu', { align: 'center' })
    .moveDown()
    .fillColor('#1f2937')
    .fontSize(18)
    .text(title, { align: 'center', underline: true })
    .moveDown(0.5);
    
  if (subtitle) {
    doc.fontSize(12).text(subtitle, { align: 'center' }).moveDown();
  }
};

export const generateSalarySlipPDF = (salaryData, res) => {
  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=salary-slip-${salaryData.month}-${salaryData.year}.pdf`);
  doc.pipe(res);

  buildHeader(doc, 'Salary Slip', `${getMonthName(salaryData.month)} ${salaryData.year}`);

  // Teacher Profile Image
  const profileImage = salaryData.teacher?.user?.profileImage || salaryData.teacher?.profileImage;
  if (profileImage) {
    const imagePath = path.join(__dirname, '..', profileImage); // Assuming /uploads/...
    if (fs.existsSync(imagePath)) {
      doc.image(imagePath, 450, 40, { fit: [60, 60], align: 'center', valign: 'center' });
    }
  }

  // Employee Details
  doc
    .fontSize(12)
    .text(`Teacher Name: ${salaryData.teacher.fullName}`)
    .text(`Department: ${salaryData.teacher.department || 'N/A'}`)
    .text(`Status: ${salaryData.status.toUpperCase()}`)
    .text(`Paid Date: ${salaryData.paidDate ? new Date(salaryData.paidDate).toLocaleDateString() : 'N/A'}`)
    .moveDown();

  // Earnings Table
  const tableTop = doc.y;
  let currentY = tableTop;

  const drawRow = (y, label, value, isBold = false) => {
    if (isBold) doc.font('Helvetica-Bold');
    else doc.font('Helvetica');
    
    doc
      .text(label, 50, y)
      .text(value.toString(), 400, y, { width: 100, align: 'right' });
  };

  doc.font('Helvetica-Bold').text('Earnings', 50, currentY).text('Amount', 400, currentY, { width: 100, align: 'right' });
  currentY += 20;
  drawRow(currentY, 'Basic Salary', salaryData.basicSalary);
  currentY += 20;
  drawRow(currentY, 'Allowances', salaryData.allowances);
  currentY += 20;
  drawRow(currentY, 'Bonuses', salaryData.bonuses);
  currentY += 20;
  drawRow(currentY, 'Overtime', salaryData.overtime?.total || 0);
  currentY += 25;
  drawRow(currentY, 'Gross Salary', salaryData.grossSalary, true);

  currentY += 40;

  // Deductions Table
  doc.font('Helvetica-Bold').text('Deductions', 50, currentY).text('Amount', 400, currentY, { width: 100, align: 'right' });
  currentY += 20;
  drawRow(currentY, 'Tax Deduction', salaryData.taxDeduction);
  currentY += 20;
  drawRow(currentY, 'Leave Deductions', salaryData.leaveDeductions);
  currentY += 20;
  drawRow(currentY, 'Late Deductions', salaryData.lateDeductions);
  currentY += 25;
  drawRow(currentY, 'Total Deductions', (salaryData.taxDeduction + salaryData.leaveDeductions + salaryData.lateDeductions), true);

  currentY += 40;

  // Net Salary
  doc.rect(50, currentY - 10, 500, 40).fill('#e0f2fe'); // Light navy/sky background
  doc.fillColor('#1e3a8a');
  drawRow(currentY + 5, 'NET SALARY', salaryData.netSalary, true);

  doc.end();
};

export const generateReportCardPDF = (studentData, results, res) => {
  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=report-card-${studentData.rollNumber}.pdf`);
  doc.pipe(res);

  buildHeader(doc, 'Student Report Card');

  // Student Details
  doc
    .fontSize(12)
    .text(`Name: ${studentData.fullName}`)
    .text(`Roll Number: ${studentData.rollNumber}`)
    .text(`Class: ${studentData.class?.className || 'N/A'} - ${studentData.section || ''}`)
    .moveDown();

  // Results Table
  let currentY = doc.y;
  
  // Table Header
  doc.font('Helvetica-Bold');
  doc.text('Subject', 50, currentY);
  doc.text('Total Marks', 200, currentY);
  doc.text('Obtained', 300, currentY);
  doc.text('%', 400, currentY);
  doc.text('Grade', 470, currentY);
  
  currentY += 20;
  doc.font('Helvetica');

  let grandTotal = 0;
  let totalObtained = 0;

  results.forEach(result => {
    doc.text(result.exam?.subject?.name || 'Unknown', 50, currentY);
    doc.text(result.totalMarks.toString(), 200, currentY);
    doc.text(result.marksObtained.toString(), 300, currentY);
    doc.text(result.percentage?.toFixed(2) || '0.00', 400, currentY);
    doc.text(result.grade || 'N/A', 470, currentY);
    
    grandTotal += result.totalMarks;
    totalObtained += result.marksObtained;
    currentY += 20;
  });

  currentY += 20;
  const overallPercentage = grandTotal > 0 ? (totalObtained / grandTotal) * 100 : 0;
  
  doc.font('Helvetica-Bold');
  doc.text('Overall Performance:', 50, currentY);
  currentY += 20;
  doc.font('Helvetica');
  doc.text(`Total Marks: ${totalObtained} / ${grandTotal}`, 50, currentY);
  currentY += 20;
  doc.text(`Percentage: ${overallPercentage.toFixed(2)}%`, 50, currentY);

  doc.end();
};

export const generateFeeReceiptPDF = (feeData, res) => {
  const doc = new PDFDocument({ margin: 50, size: 'A5' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=fee-receipt-${feeData.receiptNumber}.pdf`);
  doc.pipe(res);

  buildHeader(doc, 'Fee Receipt', `Receipt #: ${feeData.receiptNumber}`);

  doc
    .fontSize(12)
    .text(`Date: ${feeData.paidDate ? new Date(feeData.paidDate).toLocaleDateString() : new Date().toLocaleDateString()}`)
    .text(`Student: ${feeData.student.fullName}`)
    .text(`Roll Number: ${feeData.student.rollNumber}`)
    .text(`Class: ${feeData.class?.className || 'N/A'}`)
    .text(`Fee For: ${getMonthName(feeData.month)} ${feeData.year}`)
    .moveDown();

  const currentY = doc.y;
  
  const drawRow = (y, label, value, isBold = false) => {
    if (isBold) doc.font('Helvetica-Bold');
    else doc.font('Helvetica');
    doc.text(label, 50, y).text(value.toString(), 300, y, { width: 80, align: 'right' });
  };

  drawRow(currentY, 'Base Amount', feeData.amount);
  drawRow(currentY + 20, 'Discount', `-${feeData.discount}`);
  drawRow(currentY + 40, 'Scholarship', `-${feeData.scholarship}`);
  
  doc.rect(50, currentY + 65, 330, 30).fill('#e0f2fe');
  doc.fillColor('#1e3a8a');
  drawRow(currentY + 75, 'NET PAID', feeData.netAmount, true);

  doc.end();
};

function getMonthName(monthNumber) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[monthNumber - 1] || 'Unknown';
}
