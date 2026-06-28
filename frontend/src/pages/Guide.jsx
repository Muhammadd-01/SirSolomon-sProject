import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHome, FiUsers, FiClipboard, FiDollarSign, FiBarChart2, FiSettings, FiUser, FiChevronDown, FiBookOpen, FiInfo } from 'react-icons/fi';

const guideData = [
  {
    icon: FiHome,
    title: 'Dashboard',
    color: 'emerald',
    bgColor: 'bg-emerald-100 dark:bg-emerald-500/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    tips: [
      'Your command center — see everything at a glance.',
      'View total teachers, today\'s attendance summary, and recent salary activity.',
      'Use the stat cards at the top for quick insights like total staff, present today, and pending salaries.',
      'The dashboard updates in real-time as you navigate and make changes.',
    ]
  },
  {
    icon: FiUsers,
    title: 'Manage Teachers',
    color: 'blue',
    bgColor: 'bg-blue-100 dark:bg-blue-500/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
    tips: [
      'Add, edit, or remove teachers from the system.',
      'Fill in their complete profile — CNIC, qualifications, phone number, bank details, and profile photo.',
      'Use the status filter (Active / Suspended / Left) to quickly find teachers.',
      'Mark a teacher as "Left" instead of deleting them — this keeps all their salary and attendance records safe.',
      'The teacher\'s profile image will automatically appear on their salary slips.',
    ]
  },
  {
    icon: FiClipboard,
    title: 'Attendance Management',
    color: 'amber',
    bgColor: 'bg-amber-100 dark:bg-amber-500/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
    tips: [
      'Mark daily attendance for all teachers and staff.',
      'Select the date, then choose Present, Absent, Late, or Leave for each person.',
      'Use the bulk actions toolbar to quickly mark everyone as Present or Absent.',
      'The system automatically calculates late penalties and absence deductions when generating salary.',
      'You can go back and edit attendance for past dates if needed.',
    ]
  },
  {
    icon: FiDollarSign,
    title: 'Salary Management',
    color: 'green',
    bgColor: 'bg-green-100 dark:bg-green-500/20',
    iconColor: 'text-green-600 dark:text-green-400',
    tips: [
      'Select the month and year, check the teachers you want, and click "Calculate".',
      'The system automatically applies attendance-based deductions, allowances, and additions.',
      'Download individual salary slips as professional A5 PDF documents.',
      'Click the WhatsApp button to send salary details — the PDF slip downloads automatically for you to attach.',
      'Export everything to Excel for your records.',
      'Need to recalculate? Just delete the record and generate it again.',
    ]
  },
  {
    icon: FiBarChart2,
    title: 'Reports & Analytics',
    color: 'purple',
    bgColor: 'bg-purple-100 dark:bg-purple-500/20',
    iconColor: 'text-purple-600 dark:text-purple-400',
    tips: [
      'Generate detailed reports for attendance patterns and salary summaries.',
      'Download reports as professional PDF documents with the school letterhead.',
      'All reports include the principal\'s signature and official formatting automatically.',
      'Use reports for record-keeping, audits, or sharing with management.',
    ]
  },
  {
    icon: FiSettings,
    title: 'School Settings',
    color: 'slate',
    bgColor: 'bg-slate-100 dark:bg-slate-500/20',
    iconColor: 'text-slate-600 dark:text-slate-400',
    tips: [
      'Configure your school\'s name, address, and contact details.',
      'Manage salary components — basic pay, allowances, and deduction rules.',
      'Set attendance policies and customize how the system calculates salaries.',
      'Changes here affect salary calculations for all teachers, so review carefully.',
    ]
  },
  {
    icon: FiUser,
    title: 'Your Profile',
    color: 'rose',
    bgColor: 'bg-rose-100 dark:bg-rose-500/20',
    iconColor: 'text-rose-600 dark:text-rose-400',
    tips: [
      'Update your personal information and profile picture.',
      'Change your password anytime for security.',
      'Keep your contact details current for accurate school records.',
    ]
  },
];

export default function Guide() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-4">
          <FiBookOpen className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white font-display mb-2">
          Principal's Guide
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Everything you need to know about managing your school system — explained simply.
        </p>
      </motion.div>

      {/* Accordion */}
      <div className="space-y-3">
        {guideData.map((item, idx) => {
          const Icon = item.icon;
          const isOpen = openIndex === idx;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <button
                onClick={() => toggle(idx)}
                className="w-full flex items-center gap-4 p-4 text-left focus:outline-none"
              >
                <div className={`w-10 h-10 rounded-xl ${item.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${item.iconColor}`} />
                </div>
                <span className="flex-1 text-base font-semibold text-slate-800 dark:text-white font-display">
                  {item.title}
                </span>
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FiChevronDown className="w-5 h-5 text-slate-400" />
                </motion.div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pl-[72px]">
                      <ul className="space-y-2">
                        {item.tips.map((tip, tIdx) => (
                          <li key={tIdx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0"></span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Tip Box */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-5"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <FiInfo className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-1">Quick Tips</h3>
            <ul className="text-sm text-emerald-700 dark:text-emerald-400 space-y-1">
              <li>• Collapse the sidebar by clicking the arrow button on the left edge for more workspace.</li>
              <li>• Use the dark mode toggle in the top header for comfortable nighttime viewing.</li>
              <li>• All documents (slips, reports) are generated with your school logo and principal signature automatically.</li>
              <li>• The system remembers your preferences — no need to reconfigure every time you log in.</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
