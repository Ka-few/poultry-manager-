export const sqliteSchema = [
  `CREATE TABLE IF NOT EXISTS farmers (
    id TEXT PRIMARY KEY NOT NULL,
    farmer_name TEXT NOT NULL,
    farm_name TEXT NOT NULL,
    farm_location TEXT NOT NULL,
    phone_number TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS flocks (
    id TEXT PRIMARY KEY NOT NULL,
    batch_name TEXT NOT NULL,
    bird_type TEXT NOT NULL,
    breed TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    source TEXT NOT NULL,
    purchase_date TEXT NOT NULL,
    age_weeks INTEGER NOT NULL,
    status TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS egg_logs (
    id TEXT PRIMARY KEY NOT NULL,
    date TEXT NOT NULL,
    flock_id TEXT NOT NULL,
    eggs_collected INTEGER NOT NULL,
    broken_eggs INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (flock_id) REFERENCES flocks(id)
  );`,
  `CREATE TABLE IF NOT EXISTS feed_inventory (
    id TEXT PRIMARY KEY NOT NULL,
    feed_type TEXT NOT NULL,
    quantity_kg REAL NOT NULL,
    cost_kes REAL NOT NULL,
    supplier TEXT NOT NULL,
    date_purchased TEXT NOT NULL,
    created_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS feed_usage (
    id TEXT PRIMARY KEY NOT NULL,
    date TEXT NOT NULL,
    flock_id TEXT NOT NULL,
    feed_type TEXT NOT NULL,
    quantity_kg REAL NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (flock_id) REFERENCES flocks(id)
  );`,
  `CREATE TABLE IF NOT EXISTS mortality_logs (
    id TEXT PRIMARY KEY NOT NULL,
    date TEXT NOT NULL,
    flock_id TEXT NOT NULL,
    birds_lost INTEGER NOT NULL,
    suspected_cause TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (flock_id) REFERENCES flocks(id)
  );`,
  `CREATE TABLE IF NOT EXISTS vaccinations (
    id TEXT PRIMARY KEY NOT NULL,
    flock_id TEXT NOT NULL,
    vaccine_name TEXT NOT NULL,
    date_administered TEXT NOT NULL,
    next_due_date TEXT,
    dosage TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (flock_id) REFERENCES flocks(id)
  );`,
  `CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY NOT NULL,
    amount_kes REAL NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS income (
    id TEXT PRIMARY KEY NOT NULL,
    amount_kes REAL NOT NULL,
    source TEXT NOT NULL,
    date TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY NOT NULL,
    sale_type TEXT NOT NULL,
    quantity_sold REAL NOT NULL,
    price_kes REAL NOT NULL,
    customer TEXT,
    date TEXT NOT NULL,
    created_at TEXT NOT NULL
  );`,
];
