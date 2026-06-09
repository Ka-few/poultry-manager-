# Poultry Manager

A modern, offline-first poultry farm management Android application for smallholder poultry farmers in Kenya.

## Phase 1 MVP

This version focuses on the core daily workflows:

- Dashboard with flock, egg, feed, revenue, expense, and profit indicators
- Flock management with search, filters, batch profiles, status updates, and archive flow
- Daily egg production logging with weekly insight text and charts
- Feed stock purchases, feed usage logs, cost tracking, and low-stock alerts
- Local farmer profile

## Architecture

- `src/features/*` contains module screens grouped by farm workflow.
- `src/context/FarmDataContext.tsx` is the app state boundary for the MVP.
- `src/data/schema.ts` defines the normalized SQLite schema for Phase 1 plus planned Phase 2/3 tables.
- `src/data/sqliteClient.ts` initializes SQLite on native Capacitor builds.
- `src/data/localStore.ts` provides browser-friendly offline persistence during web development.
- `src/services/farmAnalytics.ts` contains reusable reporting and KPI calculations.

The current web build persists locally with `localStorage` so the MVP can be tested immediately. Android builds initialize the SQLite schema through Capacitor; the next production step is to move the repository methods from the context into SQLite-backed repositories for native CRUD operations.

## Getting Started

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

Prepare Android:

```bash
npm run build
npm run android:add
npm run android:sync
npm run android:open
```

## Roadmap

Phase 2:

- Mortality tracking
- Vaccination and medication schedules
- Finance management

Phase 3:

- Reports and analytics exports
- Offline notifications and reminders
- PDF/print support
