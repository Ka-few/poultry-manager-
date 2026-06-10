import { zodResolver } from '@hookform/resolvers/zod';
import { Edit3, Egg, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { z } from 'zod';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { useFarmData } from '../../context/FarmDataContext';
import { getEggInsight, getEggTrend } from '../../services/farmAnalytics';
import type { EggLog } from '../../types/farm';

const eggSchema = z.object({
  date: z.string().min(1),
  flockId: z.string().min(1),
  eggsCollected: z.coerce.number().int().min(0),
  brokenEggs: z.coerce.number().int().min(0),
  notes: z.string().optional(),
});

type EggForm = z.infer<typeof eggSchema>;

const getDefaultEggValues = (flockId: string): EggForm => ({
  date: new Date().toISOString().slice(0, 10),
  flockId,
  eggsCollected: 0,
  brokenEggs: 0,
  notes: '',
});

export function EggProductionPage() {
  const { data, addEggLog, updateEggLog, deleteEggLog } = useFarmData();
  const [editingLog, setEditingLog] = useState<EggLog | null>(null);
  const activeFlocks = data.flocks.filter((flock) => flock.status === 'Active');
  const fallbackFlockId = activeFlocks[0]?.id ?? data.flocks[0]?.id ?? '';
  const form = useForm<EggForm>({
    resolver: zodResolver(eggSchema),
    defaultValues: getDefaultEggValues(fallbackFlockId),
  });

  const flockName = (flockId: string) => data.flocks.find((flock) => flock.id === flockId)?.batchName ?? 'Deleted flock';

  const clearEditing = () => {
    setEditingLog(null);
    form.reset(getDefaultEggValues(fallbackFlockId));
  };

  const startEditing = (log: EggLog) => {
    setEditingLog(log);
    form.reset({
      date: log.date,
      flockId: log.flockId,
      eggsCollected: log.eggsCollected,
      brokenEggs: log.brokenEggs,
      notes: log.notes ?? '',
    });
  };

  const submit = form.handleSubmit((values) => {
    if (editingLog) {
      updateEggLog({ ...editingLog, ...values });
    } else {
      addEggLog(values);
    }
    clearEditing();
  });

  return (
    <div className="page-stack">
      <PageHeader title="Egg production" eyebrow="Daily collection log" />
      <section className="split-grid">
        <form className="form-panel" onSubmit={submit}>
          <div className="form-title">
            <Egg size={24} aria-hidden />
            <h2>{editingLog ? 'Update egg log' : 'Record eggs'}</h2>
          </div>
          {data.flocks.length ? (
            <div className="form-grid single">
              <label>Date<input type="date" {...form.register('date')} /></label>
              <label>
                Flock
                <select {...form.register('flockId')}>
                  {data.flocks.map((flock) => <option key={flock.id} value={flock.id}>{flock.batchName}</option>)}
                </select>
              </label>
              <label>Eggs collected<input type="number" {...form.register('eggsCollected')} /></label>
              <label>Broken eggs<input type="number" {...form.register('brokenEggs')} /></label>
              <label>Notes<textarea rows={3} {...form.register('notes')} /></label>
              <div className="form-actions">
                <button className="primary-button" type="submit">{editingLog ? 'Update egg log' : 'Save egg log'}</button>
                {editingLog ? (
                  <button className="secondary-button" type="button" onClick={clearEditing}>
                    <X size={20} aria-hidden /> Cancel
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <EmptyState title="No flock found" text="Add a flock before recording egg production." />
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
        <div className="panel-heading"><h2>Recent logs</h2><span>Edit or delete daily records</span></div>
        <div className="table-list">
          {data.eggLogs.slice(0, 12).map((log) => (
            <div className="table-row with-actions" key={log.id}>
              <span>{log.date}</span>
              <strong>{log.eggsCollected} eggs</strong>
              <span>{log.brokenEggs} broken</span>
              <span>{flockName(log.flockId)}</span>
              <div className="row-actions">
                <button className="icon-button" aria-label={`Edit egg log for ${log.date}`} onClick={() => startEditing(log)}>
                  <Edit3 size={18} aria-hidden />
                </button>
                <button
                  className="icon-button danger"
                  aria-label={`Delete egg log for ${log.date}`}
                  onClick={() => {
                    if (window.confirm(`Delete egg log for ${log.date}?`)) {
                      deleteEggLog(log.id);
                      if (editingLog?.id === log.id) clearEditing();
                    }
                  }}
                >
                  <Trash2 size={18} aria-hidden />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
