import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Configuration } from './pages/Configuration';
import { AiAnalyst } from './pages/AiAnalyst';

import { DashboardProvider } from './contexts/DashboardContext';
import { LanguageProvider } from './contexts/LanguageContext';

function App() {
  return (
    <LanguageProvider>
      <DashboardProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="dashboard/:sectionId" element={<Dashboard />} />
              <Route path="config" element={<Configuration />} />
              <Route path="ai" element={<AiAnalyst />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </DashboardProvider>
    </LanguageProvider>
  );
}

export default App;
