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



function numberToWords(num) {
  const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
  const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];
  if ((num = num.toString()).length > 9) return 'overflow';
  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return;
  let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Only' : 'Only';
  return str.trim();
}

function formatDate(date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
}

function calculateAge(dob) {
  if (!dob) return { years: 0, months: 0, days: 0 };
  const birthDate = new Date(dob);
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();
  if (days < 0) {
    months--;
    days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  return { years, months, days };
}

export const generateSalarySlipPDF = (salaryData, res) => {
  const doc = new PDFDocument({ margin: 25, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=salary-slip-${salaryData.month}-${salaryData.year}.pdf`);
  doc.pipe(res);

  const teacher = salaryData.teacher;
  const age = calculateAge(teacher.dob);
  const service = calculateAge(teacher.joiningDate);

  const primaryColor = '#059669'; // Emerald-600
  const secondaryColor = '#047857'; // Emerald-700
  const lightBg = '#f0fdf4'; // Emerald-50
  const darkTextColor = '#1e293b'; // Slate-800
  const mutedTextColor = '#475569'; // Slate-600
  const borderColor = '#a7f3d0'; // Emerald-200

  // Outer border with double styling (emerald theme)
  doc.rect(20, 20, 555, 802).lineWidth(2).strokeColor(primaryColor).stroke();
  doc.rect(23, 23, 549, 796).lineWidth(0.5).strokeColor(borderColor).stroke();

  // Decorative header ribbon
  doc.rect(24, 24, 547, 6).fill(primaryColor);

  // School Header Info
  doc.fillColor(secondaryColor).font('Helvetica-Bold').fontSize(22);
  doc.text("Sir Solomon's Secondary School", 30, 42, { align: 'center' });
  
  doc.fillColor(mutedTextColor).font('Helvetica-Oblique').fontSize(10);
  doc.text("(Regd. & Recog.)", 30, 68, { align: 'center' });
  
  doc.fillColor(darkTextColor).font('Helvetica').fontSize(9.5);
  doc.text("House # R-45, R-202, R-203, R-204, Sector 31/B, K.D.A Employee's Korangi", 30, 83, { align: 'center' });
  doc.font('Helvetica-Bold').text("Cell # 0333-2310974 , 0333-2255877", 30, 98, { align: 'center' });

  // Salary Slip Title Badge
  doc.roundedRect(227, 120, 140, 24, 4).fill(primaryColor);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11).text("SALARY SLIP", 227, 127, { width: 140, align: 'center' });

  // For the Month line
  doc.fillColor(darkTextColor).font('Helvetica-Bold').fontSize(10);
  doc.text(`For the Month of: ${getMonthName(salaryData.month)} ${salaryData.year}`, 30, 155, { align: 'center' });

  // --- Section 1: Personal Information ---
  let cy = 180;
  
  // Section Header bar
  doc.rect(25, cy, 545, 18).fill(lightBg);
  doc.fillColor(secondaryColor).font('Helvetica-Bold').fontSize(10).text("PERSONAL INFORMATION", 35, cy + 4);
  doc.fillColor(mutedTextColor).font('Helvetica').fontSize(9).text(`Date: ${formatDate(new Date())}`, 480, cy + 5);
  
  // Inner Border for Personal Info Grid
  cy += 18;
  doc.rect(25, cy, 545, 160).lineWidth(1).strokeColor(borderColor).stroke();

  // Grid Data
  doc.fillColor(darkTextColor).font('Helvetica');
  let rowY = cy + 12;
  const col1 = 35;
  const col2 = 310;

  // Row 1: ID & Guardian Name
  doc.font('Helvetica-Bold').text("I.D :", col1, rowY).font('Helvetica').text(teacher.teacherId || 'N/A', col1 + 110, rowY);
  doc.font('Helvetica-Bold').text("D/O, S/O, W/O :", col2, rowY).font('Helvetica').text(teacher.guardianName || 'N/A', col2 + 110, rowY);
  
  // Row 2: Name & DOB
  rowY += 20;
  doc.font('Helvetica-Bold').text("Name :", col1, rowY).font('Helvetica').text(teacher.fullName || 'N/A', col1 + 110, rowY);
  doc.font('Helvetica-Bold').text("D.O.B :", col2, rowY).font('Helvetica').text(formatDate(teacher.dob), col2 + 110, rowY);
  
  // Row 3: CNIC & Designation
  rowY += 20;
  doc.font('Helvetica-Bold').text("CNIC # :", col1, rowY).font('Helvetica').text(teacher.cnic || 'N/A', col1 + 110, rowY);
  doc.font('Helvetica-Bold').text("DESIGNATION :", col2, rowY).font('Helvetica').text(teacher.department || 'Teacher', col2 + 110, rowY);
  
  // Row 4: Cell & June/July Status
  rowY += 20;
  doc.font('Helvetica-Bold').text("CELL # :", col1, rowY).font('Helvetica').text(teacher.phone || 'N/A', col1 + 110, rowY);
  doc.font('Helvetica-Bold').text("June / July Status :", col2, rowY).font('Helvetica').text("NO", col2 + 110, rowY);
  
  // Row 5: Address & Age
  rowY += 20;
  doc.font('Helvetica-Bold').text("ADDRESS :", col1, rowY).font('Helvetica').text(teacher.address || 'N/A', col1 + 110, rowY, { width: 160 });
  doc.font('Helvetica-Bold').text("AGE :", col2, rowY).font('Helvetica').text(`${age.years} Years, ${age.months} Months, ${age.days} Days`, col2 + 110, rowY);
  
  // Row 6: Qualifications & Joining Date
  rowY += 20;
  const quals = [teacher.academicQualification, teacher.professionalQualification].filter(Boolean).join(' / ') || 'N/A';
  doc.font('Helvetica-Bold').text("QUALIFICATIONS :", col1, rowY).font('Helvetica').text(quals, col1 + 110, rowY);
  doc.font('Helvetica-Bold').text("D.O.JOINING :", col2, rowY).font('Helvetica').text(formatDate(teacher.joiningDate), col2 + 110, rowY);

  // Row 7: Service Length
  rowY += 20;
  doc.font('Helvetica-Bold').text("SERVICE LENGTH :", col2, rowY).font('Helvetica').text(`${service.years} Years, ${service.months} Months, ${service.days} Days`, col2 + 110, rowY);


  // --- Section 2: Attendance ---
  cy += 175;
  doc.rect(25, cy, 545, 18).fill(lightBg);
  doc.fillColor(secondaryColor).font('Helvetica-Bold').fontSize(10).text("ATTENDANCE OF THE MONTH", 35, cy + 4);
  
  cy += 18;
  doc.rect(25, cy, 545, 55).lineWidth(1).strokeColor(borderColor).stroke();
  
  rowY = cy + 10;
  doc.fillColor(darkTextColor).font('Helvetica');
  doc.font('Helvetica-Bold').text("Working Days :", col1, rowY).font('Helvetica').text(salaryData.totalWorkingDays.toString(), col1 + 110, rowY);
  doc.font('Helvetica-Bold').text("Presents :", 220, rowY).font('Helvetica').text(salaryData.presentDays.toString(), 220 + 70, rowY);
  doc.font('Helvetica-Bold').text("Absents :", 400, rowY).font('Helvetica').text(salaryData.absentDays.toString(), 400 + 70, rowY);

  rowY += 20;
  doc.font('Helvetica-Bold').text("Late Days :", col1, rowY).font('Helvetica').text(salaryData.lateDays.toString(), col1 + 110, rowY);
  doc.font('Helvetica-Bold').text("Late Absents :", 220, rowY).font('Helvetica').text((salaryData.absenceDueToLate || 0).toString(), 220 + 90, rowY);
  doc.font('Helvetica-Bold').text("Total Absents :", 400, rowY).font('Helvetica').text((salaryData.absentDays + (salaryData.absenceDueToLate || 0)).toString(), 400 + 95, rowY);


  // --- Section 3: Allowances & Deductions ---
  cy += 70;
  // Let's create two parallel cards for Allowance and Deductions side-by-side
  const cardWidth = 265;
  const colLeft = 25;
  const colRight = 305;

  // Left card (Allowances)
  doc.rect(colLeft, cy, cardWidth, 18).fill(lightBg);
  doc.fillColor(secondaryColor).font('Helvetica-Bold').fontSize(10).text("ALLOWANCES CALCULATION", colLeft + 10, cy + 4);
  
  doc.rect(colLeft, cy + 18, cardWidth, 75).lineWidth(1).strokeColor(borderColor).stroke();
  doc.fillColor(darkTextColor).font('Helvetica');
  doc.text("Regularity Allowance :", colLeft + 10, cy + 28).text(`Rs. ${salaryData.attendanceAllowance || 0}`, colLeft + 160, cy + 28, { align: 'right', width: 90 });
  doc.text("Punctuality Allowance :", colLeft + 10, cy + 48).text(`Rs. ${salaryData.punctualityAllowance || 0}`, colLeft + 160, cy + 48, { align: 'right', width: 90 });
  doc.font('Helvetica-Bold').text("Total Allowance :", colLeft + 10, cy + 70).text(`Rs. ${salaryData.totalAllowance}`, colLeft + 160, cy + 70, { align: 'right', width: 90 });

  // Right card (Deductions)
  doc.rect(colRight, cy, cardWidth, 18).fill('#fef2f2'); // soft red background
  doc.fillColor('#991b1b').font('Helvetica-Bold').fontSize(10).text("DEDUCTIONS", colRight + 10, cy + 4);
  
  doc.rect(colRight, cy + 18, cardWidth, 75).lineWidth(1).strokeColor('#fca5a5').stroke();
  doc.fillColor(darkTextColor).font('Helvetica');
  const absentDeductVal = salaryData.absenceDeduction + salaryData.lateAbsenceDeduction;
  doc.text("Absents Amount :", colRight + 10, cy + 28).text(`Rs. ${absentDeductVal}`, colRight + 160, cy + 28, { align: 'right', width: 90 });
  doc.text("Advance / Other :", colRight + 10, cy + 48).text(`Rs. ${salaryData.advance}`, colRight + 160, cy + 48, { align: 'right', width: 90 });
  doc.font('Helvetica-Bold').text("Total Deductions :", colRight + 10, cy + 70).text(`Rs. ${salaryData.totalDeductions}`, colRight + 160, cy + 70, { align: 'right', width: 90 });


  // --- Section 4: Salary Calculations ---
  cy += 110;
  doc.rect(25, cy, 545, 18).fill(lightBg);
  doc.fillColor(secondaryColor).font('Helvetica-Bold').fontSize(10).text("SALARY CALCULATIONS", 35, cy + 4);
  
  cy += 18;
  doc.rect(25, cy, 545, 160).lineWidth(1).strokeColor(borderColor).stroke();

  rowY = cy + 10;
  doc.fillColor(darkTextColor).font('Helvetica');
  doc.font('Helvetica-Bold').text("Basic Salary of the Month :", col1, rowY).font('Helvetica').text(`Rs. ${salaryData.basicSalary}   /=`, col1 + 170, rowY);
  
  // Per day salary box
  doc.roundedRect(420, rowY - 4, 135, 20, 2).fill(primaryColor);
  doc.fillColor('#ffffff').font('Helvetica-Bold').text(`Per Day Salary: Rs. ${salaryData.perDaySalary}`, 420, rowY, { width: 135, align: 'center' });

  doc.fillColor(darkTextColor).font('Helvetica');
  rowY += 20;
  doc.text("(-) Total Deductions :", col1, rowY).text(`Rs. ${salaryData.totalDeductions}   /=`, col1 + 170, rowY);
  
  rowY += 20;
  doc.font('Helvetica-Bold').text("Gross Salary :", col1, rowY).font('Helvetica').text(`Rs. ${salaryData.grossPay}   /=`, col1 + 170, rowY);
  
  rowY += 20;
  doc.text("(+) Total Allowances :", col1, rowY).text(`Rs. ${salaryData.totalAllowance}   /=`, col1 + 170, rowY);
  
  rowY += 20;
  const jjSalary = (salaryData.juneSalary || 0) + (salaryData.julySalary || 0);
  doc.text("(+) June / July Salary :", col1, rowY).text(`Rs. ${jjSalary > 0 ? jjSalary : '0'}   /=`, col1 + 170, rowY);
  
  // Highlight payable amount banner
  rowY += 20;
  doc.roundedRect(col1 - 5, rowY - 5, 515, 26, 4).fill(primaryColor);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11).text("Net Payable Salary Amount :", col1, rowY);
  doc.text(`Rs. ${salaryData.payableSalary}   /=`, 400, rowY, { align: 'right', width: 130 });

  // Amount in words box
  cy += 190;
  doc.roundedRect(25, cy, 545, 25, 4).fill(lightBg);
  doc.fillColor(secondaryColor).font('Helvetica-Bold').fontSize(9.5).text("Salary Amount in words :", 35, cy + 8);
  doc.fillColor(darkTextColor).font('Helvetica-BoldOblique').text(`Rupees ${numberToWords(salaryData.payableSalary)}`, 175, cy + 8);

  // Signatures
  cy += 70;
  doc.fillColor(mutedTextColor).font('Helvetica').fontSize(9.5);
  doc.moveTo(50, cy).lineTo(200, cy).lineWidth(0.5).strokeColor(mutedTextColor).stroke();
  doc.text("Admin Signature", 75, cy + 6);
  
  doc.moveTo(390, cy).lineTo(540, cy).stroke();
  doc.text("Teacher Signature", 420, cy + 6);

  // Footer seal / timestamp
  doc.fontSize(8).fillColor('#94a3b8');
  doc.text("Generated via Sir Solomon's School Management System", 30, 785, { align: 'center' });

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
