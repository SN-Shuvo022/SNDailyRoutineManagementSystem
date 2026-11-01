import React from 'react';
import {
  LayoutDashboard, CalendarDays, Clock, Target, BarChart3, Settings, X, Menu
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import '../styles/Sidebar.css';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'planner', label: 'Daily Planner', icon: CalendarDays },
  { id: 'freetime', label: 'Free Time', icon: Clock },
  { id: 'goals', label: 'Goals & Tasks', icon: Target },
  { id: 'progress', label: 'Progress', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { currentPage, setCurrentPage, sidebarOpen, setSidebarOpen } = useApp();

  return (
    <>
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__header">
          <div className="sidebar__brand">
            <div className="sidebar__logo">
              <CalendarDays size={24} />
            </div>
            <div className="sidebar__brand-text">
              <h1>SN Daily Planner</h1>
              <p>Management System</p>
            </div>
          </div>
          <button className="sidebar__close" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar__nav">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`sidebar__nav-item ${currentPage === item.id ? 'sidebar__nav-item--active' : ''}`}
                onClick={() => {
                  setCurrentPage(item.id);
                  setSidebarOpen(false);
                }}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar__footer">
          <p>📍 Offline Personal Planner</p>
          <p className="sidebar__version">v1.0</p>
        </div>
      </aside>
    </>
  );
}
