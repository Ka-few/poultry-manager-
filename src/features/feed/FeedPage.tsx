import { zodResolver } from '@hookform/resolvers/zod';
import { PackagePlus, Wheat } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { KpiCard } from '../../components/ui/KpiCard';
import { PageHeader } from '../../components/ui/PageHeader';
import { useFarmData } from '../../context/FarmDataContext';
import { getDailyFeedRate, getFeedOnHand, getMonthlyFeedSpend } from '../../services/farmAnalytics';
import type { FeedType } from '../../types/farm';
import { kes } from '../../utils/format';

const feedTypes: FeedType[] = ['Chick mash', 'Growers mash', 'Layers mash', 'Broiler starter', 'Broiler finisher', 'Custom feed'];

const stockSchema = z.object({
  feedType: z.enum(feedTypes as [FeedType, ...FeedType[]]),
  quantityKg: z.coerce.number().positive(),
  costKes: z.coerce.number().min(0),
  supplier: z.string().min(2),
  datePurchased: z.string().min(1),
});

const usageSchema = z.object({
  date: z.string().min(1),
  flockId: z.string().min(1),
  feedType: z.enum(feedTypes as [FeedType, ...FeedType[]]),
  quantityKg: z.coerce.number().positive(),
  notes: z.string().optional(),
});

type StockForm = z.infer<typeof stockSchema>;
type UsageForm = z.infer<typeof usageSchema>;

export function FeedPage() {
  const { data, addFeedStock, addFeedUsage } = useFarmData();
  const activeFlocks = data.flocks.filter((flock) => flock.status === 'Active');
  const stockForm = useForm<StockForm>({
    resolver: zodResolver(stockSchema),
    defaultValues: { feedType: 'Layers mash', datePurchased: new Date().toISOString().slice(0, 10), quantityKg: 50, costKes: 0 },
  });
  const usageForm = useForm<UsageForm>({
    resolver: zodResolver(usageSchema),
    defaultValues: { date: new Date().toISOString().slice(0, 10), flockId: activeFlocks[0]?.id ?? '', feedType: 'Layers mash', quantityKg: 0 },
  });
  const feedOnHand = getFeedOnHand(data.feedStock, data.feedUsage);

  return (
    <div className="page-stack">
      <PageHeader title="Feed management" eyebrow="Inventory and consumption" />
      <section className="kpi-grid compact">
        <KpiCard label="Monthly spend" value={kes.format(getMonthlyFeedSpend(data.feedStock))} hint="Feed purchases this month" icon={Wheat} tone="blue" />
        <KpiCard label="Daily rate" value={`${getDailyFeedRate(data.feedUsage).toFixed(1)} kg`} hint="Average recent usage" icon={Wheat} />
      </section>
      <section className="split-grid">
        <form className="form-panel" onSubmit={stockForm.handleSubmit((values) => { addFeedStock(values); stockForm.reset({ feedType: 'Layers mash', datePurchased: new Date().toISOString().slice(0, 10), quantityKg: 50, costKes: 0 }); })}>
          <div className="form-title"><PackagePlus size={24} aria-hidden /><h2>Add feed stock</h2></div>
          <div className="form-grid single">
            <label>Feed type<select {...stockForm.register('feedType')}>{feedTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            <label>Quantity kg<input type="number" step="0.1" {...stockForm.register('quantityKg')} /></label>
            <label>Cost KES<input type="number" {...stockForm.register('costKes')} /></label>
            <label>Supplier<input {...stockForm.register('supplier')} placeholder="Agrovet or supplier" /></label>
            <label>Date purchased<input type="date" {...stockForm.register('datePurchased')} /></label>
            <button className="primary-button" type="submit">Save stock</button>
          </div>
        </form>
        <form className="form-panel" onSubmit={usageForm.handleSubmit((values) => { addFeedUsage(values); usageForm.reset({ date: new Date().toISOString().slice(0, 10), flockId: activeFlocks[0]?.id ?? '', feedType: 'Layers mash', quantityKg: 0 }); })}>
          <div className="form-title"><Wheat size={24} aria-hidden /><h2>Record feed use</h2></div>
          <div className="form-grid single">
            <label>Date<input type="date" {...usageForm.register('date')} /></label>
            <label>Flock<select {...usageForm.register('flockId')}>{activeFlocks.map((flock) => <option key={flock.id} value={flock.id}>{flock.batchName}</option>)}</select></label>
            <label>Feed type<select {...usageForm.register('feedType')}>{feedTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            <label>Quantity kg<input type="number" step="0.1" {...usageForm.register('quantityKg')} /></label>
            <label>Notes<textarea rows={3} {...usageForm.register('notes')} /></label>
            <button className="primary-button" type="submit">Save usage</button>
          </div>
        </form>
      </section>
      <section className="panel">
        <div className="panel-heading"><h2>Feed on hand</h2><span>Low stock below 50 kg</span></div>
        <div className="table-list">
          {feedOnHand.map((item) => (
            <div className="table-row" key={item.feedType}>
              <strong>{item.feedType}</strong>
              <span>{Math.max(0, item.quantityKg).toFixed(1)} kg</span>
              <b className={item.quantityKg < 50 ? 'danger-text' : 'ok-text'}>{item.quantityKg < 50 ? 'Low stock' : 'Healthy'}</b>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
