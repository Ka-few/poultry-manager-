import { formatISO } from 'date-fns';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createId, loadFarmData, persistFarmData } from '../data/localStore';
import { isSQLiteAvailable, loadFarmDataFromSQLite, persistFarmDataToSQLite } from '../data/sqliteClient';
import type {
  EggLog,
  Expense,
  FarmData,
  FeedStock,
  FeedUsage,
  Flock,
  FarmerProfile,
  HealthRecord,
  Income,
  MortalityLog,
} from '../types/farm';

interface FarmDataContextValue {
  data: FarmData;
  saveProfile: (profile: FarmerProfile) => void;
  addFlock: (flock: Omit<Flock, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateFlock: (flock: Flock) => void;
  deleteFlock: (flockId: string) => void;
  addEggLog: (log: Omit<EggLog, 'id' | 'createdAt'>) => void;
  updateEggLog: (log: EggLog) => void;
  deleteEggLog: (logId: string) => void;
  addFeedStock: (stock: Omit<FeedStock, 'id' | 'createdAt'>) => void;
  updateFeedStock: (stock: FeedStock) => void;
  deleteFeedStock: (stockId: string) => void;
  addFeedUsage: (usage: Omit<FeedUsage, 'id' | 'createdAt'>) => void;
  updateFeedUsage: (usage: FeedUsage) => void;
  deleteFeedUsage: (usageId: string) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (expenseId: string) => void;
  addIncome: (income: Omit<Income, 'id' | 'createdAt'>) => void;
  updateIncome: (income: Income) => void;
  deleteIncome: (incomeId: string) => void;
  addMortalityLog: (log: Omit<MortalityLog, 'id' | 'createdAt'>) => void;
  updateMortalityLog: (log: MortalityLog) => void;
  deleteMortalityLog: (logId: string) => void;
  addHealthRecord: (record: Omit<HealthRecord, 'id' | 'createdAt'>) => void;
  updateHealthRecord: (record: HealthRecord) => void;
  deleteHealthRecord: (recordId: string) => void;
}

const FarmDataContext = createContext<FarmDataContextValue | undefined>(undefined);

export function FarmDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<FarmData>(() => loadFarmData());
  const [nativeStorageReady, setNativeStorageReady] = useState(!isSQLiteAvailable());

  useEffect(() => {
    if (!isSQLiteAvailable()) return;

    let cancelled = false;

    async function hydrateNativeData() {
      try {
        const sqliteData = await loadFarmDataFromSQLite();
        if (cancelled) return;

        if (sqliteData) {
          setData(sqliteData);
        } else {
          await persistFarmDataToSQLite(data);
        }
      } catch (error) {
        console.warn('SQLite storage unavailable; falling back to WebView storage.', error);
      } finally {
        if (!cancelled) setNativeStorageReady(true);
      }
    }

    void hydrateNativeData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    persistFarmData(data);
    if (nativeStorageReady) {
      persistFarmDataToSQLite(data).catch((error) => {
        console.warn('Could not persist farm data to SQLite.', error);
      });
    }
  }, [data, nativeStorageReady]);

  const value = useMemo<FarmDataContextValue>(
    () => ({
      data,
      saveProfile: (profile) => setData((current) => ({ ...current, profile })),
      addFlock: (flock) =>
        setData((current) => ({
          ...current,
          flocks: [
            {
              ...flock,
              id: createId('flock'),
              createdAt: formatISO(new Date()),
              updatedAt: formatISO(new Date()),
            },
            ...current.flocks,
          ],
        })),
      updateFlock: (flock) =>
        setData((current) => ({
          ...current,
          flocks: current.flocks.map((item) =>
            item.id === flock.id ? { ...flock, updatedAt: formatISO(new Date()) } : item,
          ),
        })),
      deleteFlock: (flockId) =>
        setData((current) => ({
          ...current,
          flocks: current.flocks.filter((item) => item.id !== flockId),
          eggLogs: current.eggLogs.filter((item) => item.flockId !== flockId),
          feedUsage: current.feedUsage.filter((item) => item.flockId !== flockId),
          mortalityLogs: current.mortalityLogs.filter((item) => item.flockId !== flockId),
          healthRecords: current.healthRecords.filter((item) => item.flockId !== flockId),
        })),
      addEggLog: (log) =>
        setData((current) => ({
          ...current,
          eggLogs: [{ ...log, id: createId('egg'), createdAt: formatISO(new Date()) }, ...current.eggLogs],
        })),
      updateEggLog: (log) =>
        setData((current) => ({
          ...current,
          eggLogs: current.eggLogs.map((item) => (item.id === log.id ? log : item)),
        })),
      deleteEggLog: (logId) =>
        setData((current) => ({
          ...current,
          eggLogs: current.eggLogs.filter((item) => item.id !== logId),
        })),
      addFeedStock: (stock) =>
        setData((current) => ({
          ...current,
          feedStock: [{ ...stock, id: createId('feed-stock'), createdAt: formatISO(new Date()) }, ...current.feedStock],
        })),
      updateFeedStock: (stock) =>
        setData((current) => ({
          ...current,
          feedStock: current.feedStock.map((item) => (item.id === stock.id ? stock : item)),
        })),
      deleteFeedStock: (stockId) =>
        setData((current) => ({
          ...current,
          feedStock: current.feedStock.filter((item) => item.id !== stockId),
        })),
      addFeedUsage: (usage) =>
        setData((current) => ({
          ...current,
          feedUsage: [{ ...usage, id: createId('feed-usage'), createdAt: formatISO(new Date()) }, ...current.feedUsage],
        })),
      updateFeedUsage: (usage) =>
        setData((current) => ({
          ...current,
          feedUsage: current.feedUsage.map((item) => (item.id === usage.id ? usage : item)),
        })),
      deleteFeedUsage: (usageId) =>
        setData((current) => ({
          ...current,
          feedUsage: current.feedUsage.filter((item) => item.id !== usageId),
        })),
      addExpense: (expense) =>
        setData((current) => ({
          ...current,
          expenses: [{ ...expense, id: createId('expense'), createdAt: formatISO(new Date()) }, ...current.expenses],
        })),
      updateExpense: (expense) =>
        setData((current) => ({
          ...current,
          expenses: current.expenses.map((item) => (item.id === expense.id ? expense : item)),
        })),
      deleteExpense: (expenseId) =>
        setData((current) => ({
          ...current,
          expenses: current.expenses.filter((item) => item.id !== expenseId),
        })),
      addIncome: (income) =>
        setData((current) => ({
          ...current,
          income: [{ ...income, id: createId('income'), createdAt: formatISO(new Date()) }, ...current.income],
        })),
      updateIncome: (income) =>
        setData((current) => ({
          ...current,
          income: current.income.map((item) => (item.id === income.id ? income : item)),
        })),
      deleteIncome: (incomeId) =>
        setData((current) => ({
          ...current,
          income: current.income.filter((item) => item.id !== incomeId),
        })),
      addMortalityLog: (log) =>
        setData((current) => ({
          ...current,
          flocks: current.flocks.map((flock) =>
            flock.id === log.flockId
              ? { ...flock, quantity: Math.max(0, flock.quantity - log.birdsLost), updatedAt: formatISO(new Date()) }
              : flock,
          ),
          mortalityLogs: [{ ...log, id: createId('mortality'), createdAt: formatISO(new Date()) }, ...current.mortalityLogs],
        })),
      updateMortalityLog: (log) =>
        setData((current) => {
          const previous = current.mortalityLogs.find((item) => item.id === log.id);
          const difference = log.birdsLost - (previous?.birdsLost ?? 0);

          return {
            ...current,
            flocks: current.flocks.map((flock) =>
              flock.id === log.flockId
                ? { ...flock, quantity: Math.max(0, flock.quantity - difference), updatedAt: formatISO(new Date()) }
                : flock,
            ),
            mortalityLogs: current.mortalityLogs.map((item) => (item.id === log.id ? log : item)),
          };
        }),
      deleteMortalityLog: (logId) =>
        setData((current) => {
          const previous = current.mortalityLogs.find((item) => item.id === logId);

          return {
            ...current,
            flocks: previous
              ? current.flocks.map((flock) =>
                  flock.id === previous.flockId
                    ? { ...flock, quantity: flock.quantity + previous.birdsLost, updatedAt: formatISO(new Date()) }
                    : flock,
                )
              : current.flocks,
            mortalityLogs: current.mortalityLogs.filter((item) => item.id !== logId),
          };
        }),
      addHealthRecord: (record) =>
        setData((current) => ({
          ...current,
          healthRecords: [{ ...record, id: createId('health'), createdAt: formatISO(new Date()) }, ...current.healthRecords],
        })),
      updateHealthRecord: (record) =>
        setData((current) => ({
          ...current,
          healthRecords: current.healthRecords.map((item) => (item.id === record.id ? record : item)),
        })),
      deleteHealthRecord: (recordId) =>
        setData((current) => ({
          ...current,
          healthRecords: current.healthRecords.filter((item) => item.id !== recordId),
        })),
    }),
    [data],
  );

  return <FarmDataContext.Provider value={value}>{children}</FarmDataContext.Provider>;
}

export function useFarmData() {
  const context = useContext(FarmDataContext);
  if (!context) {
    throw new Error('useFarmData must be used inside FarmDataProvider');
  }
  return context;
}
