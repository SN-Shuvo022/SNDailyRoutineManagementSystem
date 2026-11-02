import React from 'react';
import { Menu, Sun, Smartphone } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { formatDateDisplay, getTodayStr, getGreeting } from '../utils/timeUtils';
import '../styles/Header.css';

export default function Header() {
  const {
    setSidebarOpen, settings, accountSync, setIsSyncModalOpen,
    isFirebaseConnected, lastRemoteSyncAt
  } = useApp();
  const today = getTodayStr();

  return (
    <header className="header">
      <div className="header__left">
        <button className="header__menu-btn" onClick={() => setSidebarOpen(true)}>
          <Menu size={24} />
        </button>
        <div className="header__greeting">
          <h2>{getGreeting()}{settings?.name ? `, ${settings.name}` : ''}!</h2>
          <p>{formatDateDisplay(today)}</p>
        </div>
      </div>
      <div className="header__right">
        {lastRemoteSyncAt && (
          <span style={{ fontSize: '0.75rem', color: '#065F46', backgroundColor: '#D1FAE5', padding: '0.2rem 0.55rem', borderRadius: '9999px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            ⚡ Live Synced ({lastRemoteSyncAt})
          </span>
        )}

        <button
          className="header__sync-btn"
          onClick={() => setIsSyncModalOpen(true)}
          title="Account & Multi-Device Sync (Sync between Laptop and Phone)"
          style={isFirebaseConnected ? { backgroundColor: '#FEF3C7', color: '#B45309', borderColor: '#FDE68A' } : {}}
        >
          {isFirebaseConnected ? '🔥' : <Smartphone size={15} />}
          <span>{accountSync?.accountId || 'SN-Shuvo'}</span>
          <span className={`sync-dot ${isFirebaseConnected || accountSync?.isLoggedIn ? 'sync-dot--active' : ''}`} />
        </button>

        <div className="header__status">
          <Sun size={16} />
          <span>Offline Ready</span>
        </div>
      </div>
    </header>
  );
}
