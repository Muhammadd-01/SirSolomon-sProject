export const ROLES = {
  PRINCIPAL: 'principal',
  TEACHER: 'teacher',
  STUDENT: 'student'
};

export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  HALF_DAY: 'halfDay',
  LEAVE: 'leave',
  HOLIDAY: 'holiday'
};

export const SALARY_STATUS = {
  PAID: 'paid',
  PENDING: 'pending',
  PROCESSING: 'processing'
};

export const FEE_STATUS = {
  PAID: 'paid',
  PENDING: 'pending',
  OVERDUE: 'overdue'
};

export const GRADE_SCALE = [
  { grade: 'A+', minMarks: 90 },
  { grade: 'A', minMarks: 85 },
  { grade: 'A-', minMarks: 80 },
  { grade: 'B+', minMarks: 75 },
  { grade: 'B', minMarks: 70 },
  { grade: 'B-', minMarks: 65 },
  { grade: 'C+', minMarks: 60 },
  { grade: 'C', minMarks: 55 },
  { grade: 'D', minMarks: 50 },
  { grade: 'F', minMarks: 0 }
];
