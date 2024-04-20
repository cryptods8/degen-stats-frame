export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getDailyAllowanceStart(): Date {
  const now = new Date();
  let allowanceStart = new Date(now);
  allowanceStart.setUTCHours(7, 35, 0, 0);
  if (allowanceStart.getTime() > now.getTime()) {
    allowanceStart = addDays(allowanceStart, -1);
  }
  return allowanceStart;
}
