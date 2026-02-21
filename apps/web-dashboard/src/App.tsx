import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { useWebSocket } from './hooks/useWebSocket';

import DashboardPage from './pages/DashboardPage';
import SortingPlanPage from './pages/SortingPlanPage';
import MonitoringPage from './pages/MonitoringPage';
import StatisticsPage from './pages/StatisticsPage';
import AlarmsPage from './pages/AlarmsPage';
import LogsPage from './pages/LogsPage';
import RelayPage from './pages/RelayPage';
import KeyingPage from './pages/KeyingPage';
import ChuteDisplayPage from './pages/ChuteDisplayPage';
import SituationControlPage from './pages/SituationControlPage';

function App() {
  // Initialize WebSocket (simulation mode)
  useWebSocket('ws://localhost:3100');

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="sorting-plan" element={<SortingPlanPage />} />
        <Route path="monitoring" element={<MonitoringPage />} />
        <Route path="statistics" element={<StatisticsPage />} />
        <Route path="alarms" element={<AlarmsPage />} />
        <Route path="logs" element={<LogsPage />} />
        <Route path="relay" element={<RelayPage />} />
        <Route path="keying" element={<KeyingPage />} />
        <Route path="chute-display" element={<ChuteDisplayPage />} />
        <Route path="situation" element={<SituationControlPage />} />
      </Route>
    </Routes>
  );
}

export default App;
