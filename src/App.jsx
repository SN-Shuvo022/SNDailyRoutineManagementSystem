import React from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import DailyPlanner from './pages/DailyPlanner';
import FreeTime from './pages/FreeTime';
import GoalsAndTasks from './pages/GoalsAndTasks';
import Progress from './pages/Progress';
import Settings from './pages/Settings';
import AccountSyncModal from './components/AccountSyncModal';
import './App.css';

function MainContent() {
  const { currentPage, isSyncModalOpen, setIsSyncModalOpen } = useApp();

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Header />
        <main className="app-content">
          {currentPage === 'dashboard' && <Dashboard />}
          {currentPage === 'planner' && <DailyPlanner />}
          {currentPage === 'freetime' && <FreeTime />}
          {currentPage === 'goals' && <GoalsAndTasks />}
          {currentPage === 'progress' && <Progress />}
          {currentPage === 'settings' && <Settings />}
        </main>
      </div>

      {isSyncModalOpen && (
        <AccountSyncModal onClose={() => setIsSyncModalOpen(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
