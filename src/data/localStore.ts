import { addDays, formatISO, subDays } from 'date-fns';
import type { FarmData } from '../types/farm';

const STORAGE_KEY = 'poultry-manager:farm-data:v1';

const today = new Date();
const isoDate = (date: Date) => formatISO(date, { representation: 'date' });

export const seedFarmData: FarmData = {
  profile: {
    id: 'profile-local',
    farmerName: 'Mama Farm',
    farmName: 'Green Valley Poultry',
    farmLocation: 'Kenya',
    phoneNumber: '',
  },
  flocks: [
    {
      id: 'flock-layers-1',
      batchName: 'Layers Batch A',
      birdType: 'Layers',
      breed: 'Isa Brown',
      quantity: 180,
      source: 'Local supplier',
      purchaseDate: isoDate(subDays(today, 120)),
      ageWeeks: 18,
      status: 'Active',
      notes: 'Main egg production flock.',
      createdAt: formatISO(subDays(today, 120)),
      updatedAt: formatISO(today),
    },
    {
      id: 'flock-kienyeji-1',
      batchName: 'Kienyeji Growers',
      birdType: 'Kienyeji',
      breed: 'Improved Kienyeji',
      quantity: 75,
      source: 'Neighbour hatchery',
      purchaseDate: isoDate(subDays(today, 55)),
      ageWeeks: 8,
      status: 'Active',
      createdAt: formatISO(subDays(today, 55)),
      updatedAt: formatISO(today),
    },
  ],
  eggLogs: Array.from({ length: 14 }).map((_, index) => ({
    id: `egg-${index}`,
    date: isoDate(subDays(today, 13 - index)),
    flockId: 'flock-layers-1',
    eggsCollected: 118 + Math.round(Math.sin(index / 2) * 10) + index,
    brokenEggs: index % 5 === 0 ? 3 : 1,
    notes: '',
    createdAt: formatISO(subDays(today, 13 - index)),
  })),
  feedStock: [
    {
      id: 'feed-stock-1',
      feedType: 'Layers mash',
      quantityKg: 210,
      costKes: 16800,
      supplier: 'Agrovet',
      datePurchased: isoDate(subDays(today, 10)),
      createdAt: formatISO(subDays(today, 10)),
    },
    {
      id: 'feed-stock-2',
      feedType: 'Growers mash',
      quantityKg: 80,
      costKes: 6400,
      supplier: 'Agrovet',
      datePurchased: isoDate(subDays(today, 7)),
      createdAt: formatISO(subDays(today, 7)),
    },
  ],
  feedUsage: [
    {
      id: 'feed-usage-1',
      date: isoDate(subDays(today, 1)),
      flockId: 'flock-layers-1',
      feedType: 'Layers mash',
      quantityKg: 22,
      notes: '',
      createdAt: formatISO(subDays(today, 1)),
    },
    {
      id: 'feed-usage-2',
      date: isoDate(today),
      flockId: 'flock-kienyeji-1',
      feedType: 'Growers mash',
      quantityKg: 8,
      notes: '',
      createdAt: formatISO(today),
    },
  ],
};

export function loadFarmData(): FarmData {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    persistFarmData(seedFarmData);
    return seedFarmData;
  }

  return JSON.parse(raw) as FarmData;
}

export function persistFarmData(data: FarmData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export const nextVaccinations = [
  { id: 'vax-1', name: 'Newcastle', dueDate: isoDate(addDays(today, 5)), flockName: 'Layers Batch A' },
  { id: 'vax-2', name: 'Gumboro', dueDate: isoDate(addDays(today, 12)), flockName: 'Kienyeji Growers' },
];
