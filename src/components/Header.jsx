import React, { useState } from 'react';
import { Menu, Sun, Smartphone, UserCheck, Cloud } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { formatDateDisplay, getTodayStr, getGreeting } from '../utils/timeUtils';
import AccountSyncModal from './AccountSyncModal';
import '../styles/Header.css';

export default function Header() {
  const { setSidebarOpen, settings, accountSync } = useApp();
  const [showSyncModal, setShowSyncModal] = useState(false);
  const today = getTodayStr();

  return (
    <header className="header">
      <div className="header__left">
        <button className="header__menu-btn" onClick={() => setSidebarOpen(true)}>
          <Menu size={24} />
        </button>
        <div className="header__greeting">
          <h2>{getGreeting()}{settings.name ? `, ${settings.name}` : ''}!</h2>
          <p>{formatDateDisplay(today)}</p>
        </div>
      </div>
      <div className="header__right">
        <button
          className="header__sync-btn"
          onClick={() => setShowSyncModal(true)}
          title="Account & Multi-Device Sync (Sync between Laptop and Phone)"
        >
          <Smartphone size={15} />
          <span>{accountSync?.isLoggedIn ? accountSync.accountId : 'Account & Sync'}</span>
          <span className={`sync-dot ${accountSync?.isLoggedIn ? 'sync-dot--active' : ''}`} />
        </button>

        <div className="header__status">
          <Sun size={16} />
          <span>Offline Ready</span>
        </div>
      </div>

      {showSyncModal && (
        <AccountSyncModal onClose={() => setShowSyncModal(false)} />
      )}
    </header>
  );
}
