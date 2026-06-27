import { GRADE_SCALE } from '../config/constants.js';

export const calculateGrade = (percentage) => {
  for (const gradeObj of GRADE_SCALE) {
    if (percentage >= gradeObj.minMarks) {
      return gradeObj.grade;
    }
  }
  return 'F';
};

const gpaMapping = {
  'A+': 4.0,
  'A': 4.0,
  'A-': 3.7,
  'B+': 3.3,
  'B': 3.0,
  'B-': 2.7,
  'C+': 2.3,
  'C': 2.0,
  'D': 1.0,
  'F': 0.0,
};

export const calculateCGPA = (results) => {
  if (!results || results.length === 0) return 0.0;
  
  let totalPoints = 0;
  let validResultsCount = 0;

  results.forEach(result => {
    if (result.grade && gpaMapping[result.grade] !== undefined) {
      totalPoints += gpaMapping[result.grade];
      validResultsCount++;
    }
  });

  if (validResultsCount === 0) return 0.0;
  return Number((totalPoints / validResultsCount).toFixed(2));
};
