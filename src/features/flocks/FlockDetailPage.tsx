import { Archive, Save } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { useFarmData } from '../../context/FarmDataContext';
import type { FlockStatus } from '../../types/farm';

export function FlockDetailPage() {
  const { flockId } = useParams();
  const navigate = useNavigate();
  const { data, updateFlock } = useFarmData();
  const flock = data.flocks.find((item) => item.id === flockId);
  const [status, setStatus] = useState<FlockStatus>(flock?.status ?? 'Active');
  const relatedEggs = useMemo(() => data.eggLogs.filter((log) => log.flockId === flockId), [data.eggLogs, flockId]);
  const relatedFeed = useMemo(() => data.feedUsage.filter((log) => log.flockId === flockId), [data.feedUsage, flockId]);

  if (!flock) {
    return (
      <div className="page-stack">
        <PageHeader title="Flock not found" eyebrow="Flock profile" />
        <button className="primary-button" onClick={() => navigate('/flocks')}>Back to flocks</button>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        title={flock.batchName}
        eyebrow="Flock profile"
        actions={
          <button className="primary-button" onClick={() => updateFlock({ ...flock, status })}>
            <Save size={20} aria-hidden /> Save
          </button>
        }
      />
      <section className="detail-grid">
        <article className="panel">
          <div className="panel-heading"><h2>Batch details</h2><span>{flock.birdType}</span></div>
          <dl className="detail-list">
            <div><dt>Breed</dt><dd>{flock.breed}</dd></div>
            <div><dt>Quantity</dt><dd>{flock.quantity}</dd></div>
            <div><dt>Source</dt><dd>{flock.source}</dd></div>
            <div><dt>Purchase date</dt><dd>{flock.purchaseDate}</dd></div>
            <div><dt>Age</dt><dd>{flock.ageWeeks} weeks</dd></div>
          </dl>
          <label className="status-control">Status<select value={status} onChange={(event) => setStatus(event.target.value as FlockStatus)}><option>Active</option><option>Sold</option><option>Dead</option><option>Completed</option></select></label>
          <button className="secondary-button" onClick={() => setStatus('Completed')}><Archive size={20} aria-hidden /> Archive flock</button>
        </article>
        <article className="panel">
          <div className="panel-heading"><h2>Flock history</h2><span>Activity</span></div>
          <div className="summary-row"><div><strong>{relatedEggs.length} egg logs</strong><span>Production records</span></div></div>
          <div className="summary-row"><div><strong>{relatedFeed.length} feed logs</strong><span>Consumption records</span></div></div>
          <div className="summary-row"><div><strong>{flock.notes || 'No notes yet'}</strong><span>Farm notes</span></div></div>
        </article>
      </section>
    </div>
  );
}
