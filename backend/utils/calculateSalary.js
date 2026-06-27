export const calculateSalary = ({
  basicSalary = 0,
  totalWorkingDays = 30,
  absences = 0,
  lates = 0,
  advance = 0,
  juneSalary = 0,
  julySalary = 0,
  bonus = 0,
  customComponents = [], // [{name, type, amount, isPercentage}]
  taxPercentage = 0
}) => {
  const perDaySalary = Math.round(basicSalary / totalWorkingDays);

  // Deductions
  const absenceDeduction = absences * perDaySalary;
  const absenceDueToLate = Math.floor(lates / 4);
  const lateAbsenceDeduction = absenceDueToLate * perDaySalary;
  const totalDeductions = absenceDeduction + lateAbsenceDeduction + advance;

  // Gross Pay
  const grossPay = basicSalary - totalDeductions;

  // Allowances (built-in)
  const attendanceAllowance = absences === 0 ? 150 : 0;
  const punctualityAllowance = lates < 4 ? 150 : 0;

  // Custom salary components
  let customAdditions = 0;
  let customDeductions = 0;
  const appliedComponents = [];

  customComponents.forEach(comp => {
    const amount = comp.isPercentage
      ? Math.round((basicSalary * comp.amount) / 100)
      : comp.amount;

    appliedComponents.push({
      name: comp.name,
      type: comp.type,
      originalAmount: comp.amount,
      isPercentage: comp.isPercentage,
      calculatedAmount: amount
    });

    if (comp.type === 'addition') {
      customAdditions += amount;
    } else {
      customDeductions += amount;
    }
  });

  const totalAllowance = attendanceAllowance + punctualityAllowance + customAdditions;

  // Net Pay
  const netPay = grossPay + totalAllowance - customDeductions;

  // Tax
  const taxAmount = taxPercentage > 0 ? Math.round((grossPay * taxPercentage) / 100) : 0;

  // Additions
  const totalAdditions = juneSalary + julySalary + bonus;

  // Payable Salary
  const payableSalary = netPay + totalAdditions - taxAmount;

  return {
    perDaySalary,
    absenceDeduction,
    absenceDueToLate,
    lateAbsenceDeduction,
    totalDeductions,
    grossPay,
    attendanceAllowance,
    punctualityAllowance,
    customAdditions,
    customDeductions,
    appliedComponents,
    totalAllowance,
    netPay,
    taxAmount,
    totalAdditions,
    payableSalary
  };
};
