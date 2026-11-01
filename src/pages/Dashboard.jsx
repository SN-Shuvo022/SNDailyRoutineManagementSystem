import React, { useMemo, useState } from 'react';
import {
  CalendarDays, CheckCircle2, Clock, ListTodo, Target, ArrowRight,
  BookOpen, Zap, TrendingUp, AlertCircle, FastForward
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import {
  getTodayStr, getTomorrowStr, formatDateDisplay, formatDuration,
  timeToMinutes, formatTimeDisplay, getGreeting, calculateFreeSlots, formatDateStr
} from '../utils/timeUtils';
import Timeline from '../components/Timeline';
import ShiftModal from '../components/ShiftModal';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const {
    settings, getAllActivitiesForDate, toggleActivityComplete,
    setCurrentPage, setSelectedDate, completionHistory, taskLibrary,
    activities
  } = useApp();

  const [showShiftModal, setShowShiftModal] = useState(false);
  const today = getTodayStr();
  const todayActivities = useMemo(
    () => getAllActivitiesForDate(today),
    [today, getAllActivitiesForDate, activities, completionHistory]
  );

  const stats = useMemo(() => {
    const total = todayActivities.length;
    const completed = todayActivities.filter(a => a.completed).length;
    const pending = total - completed;

    const freeSlots = calculateFreeSlots(todayActivities, settings.dayStartTime, settings.dayEndTime);
    const totalFreeMinutes = freeSlots.reduce((s, f) => s + f.duration, 0);

    const focusBlocks = todayActivities.filter(a => a.type === 'Focus Block');
    const focusMinutes = focusBlocks.reduce((s, a) =>
      s + (timeToMinutes(a.endTime) - timeToMinutes(a.startTime)), 0);
    const completedFocus = focusBlocks.filter(a => a.completed).length;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const upcoming = todayActivities
      .filter(a => timeToMinutes(a.startTime) > currentMinutes && !a.completed)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    const nextActivity = upcoming[0] || null;

    const weekStats = { completed: 0, planned: 0, thesisHours: 0 };
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = formatDateStr(d);
      const dayHistory = completionHistory[ds] || {};
      const dayActs = getAllActivitiesForDate(ds);
      weekStats.planned += dayActs.length;
      weekStats.completed += Object.values(dayHistory).filter(h => h.completed).length;
      const thesisActs = dayActs.filter(a =>
        (a.category === 'Thesis' || a.focusBlock === 'fb3') && a.completed
      );
      weekStats.thesisHours += thesisActs.reduce((s, a) =>
        s + (timeToMinutes(a.endTime) - timeToMinutes(a.startTime)) / 60, 0);
    }

    return {
      total, completed, pending, totalFreeMinutes,
      focusMinutes, completedFocus, totalFocus: focusBlocks.length,
      nextActivity, weekStats
    };
  }, [todayActivities, settings, completionHistory, getAllActivitiesForDate]);

  const handlePlanTomorrow = () => {
    setSelectedDate(getTomorrowStr());
    setCurrentPage('planner');
  };

  const thesisTasks = taskLibrary.filter(t => t.category === 'Thesis');
  const completedThesis = thesisTasks.filter(t => t.completed).length;

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <div>
          <h2 className="dashboard__title">Dashboard</h2>
          <p className="dashboard__subtitle">Your productivity at a glance</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn--outline btn--lg" onClick={() => setShowShiftModal(true)} title="Shift today's remaining activities (+30m, +15m) without changing prayer times">
            <FastForward size={18} />
            Quick Shift (+30m)
          </button>
          <button className="btn btn--primary btn--lg" onClick={handlePlanTomorrow}>
            <CalendarDays size={18} />
            Plan Tomorrow
          </button>
        </div>
      </div>

      <div className="dashboard__stats">
        <div className="stat-card stat-card--blue">
          <div className="stat-card__icon"><ListTodo size={24} /></div>
          <div className="stat-card__info">
            <span className="stat-card__value">{stats.total}</span>
            <span className="stat-card__label">Planned Activities</span>
          </div>
        </div>
        <div className="stat-card stat-card--green">
          <div className="stat-card__icon"><CheckCircle2 size={24} /></div>
          <div className="stat-card__info">
            <span className="stat-card__value">{stats.completed}</span>
            <span className="stat-card__label">Completed</span>
          </div>
        </div>
        <div className="stat-card stat-card--orange">
          <div className="stat-card__icon"><AlertCircle size={24} /></div>
          <div className="stat-card__info">
            <span className="stat-card__value">{stats.pending}</span>
            <span className="stat-card__label">Pending</span>
          </div>
        </div>
        <div className="stat-card stat-card--purple">
          <div className="stat-card__icon"><Clock size={24} /></div>
          <div className="stat-card__info">
            <span className="stat-card__value">{formatDuration(stats.totalFreeMinutes)}</span>
            <span className="stat-card__label">Free Time</span>
          </div>
        </div>
        <div className="stat-card stat-card--teal">
          <div className="stat-card__icon"><Zap size={24} /></div>
          <div className="stat-card__info">
            <span className="stat-card__value">{formatDuration(stats.focusMinutes)}</span>
            <span className="stat-card__label">Focus Time</span>
          </div>
        </div>
      </div>

      <div className="dashboard__grid">
        <div className="dashboard__card dashboard__card--wide">
          <h3><Clock size={18} /> Today's Timeline</h3>
          {todayActivities.length > 0 ? (
            <Timeline
              activities={todayActivities}
              onToggleComplete={(id) => toggleActivityComplete(id, today)}
              dateStr={today}
              compact
            />
          ) : (
            <div className="empty-state">
              <CalendarDays size={48} />
              <p>No activities planned for today</p>
              <button
                className="btn btn--primary"
                onClick={() => {
                  setSelectedDate(today);
                  setCurrentPage('planner');
                }}
              >
                Plan Today
              </button>
            </div>
          )}
        </div>

        <div className="dashboard__sidebar-cards">
          {stats.nextActivity && (
            <div className="dashboard__card">
              <h3><ArrowRight size={18} /> Next Up</h3>
              <div className="next-activity">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="next-activity__time">
                    {formatTimeDisplay(stats.nextActivity.startTime)}
                  </span>
                  <button
                    className="btn btn--sm btn--primary"
                    onClick={() => toggleActivityComplete(stats.nextActivity.id, today)}
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                    title="Mark this activity completed"
                  >
                    <CheckCircle2 size={13} /> Mark Done
                  </button>
                </div>
                <span className="next-activity__title">{stats.nextActivity.title}</span>
                <span className="next-activity__category">{stats.nextActivity.category}</span>
              </div>
            </div>
          )}

          <div className="dashboard__card">
            <h3><BookOpen size={18} /> Thesis Progress</h3>
            <div className="thesis-progress">
              <div className="thesis-progress__bar">
                <div
                  className="thesis-progress__fill"
                  style={{ width: thesisTasks.length > 0 ? `${(completedThesis / thesisTasks.length) * 100}%` : '0%' }}
                />
              </div>
              <span className="thesis-progress__text">
                {completedThesis}/{thesisTasks.length} tasks · {stats.weekStats.thesisHours.toFixed(1)}h this week
              </span>
            </div>
          </div>

          <div className="dashboard__card">
            <h3><TrendingUp size={18} /> Weekly Overview</h3>
            <div className="weekly-overview">
              <div className="weekly-stat">
                <span className="weekly-stat__value">{stats.weekStats.completed}</span>
                <span className="weekly-stat__label">Completed</span>
              </div>
              <div className="weekly-stat">
                <span className="weekly-stat__value">{stats.weekStats.planned}</span>
                <span className="weekly-stat__label">Planned</span>
              </div>
              <div className="weekly-stat">
                <span className="weekly-stat__value">
                  {stats.weekStats.planned > 0
                    ? Math.round((stats.weekStats.completed / stats.weekStats.planned) * 100)
                    : 0}%
                </span>
                <span className="weekly-stat__label">Rate</span>
              </div>
            </div>
          </div>

          <div className="dashboard__card">
            <h3><Target size={18} /> Focus Blocks</h3>
            <div className="focus-summary">
              <span>{stats.completedFocus}/{stats.totalFocus} completed today</span>
              {stats.totalFocus > 0 && (
                <div className="thesis-progress__bar" style={{ marginTop: '0.5rem' }}>
                  <div
                    className="thesis-progress__fill thesis-progress__fill--green"
                    style={{ width: `${(stats.completedFocus / stats.totalFocus) * 100}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showShiftModal && (
        <ShiftModal
          onClose={() => setShowShiftModal(false)}
          dateStr={today}
        />
      )}
    </div>
  );
}

