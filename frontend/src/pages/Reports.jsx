import { useState, useRef } from 'react';
import Card, { CardBody } from '../components/ui/Card';
import { FiPieChart, FiBarChart2, FiTrendingUp, FiDownload, FiChevronDown, FiFileText } from 'react-icons/fi';
import Button from '../components/ui/Button';
import useClickOutside from '../hooks/useClickOutside';
import api from '../services/api';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ReportCard = ({ title, description, icon, onDownload, isLoading }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setIsOpen(false));

  return (
    <Card glass hover>
      <CardBody className="p-6 relative">
        <div className="w-12 h-12 bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400 rounded-xl flex items-center justify-center mb-4">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 h-10">
          {description}
        </p>
        <div className="relative w-full" ref={ref}>
          <Button 
            className="w-full flex justify-between items-center" 
            variant="secondary"
            onClick={() => setIsOpen(!isOpen)}
            isLoading={isLoading}
          >
            <span className="flex items-center gap-2"><FiDownload /> Generate Report</span>
            <FiChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
          
          {isOpen && (
            <div className="absolute z-10 w-full mt-2 bg-white dark:bg-dark-800 rounded-xl shadow-xl border border-slate-200 dark:border-white/10 overflow-hidden animate-slide-down origin-top">
              <button onClick={() => { setIsOpen(false); onDownload('csv'); }} className="w-full px-4 py-3 text-sm text-left flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-dark-700 text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-white/5 transition-colors">
                <FiFileText /> Download CSV
              </button>
              <button onClick={() => { setIsOpen(false); onDownload('excel'); }} className="w-full px-4 py-3 text-sm text-left flex items-center gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-b border-slate-100 dark:border-white/5 transition-colors">
                <FiFileText /> Download Excel
              </button>
              <button onClick={() => { setIsOpen(false); onDownload('pdf'); }} className="w-full px-4 py-3 text-sm text-left flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-700 dark:text-red-400 transition-colors">
                <FiFileText /> Download PDF
              </button>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default function Reports() {
  const [loadingType, setLoadingType] = useState(null);

  const generateCSV = (data, filename) => {
    if (!data || data.length === 0) {
      toast.info('No data available for this report.');
      return;
    }
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateExcel = (data, filename) => {
    if (!data || data.length === 0) {
      toast.info('No data available for this report.');
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const generatePDF = (data, filename, title) => {
    if (!data || data.length === 0) {
      toast.info('No data available for this report.');
      return;
    }
    const doc = new jsPDF({ format: 'a5' });
    
    // SirSolomon Branding
    doc.setFontSize(16);
    doc.setTextColor(16, 185, 129); // Emerald
    doc.text("SirSolomon's School & College", 14, 15);
    
    // Report Title
    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.text(title, 14, 22);
    
    const headers = Object.keys(data[0]);
    const body = data.map(row => headers.map(h => row[h]));
    
    doc.autoTable({
      head: [headers],
      body: body,
      startY: 28,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [16, 185, 129] } // Emerald 500
    });
    
    doc.save(`${filename}.pdf`);
  };

  const downloadReport = (format, data, filename, title) => {
    if (format === 'csv') generateCSV(data, filename);
    else if (format === 'excel') generateExcel(data, filename);
    else if (format === 'pdf') generatePDF(data, filename, title);
    toast.success(`${title} downloaded successfully in ${format.toUpperCase()} format.`);
  };

  const handleAttendanceDownload = async (format) => {
    setLoadingType('attendance');
    try {
      const res = await api.get('/reports/attendance');
      const formattedData = res.data.data.map(a => ({
        Date: new Date(a.date).toLocaleDateString(),
        Role: a.role.charAt(0).toUpperCase() + a.role.slice(1),
        Name: a.user?.name || 'Unknown',
        Status: a.status.replace('_', ' ').toUpperCase(),
        CheckIn: a.checkInTime || '-'
      }));
      downloadReport(format, formattedData, 'Attendance_Report', 'School Attendance Report');
    } catch (err) {
      toast.error('Failed to fetch attendance data');
    } finally {
      setLoadingType(null);
    }
  };

  const handleFinancialDownload = async (format) => {
    setLoadingType('financial');
    try {
      const res = await api.get('/reports/financial');
      const data = res.data.data;
      const formattedData = [
        { Metric: 'Total Revenue (Fees Collected)', Amount: `$${data.totalRevenue.toLocaleString()}` },
        { Metric: 'Total Expenses (Salaries Paid)', Amount: `$${data.totalExpenses.toLocaleString()}` },
        { Metric: 'Net Profit', Amount: `$${data.netProfit.toLocaleString()}` }
      ];
      downloadReport(format, formattedData, 'Financial_Report', 'School Financial Overview');
    } catch (err) {
      toast.error('Failed to fetch financial data');
    } finally {
      setLoadingType(null);
    }
  };

  const handleAcademicDownload = async (format) => {
    setLoadingType('academic');
    try {
      const res = await api.get('/reports/academic');
      if(res.data.data.length === 0) {
        toast.info("No academic results found in the system.");
        setLoadingType(null);
        return;
      }
      const formattedData = res.data.data.map(r => ({
        Student: r.studentName,
        AdmissionNo: r.admissionNumber,
        Class: r.className,
        Subject: r.subject,
        Exam: r.examTitle,
        Obtained: r.marksObtained,
        Total: r.totalMarks,
        Percentage: r.percentage + '%',
        Grade: r.grade
      }));
      downloadReport(format, formattedData, 'Academic_Report', 'Academic Performance Report');
    } catch (err) {
      toast.error('Failed to fetch academic data');
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white font-display">Reports & Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Generate and download comprehensive school reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ReportCard 
          title="Attendance Report"
          description="Detailed attendance statistics for students and teachers across any date range."
          icon={<FiPieChart className="w-6 h-6 text-blue-500" />}
          isLoading={loadingType === 'attendance'}
          onDownload={handleAttendanceDownload}
        />
        
        <ReportCard 
          title="Financial Report"
          description="Revenue from fees versus expenses from payroll. Download income statements."
          icon={<FiTrendingUp className="w-6 h-6 text-emerald-500" />}
          isLoading={loadingType === 'financial'}
          onDownload={handleFinancialDownload}
        />

        <ReportCard 
          title="Academic Report"
          description="Class-wise performance analytics, top students, and average grade distributions."
          icon={<FiBarChart2 className="w-6 h-6 text-purple-500" />}
          isLoading={loadingType === 'academic'}
          onDownload={handleAcademicDownload}
        />
      </div>
    </div>
  );
}
