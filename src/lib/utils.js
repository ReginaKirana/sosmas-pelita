import { differenceInMonths } from 'date-fns';

export function calculateAgeInMonths(birthDateStr) {
  const birthDate = new Date(birthDateStr);
  const now = new Date();
  return differenceInMonths(now, birthDate);
}

export function getAgeCategory(months) {
  if (months <= 5) return '0-5 bulan';
  if (months <= 11) return '6-11 bulan';
  if (months <= 23) return '12-23 bulan';
  if (months <= 35) return '24-35 bulan';
  return '36-60 bulan';
}
