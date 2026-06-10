export type BirdType = 'Layers' | 'Broilers' | 'Kienyeji';
export type FlockStatus = 'Active' | 'Sold' | 'Dead' | 'Completed';
export type FeedType =
  | 'Chick mash'
  | 'Growers mash'
  | 'Layers mash'
  | 'Broiler starter'
  | 'Broiler finisher'
  | 'Custom feed';
export type ExpenseCategory =
  | 'Feed'
  | 'Vaccination'
  | 'Medicine'
  | 'Pesticides'
  | 'Labour'
  | 'Utilities'
  | 'Transport'
  | 'Equipment'
  | 'Miscellaneous';
export type IncomeSource = 'Egg sales' | 'Chicken meat sales' | 'Chick sales' | 'Manure sales' | 'Other income';
export type MortalityCause = 'Disease' | 'Predators' | 'Weather' | 'Accident' | 'Unknown' | 'Other';
export type HealthRecordType = 'Vaccination' | 'Medication' | 'Treatment';

export interface FarmerProfile {
  id: string;
  farmerName: string;
  farmName: string;
  farmLocation: string;
  phoneNumber: string;
}

export interface Flock {
  id: string;
  batchName: string;
  birdType: BirdType;
  breed: string;
  quantity: number;
  source: string;
  purchaseDate: string;
  ageWeeks: number;
  status: FlockStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EggLog {
  id: string;
  date: string;
  flockId: string;
  eggsCollected: number;
  brokenEggs: number;
  notes?: string;
  createdAt: string;
}

export interface FeedStock {
  id: string;
  feedType: FeedType;
  quantityKg: number;
  costKes: number;
  supplier: string;
  datePurchased: string;
  createdAt: string;
}

export interface FeedUsage {
  id: string;
  date: string;
  flockId: string;
  feedType: FeedType;
  quantityKg: number;
  notes?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  amountKes: number;
  category: ExpenseCategory;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface Income {
  id: string;
  amountKes: number;
  source: IncomeSource;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface MortalityLog {
  id: string;
  flockId: string;
  date: string;
  birdsLost: number;
  suspectedCause: MortalityCause;
  notes?: string;
  createdAt: string;
}

export interface HealthRecord {
  id: string;
  flockId: string;
  recordType: HealthRecordType;
  name: string;
  dateAdministered: string;
  nextDueDate?: string;
  dosage?: string;
  notes?: string;
  createdAt: string;
}

export interface FarmData {
  profile: FarmerProfile;
  flocks: Flock[];
  eggLogs: EggLog[];
  feedStock: FeedStock[];
  feedUsage: FeedUsage[];
  expenses: Expense[];
  income: Income[];
  mortalityLogs: MortalityLog[];
  healthRecords: HealthRecord[];
}
