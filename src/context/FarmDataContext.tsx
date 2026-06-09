import { formatISO } from 'date-fns';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createId, loadFarmData, persistFarmData } from '../data/localStore';
import { initializeSQLite } from '../data/sqliteClient';
import type { EggLog, FarmData, FeedStock, FeedUsage, Flock, FarmerProfile } from '../types/farm';

interface FarmDataContextValue {
  data: FarmData;
  saveProfile: (profile: FarmerProfile) => void;
  addFlock: (flock: Omit<Flock, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateFlock: (flock: Flock) => void;
  addEggLog: (log: Omit<EggLog, 'id' | 'createdAt'>) => void;
  addFeedStock: (stock: Omit<FeedStock, 'id' | 'createdAt'>) => void;
  addFeedUsage: (usage: Omit<FeedUsage, 'id' | 'createdAt'>) => void;
}

const FarmDataContext = createContext<FarmDataContextValue | undefined>(undefined);

export function FarmDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<FarmData>(() => loadFarmData());

  useEffect(() => {
    void initializeSQLite();
  }, []);

  useEffect(() => {
    persistFarmData(data);
  }, [data]);

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
      addEggLog: (log) =>
        setData((current) => ({
          ...current,
          eggLogs: [{ ...log, id: createId('egg'), createdAt: formatISO(new Date()) }, ...current.eggLogs],
        })),
      addFeedStock: (stock) =>
        setData((current) => ({
          ...current,
          feedStock: [{ ...stock, id: createId('feed-stock'), createdAt: formatISO(new Date()) }, ...current.feedStock],
        })),
      addFeedUsage: (usage) =>
        setData((current) => ({
          ...current,
          feedUsage: [{ ...usage, id: createId('feed-usage'), createdAt: formatISO(new Date()) }, ...current.feedUsage],
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
