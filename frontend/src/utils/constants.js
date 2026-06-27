export const ROLES = {
  PRINCIPAL: 'principal',
  TEACHER: 'teacher',
  STUDENT: 'student'
};

export const NAV_ITEMS = {
  principal: [
    { title: 'Dashboard', path: '/dashboard', icon: 'HiOutlineHome' },
    { title: 'Teachers', path: '/teachers', icon: 'HiOutlineUsers' },
    { title: 'Students', path: '/students', icon: 'HiOutlineAcademicCap' },
    { title: 'Classes', path: '/classes', icon: 'HiOutlineBookOpen' },
    { title: 'Attendance', path: '/attendance', icon: 'HiOutlineClipboardCheck' },
    { title: 'Salary', path: '/salary', icon: 'HiOutlineCurrencyDollar' },
    { title: 'Fees', path: '/fees', icon: 'HiOutlineCreditCard' },
    { title: 'Exams', path: '/exams', icon: 'HiOutlineDocumentText' },
    { title: 'Notices', path: '/notices', icon: 'HiOutlineSpeakerphone' },
    { title: 'Reports', path: '/reports', icon: 'HiOutlineChartBar' },
    { title: 'Settings', path: '/settings', icon: 'HiOutlineCog' }
  ],
  teacher: [
    { title: 'Dashboard', path: '/dashboard', icon: 'HiOutlineHome' },
    { title: 'My Classes', path: '/classes', icon: 'HiOutlineBookOpen' },
    { title: 'Students', path: '/students', icon: 'HiOutlineAcademicCap' },
    { title: 'Attendance', path: '/attendance', icon: 'HiOutlineClipboardCheck' },
    { title: 'My Salary', path: '/salary', icon: 'HiOutlineCurrencyDollar' },
    { title: 'Exams & Marks', path: '/exams', icon: 'HiOutlineDocumentText' },
    { title: 'Notices', path: '/notices', icon: 'HiOutlineSpeakerphone' }
  ],
  student: [
    { title: 'Dashboard', path: '/dashboard', icon: 'HiOutlineHome' },
    { title: 'My Attendance', path: '/attendance', icon: 'HiOutlineClipboardCheck' },
    { title: 'My Fees', path: '/fees', icon: 'HiOutlineCreditCard' },
    { title: 'My Results', path: '/exams', icon: 'HiOutlineDocumentText' },
    { title: 'Notices', path: '/notices', icon: 'HiOutlineSpeakerphone' }
  ]
};
