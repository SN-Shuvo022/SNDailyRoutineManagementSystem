import React from 'react';
import { Menu, Sun } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { formatDateDisplay, getTodayStr, getGreeting } from '../utils/timeUtils';
import '../styles/Header.css';

export default function Header() {
  const { setSidebarOpen, settings } = useApp();
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
        <div className="header__status">
          <Sun size={18} />
          <span>Offline Mode</span>
        </div>
      </div>
    </header>
  );
}
