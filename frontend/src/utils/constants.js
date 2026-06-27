export const ROLES = {
  PRINCIPAL: 'principal',
  TEACHER: 'teacher'
};

export const NAV_ITEMS = {
  principal: [
    { title: 'Dashboard', path: '/dashboard', icon: 'HiOutlineHome' },
    { title: 'Teachers', path: '/teachers', icon: 'HiOutlineUsers' },
    { title: 'Attendance', path: '/attendance', icon: 'HiOutlineClipboardCheck' },
    { title: 'Salary', path: '/salary', icon: 'HiOutlineCurrencyDollar' },
    { title: 'Notices', path: '/notices', icon: 'HiOutlineSpeakerphone' },
    { title: 'Reports', path: '/reports', icon: 'HiOutlineChartBar' },
    { title: 'Settings', path: '/settings', icon: 'HiOutlineCog' }
  ],
  teacher: [
    { title: 'Dashboard', path: '/dashboard', icon: 'HiOutlineHome' },
    { title: 'Attendance', path: '/attendance', icon: 'HiOutlineClipboardCheck' },
    { title: 'My Salary', path: '/salary', icon: 'HiOutlineCurrencyDollar' },
    { title: 'Notices', path: '/notices', icon: 'HiOutlineSpeakerphone' }
  ]
};
