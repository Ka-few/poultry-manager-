import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, type SQLiteDBConnection } from '@capacitor-community/sqlite';
import { sqliteSchema } from './schema';

let db: SQLiteDBConnection | undefined;

export async function initializeSQLite() {
  if (!Capacitor.isNativePlatform()) {
    return undefined;
  }

  const sqlite = new SQLiteConnection(CapacitorSQLite);
  db = await sqlite.createConnection('poultry_manager', false, 'no-encryption', 1, false);
  await db.open();

  for (const statement of sqliteSchema) {
    await db.execute(statement);
  }

  return db;
}

export function getSQLiteConnection() {
  return db;
}
