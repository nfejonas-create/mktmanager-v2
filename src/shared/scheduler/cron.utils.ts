import { CronExpressionParser } from 'cron-parser';

export function getNextRunAt(cronExpression: string, timezone: string, currentDate: Date = new Date()) {
  const interval = CronExpressionParser.parse(cronExpression, {
    currentDate,
    tz: timezone
  });

  return interval.next().toDate();
}
