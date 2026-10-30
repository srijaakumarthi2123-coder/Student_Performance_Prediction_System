import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import StudentProfilePage from './pages/StudentProfilePage';
import PredictionPage from './pages/PredictionPage';
import AnalyticsPage from './pages/AnalyticsPage';
import DatasetPage from './pages/DatasetPage';
import ReportsPage from './pages/ReportsPage';
import PredictionHistoryPage from './pages/PredictionHistoryPage';
import './index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('spp_auth') === 'true';
  });

  const handleLogin = () => {
    localStorage.setItem('spp_auth', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('spp_auth');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Router>
      <Layout onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/students/:id" element={<StudentProfilePage />} />
          <Route path="/performance-prediction" element={<PredictionPage />} />
          <Route path="/prediction" element={<Navigate to="/performance-prediction" replace />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/manage-dataset" element={<DatasetPage />} />
          <Route path="/dataset" element={<Navigate to="/manage-dataset" replace />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/prediction-history" element={<PredictionHistoryPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>

      </Layout>
    </Router>
  );
}

export default App;
