import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, type SQLiteDBConnection } from '@capacitor-community/sqlite';
import { sqliteSchema } from './schema';

let db: SQLiteDBConnection | undefined;

export async function initializeSQLite() {
  if (!Capacitor.isNativePlatform()) {
    return undefined;
  }

  try {
    const sqlite = new SQLiteConnection(CapacitorSQLite);
    const consistent = await sqlite.checkConnectionsConsistency();
    const existing = consistent.result ? await sqlite.isConnection('poultry_manager', false) : { result: false };
    db = existing.result
      ? await sqlite.retrieveConnection('poultry_manager', false)
      : await sqlite.createConnection('poultry_manager', false, 'no-encryption', 1, false);
    await db.open();

    for (const statement of sqliteSchema) {
      await db.execute(statement);
    }

    return db;
  } catch (error) {
    console.warn('SQLite initialization skipped; local storage remains available.', error);
    return undefined;
  }
}

export function getSQLiteConnection() {
  return db;
}
