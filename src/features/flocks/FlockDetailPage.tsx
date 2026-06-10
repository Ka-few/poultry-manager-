import { zodResolver } from '@hookform/resolvers/zod';
import { Archive, Edit3, Save, ShieldPlus, Skull, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { KpiCard } from '../../components/ui/KpiCard';
import { PageHeader } from '../../components/ui/PageHeader';
import { useFarmData } from '../../context/FarmDataContext';
import type { HealthRecord, MortalityLog } from '../../types/farm';

const flockSchema = z.object({
  batchName: z.string().min(2),
  birdType: z.enum(['Layers', 'Broilers', 'Kienyeji']),
  breed: z.string().min(2),
  quantity: z.coerce.number().int().min(0),
  source: z.string().min(2),
  purchaseDate: z.string().min(1),
  ageWeeks: z.coerce.number().int().min(0),
  status: z.enum(['Active', 'Sold', 'Dead', 'Completed']),
  notes: z.string().optional(),
});

const mortalitySchema = z.object({
  date: z.string().min(1),
  birdsLost: z.coerce.number().int().positive(),
  suspectedCause: z.enum(['Disease', 'Predators', 'Weather', 'Accident', 'Unknown', 'Other']),
  notes: z.string().optional(),
});

const healthSchema = z.object({
  recordType: z.enum(['Vaccination', 'Medication', 'Treatment']),
  name: z.string().min(2),
  dateAdministered: z.string().min(1),
  nextDueDate: z.string().optional(),
  dosage: z.string().optional(),
  notes: z.string().optional(),
});

type FlockForm = z.infer<typeof flockSchema>;
type MortalityForm = z.infer<typeof mortalitySchema>;
type HealthForm = z.infer<typeof healthSchema>;
type FlockProfileTab = 'Overview' | 'Mortality' | 'Health';

const today = () => new Date().toISOString().slice(0, 10);

const defaultMortalityValues = (): MortalityForm => ({
  date: today(),
  birdsLost: 1,
  suspectedCause: 'Unknown',
  notes: '',
});

const defaultHealthValues = (): HealthForm => ({
  recordType: 'Vaccination',
  name: 'Newcastle',
  dateAdministered: today(),
  nextDueDate: '',
  dosage: '',
  notes: '',
});

export function FlockDetailPage() {
  const { flockId } = useParams();
  const navigate = useNavigate();
  const {
    data,
    updateFlock,
    deleteFlock,
    addMortalityLog,
    updateMortalityLog,
    deleteMortalityLog,
    addHealthRecord,
    updateHealthRecord,
    deleteHealthRecord,
  } = useFarmData();
  const [editingMortality, setEditingMortality] = useState<MortalityLog | null>(null);
  const [editingHealth, setEditingHealth] = useState<HealthRecord | null>(null);
  const [activeTab, setActiveTab] = useState<FlockProfileTab>('Overview');
  const flock = data.flocks.find((item) => item.id === flockId);
  const relatedEggs = useMemo(() => data.eggLogs.filter((log) => log.flockId === flockId), [data.eggLogs, flockId]);
  const relatedFeed = useMemo(() => data.feedUsage.filter((log) => log.flockId === flockId), [data.feedUsage, flockId]);
  const mortalityLogs = useMemo(() => data.mortalityLogs.filter((log) => log.flockId === flockId), [data.mortalityLogs, flockId]);
  const healthRecords = useMemo(() => data.healthRecords.filter((record) => record.flockId === flockId), [data.healthRecords, flockId]);
  const mortalityTotal = mortalityLogs.reduce((total, log) => total + log.birdsLost, 0);
  const upcomingHealth = healthRecords.filter((record) => record.nextDueDate && record.nextDueDate >= today()).length;
  const form = useForm<FlockForm>({
    resolver: zodResolver(flockSchema),
    values: flock
      ? {
          batchName: flock.batchName,
          birdType: flock.birdType,
          breed: flock.breed,
          quantity: flock.quantity,
          source: flock.source,
          purchaseDate: flock.purchaseDate,
          ageWeeks: flock.ageWeeks,
          status: flock.status,
          notes: flock.notes ?? '',
        }
      : undefined,
  });
  const mortalityForm = useForm<MortalityForm>({
    resolver: zodResolver(mortalitySchema),
    defaultValues: defaultMortalityValues(),
  });
  const healthForm = useForm<HealthForm>({
    resolver: zodResolver(healthSchema),
    defaultValues: defaultHealthValues(),
  });

  if (!flock) {
    return (
      <div className="page-stack">
        <PageHeader title="Flock not found" eyebrow="Flock profile" />
        <button className="primary-button" onClick={() => navigate('/flocks')}>Back to flocks</button>
      </div>
    );
  }

  const saveFlock = form.handleSubmit((values) => {
    updateFlock({ ...flock, ...values });
  });

  const removeFlock = () => {
    if (window.confirm(`Delete ${flock.batchName} and its related egg, feed, and health records?`)) {
      deleteFlock(flock.id);
      navigate('/flocks');
    }
  };

  const clearMortalityEditing = () => {
    setEditingMortality(null);
    mortalityForm.reset(defaultMortalityValues());
  };

  const clearHealthEditing = () => {
    setEditingHealth(null);
    healthForm.reset(defaultHealthValues());
  };

  const saveMortality = mortalityForm.handleSubmit((values) => {
    if (editingMortality) {
      updateMortalityLog({ ...editingMortality, ...values });
    } else {
      addMortalityLog({ ...values, flockId: flock.id });
    }
    clearMortalityEditing();
  });

  const saveHealth = healthForm.handleSubmit((values) => {
    const record = {
      ...values,
      flockId: flock.id,
      nextDueDate: values.nextDueDate || undefined,
      dosage: values.dosage || undefined,
      notes: values.notes || undefined,
    };

    if (editingHealth) {
      updateHealthRecord({ ...editingHealth, ...record });
    } else {
      addHealthRecord(record);
    }
    clearHealthEditing();
  });

  const startMortalityEditing = (log: MortalityLog) => {
    setEditingMortality(log);
    mortalityForm.reset({
      date: log.date,
      birdsLost: log.birdsLost,
      suspectedCause: log.suspectedCause,
      notes: log.notes ?? '',
    });
  };

  const startHealthEditing = (record: HealthRecord) => {
    setEditingHealth(record);
    healthForm.reset({
      recordType: record.recordType,
      name: record.name,
      dateAdministered: record.dateAdministered,
      nextDueDate: record.nextDueDate ?? '',
      dosage: record.dosage ?? '',
      notes: record.notes ?? '',
    });
  };

  return (
    <div className="page-stack">
      <PageHeader
        title={flock.batchName}
        eyebrow="Flock profile"
        actions={
          <div className="header-actions">
            <button className="danger-button" onClick={removeFlock}>
              <Trash2 size={20} aria-hidden /> Delete
            </button>
            <button className="primary-button" onClick={saveFlock}>
              <Save size={20} aria-hidden /> Save
            </button>
          </div>
        }
      />

      <div className="tab-bar" role="tablist" aria-label="Flock profile sections">
        {(['Overview', 'Mortality', 'Health'] as FlockProfileTab[]).map((tab) => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <section className="kpi-grid compact">
        <KpiCard label="Live birds" value={String(flock.quantity)} hint="Current flock count" icon={ShieldPlus} tone="green" />
        <KpiCard label="Birds lost" value={String(mortalityTotal)} hint="Recorded mortality" icon={Skull} tone="red" />
        <KpiCard label="Health records" value={String(healthRecords.length)} hint="Vaccines and treatments" icon={ShieldPlus} tone="blue" />
        <KpiCard label="Upcoming due" value={String(upcomingHealth)} hint="With next due dates" icon={ShieldPlus} tone="gold" />
      </section>

      {activeTab === 'Overview' ? (
      <section className="detail-grid" role="tabpanel">
        <form className="form-panel" onSubmit={saveFlock}>
          <div className="panel-heading"><h2>Edit batch details</h2><span>{flock.birdType}</span></div>
          <div className="form-grid">
            <label>Batch name<input {...form.register('batchName')} /></label>
            <label>Bird type<select {...form.register('birdType')}><option>Layers</option><option>Broilers</option><option>Kienyeji</option></select></label>
            <label>Breed<input {...form.register('breed')} /></label>
            <label>Live quantity<input type="number" {...form.register('quantity')} /></label>
            <label>Source<input {...form.register('source')} /></label>
            <label>Purchase date<input type="date" {...form.register('purchaseDate')} /></label>
            <label>Age in weeks<input type="number" {...form.register('ageWeeks')} /></label>
            <label>Status<select {...form.register('status')}><option>Active</option><option>Sold</option><option>Dead</option><option>Completed</option></select></label>
            <label className="wide">Notes<textarea rows={3} {...form.register('notes')} /></label>
          </div>
          <div className="form-actions">
            <button className="primary-button" type="submit"><Save size={20} aria-hidden /> Save changes</button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => form.setValue('status', 'Completed', { shouldDirty: true })}
            >
              <Archive size={20} aria-hidden /> Mark completed
            </button>
          </div>
        </form>
        <article className="panel">
          <div className="panel-heading"><h2>Flock history</h2><span>Activity</span></div>
          <div className="summary-row"><div><strong>{relatedEggs.length} egg logs</strong><span>Production records</span></div></div>
          <div className="summary-row"><div><strong>{relatedFeed.length} feed logs</strong><span>Consumption records</span></div></div>
          <div className="summary-row"><div><strong>{mortalityTotal} birds lost</strong><span>Mortality records</span></div></div>
          <div className="summary-row"><div><strong>{flock.notes || 'No notes yet'}</strong><span>Farm notes</span></div></div>
        </article>
      </section>
      ) : null}

      {activeTab === 'Mortality' ? (
      <section className="split-grid" role="tabpanel">
        <form className="form-panel" onSubmit={saveMortality}>
          <div className="form-title"><Skull size={24} aria-hidden /><h2>{editingMortality ? 'Update mortality' : 'Record dead birds'}</h2></div>
          <div className="form-grid single">
            <label>Date<input type="date" {...mortalityForm.register('date')} /></label>
            <label>Number of birds lost<input type="number" {...mortalityForm.register('birdsLost')} /></label>
            <label>Suspected cause<select {...mortalityForm.register('suspectedCause')}><option>Disease</option><option>Predators</option><option>Weather</option><option>Accident</option><option>Unknown</option><option>Other</option></select></label>
            <label>Notes<textarea rows={3} {...mortalityForm.register('notes')} /></label>
            <div className="form-actions">
              <button className="primary-button" type="submit">{editingMortality ? 'Update mortality' : 'Save mortality'}</button>
              {editingMortality ? <button className="secondary-button" type="button" onClick={clearMortalityEditing}><X size={20} aria-hidden /> Cancel</button> : null}
            </div>
          </div>
        </form>

        <article className="panel">
          <div className="panel-heading"><h2>Mortality history</h2><span>Dead bird records</span></div>
          <div className="table-list">
            {mortalityLogs.map((log) => (
              <div className="table-row with-actions" key={log.id}>
                <span>{log.date}</span>
                <strong>{log.birdsLost} lost</strong>
                <span>{log.suspectedCause}</span>
                <span>{log.notes || 'No notes'}</span>
                <div className="row-actions">
                  <button className="icon-button" aria-label={`Edit mortality from ${log.date}`} onClick={() => startMortalityEditing(log)}><Edit3 size={18} aria-hidden /></button>
                  <button
                    className="icon-button danger"
                    aria-label={`Delete mortality from ${log.date}`}
                    onClick={() => {
                      if (window.confirm(`Delete mortality record from ${log.date}?`)) {
                        deleteMortalityLog(log.id);
                        if (editingMortality?.id === log.id) clearMortalityEditing();
                      }
                    }}
                  >
                    <Trash2 size={18} aria-hidden />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
      ) : null}

      {activeTab === 'Health' ? (
      <section className="split-grid" role="tabpanel">
        <form className="form-panel" onSubmit={saveHealth}>
          <div className="form-title"><ShieldPlus size={24} aria-hidden /><h2>{editingHealth ? 'Update health record' : 'Record health action'}</h2></div>
          <div className="form-grid single">
            <label>Record type<select {...healthForm.register('recordType')}><option>Vaccination</option><option>Medication</option><option>Treatment</option></select></label>
            <label>Name<input {...healthForm.register('name')} placeholder="Newcastle, Gumboro, antibiotic..." /></label>
            <label>Date administered<input type="date" {...healthForm.register('dateAdministered')} /></label>
            <label>Next due date<input type="date" {...healthForm.register('nextDueDate')} /></label>
            <label>Dosage<input {...healthForm.register('dosage')} placeholder="Dose or instructions" /></label>
            <label>Notes<textarea rows={3} {...healthForm.register('notes')} /></label>
            <div className="form-actions">
              <button className="primary-button" type="submit">{editingHealth ? 'Update health' : 'Save health'}</button>
              {editingHealth ? <button className="secondary-button" type="button" onClick={clearHealthEditing}><X size={20} aria-hidden /> Cancel</button> : null}
            </div>
          </div>
        </form>

        <article className="panel">
          <div className="panel-heading"><h2>Vaccination and treatment history</h2><span>Health records</span></div>
          <div className="table-list">
            {healthRecords.map((record) => (
              <div className="table-row with-actions" key={record.id}>
                <span>{record.dateAdministered}</span>
                <strong>{record.name}</strong>
                <span>{record.recordType}</span>
                <span>{record.nextDueDate ? `Due ${record.nextDueDate}` : record.dosage || 'No due date'}</span>
                <div className="row-actions">
                  <button className="icon-button" aria-label={`Edit ${record.name}`} onClick={() => startHealthEditing(record)}><Edit3 size={18} aria-hidden /></button>
                  <button
                    className="icon-button danger"
                    aria-label={`Delete ${record.name}`}
                    onClick={() => {
                      if (window.confirm(`Delete ${record.name} health record?`)) {
                        deleteHealthRecord(record.id);
                        if (editingHealth?.id === record.id) clearHealthEditing();
                      }
                    }}
                  >
                    <Trash2 size={18} aria-hidden />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
      ) : null}
    </div>
  );
}
