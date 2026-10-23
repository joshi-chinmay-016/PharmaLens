import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { InvestigationsListPage } from './pages/InvestigationsListPage';
import { InvestigationWorkspacePage } from './pages/InvestigationWorkspacePage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Flagship Product Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Core Workspace & Operational Shell */}
        <Route element={<MainLayout />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="investigations" element={<InvestigationsListPage />} />
          <Route path="investigations/new" element={<InvestigationWorkspacePage />} />
          <Route path="investigations/:id" element={<InvestigationWorkspacePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback to Landing Page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
