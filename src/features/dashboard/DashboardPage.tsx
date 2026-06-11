import { AlertTriangle, Banknote, Egg, Skull, Sprout, TrendingUp, Wheat } from 'lucide-react';
import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { KpiCard } from '../../components/ui/KpiCard';
import { PageHeader } from '../../components/ui/PageHeader';
import { useFarmData } from '../../context/FarmDataContext';
import { nextVaccinations } from '../../data/localStore';
import { getEggTrend, getFeedOnHand, getFeedTrend } from '../../services/farmAnalytics';
import { kes, number } from '../../utils/format';
import {
  currentMonthKey,
  currentMonthRange,
  getPeriodRange,
  inPeriodRange,
  PeriodFilterMode,
  todayKey,
} from '../../utils/periodRange';

export function DashboardPage() {
  const { data } = useFarmData();
  const [filterMode, setFilterMode] = useState<PeriodFilterMode>('month');
  const [selectedDay, setSelectedDay] = useState(todayKey());
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());
  const [customFrom, setCustomFrom] = useState(format(currentMonthRange().from, 'yyyy-MM-dd'));
  const [customTo, setCustomTo] = useState(format(currentMonthRange().to, 'yyyy-MM-dd'));

  const dashboardRange = useMemo(
    () => getPeriodRange(filterMode, selectedDay, selectedMonth, customFrom, customTo),
    [customFrom, customTo, filterMode, selectedDay, selectedMonth],
  );

  const activeFlocks = data.flocks.filter((flock) => flock.status === 'Active');
  const totalBirds = activeFlocks.reduce((total, flock) => total + flock.quantity, 0);
  const periodEggs = data.eggLogs.filter((log) => inPeriodRange(log.date, dashboardRange));
  const periodFeedStock = data.feedStock.filter((stock) => inPeriodRange(stock.datePurchased, dashboardRange));
  const periodFeedUsage = data.feedUsage.filter((usage) => inPeriodRange(usage.date, dashboardRange));
  const periodMortality = data.mortalityLogs.filter((log) => inPeriodRange(log.date, dashboardRange));
  const periodIncome = data.income.filter((item) => inPeriodRange(item.date, dashboardRange));
  const periodExpenses = data.expenses.filter((item) => inPeriodRange(item.date, dashboardRange));
  const eggsCollected = periodEggs.reduce((total, log) => total + log.eggsCollected, 0);
  const feedUsed = periodFeedUsage.reduce((total, log) => total + log.quantityKg, 0);
  const birdsLost = periodMortality.reduce((total, log) => total + log.birdsLost, 0);
  const recordedRevenue = periodIncome.reduce((total, item) => total + item.amountKes, 0);
  const estimatedRevenue = eggsCollected * 15;
  const feedExpense = periodFeedStock.reduce((total, stock) => total + stock.costKes, 0);
  const recordedExpenses = periodExpenses.reduce((total, item) => total + item.amountKes, 0);
  const revenue = recordedRevenue || estimatedRevenue;
  const expenses = recordedExpenses || feedExpense;
  const profit = revenue - expenses;
  const eggTrend = getEggTrend(periodEggs);
  const feedTrend = getFeedTrend(periodFeedStock);
  const feedOnHand = getFeedOnHand(data.feedStock, data.feedUsage);
  const lowStock = feedOnHand.filter((item) => item.quantityKg < 50);

  return (
    <div className="page-stack">
      <PageHeader title="Farm dashboard" eyebrow={`${dashboardRange.label} overview`} />

      <section className="report-filter" aria-label="Dashboard period filter">
        <label>
          Summary period
          <select value={filterMode} onChange={(event) => setFilterMode(event.target.value as PeriodFilterMode)}>
            <option value="month">Month</option>
            <option value="day">Day</option>
            <option value="custom">Custom period</option>
          </select>
        </label>

        {filterMode === 'day' ? (
          <label>
            Day
            <input type="date" value={selectedDay} onChange={(event) => setSelectedDay(event.target.value)} />
          </label>
        ) : null}

        {filterMode === 'month' ? (
          <label>
            Month
            <input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} />
          </label>
        ) : null}

        {filterMode === 'custom' ? (
          <>
            <label>
              From
              <input type="date" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} />
            </label>
            <label>
              To
              <input type="date" value={customTo} onChange={(event) => setCustomTo(event.target.value)} />
            </label>
          </>
        ) : null}
      </section>

      <section className="kpi-grid">
        <KpiCard label="Total birds" value={number.format(totalBirds)} hint="Current active stock" icon={Sprout} />
        <KpiCard label="Active flocks" value={String(activeFlocks.length)} hint="Current running batches" icon={TrendingUp} tone="blue" />
        <KpiCard label="Eggs collected" value={number.format(eggsCollected)} hint={dashboardRange.label} icon={Egg} tone="gold" />
        <KpiCard label="Feed used" value={`${number.format(feedUsed)} kg`} hint={dashboardRange.label} icon={Wheat} />
        <KpiCard label="Mortality" value={number.format(birdsLost)} hint={dashboardRange.label} icon={Skull} tone="red" />
        <KpiCard label="Revenue" value={kes.format(revenue)} hint={recordedRevenue ? 'Recorded income' : 'Estimated from eggs'} icon={Banknote} tone="blue" />
        <KpiCard label="Expenses" value={kes.format(expenses)} hint={recordedExpenses ? 'Recorded costs' : 'Feed purchases'} icon={Banknote} tone="red" />
        <KpiCard label="Profit" value={kes.format(profit)} hint={dashboardRange.label} icon={TrendingUp} tone="green" />
      </section>

      <section className="dashboard-grid">
        <article className="panel chart-panel">
          <div className="panel-heading">
            <h2>Egg production trend</h2>
            <span>{dashboardRange.label}</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={eggTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dfe8df" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="eggs" stroke="#1f7a55" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="broken" stroke="#d99520" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </article>

        <article className="panel chart-panel">
          <div className="panel-heading">
            <h2>Feed cost trend</h2>
            <span>{dashboardRange.label}</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={feedTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dfe8df" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="cost" fill="#3066be" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h2>Upcoming vaccinations</h2>
            <span>Phase 2 reminders</span>
          </div>
          <div className="list-stack">
            {nextVaccinations.map((item) => (
              <div className="summary-row" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.flockName}</span>
                </div>
                <b>{item.dueDate}</b>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h2>Low stock alerts</h2>
            <span>Feed below 50 kg</span>
          </div>
          <div className="list-stack">
            {lowStock.length ? (
              lowStock.map((item) => (
                <div className="alert-row" key={item.feedType}>
                  <AlertTriangle size={22} aria-hidden />
                  <div>
                    <strong>{item.feedType}</strong>
                    <span>{Math.max(0, item.quantityKg).toFixed(1)} kg remaining</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="summary-row">
                <div>
                  <strong>Feed stock is healthy</strong>
                  <span>No low stock alerts today</span>
                </div>
              </div>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
