import { differenceInCalendarDays, format, isSameMonth, parseISO, subDays } from 'date-fns';
import type { EggLog, Expense, FarmData, FeedStock, FeedUsage, Income } from '../types/farm';

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
  const mortalityThisMonth = data.mortalityLogs
    .filter((log) => isSameMonth(parseISO(log.date), today))
    .reduce((total, log) => total + log.birdsLost, 0);
  const feedExpense = data.feedStock.reduce((total, stock) => total + stock.costKes, 0);
  const estimatedRevenue = data.eggLogs.reduce((total, log) => total + log.eggsCollected * 15, 0);
  const recordedRevenue = data.income.reduce((total, item) => total + item.amountKes, 0);
  const recordedExpenses = data.expenses.reduce((total, item) => total + item.amountKes, 0);
  const revenue = recordedRevenue || estimatedRevenue;
  const expenses = recordedExpenses || feedExpense;

  return {
    totalBirds,
    activeFlocks: activeFlocks.length,
    eggsToday,
    feedToday,
    mortalityThisMonth,
    revenue,
    expenses,
    profit: revenue - expenses,
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

export function getFinanceSummary(income: Income[], expenses: Expense[]) {
  const totalIncome = income.reduce((total, item) => total + item.amountKes, 0);
  const totalExpenses = expenses.reduce((total, item) => total + item.amountKes, 0);
  const monthlyIncome = income
    .filter((item) => isSameMonth(parseISO(item.date), new Date()))
    .reduce((total, item) => total + item.amountKes, 0);
  const monthlyExpenses = expenses
    .filter((item) => isSameMonth(parseISO(item.date), new Date()))
    .reduce((total, item) => total + item.amountKes, 0);

  return {
    totalIncome,
    totalExpenses,
    netProfit: totalIncome - totalExpenses,
    monthlyIncome,
    monthlyExpenses,
    monthlyProfit: monthlyIncome - monthlyExpenses,
  };
}

export function getFinanceTrend(income: Income[], expenses: Expense[]) {
  const totals = new Map<string, { month: string; income: number; expenses: number; profit: number }>();

  income.forEach((item) => {
    const month = format(parseISO(item.date), 'MMM yyyy');
    const row = totals.get(month) ?? { month, income: 0, expenses: 0, profit: 0 };
    row.income += item.amountKes;
    row.profit = row.income - row.expenses;
    totals.set(month, row);
  });

  expenses.forEach((item) => {
    const month = format(parseISO(item.date), 'MMM yyyy');
    const row = totals.get(month) ?? { month, income: 0, expenses: 0, profit: 0 };
    row.expenses += item.amountKes;
    row.profit = row.income - row.expenses;
    totals.set(month, row);
  });

  return Array.from(totals.values()).slice(-6);
}

export function getExpenseBreakdown(expenses: Expense[]) {
  const totals = expenses.reduce<Record<string, number>>((groups, item) => {
    groups[item.category] = (groups[item.category] ?? 0) + item.amountKes;
    return groups;
  }, {});

  return Object.entries(totals).map(([category, amount]) => ({ category, amount }));
}
