import { zodResolver } from '@hookform/resolvers/zod';
import { Edit3, PackagePlus, Trash2, Wheat, X } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { KpiCard } from '../../components/ui/KpiCard';
import { PageHeader } from '../../components/ui/PageHeader';
import { useFarmData } from '../../context/FarmDataContext';
import { getDailyFeedRate, getFeedOnHand, getMonthlyFeedSpend } from '../../services/farmAnalytics';
import type { FeedStock, FeedType, FeedUsage } from '../../types/farm';
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

const today = () => new Date().toISOString().slice(0, 10);

const getDefaultStockValues = (): StockForm => ({
  feedType: 'Layers mash',
  datePurchased: today(),
  quantityKg: 50,
  costKes: 0,
  supplier: '',
});

const getDefaultUsageValues = (flockId: string): UsageForm => ({
  date: today(),
  flockId,
  feedType: 'Layers mash',
  quantityKg: 0,
  notes: '',
});

export function FeedPage() {
  const { data, addFeedStock, updateFeedStock, deleteFeedStock, addFeedUsage, updateFeedUsage, deleteFeedUsage } = useFarmData();
  const [editingStock, setEditingStock] = useState<FeedStock | null>(null);
  const [editingUsage, setEditingUsage] = useState<FeedUsage | null>(null);
  const activeFlocks = data.flocks.filter((flock) => flock.status === 'Active');
  const fallbackFlockId = activeFlocks[0]?.id ?? data.flocks[0]?.id ?? '';
  const stockForm = useForm<StockForm>({
    resolver: zodResolver(stockSchema),
    defaultValues: getDefaultStockValues(),
  });
  const usageForm = useForm<UsageForm>({
    resolver: zodResolver(usageSchema),
    defaultValues: getDefaultUsageValues(fallbackFlockId),
  });
  const feedOnHand = getFeedOnHand(data.feedStock, data.feedUsage);
  const flockName = (flockId: string) => data.flocks.find((flock) => flock.id === flockId)?.batchName ?? 'Deleted flock';

  const clearStockEditing = () => {
    setEditingStock(null);
    stockForm.reset(getDefaultStockValues());
  };

  const clearUsageEditing = () => {
    setEditingUsage(null);
    usageForm.reset(getDefaultUsageValues(fallbackFlockId));
  };

  const saveStock = stockForm.handleSubmit((values) => {
    if (editingStock) {
      updateFeedStock({ ...editingStock, ...values });
    } else {
      addFeedStock(values);
    }
    clearStockEditing();
  });

  const saveUsage = usageForm.handleSubmit((values) => {
    if (editingUsage) {
      updateFeedUsage({ ...editingUsage, ...values });
    } else {
      addFeedUsage(values);
    }
    clearUsageEditing();
  });

  const startEditingStock = (stock: FeedStock) => {
    setEditingStock(stock);
    stockForm.reset({
      feedType: stock.feedType,
      quantityKg: stock.quantityKg,
      costKes: stock.costKes,
      supplier: stock.supplier,
      datePurchased: stock.datePurchased,
    });
  };

  const startEditingUsage = (usage: FeedUsage) => {
    setEditingUsage(usage);
    usageForm.reset({
      date: usage.date,
      flockId: usage.flockId,
      feedType: usage.feedType,
      quantityKg: usage.quantityKg,
      notes: usage.notes ?? '',
    });
  };

  return (
    <div className="page-stack">
      <PageHeader title="Feed management" eyebrow="Inventory and consumption" />
      <section className="kpi-grid compact">
        <KpiCard label="Monthly spend" value={kes.format(getMonthlyFeedSpend(data.feedStock))} hint="Feed purchases this month" icon={Wheat} tone="blue" />
        <KpiCard label="Daily rate" value={`${getDailyFeedRate(data.feedUsage).toFixed(1)} kg`} hint="Average recent usage" icon={Wheat} />
      </section>
      <section className="split-grid">
        <form className="form-panel" onSubmit={saveStock}>
          <div className="form-title"><PackagePlus size={24} aria-hidden /><h2>{editingStock ? 'Update feed stock' : 'Add feed stock'}</h2></div>
          <div className="form-grid single">
            <label>Feed type<select {...stockForm.register('feedType')}>{feedTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            <label>Quantity kg<input type="number" step="0.1" {...stockForm.register('quantityKg')} /></label>
            <label>Cost KES<input type="number" {...stockForm.register('costKes')} /></label>
            <label>Supplier<input {...stockForm.register('supplier')} placeholder="Agrovet or supplier" /></label>
            <label>Date purchased<input type="date" {...stockForm.register('datePurchased')} /></label>
            <div className="form-actions">
              <button className="primary-button" type="submit">{editingStock ? 'Update stock' : 'Save stock'}</button>
              {editingStock ? (
                <button className="secondary-button" type="button" onClick={clearStockEditing}><X size={20} aria-hidden /> Cancel</button>
              ) : null}
            </div>
          </div>
        </form>
        <form className="form-panel" onSubmit={saveUsage}>
          <div className="form-title"><Wheat size={24} aria-hidden /><h2>{editingUsage ? 'Update feed use' : 'Record feed use'}</h2></div>
          <div className="form-grid single">
            <label>Date<input type="date" {...usageForm.register('date')} /></label>
            <label>
              Flock
              <select {...usageForm.register('flockId')}>
                {data.flocks.map((flock) => <option key={flock.id} value={flock.id}>{flock.batchName}</option>)}
              </select>
            </label>
            <label>Feed type<select {...usageForm.register('feedType')}>{feedTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
            <label>Quantity kg<input type="number" step="0.1" {...usageForm.register('quantityKg')} /></label>
            <label>Notes<textarea rows={3} {...usageForm.register('notes')} /></label>
            <div className="form-actions">
              <button className="primary-button" type="submit">{editingUsage ? 'Update usage' : 'Save usage'}</button>
              {editingUsage ? (
                <button className="secondary-button" type="button" onClick={clearUsageEditing}><X size={20} aria-hidden /> Cancel</button>
              ) : null}
            </div>
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
      <section className="split-grid">
        <article className="panel">
          <div className="panel-heading"><h2>Feed purchases</h2><span>Edit or delete stock records</span></div>
          <div className="table-list">
            {data.feedStock.slice(0, 10).map((stock) => (
              <div className="table-row with-actions" key={stock.id}>
                <span>{stock.datePurchased}</span>
                <strong>{stock.feedType}</strong>
                <span>{stock.quantityKg} kg</span>
                <span>{kes.format(stock.costKes)}</span>
                <div className="row-actions">
                  <button className="icon-button" aria-label={`Edit ${stock.feedType} purchase`} onClick={() => startEditingStock(stock)}>
                    <Edit3 size={18} aria-hidden />
                  </button>
                  <button
                    className="icon-button danger"
                    aria-label={`Delete ${stock.feedType} purchase`}
                    onClick={() => {
                      if (window.confirm(`Delete ${stock.feedType} stock purchase from ${stock.datePurchased}?`)) {
                        deleteFeedStock(stock.id);
                        if (editingStock?.id === stock.id) clearStockEditing();
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
        <article className="panel">
          <div className="panel-heading"><h2>Feed usage logs</h2><span>Edit or delete consumption records</span></div>
          <div className="table-list">
            {data.feedUsage.slice(0, 10).map((usage) => (
              <div className="table-row with-actions" key={usage.id}>
                <span>{usage.date}</span>
                <strong>{usage.feedType}</strong>
                <span>{usage.quantityKg} kg</span>
                <span>{flockName(usage.flockId)}</span>
                <div className="row-actions">
                  <button className="icon-button" aria-label={`Edit ${usage.feedType} usage`} onClick={() => startEditingUsage(usage)}>
                    <Edit3 size={18} aria-hidden />
                  </button>
                  <button
                    className="icon-button danger"
                    aria-label={`Delete ${usage.feedType} usage`}
                    onClick={() => {
                      if (window.confirm(`Delete ${usage.feedType} usage from ${usage.date}?`)) {
                        deleteFeedUsage(usage.id);
                        if (editingUsage?.id === usage.id) clearUsageEditing();
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
    </div>
  );
}
