import { useState } from 'react';
import Card, { CardBody } from '../components/ui/Card';
import { FiPieChart, FiBarChart2, FiTrendingUp, FiDownload } from 'react-icons/fi';
import Button from '../components/ui/Button';

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white font-display">Reports & Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Generate and download comprehensive school reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Attendance Report Card */}
        <Card glass hover>
          <CardBody className="p-6">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-4">
              <FiPieChart className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Attendance Report</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-2">
              Detailed attendance statistics for students and teachers across any date range.
            </p>
            <Button className="w-full" leftIcon={<FiDownload />} variant="secondary">
              Generate Report
            </Button>
          </CardBody>
        </Card>

        {/* Financial Report Card */}
        <Card glass hover>
          <CardBody className="p-6">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-4">
              <FiTrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Financial Report</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-2">
              Revenue from fees versus expenses from payroll. Download income statements.
            </p>
            <Button className="w-full" leftIcon={<FiDownload />} variant="secondary">
              Generate Report
            </Button>
          </CardBody>
        </Card>

        {/* Academic Report Card */}
        <Card glass hover>
          <CardBody className="p-6">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center mb-4">
              <FiBarChart2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Academic Report</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-2">
              Class-wise performance analytics, top students, and average grade distributions.
            </p>
            <Button className="w-full" leftIcon={<FiDownload />} variant="secondary">
              Generate Report
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
