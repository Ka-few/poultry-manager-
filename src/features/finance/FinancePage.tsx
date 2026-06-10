import { zodResolver } from '@hookform/resolvers/zod';
import { Banknote, Edit3, ReceiptText, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { z } from 'zod';
import { KpiCard } from '../../components/ui/KpiCard';
import { PageHeader } from '../../components/ui/PageHeader';
import { useFarmData } from '../../context/FarmDataContext';
import { getExpenseBreakdown, getFinanceSummary, getFinanceTrend } from '../../services/farmAnalytics';
import type { Expense, ExpenseCategory, Income, IncomeSource } from '../../types/farm';
import { kes } from '../../utils/format';

const expenseCategories: ExpenseCategory[] = [
  'Feed',
  'Vaccination',
  'Medicine',
  'Pesticides',
  'Labour',
  'Utilities',
  'Transport',
  'Equipment',
  'Miscellaneous',
];

const incomeSources: IncomeSource[] = ['Egg sales', 'Chicken meat sales', 'Chick sales', 'Manure sales', 'Other income'];

const expenseSchema = z.object({
  amountKes: z.coerce.number().positive(),
  category: z.enum(expenseCategories as [ExpenseCategory, ...ExpenseCategory[]]),
  date: z.string().min(1),
  notes: z.string().optional(),
});

const incomeSchema = z.object({
  amountKes: z.coerce.number().positive(),
  source: z.enum(incomeSources as [IncomeSource, ...IncomeSource[]]),
  date: z.string().min(1),
  notes: z.string().optional(),
});

type ExpenseForm = z.infer<typeof expenseSchema>;
type IncomeForm = z.infer<typeof incomeSchema>;

const today = () => new Date().toISOString().slice(0, 10);

const defaultExpenseValues = (): ExpenseForm => ({
  amountKes: 0,
  category: 'Feed',
  date: today(),
  notes: '',
});

const defaultIncomeValues = (): IncomeForm => ({
  amountKes: 0,
  source: 'Egg sales',
  date: today(),
  notes: '',
});

export function FinancePage() {
  const {
    data,
    addExpense,
    updateExpense,
    deleteExpense,
    addIncome,
    updateIncome,
    deleteIncome,
  } = useFarmData();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const expenseForm = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: defaultExpenseValues(),
  });
  const incomeForm = useForm<IncomeForm>({
    resolver: zodResolver(incomeSchema),
    defaultValues: defaultIncomeValues(),
  });
  const summary = getFinanceSummary(data.income, data.expenses);
  const trend = getFinanceTrend(data.income, data.expenses);
  const expenseBreakdown = getExpenseBreakdown(data.expenses);

  const clearExpenseEditing = () => {
    setEditingExpense(null);
    expenseForm.reset(defaultExpenseValues());
  };

  const clearIncomeEditing = () => {
    setEditingIncome(null);
    incomeForm.reset(defaultIncomeValues());
  };

  const saveExpense = expenseForm.handleSubmit((values) => {
    if (editingExpense) {
      updateExpense({ ...editingExpense, ...values });
    } else {
      addExpense(values);
    }
    clearExpenseEditing();
  });

  const saveIncome = incomeForm.handleSubmit((values) => {
    if (editingIncome) {
      updateIncome({ ...editingIncome, ...values });
    } else {
      addIncome(values);
    }
    clearIncomeEditing();
  });

  const startExpenseEditing = (expense: Expense) => {
    setEditingExpense(expense);
    expenseForm.reset({
      amountKes: expense.amountKes,
      category: expense.category,
      date: expense.date,
      notes: expense.notes ?? '',
    });
  };

  const startIncomeEditing = (income: Income) => {
    setEditingIncome(income);
    incomeForm.reset({
      amountKes: income.amountKes,
      source: income.source,
      date: income.date,
      notes: income.notes ?? '',
    });
  };

  return (
    <div className="page-stack">
      <PageHeader title="Finance" eyebrow="Income, expenses and profit" />

      <section className="kpi-grid">
        <KpiCard label="Total income" value={kes.format(summary.totalIncome)} hint="All recorded sales" icon={Banknote} tone="green" />
        <KpiCard label="Total expenses" value={kes.format(summary.totalExpenses)} hint="All farm costs" icon={ReceiptText} tone="red" />
        <KpiCard label="Net profit" value={kes.format(summary.netProfit)} hint="Income minus expenses" icon={Banknote} tone={summary.netProfit >= 0 ? 'blue' : 'red'} />
        <KpiCard label="This month" value={kes.format(summary.monthlyProfit)} hint="Monthly profit/loss" icon={ReceiptText} tone={summary.monthlyProfit >= 0 ? 'green' : 'red'} />
      </section>

      <section className="split-grid">
        <form className="form-panel" onSubmit={saveExpense}>
          <div className="form-title"><ReceiptText size={24} aria-hidden /><h2>{editingExpense ? 'Update expense' : 'Record expense'}</h2></div>
          <div className="form-grid single">
            <label>Amount KES<input type="number" {...expenseForm.register('amountKes')} /></label>
            <label>Category<select {...expenseForm.register('category')}>{expenseCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
            <label>Date<input type="date" {...expenseForm.register('date')} /></label>
            <label>Notes<textarea rows={3} {...expenseForm.register('notes')} placeholder="Vaccination, labour, pesticide, feed..." /></label>
            <div className="form-actions">
              <button className="primary-button" type="submit">{editingExpense ? 'Update expense' : 'Save expense'}</button>
              {editingExpense ? <button className="secondary-button" type="button" onClick={clearExpenseEditing}><X size={20} aria-hidden /> Cancel</button> : null}
            </div>
          </div>
        </form>

        <form className="form-panel" onSubmit={saveIncome}>
          <div className="form-title"><Banknote size={24} aria-hidden /><h2>{editingIncome ? 'Update income' : 'Record income'}</h2></div>
          <div className="form-grid single">
            <label>Amount KES<input type="number" {...incomeForm.register('amountKes')} /></label>
            <label>Source<select {...incomeForm.register('source')}>{incomeSources.map((source) => <option key={source}>{source}</option>)}</select></label>
            <label>Date<input type="date" {...incomeForm.register('date')} /></label>
            <label>Notes<textarea rows={3} {...incomeForm.register('notes')} placeholder="Eggs, meat, manure, chicks..." /></label>
            <div className="form-actions">
              <button className="primary-button" type="submit">{editingIncome ? 'Update income' : 'Save income'}</button>
              {editingIncome ? <button className="secondary-button" type="button" onClick={clearIncomeEditing}><X size={20} aria-hidden /> Cancel</button> : null}
            </div>
          </div>
        </form>
      </section>

      <section className="dashboard-grid">
        <article className="panel chart-panel">
          <div className="panel-heading"><h2>Income vs expenses</h2><span>Monthly report</span></div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dfe8df" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip formatter={(value) => kes.format(Number(value))} />
              <Bar dataKey="income" fill="#1f7a55" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expenses" fill="#b9412d" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="panel">
          <div className="panel-heading"><h2>Expense breakdown</h2><span>By category</span></div>
          <div className="table-list">
            {expenseBreakdown.map((item) => (
              <div className="table-row" key={item.category}>
                <strong>{item.category}</strong>
                <span>{kes.format(item.amount)}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="split-grid">
        <article className="panel">
          <div className="panel-heading"><h2>Expense records</h2><span>Edit or delete costs</span></div>
          <div className="table-list">
            {data.expenses.slice(0, 12).map((expense) => (
              <div className="table-row with-actions" key={expense.id}>
                <span>{expense.date}</span>
                <strong>{expense.category}</strong>
                <span>{kes.format(expense.amountKes)}</span>
                <span>{expense.notes || 'No notes'}</span>
                <div className="row-actions">
                  <button className="icon-button" aria-label={`Edit ${expense.category} expense`} onClick={() => startExpenseEditing(expense)}><Edit3 size={18} aria-hidden /></button>
                  <button
                    className="icon-button danger"
                    aria-label={`Delete ${expense.category} expense`}
                    onClick={() => {
                      if (window.confirm(`Delete ${expense.category} expense from ${expense.date}?`)) {
                        deleteExpense(expense.id);
                        if (editingExpense?.id === expense.id) clearExpenseEditing();
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
          <div className="panel-heading"><h2>Income records</h2><span>Edit or delete sales</span></div>
          <div className="table-list">
            {data.income.slice(0, 12).map((income) => (
              <div className="table-row with-actions" key={income.id}>
                <span>{income.date}</span>
                <strong>{income.source}</strong>
                <span>{kes.format(income.amountKes)}</span>
                <span>{income.notes || 'No notes'}</span>
                <div className="row-actions">
                  <button className="icon-button" aria-label={`Edit ${income.source}`} onClick={() => startIncomeEditing(income)}><Edit3 size={18} aria-hidden /></button>
                  <button
                    className="icon-button danger"
                    aria-label={`Delete ${income.source}`}
                    onClick={() => {
                      if (window.confirm(`Delete ${income.source} from ${income.date}?`)) {
                        deleteIncome(income.id);
                        if (editingIncome?.id === income.id) clearIncomeEditing();
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
