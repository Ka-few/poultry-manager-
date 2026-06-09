import { differenceInCalendarDays, isSameMonth, parseISO, subDays } from 'date-fns';
import type { EggLog, FarmData, FeedStock, FeedUsage } from '../types/farm';

export function getDashboardMetrics(data: FarmData) {
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const activeFlocks = data.flocks.filter((flock) => flock.status === 'Active');
  const totalBirds = activeFlocks.reduce((total, flock) => total + flock.quantity, 0);
  const eggsToday = data.eggLogs
    .filter((log) => log.date === todayKey)
    .reduce((total, log) => total + log.eggsCollected, 0);
  const feedToday = data.feedUsage
    .filter((log) => log.date === todayKey)
    .reduce((total, log) => total + log.quantityKg, 0);
  const feedExpense = data.feedStock.reduce((total, stock) => total + stock.costKes, 0);
  const estimatedRevenue = data.eggLogs.reduce((total, log) => total + log.eggsCollected * 15, 0);

  return {
    totalBirds,
    activeFlocks: activeFlocks.length,
    eggsToday,
    feedToday,
    mortalityThisMonth: 0,
    revenue: estimatedRevenue,
    expenses: feedExpense,
    profit: estimatedRevenue - feedExpense,
  };
}

export function getEggTrend(logs: EggLog[]) {
  return logs
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14)
    .map((log) => ({
      date: log.date,
      eggs: log.eggsCollected,
      broken: log.brokenEggs,
    }));
}

export function getFeedTrend(stock: FeedStock[]) {
  return stock
    .slice()
    .sort((a, b) => a.datePurchased.localeCompare(b.datePurchased))
    .map((item) => ({
      date: item.datePurchased,
      cost: item.costKes,
      quantity: item.quantityKg,
    }));
}

export function getFeedOnHand(stock: FeedStock[], usage: FeedUsage[]) {
  const purchased = stock.reduce<Record<string, number>>((totals, item) => {
    totals[item.feedType] = (totals[item.feedType] ?? 0) + item.quantityKg;
    return totals;
  }, {});

  usage.forEach((item) => {
    purchased[item.feedType] = (purchased[item.feedType] ?? 0) - item.quantityKg;
  });

  return Object.entries(purchased).map(([feedType, quantityKg]) => ({ feedType, quantityKg }));
}

export function getEggInsight(logs: EggLog[]) {
  const recent = logs.filter((log) => differenceInCalendarDays(new Date(), parseISO(log.date)) <= 6);
  const previous = logs.filter((log) => {
    const days = differenceInCalendarDays(new Date(), parseISO(log.date));
    return days > 6 && days <= 13;
  });

  const recentTotal = recent.reduce((total, log) => total + log.eggsCollected, 0);
  const previousTotal = previous.reduce((total, log) => total + log.eggsCollected, 0);

  if (!previousTotal) return 'Start logging daily eggs to unlock weekly production insights.';

  const change = Math.round(((recentTotal - previousTotal) / previousTotal) * 100);
  if (change < 0) return `Egg production dropped ${Math.abs(change)}% this week.`;
  if (change > 0) return `Egg production improved ${change}% this week.`;
  return 'Egg production is steady compared with last week.';
}

export function getMonthlyFeedSpend(stock: FeedStock[]) {
  return stock
    .filter((item) => isSameMonth(parseISO(item.datePurchased), new Date()))
    .reduce((total, item) => total + item.costKes, 0);
}

export function getDailyFeedRate(usage: FeedUsage[]) {
  const recent = usage.filter((item) => parseISO(item.date) >= subDays(new Date(), 7));
  return recent.reduce((total, item) => total + item.quantityKg, 0) / Math.max(recent.length, 1);
}
