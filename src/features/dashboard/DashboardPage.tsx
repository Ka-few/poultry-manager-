import { AlertTriangle, Banknote, Egg, Skull, Sprout, TrendingUp, Wheat } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { KpiCard } from '../../components/ui/KpiCard';
import { PageHeader } from '../../components/ui/PageHeader';
import { useFarmData } from '../../context/FarmDataContext';
import { nextVaccinations } from '../../data/localStore';
import { getDashboardMetrics, getEggInsight, getEggTrend, getFeedOnHand, getFeedTrend } from '../../services/farmAnalytics';
import { kes, number } from '../../utils/format';

export function DashboardPage() {
  const { data } = useFarmData();
  const metrics = getDashboardMetrics(data);
  const eggTrend = getEggTrend(data.eggLogs);
  const feedTrend = getFeedTrend(data.feedStock);
  const feedOnHand = getFeedOnHand(data.feedStock, data.feedUsage);
  const lowStock = feedOnHand.filter((item) => item.quantityKg < 50);

  return (
    <div className="page-stack">
      <PageHeader title="Farm dashboard" eyebrow="Today overview" />
      <section className="kpi-grid">
        <KpiCard label="Total birds" value={number.format(metrics.totalBirds)} hint="Active stock" icon={Sprout} />
        <KpiCard label="Active flocks" value={String(metrics.activeFlocks)} hint="Running batches" icon={TrendingUp} tone="blue" />
        <KpiCard label="Eggs today" value={number.format(metrics.eggsToday)} hint={getEggInsight(data.eggLogs)} icon={Egg} tone="gold" />
        <KpiCard label="Feed today" value={`${metrics.feedToday} kg`} hint="Logged consumption" icon={Wheat} />
        <KpiCard label="Mortality" value={String(metrics.mortalityThisMonth)} hint="This month" icon={Skull} tone="red" />
        <KpiCard label="Revenue" value={kes.format(metrics.revenue)} hint="Estimated from eggs" icon={Banknote} tone="blue" />
        <KpiCard label="Expenses" value={kes.format(metrics.expenses)} hint="Feed purchases" icon={Banknote} tone="red" />
        <KpiCard label="Profit" value={kes.format(metrics.profit)} hint="Early estimate" icon={TrendingUp} tone="green" />
      </section>

      <section className="dashboard-grid">
        <article className="panel chart-panel">
          <div className="panel-heading">
            <h2>Egg production trend</h2>
            <span>Last 14 logs</span>
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
            <span>Purchases</span>
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
