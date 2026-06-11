import { endOfDay, endOfMonth, format, parseISO, startOfMonth } from 'date-fns';

export type PeriodFilterMode = 'day' | 'month' | 'custom';

export interface PeriodRange {
  from: Date;
  to: Date;
  fromKey: string;
  toKey: string;
  label: string;
}

export const todayKey = () => format(new Date(), 'yyyy-MM-dd');
export const currentMonthKey = () => format(new Date(), 'yyyy-MM');

export function currentMonthRange() {
  const now = new Date();
  return {
    from: startOfMonth(now),
    to: endOfMonth(now),
    label: format(now, 'MMMM yyyy'),
  };
}

export function formatRangeLabel(from: Date, to: Date) {
  if (format(from, 'yyyy-MM-dd') === format(to, 'yyyy-MM-dd')) {
    return format(from, 'dd MMM yyyy');
  }

  return `${format(from, 'dd MMM yyyy')} - ${format(to, 'dd MMM yyyy')}`;
}

export function getPeriodRange(
  filterMode: PeriodFilterMode,
  selectedDay: string,
  selectedMonth: string,
  customFrom: string,
  customTo: string,
): PeriodRange {
  if (filterMode === 'day') {
    const day = parseISO(selectedDay || todayKey());
    return {
      from: day,
      to: endOfDay(day),
      fromKey: format(day, 'yyyy-MM-dd'),
      toKey: format(day, 'yyyy-MM-dd'),
      label: format(day, 'dd MMM yyyy'),
    };
  }

  if (filterMode === 'custom') {
    const start = parseISO(customFrom || customTo || todayKey());
    const end = parseISO(customTo || customFrom || todayKey());
    const from = start <= end ? start : end;
    const to = start <= end ? endOfDay(end) : endOfDay(start);

    return {
      from,
      to,
      fromKey: format(from, 'yyyy-MM-dd'),
      toKey: format(to, 'yyyy-MM-dd'),
      label: formatRangeLabel(from, to),
    };
  }

  const month = selectedMonth || currentMonthKey();
  const from = startOfMonth(parseISO(`${month}-01`));
  const to = endOfMonth(from);

  return {
    from,
    to,
    fromKey: format(from, 'yyyy-MM-dd'),
    toKey: format(to, 'yyyy-MM-dd'),
    label: format(from, 'MMMM yyyy'),
  };
}

export function inPeriodRange(date: string, range: PeriodRange) {
  const value = parseISO(date);
  return value >= range.from && value <= range.to;
}
