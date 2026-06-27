export const calculateSalary = ({
  basicSalary = 0,
  totalWorkingDays = 30,
  absences = 0,
  lates = 0,
  advance = 0,
  juneSalary = 0,
  julySalary = 0,
  bonus = 0
}) => {
  const perDaySalary = Math.round(basicSalary / totalWorkingDays);

  // Deductions
  const absenceDeduction = absences * perDaySalary;
  const absenceDueToLate = Math.floor(lates / 4);
  const lateAbsenceDeduction = absenceDueToLate * perDaySalary;
  const totalDeductions = absenceDeduction + lateAbsenceDeduction + advance;

  // Gross Pay
  const grossPay = basicSalary - totalDeductions;

  // Allowances
  const attendanceAllowance = absences === 0 ? 150 : 0;
  const punctualityAllowance = lates < 4 ? 150 : 0;
  const totalAllowance = attendanceAllowance + punctualityAllowance;

  // Net Pay
  const netPay = grossPay + totalAllowance;

  // Additions
  const totalAdditions = juneSalary + julySalary + bonus;

  // Payable Salary
  const payableSalary = netPay + totalAdditions;

  return {
    perDaySalary,
    absenceDeduction,
    absenceDueToLate,
    lateAbsenceDeduction,
    totalDeductions,
    grossPay,
    attendanceAllowance,
    punctualityAllowance,
    totalAllowance,
    netPay,
    totalAdditions,
    payableSalary
  };
};
