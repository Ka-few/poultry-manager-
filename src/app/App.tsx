import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { FarmDataProvider } from '../context/FarmDataContext';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { EggProductionPage } from '../features/eggs/EggProductionPage';
import { FeedPage } from '../features/feed/FeedPage';
import { FinancePage } from '../features/finance/FinancePage';
import { FlockDetailPage } from '../features/flocks/FlockDetailPage';
import { FlocksPage } from '../features/flocks/FlocksPage';
import { ProfilePage } from '../features/profile/ProfilePage';
import { ReportsPage } from '../features/reports/ReportsPage';
import { AppErrorBoundary } from './AppErrorBoundary';

export function App() {
  return (
    <AppErrorBoundary>
      <FarmDataProvider>
        <HashRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/flocks" element={<FlocksPage />} />
              <Route path="/flocks/:flockId" element={<FlockDetailPage />} />
              <Route path="/eggs" element={<EggProductionPage />} />
              <Route path="/feed" element={<FeedPage />} />
              <Route path="/finance" element={<FinancePage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </FarmDataProvider>
    </AppErrorBoundary>
  );
}
