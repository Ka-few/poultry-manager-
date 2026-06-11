import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite } from '@capacitor-community/sqlite';
import { normalizeFarmData } from './localStore';
import type { FarmData } from '../types/farm';

const DB_NAME = 'poultry_manager';
const STATE_KEY = 'farm-data';

let initialized = false;

export function isSQLiteAvailable() {
  return Capacitor.isNativePlatform();
}

export async function initializeSQLite() {
  if (!isSQLiteAvailable() || initialized) return;

  await CapacitorSQLite.createConnection({
    database: DB_NAME,
    version: 1,
    encrypted: false,
    mode: 'no-encryption',
    readonly: false,
  });
  await CapacitorSQLite.open({ database: DB_NAME, readonly: false });
  await CapacitorSQLite.execute({
    database: DB_NAME,
    statements: `CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,
  });

  initialized = true;
}

export async function loadFarmDataFromSQLite() {
  if (!isSQLiteAvailable()) return undefined;

  await initializeSQLite();
  const result = await CapacitorSQLite.query({
    database: DB_NAME,
    statement: 'SELECT value FROM app_state WHERE key = ? LIMIT 1;',
    values: [STATE_KEY],
  });
  const row = result.values?.[0] as { value?: string } | undefined;

  if (!row?.value) return undefined;
  return normalizeFarmData(JSON.parse(row.value) as FarmData);
}

export async function persistFarmDataToSQLite(data: FarmData) {
  if (!isSQLiteAvailable()) return;

  await initializeSQLite();
  await CapacitorSQLite.run({
    database: DB_NAME,
    statement: `INSERT OR REPLACE INTO app_state (key, value, updated_at)
      VALUES (?, ?, ?);`,
    values: [STATE_KEY, JSON.stringify(data), new Date().toISOString()],
  });
}

export function getSQLiteConnection() {
  return initialized ? DB_NAME : undefined;
}
