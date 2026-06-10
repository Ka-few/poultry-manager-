import { zodResolver } from '@hookform/resolvers/zod';
import { Edit3, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { PageHeader } from '../../components/ui/PageHeader';
import { useFarmData } from '../../context/FarmDataContext';
import type { BirdType, FlockStatus } from '../../types/farm';
import { number } from '../../utils/format';

const flockSchema = z.object({
  batchName: z.string().min(2),
  birdType: z.enum(['Layers', 'Broilers', 'Kienyeji']),
  breed: z.string().min(2),
  quantity: z.coerce.number().int().positive(),
  source: z.string().min(2),
  purchaseDate: z.string().min(1),
  ageWeeks: z.coerce.number().int().min(0),
  status: z.enum(['Active', 'Sold', 'Dead', 'Completed']),
  notes: z.string().optional(),
});

type FlockForm = z.infer<typeof flockSchema>;

const defaultFlockValues: Partial<FlockForm> = {
  birdType: 'Layers',
  status: 'Active',
  purchaseDate: new Date().toISOString().slice(0, 10),
};

export function FlocksPage() {
  const { data, addFlock, deleteFlock } = useFarmData();
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | BirdType>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | FlockStatus>('All');
  const form = useForm<FlockForm>({
    resolver: zodResolver(flockSchema),
    defaultValues: defaultFlockValues,
  });

  const flocks = useMemo(
    () =>
      data.flocks.filter((flock) => {
        const matchesQuery = `${flock.batchName} ${flock.breed}`.toLowerCase().includes(query.toLowerCase());
        return (
          matchesQuery &&
          (typeFilter === 'All' || flock.birdType === typeFilter) &&
          (statusFilter === 'All' || flock.status === statusFilter)
        );
      }),
    [data.flocks, query, statusFilter, typeFilter],
  );

  const submit = form.handleSubmit((values) => {
    addFlock(values);
    form.reset(defaultFlockValues);
    setShowForm(false);
  });

  return (
    <div className="page-stack">
      <PageHeader
        title="Flock management"
        eyebrow="Batches and bird stock"
        actions={
          <button className="primary-button" onClick={() => setShowForm((current) => !current)}>
            <Plus size={22} aria-hidden /> Add flock
          </button>
        }
      />

      {showForm ? (
        <form className="form-panel" onSubmit={submit}>
          <div className="form-grid">
            <label>Batch name<input {...form.register('batchName')} placeholder="Layers Batch B" /></label>
            <label>Bird type<select {...form.register('birdType')}><option>Layers</option><option>Broilers</option><option>Kienyeji</option></select></label>
            <label>Breed<input {...form.register('breed')} placeholder="Isa Brown" /></label>
            <label>Quantity<input type="number" {...form.register('quantity')} /></label>
            <label>Source<input {...form.register('source')} placeholder="Supplier or hatchery" /></label>
            <label>Purchase date<input type="date" {...form.register('purchaseDate')} /></label>
            <label>Age in weeks<input type="number" {...form.register('ageWeeks')} /></label>
            <label>Status<select {...form.register('status')}><option>Active</option><option>Sold</option><option>Dead</option><option>Completed</option></select></label>
            <label className="wide">Notes<textarea {...form.register('notes')} rows={3} /></label>
          </div>
          <div className="form-actions">
            <button className="primary-button" type="submit">Save flock</button>
            <button className="secondary-button" type="button" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      ) : null}

      <section className="filter-bar">
        <div className="search-box"><Search size={20} aria-hidden /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search flocks" /></div>
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as 'All' | BirdType)}>
          <option>All</option><option>Layers</option><option>Broilers</option><option>Kienyeji</option>
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'All' | FlockStatus)}>
          <option>All</option><option>Active</option><option>Sold</option><option>Dead</option><option>Completed</option>
        </select>
      </section>

      <section className="card-grid">
        {flocks.map((flock) => (
          <article className="flock-card" key={flock.id}>
            <Link className="card-main-link" to={`/flocks/${flock.id}`}>
              <div>
                <span className={`status-dot ${flock.status.toLowerCase()}`} />
                <strong>{flock.batchName}</strong>
                <small>{flock.breed} - {flock.birdType}</small>
              </div>
              <b>{number.format(flock.quantity)} birds</b>
              <span>Age {flock.ageWeeks} weeks</span>
            </Link>
            <div className="row-actions">
              <Link className="icon-button" to={`/flocks/${flock.id}`} aria-label={`Edit ${flock.batchName}`}>
                <Edit3 size={18} aria-hidden />
              </Link>
              <button
                className="icon-button danger"
                aria-label={`Delete ${flock.batchName}`}
                onClick={() => {
                  if (window.confirm(`Delete ${flock.batchName} and its related egg and feed records?`)) {
                    deleteFlock(flock.id);
                  }
                }}
              >
                <Trash2 size={18} aria-hidden />
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
