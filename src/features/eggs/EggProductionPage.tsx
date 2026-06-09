import { zodResolver } from '@hookform/resolvers/zod';
import { Egg } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { z } from 'zod';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { useFarmData } from '../../context/FarmDataContext';
import { getEggInsight, getEggTrend } from '../../services/farmAnalytics';

const eggSchema = z.object({
  date: z.string().min(1),
  flockId: z.string().min(1),
  eggsCollected: z.coerce.number().int().min(0),
  brokenEggs: z.coerce.number().int().min(0),
  notes: z.string().optional(),
});

type EggForm = z.infer<typeof eggSchema>;

export function EggProductionPage() {
  const { data, addEggLog } = useFarmData();
  const activeFlocks = data.flocks.filter((flock) => flock.status === 'Active');
  const form = useForm<EggForm>({
    resolver: zodResolver(eggSchema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      flockId: activeFlocks[0]?.id ?? '',
      eggsCollected: 0,
      brokenEggs: 0,
    },
  });

  const submit = form.handleSubmit((values) => {
    addEggLog(values);
    form.reset({ date: new Date().toISOString().slice(0, 10), flockId: activeFlocks[0]?.id ?? '', eggsCollected: 0, brokenEggs: 0 });
  });

  return (
    <div className="page-stack">
      <PageHeader title="Egg production" eyebrow="Daily collection log" />
      <section className="split-grid">
        <form className="form-panel" onSubmit={submit}>
          <div className="form-title"><Egg size={24} aria-hidden /><h2>Record eggs</h2></div>
          {activeFlocks.length ? (
            <div className="form-grid single">
              <label>Date<input type="date" {...form.register('date')} /></label>
              <label>Flock<select {...form.register('flockId')}>{activeFlocks.map((flock) => <option key={flock.id} value={flock.id}>{flock.batchName}</option>)}</select></label>
              <label>Eggs collected<input type="number" {...form.register('eggsCollected')} /></label>
              <label>Broken eggs<input type="number" {...form.register('brokenEggs')} /></label>
              <label>Notes<textarea rows={3} {...form.register('notes')} /></label>
              <button className="primary-button" type="submit">Save egg log</button>
            </div>
          ) : (
            <EmptyState title="No active flock" text="Add a flock before recording egg production." />
          )}
        </form>
        <article className="panel chart-panel">
          <div className="panel-heading"><h2>Monthly analytics</h2><span>{getEggInsight(data.eggLogs)}</span></div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={getEggTrend(data.eggLogs)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dfe8df" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="eggs" fill="#1f7a55" radius={[6, 6, 0, 0]} />
              <Bar dataKey="broken" fill="#d99520" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>
      </section>
      <section className="panel">
        <div className="panel-heading"><h2>Recent logs</h2><span>Daily records</span></div>
        <div className="table-list">
          {data.eggLogs.slice(0, 8).map((log) => (
            <div className="table-row" key={log.id}>
              <span>{log.date}</span>
              <strong>{log.eggsCollected} eggs</strong>
              <span>{log.brokenEggs} broken</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
