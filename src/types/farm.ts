export type BirdType = 'Layers' | 'Broilers' | 'Kienyeji';
export type FlockStatus = 'Active' | 'Sold' | 'Dead' | 'Completed';
export type FeedType =
  | 'Chick mash'
  | 'Growers mash'
  | 'Layers mash'
  | 'Broiler starter'
  | 'Broiler finisher'
  | 'Custom feed';

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

export interface FarmData {
  profile: FarmerProfile;
  flocks: Flock[];
  eggLogs: EggLog[];
  feedStock: FeedStock[];
  feedUsage: FeedUsage[];
}
