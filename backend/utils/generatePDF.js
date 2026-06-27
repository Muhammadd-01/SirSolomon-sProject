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
    .fontSize(18)
    .text("Sir Solomon's School", { align: 'center' })
    .fillColor('#4b5563')
    .fontSize(10)
    .text('123 Education Lane, Learning City, PK', { align: 'center' })
    .text('Phone: +92 300 1234567 | Email: info@sirsolomons.edu', { align: 'center' })
    .moveDown()
    .fillColor('#1f2937')
    .fontSize(14)
    .text(title, { align: 'center', underline: true })
    .moveDown(0.5);
    
  if (subtitle) {
    doc.fontSize(10).text(subtitle, { align: 'center' }).moveDown();
  }
};

export const generateSalarySlipPDF = (salaryData, res) => {
  // Use A5 format
  const doc = new PDFDocument({ margin: 30, size: 'A5' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=salary-slip-${salaryData.month}-${salaryData.year}.pdf`);
  doc.pipe(res);

  buildHeader(doc, 'Salary Bill Receipt', `${getMonthName(salaryData.month)} ${salaryData.year}`);

  // Employee Details
  doc.fontSize(10).fillColor('#000000');
  const detailsY = doc.y;
  doc.text(`Name: ${salaryData.teacher.fullName}`, 30, detailsY);
  doc.text(`Department: ${salaryData.teacher.department || 'N/A'}`, 30, detailsY + 15);
  doc.text(`Basic Salary: PKR ${salaryData.basicSalary}`, 200, detailsY);
  doc.text(`Working Days: ${salaryData.totalWorkingDays}`, 200, detailsY + 15);
  doc.moveDown(2);

  let currentY = doc.y;

  const drawRow = (y, label, value, isBold = false) => {
    if (isBold) doc.font('Helvetica-Bold');
    else doc.font('Helvetica');
    doc.text(label, 30, y);
    doc.text(value.toString(), 250, y, { width: 100, align: 'right' });
  };

  const drawSectionHeader = (y, text) => {
    doc.rect(30, y - 2, 350, 16).fill('#f3f4f6');
    doc.fillColor('#1f2937').font('Helvetica-Bold').fontSize(10).text(text, 35, y);
    doc.font('Helvetica').fillColor('#000000');
  };

  // 1. DEDUCTIONS
  drawSectionHeader(currentY, 'Deductions');
  currentY += 20;
  
  doc.fontSize(9);
  drawRow(currentY, `Per Day Salary (Basic / ${salaryData.totalWorkingDays})`, `PKR ${salaryData.perDaySalary}`);
  currentY += 15;
  drawRow(currentY, `Absence Deduction (${salaryData.absentDays} days)`, `PKR ${salaryData.absenceDeduction}`);
  currentY += 15;
  drawRow(currentY, `Late Deduction (${salaryData.lateDays} lates = ${salaryData.absenceDueToLate} absents)`, `PKR ${salaryData.lateAbsenceDeduction}`);
  currentY += 15;
  
  if (salaryData.advance > 0) {
    drawRow(currentY, `Advance Deduction`, `PKR ${salaryData.advance}`);
    currentY += 15;
  }
  
  if (salaryData.appliedComponents && salaryData.appliedComponents.length > 0) {
    salaryData.appliedComponents.filter(c => c.type === 'deduction').forEach(comp => {
      drawRow(currentY, `${comp.name} ${comp.isPercentage ? `(${comp.originalAmount}%)` : ''}`, `PKR ${comp.calculatedAmount}`);
      currentY += 15;
    });
  }
  
  doc.fontSize(10);
  const totalDeductions = salaryData.totalDeductions + (salaryData.customDeductions || 0);
  drawRow(currentY, 'Total Deductions', `PKR ${totalDeductions}`, true);
  currentY += 25;

  // 2. GROSS PAY
  doc.rect(30, currentY - 5, 350, 20).fill('#e0f2fe');
  doc.fillColor('#1e3a8a');
  drawRow(currentY, 'GROSS PAY (Basic - Deductions)', `PKR ${salaryData.grossPay}`, true);
  doc.fillColor('#000000');
  currentY += 30;

  // 3. ALLOWANCES & ADDITIONS
  drawSectionHeader(currentY, 'Allowances & Additions');
  currentY += 20;
  
  doc.fontSize(9);
  drawRow(currentY, `Attendance (0 absents)`, `PKR ${salaryData.attendanceAllowance}`);
  currentY += 15;
  drawRow(currentY, `Punctuality (<4 lates)`, `PKR ${salaryData.punctualityAllowance}`);
  currentY += 15;
  
  if (salaryData.appliedComponents && salaryData.appliedComponents.length > 0) {
    salaryData.appliedComponents.filter(c => c.type === 'addition').forEach(comp => {
      drawRow(currentY, `${comp.name} ${comp.isPercentage ? `(${comp.originalAmount}%)` : ''}`, `PKR ${comp.calculatedAmount}`);
      currentY += 15;
    });
  }

  if (salaryData.juneSalary > 0) {
    drawRow(currentY, 'June Salary', `PKR ${salaryData.juneSalary}`);
    currentY += 15;
  }
  if (salaryData.julySalary > 0) {
    drawRow(currentY, 'July Salary', `PKR ${salaryData.julySalary}`);
    currentY += 15;
  }
  if (salaryData.bonus > 0) {
    drawRow(currentY, 'Bonus', `PKR ${salaryData.bonus}`);
    currentY += 15;
  }
  
  doc.fontSize(10);
  const totalAllowancesAndAdditions = salaryData.totalAllowance + salaryData.totalAdditions + (salaryData.customAdditions || 0);
  drawRow(currentY, 'Total Additions', `PKR ${totalAllowancesAndAdditions}`, true);
  currentY += 25;
  
  if (salaryData.taxAmount > 0) {
    doc.fillColor('#ef4444');
    drawRow(currentY, `Tax Deduction`, `- PKR ${salaryData.taxAmount}`, true);
    doc.fillColor('#000000');
    currentY += 25;
  }

  // 4. PAYABLE SALARY
  doc.rect(30, currentY - 5, 350, 25).fill('#1e3a8a');
  doc.fillColor('#ffffff');
  drawRow(currentY, 'FINAL PAYABLE SALARY', `PKR ${salaryData.payableSalary}`, true);
  doc.fillColor('#000000');
  currentY += 40;

  // Footer / Signatures
  if (currentY > doc.page.height - 80) {
    doc.addPage();
    currentY = 50;
  }
  
  currentY += 30;
  doc.fontSize(9);
  doc.text('_______________________', 40, currentY);
  doc.text('Admin Signature', 50, currentY + 15);
  
  doc.text('_______________________', 220, currentY);
  doc.text('Teacher Signature', 230, currentY + 15);

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
