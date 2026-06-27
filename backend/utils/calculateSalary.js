export const calculateSalary = ({
  basicSalary = 0,
  allowances = 0,
  bonuses = 0,
  vacationPay = 0,
  overtimeHours = 0,
  overtimeRate = 0,
  taxPercent = 0,
  leaveDeductions = 0,
  lateDeductions = 0,
  advance = 0
}) => {
  const overtimeTotal = overtimeHours * overtimeRate;
  const grossSalary = basicSalary + allowances + bonuses + vacationPay + overtimeTotal;
  
  const tax = (grossSalary * taxPercent) / 100;
  
  const netSalary = grossSalary - tax - leaveDeductions - lateDeductions - advance;

  return {
    grossSalary,
    netSalary,
    tax,
    overtimeTotal,
  };
};
