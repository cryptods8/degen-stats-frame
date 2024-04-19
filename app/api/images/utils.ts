const DAY_MILLIS = 24 * 60 * 60 * 1000;

export function getDailyAllowanceStart(): Date {
  const now = new Date();
  let allowanceStart = new Date();
  allowanceStart.setUTCHours(7, 35, 0, 0);
  if (allowanceStart.getTime() > now.getTime()) {
    allowanceStart = new Date(allowanceStart.getTime() - DAY_MILLIS);
  }
  return allowanceStart;
}
