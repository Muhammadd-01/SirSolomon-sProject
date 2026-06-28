import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const signaturePath = path.join(__dirname, '..', 'public', 'images', 'principal_signature.png');
const logoPath = path.join(__dirname, '..', 'public', 'images', 'logo.png'); // Using png

const professionalNote = "Note: This computer-generated document requires no signature and is not acceptable in court.";

const buildHeader = (doc, title, subtitle) => {
  if (fs.existsSync(logoPath)) {
    doc.save();
    doc.roundedRect(25, 20, 40, 40, 8).clip();
    doc.image(logoPath, 25, 20, { width: 40, height: 40 });
    doc.restore();
  }

  doc
    .fillColor('#1e3a8a') // Navy primary
    .font('Helvetica-Bold')
    .fontSize(14)
    .text("Sir Solomon's School", 20, 20, { align: 'center', width: 380 })
    .fillColor('#4b5563')
    .font('Helvetica')
    .fontSize(8)
    .text('123 Education Lane, Learning City, PK', 20, 36, { align: 'center', width: 380 })
    .text('Phone: +92 300 1234567 | Email: info@sirsolomons.edu', 20, 46, { align: 'center', width: 380 })
    .fillColor('#1f2937')
    .font('Helvetica-Bold')
    .fontSize(12)
    .text(title, 20, 65, { align: 'center', width: 380, underline: true });
    
  if (subtitle) {
    doc.font('Helvetica').fontSize(8).text(subtitle, 20, 80, { align: 'center', width: 380 });
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
  const doc = new PDFDocument({ size: 'A5', margins: { top: 20, bottom: 10, left: 20, right: 20 }, autoFirstPage: true });
  
  res.setHeader('Content-Type', 'application/pdf');
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const safeName = salaryData.teacher?.fullName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Employee';
  const tId = salaryData.teacher?.teacherId || 'NoID';
  const monthName = monthNames[salaryData.month - 1] || salaryData.month;
  res.setHeader('Content-Disposition', `attachment; filename=salary-slip-${tId}-${safeName}-${monthName}-${salaryData.year}.pdf`);
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

  // Decorative header ribbon
  doc.rect(18, 18, 384, 4).fill(primaryColor);

  if (fs.existsSync(logoPath)) {
    doc.save();
    doc.roundedRect(25, 28, 45, 45, 10).clip();
    doc.image(logoPath, 25, 28, { width: 45, height: 45 });
    doc.restore();
  }

  doc.fillColor(secondaryColor).font('Helvetica-Bold').fontSize(16);
  doc.text("Sir Solomon's Secondary School", 20, 30, { align: 'center', width: 380 });
  
  doc.fillColor(mutedTextColor).font('Helvetica-Oblique').fontSize(8);
  doc.text("(Regd. & Recog.)", 20, 48, { align: 'center', width: 380 });
  
  doc.fillColor(darkTextColor).font('Helvetica').fontSize(7);
  doc.text("House # R-45, R-202, R-203, R-204, Sector 31/B, K.D.A Employee's Korangi", 20, 60, { align: 'center', width: 380 });
  doc.font('Helvetica-Bold').text("Cell # 0333-2310974 , 0333-2255877", 20, 70, { align: 'center', width: 380 });

  // Salary Slip Title Badge
  doc.roundedRect(150, 85, 120, 18, 3).fill(primaryColor);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9).text("SALARY SLIP", 150, 90, { width: 120, align: 'center' });

  // For the Month line
  doc.fillColor(darkTextColor).font('Helvetica-Bold').fontSize(8);
  doc.text(`For the Month of: ${getMonthName(salaryData.month)} ${salaryData.year}`, 20, 110, { align: 'center', width: 380 });

  // --- Section 1: Personal Information ---
  let cy = 120;
  
  doc.rect(20, cy, 380, 14).fill(lightBg);
  doc.fillColor(secondaryColor).font('Helvetica-Bold').fontSize(8).text("PERSONAL INFORMATION", 25, cy + 3);
  doc.fillColor(mutedTextColor).font('Helvetica').fontSize(7).text(`Date: ${formatDate(new Date())}`, 330, cy + 4);
  
  cy += 14;
  doc.rect(20, cy, 380, 110).lineWidth(0.5).strokeColor(borderColor).stroke();

  // Teacher Image inside Personal Info Box
  if (teacher.profileImage) {
    const cleanPath = teacher.profileImage.startsWith('/') ? teacher.profileImage.substring(1) : teacher.profileImage;
    const profileImagePath = path.join(__dirname, '..', cleanPath);
    if (fs.existsSync(profileImagePath)) {
      doc.save();
      doc.roundedRect(330, cy + 8, 60, 60, 6).lineWidth(0.5).strokeColor(borderColor).stroke();
      doc.roundedRect(330, cy + 8, 60, 60, 6).clip();
      doc.image(profileImagePath, 330, cy + 8, { width: 60, height: 60 });
      doc.restore();
    }
  }

  doc.fillColor(darkTextColor).font('Helvetica').fontSize(7);
  let rowY = cy + 6;
  const col1 = 25;
  const col2 = 200; // Shifted slightly left to make room for image

  // Row 1: ID & Guardian Name
  doc.font('Helvetica-Bold').text("I.D :", col1, rowY).font('Helvetica').text(teacher.teacherId || 'N/A', col1 + 75, rowY);
  doc.font('Helvetica-Bold').text("D/O, S/O, W/O :", col2, rowY).font('Helvetica').text(teacher.guardianName || 'N/A', col2 + 75, rowY, { width: 50 });
  
  // Row 2: Name & DOB
  rowY += 15;
  doc.font('Helvetica-Bold').text("Name :", col1, rowY).font('Helvetica').text(teacher.fullName || 'N/A', col1 + 75, rowY);
  doc.font('Helvetica-Bold').text("D.O.B :", col2, rowY).font('Helvetica').text(formatDate(teacher.dob), col2 + 75, rowY);
  
  // Row 3: CNIC & Designation
  rowY += 15;
  doc.font('Helvetica-Bold').text("CNIC # :", col1, rowY).font('Helvetica').text(teacher.cnic || 'N/A', col1 + 75, rowY);
  doc.font('Helvetica-Bold').text("DESIGNATION :", col2, rowY).font('Helvetica').text(teacher.department || 'Teacher', col2 + 75, rowY);
  
  // Row 4: Cell & June/July Status
  rowY += 15;
  doc.font('Helvetica-Bold').text("CELL # :", col1, rowY).font('Helvetica').text(teacher.phone || 'N/A', col1 + 75, rowY);
  doc.font('Helvetica-Bold').text("June / July Status :", col2, rowY).font('Helvetica').text("NO", col2 + 75, rowY);
  
  // Row 5: Address & Age
  rowY += 15;
  doc.font('Helvetica-Bold').text("ADDRESS :", col1, rowY).font('Helvetica').text(teacher.address || 'N/A', col1 + 75, rowY, { width: 110 });
  doc.font('Helvetica-Bold').text("AGE :", col2, rowY).font('Helvetica').text(`${age.years} Y, ${age.months} M, ${age.days} D`, col2 + 75, rowY);
  
  // Row 6: Qualifications & Joining Date
  rowY += 15;
  const quals = [teacher.academicQualification, teacher.professionalQualification].filter(Boolean).join(' / ') || 'N/A';
  doc.font('Helvetica-Bold').text("QUALIFICATIONS :", col1, rowY).font('Helvetica').text(quals, col1 + 75, rowY);
  doc.font('Helvetica-Bold').text("D.O.JOINING :", col2, rowY).font('Helvetica').text(formatDate(teacher.joiningDate), col2 + 75, rowY);

  // Row 7: Service Length
  rowY += 15;
  doc.font('Helvetica-Bold').text("SERVICE LENGTH :", col2, rowY).font('Helvetica').text(`${service.years} Y, ${service.months} M, ${service.days} D`, col2 + 75, rowY);

  // --- Section 2: Attendance ---
  cy += 116;
  doc.rect(20, cy, 380, 14).fill(lightBg);
  doc.fillColor(secondaryColor).font('Helvetica-Bold').fontSize(8).text("ATTENDANCE OF THE MONTH", 25, cy + 3);
  
  cy += 14;
  doc.rect(20, cy, 380, 36).lineWidth(0.5).strokeColor(borderColor).stroke();
  
  rowY = cy + 6;
  doc.fillColor(darkTextColor).font('Helvetica').fontSize(7);
  doc.font('Helvetica-Bold').text("Working Days :", col1, rowY).font('Helvetica').text(salaryData.totalWorkingDays.toString(), col1 + 75, rowY);
  doc.font('Helvetica-Bold').text("Presents :", 160, rowY).font('Helvetica').text(salaryData.presentDays.toString(), 160 + 50, rowY);
  doc.font('Helvetica-Bold').text("Absents :", 290, rowY).font('Helvetica').text(salaryData.absentDays.toString(), 290 + 45, rowY);

  rowY += 15;
  doc.font('Helvetica-Bold').text("Late Days :", col1, rowY).font('Helvetica').text(salaryData.lateDays.toString(), col1 + 75, rowY);
  doc.font('Helvetica-Bold').text("Late Absents :", 160, rowY).font('Helvetica').text((salaryData.absenceDueToLate || 0).toString(), 160 + 60, rowY);
  doc.font('Helvetica-Bold').text("Total Absents :", 290, rowY).font('Helvetica').text((salaryData.absentDays + (salaryData.absenceDueToLate || 0)).toString(), 290 + 65, rowY);

  // --- Section 3: Allowances & Deductions ---
  cy += 42;
  const cardWidth = 185;
  const colLeft = 20;
  const colRight = 215;

  // Left card (Allowances)
  doc.rect(colLeft, cy, cardWidth, 14).fill(lightBg);
  doc.fillColor(secondaryColor).font('Helvetica-Bold').fontSize(7.5).text("ALLOWANCES CALCULATION", colLeft + 5, cy + 3);
  
  doc.rect(colLeft, cy + 14, cardWidth, 50).lineWidth(0.5).strokeColor(borderColor).stroke();
  doc.fillColor(darkTextColor).font('Helvetica').fontSize(7);
  doc.text("Regularity Allowance :", colLeft + 5, cy + 22).text(`Rs. ${salaryData.attendanceAllowance || 0}`, colLeft + 110, cy + 22, { align: 'right', width: 65 });
  doc.text("Punctuality Allowance :", colLeft + 5, cy + 36).text(`Rs. ${salaryData.punctualityAllowance || 0}`, colLeft + 110, cy + 36, { align: 'right', width: 65 });
  doc.font('Helvetica-Bold').text("Total Allowance :", colLeft + 5, cy + 50).text(`Rs. ${salaryData.totalAllowance}`, colLeft + 110, cy + 50, { align: 'right', width: 65 });

  // Right card (Deductions)
  doc.rect(colRight, cy, cardWidth, 14).fill('#fef2f2'); // soft red background
  doc.fillColor('#991b1b').font('Helvetica-Bold').fontSize(7.5).text("DEDUCTIONS", colRight + 5, cy + 3);
  
  doc.rect(colRight, cy + 14, cardWidth, 50).lineWidth(0.5).strokeColor('#fca5a5').stroke();
  doc.fillColor(darkTextColor).font('Helvetica').fontSize(7);
  const absentDeductVal = salaryData.absenceDeduction + salaryData.lateAbsenceDeduction;
  doc.text("Absents Amount :", colRight + 5, cy + 22).text(`Rs. ${absentDeductVal}`, colRight + 110, cy + 22, { align: 'right', width: 65 });
  doc.text("Advance / Other :", colRight + 5, cy + 36).text(`Rs. ${salaryData.advance}`, colRight + 110, cy + 36, { align: 'right', width: 65 });
  doc.font('Helvetica-Bold').text("Total Deductions :", colRight + 5, cy + 50).text(`Rs. ${salaryData.totalDeductions}`, colRight + 110, cy + 50, { align: 'right', width: 65 });

  // --- Section 4: Salary Calculations ---
  cy += 70;
  doc.rect(20, cy, 380, 14).fill(lightBg);
  doc.fillColor(secondaryColor).font('Helvetica-Bold').fontSize(8).text("SALARY CALCULATIONS", 25, cy + 3);
  
  cy += 14;
  doc.rect(20, cy, 380, 100).lineWidth(0.5).strokeColor(borderColor).stroke();

  rowY = cy + 6;
  doc.fillColor(darkTextColor).font('Helvetica').fontSize(7.5);
  doc.font('Helvetica-Bold').text("Basic Salary of the Month :", col1, rowY).font('Helvetica').text(`Rs. ${salaryData.basicSalary}   /=`, col1 + 120, rowY);
  
  // Per day salary box
  doc.roundedRect(300, rowY - 3, 90, 14, 2).fill(primaryColor);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(7).text(`Per Day: Rs. ${salaryData.perDaySalary}`, 300, rowY, { width: 90, align: 'center' });

  doc.fillColor(darkTextColor).font('Helvetica').fontSize(7.5);
  rowY += 15;
  doc.text("(-) Total Deductions :", col1, rowY).text(`Rs. ${salaryData.totalDeductions}   /=`, col1 + 120, rowY);
  
  rowY += 15;
  doc.font('Helvetica-Bold').text("Gross Salary :", col1, rowY).font('Helvetica').text(`Rs. ${salaryData.grossPay}   /=`, col1 + 120, rowY);
  
  rowY += 15;
  doc.text("(+) Total Allowances :", col1, rowY).text(`Rs. ${salaryData.totalAllowance}   /=`, col1 + 120, rowY);
  
  rowY += 15;
  const jjSalary = (salaryData.juneSalary || 0) + (salaryData.julySalary || 0);
  doc.text("(+) June / July Salary :", col1, rowY).text(`Rs. ${jjSalary > 0 ? jjSalary : '0'}   /=`, col1 + 120, rowY);
  // Highlight payable amount banner
  rowY += 15;
  doc.roundedRect(col1 - 3, rowY - 3, 360, 18, 3).fill(primaryColor);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5).text("Net Payable Salary Amount :", col1, rowY);
  doc.text(`Rs. ${salaryData.payableSalary}   /=`, 270, rowY, { align: 'right', width: 90 });

  // Principal Signature — fixed at bottom of A5
  if (fs.existsSync(signaturePath)) {
    doc.image(signaturePath, 305, 515, { width: 55 }); 
  }
  doc.fillColor(mutedTextColor).font('Helvetica').fontSize(7);
  doc.moveTo(270, 545).lineTo(370, 545).lineWidth(0.5).strokeColor(mutedTextColor).stroke();
  doc.text("Principal Signature", 290, 550);

  // Footer notes — fixed at very bottom
  doc.fontSize(6).fillColor('#94a3b8');
  doc.text("Generated via Sir Solomon's School Management System", 20, 565, { align: 'center', width: 380 });
  doc.font('Helvetica-Bold').text(professionalNote, 20, 575, { align: 'center', width: 380 });
  
  // Outer border
  doc.rect(15, 15, 390, 580).lineWidth(1.5).strokeColor(primaryColor).stroke();

  doc.end();
};

export const generateReportCardPDF = (studentData, results, res) => {
  const doc = new PDFDocument({ size: 'A5', margins: { top: 20, bottom: -1000, left: 20, right: 20 } });
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=report-card-${studentData.rollNumber}.pdf`);
  doc.pipe(res);

  buildHeader(doc, 'Student Report Card');

  let currentY = 100;
  // Student Details
  doc
    .font('Helvetica')
    .fontSize(9)
    .text(`Name: ${studentData.fullName}`, 20, currentY)
    .text(`Roll Number: ${studentData.rollNumber}`, 20, currentY + 15)
    .text(`Class: ${studentData.class?.className || 'N/A'} - ${studentData.section || ''}`, 20, currentY + 30);

  currentY += 55;
  
  // Table Header
  doc.font('Helvetica-Bold').fontSize(8);
  doc.text('Subject', 30, currentY);
  doc.text('Total Marks', 150, currentY);
  doc.text('Obtained', 230, currentY);
  doc.text('%', 300, currentY);
  doc.text('Grade', 350, currentY);
  
  currentY += 15;
  doc.font('Helvetica');

  let grandTotal = 0;
  let totalObtained = 0;

  results.forEach(result => {
    doc.text(result.exam?.subject?.name || 'Unknown', 30, currentY);
    doc.text(result.totalMarks.toString(), 150, currentY);
    doc.text(result.marksObtained.toString(), 230, currentY);
    doc.text(result.percentage?.toFixed(2) || '0.00', 300, currentY);
    doc.text(result.grade || 'N/A', 350, currentY);
    
    grandTotal += result.totalMarks;
    totalObtained += result.marksObtained;
    currentY += 15;
  });

  currentY += 10;
  const overallPercentage = grandTotal > 0 ? (totalObtained / grandTotal) * 100 : 0;
  
  doc.font('Helvetica-Bold');
  doc.text('Overall Performance:', 30, currentY);
  currentY += 15;
  doc.font('Helvetica');
  doc.text(`Total Marks: ${totalObtained} / ${grandTotal}`, 30, currentY);
  currentY += 15;
  doc.text(`Percentage: ${overallPercentage.toFixed(2)}%`, 30, currentY);

  // Signatures directly below content
  currentY += 45;
  doc.moveTo(280, currentY).lineTo(380, currentY).lineWidth(0.5).strokeColor('#000000').stroke();
  doc.fontSize(8).fillColor('#000000').text("Principal Signature", 300, currentY + 4);
  if (fs.existsSync(signaturePath)) {
    doc.image(signaturePath, 300, currentY - 35, { width: 55 });
  }

  // Footer note directly below signature
  doc.fontSize(6).fillColor('#94a3b8');
  doc.text("Generated via Sir Solomon's School Management System", 20, currentY + 25, { align: 'center', width: 380 });
  doc.font('Helvetica-Bold').text(professionalNote, 20, currentY + 35, { align: 'center', width: 380 });
  
  // Outer border matching dynamic height
  doc.rect(15, 15, 390, currentY + 45).lineWidth(1.5).strokeColor('#3b82f6').stroke();

  doc.end();
};

export const generateFeeReceiptPDF = (feeData, res) => {
  const doc = new PDFDocument({ size: 'A5', margins: { top: 20, bottom: -1000, left: 20, right: 20 } });
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=fee-receipt-${feeData.receiptNumber}.pdf`);
  doc.pipe(res);

  buildHeader(doc, 'Fee Receipt', `Receipt #: ${feeData.receiptNumber}`);

  let currentY = 100;
  doc
    .font('Helvetica')
    .fontSize(9)
    .text(`Date: ${feeData.paidDate ? new Date(feeData.paidDate).toLocaleDateString() : new Date().toLocaleDateString()}`, 20, currentY)
    .text(`Student: ${feeData.student.fullName}`, 20, currentY + 15)
    .text(`Roll Number: ${feeData.student.rollNumber}`, 20, currentY + 30)
    .text(`Class: ${feeData.class?.className || 'N/A'}`, 20, currentY + 45)
    .text(`Fee For: ${getMonthName(feeData.month)} ${feeData.year}`, 20, currentY + 60);

  currentY += 90;
  
  const drawRow = (y, label, value, isBold = false) => {
    if (isBold) doc.font('Helvetica-Bold');
    else doc.font('Helvetica');
    doc.text(label, 30, y).text(value.toString(), 220, y, { width: 80, align: 'right' });
  };

  drawRow(currentY, 'Base Amount', feeData.amount);
  drawRow(currentY + 15, 'Discount', `-${feeData.discount}`);
  drawRow(currentY + 30, 'Scholarship', `-${feeData.scholarship}`);
  
  doc.rect(30, currentY + 50, 270, 22).fill('#e0f2fe');
  doc.fillColor('#1e3a8a');
  drawRow(currentY + 57, 'NET PAID', feeData.netAmount, true);

  const finalY = currentY + 100;
  doc.moveTo(280, finalY).lineTo(380, finalY).lineWidth(0.5).strokeColor('#000000').stroke();
  doc.fontSize(8).fillColor('#000000').text("Principal Signature", 300, finalY + 4);
  if (fs.existsSync(signaturePath)) {
    doc.image(signaturePath, 300, finalY - 35, { width: 55 });
  }

  // Footer note
  doc.fontSize(6).fillColor('#94a3b8');
  doc.text("Generated via Sir Solomon's School Management System", 20, finalY + 25, { align: 'center', width: 380 });
  doc.font('Helvetica-Bold').text(professionalNote, 20, finalY + 35, { align: 'center', width: 380 });
  
  // Outer border matching dynamic height
  doc.rect(15, 15, 390, finalY + 45).lineWidth(1.5).strokeColor('#8b5cf6').stroke();

  doc.end();
};

function getMonthName(monthNumber) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[monthNumber - 1] || 'Unknown';
}
