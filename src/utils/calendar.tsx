const isLeapYear = (year: number) =>
  year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0);

export const daysOfAYear = (year: number) => (isLeapYear(year) ? 366 : 365);
