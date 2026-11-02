import React, { useMemo, useState } from 'react';
import {
  CalendarDays, CheckCircle2, Clock, ListTodo, Target, ArrowRight,
  BookOpen, Zap, TrendingUp, AlertCircle, FastForward, XCircle, Moon, Check
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import {
  getTodayStr, getTomorrowStr, formatDateDisplay, formatDuration,
  timeToMinutes, formatTimeDisplay, getGreeting, calculateFreeSlots, formatDateStr
} from '../utils/timeUtils';
import Timeline from '../components/Timeline';
import ShiftModal from '../components/ShiftModal';
import NoteModal from '../components/NoteModal';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const {
    settings, getAllActivitiesForDate, toggleActivityComplete,
    toggleActivityMissed, updateActivityNote,
    setCurrentPage, setSelectedDate, completionHistory, taskLibrary,
    activities, isMinimumViableDay, toggleMinimumViableDay,
    thesisConfig, toggleThesisMilestone
  } = useApp();

  const [showShiftModal, setShowShiftModal] = useState(false);
  const [noteModalAct, setNoteModalAct] = useState(null);

  const today = getTodayStr();
  const isMvd = isMinimumViableDay(today);

  const todayActivities = useMemo(
    () => getAllActivitiesForDate(today),
    [today, getAllActivitiesForDate, activities, completionHistory]
  );

  const stats = useMemo(() => {
    const total = todayActivities.length;
    const completed = todayActivities.filter(a => a.completed || a.status === 'completed').length;
    const missed = todayActivities.filter(a => a.status === 'missed').length;
    const pending = Math.max(0, total - completed - missed);

    const freeSlots = calculateFreeSlots(todayActivities, settings.dayStartTime, settings.dayEndTime);
    const totalFreeMinutes = freeSlots.reduce((s, f) => s + f.duration, 0);

    const focusBlocks = todayActivities.filter(a => a.type === 'Focus Block');
    const focusMinutes = focusBlocks.reduce((s, a) =>
      s + (timeToMinutes(a.endTime) - timeToMinutes(a.startTime)), 0);
    const completedFocus = focusBlocks.filter(a => a.completed || a.status === 'completed').length;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const upcoming = todayActivities
      .filter(a => timeToMinutes(a.startTime) > currentMinutes && !a.completed && a.status !== 'missed')
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
      total, completed, missed, pending, totalFreeMinutes,
      focusMinutes, completedFocus, totalFocus: focusBlocks.length,
      nextActivity, weekStats
    };
  }, [todayActivities, settings, completionHistory, getAllActivitiesForDate]);

  const handlePlanTomorrow = () => {
    setSelectedDate(getTomorrowStr());
    setCurrentPage('planner');
  };

  // Thesis countdown calculation
  const targetDateObj = thesisConfig?.targetDate ? new Date(thesisConfig.targetDate + 'T00:00:00') : null;
  const now = new Date();
  const diffDays = targetDateObj ? Math.ceil((targetDateObj - now) / (1000 * 60 * 60 * 24)) : 0;
  const totalMilestones = thesisConfig?.milestones?.length || 0;
  const completedMilestones = thesisConfig?.milestones?.filter(m => m.completed)?.length || 0;
  const milestonePercent = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <div>
          <h2 className="dashboard__title">Dashboard</h2>
          <p className="dashboard__subtitle">Your productivity at a glance</p>
        </div>
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            className={`btn ${isMvd ? 'btn--warning' : 'btn--outline'}`}
            onClick={() => toggleMinimumViableDay(today)}
            title="Toggle Low-Energy / Minimum Viable Day mode"
            style={{ fontWeight: 600 }}
          >
            <Moon size={16} />
            {isMvd ? '🌙 MVD Mode Active' : '🌙 Low-Energy Mode'}
          </button>
          <button
            className="btn btn--outline"
            onClick={() => setShowShiftModal(true)}
            title="Shift today's remaining activities (+30m, +15m) without changing prayer times"
          >
            <FastForward size={16} />
            Quick Shift (+30m)
          </button>
          <button className="btn btn--primary" onClick={handlePlanTomorrow}>
            <CalendarDays size={16} />
            Plan Tomorrow
          </button>
        </div>
      </div>

      {/* Feature 4: Minimum Viable Day Supportive Banner */}
      {isMvd && (
        <div className="mvd-banner">
          <div className="mvd-banner__content">
            <span className="mvd-banner__emoji">🌙</span>
            <div>
              <strong>Minimum Viable Day Mode Active (আজকের জন্য লো-এনার্জি মোড)</strong>
              <p>আজ ক্লান্তি বা অসুস্থতার কারণে অতিরিক্ত কাজের মানসিক চাপ নেবেন না। শুধু ৫ ওয়াক্ত নামাজ, স্বাভাবিক খাবার ও বিশ্রামে মনযোগ দিন। কাল আবার নতুন উদ্যমে শুরু হবে।</p>
            </div>
          </div>
          <button className="btn btn--sm btn--outline" onClick={() => toggleMinimumViableDay(today)}>
            Exit Mode
          </button>
        </div>
      )}

      {/* Stats Cards */}
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
        <div className="stat-card stat-card--red">
          <div className="stat-card__icon"><XCircle size={24} /></div>
          <div className="stat-card__info">
            <span className="stat-card__value">{stats.missed}</span>
            <span className="stat-card__label">Missed</span>
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
        {/* Left Column: Timeline with 3 action buttons (Check, Cross, Note) */}
        <div className="dashboard__card dashboard__card--wide">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3><Clock size={18} /> Today's Timeline</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Actions: [✔ Done] [✖ Missed] [📝 Note]
            </span>
          </div>

          {todayActivities.length > 0 ? (
            <Timeline
              activities={todayActivities}
              onToggleComplete={(id) => toggleActivityComplete(id, today)}
              onToggleMissed={(id) => toggleActivityMissed(id, today)}
              onOpenNote={(act) => setNoteModalAct(act)}
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

        {/* Right Column: Widgets */}
        <div className="dashboard__sidebar-cards">
          {/* Next Up Card */}
          {stats.nextActivity && (
            <div className="dashboard__card">
              <h3><ArrowRight size={18} /> Next Up</h3>
              <div className="next-activity">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="next-activity__time">
                    {formatTimeDisplay(stats.nextActivity.startTime)}
                  </span>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      className="btn btn--sm btn--primary"
                      onClick={() => toggleActivityComplete(stats.nextActivity.id, today)}
                      style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                      title="Mark this activity completed"
                    >
                      <CheckCircle2 size={13} /> Done
                    </button>
                    <button
                      className="btn btn--sm btn--danger"
                      onClick={() => toggleActivityMissed(stats.nextActivity.id, today)}
                      style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                      title="Mark as missed"
                    >
                      <XCircle size={13} />
                    </button>
                  </div>
                </div>
                <span className="next-activity__title">{stats.nextActivity.title}</span>
                <span className="next-activity__category">{stats.nextActivity.category}</span>
              </div>
            </div>
          )}

          {/* Feature 6: Thesis Compass & Milestone Widget */}
          <div className="dashboard__card thesis-compass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="thesis-compass__tag">🎓 Academic Priority</span>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '0.2rem' }}>
                  {thesisConfig?.title || 'Solar Energy Thesis'}
                </h4>
              </div>
              <div className="thesis-countdown-pill">
                <span className="countdown-days">{diffDays > 0 ? diffDays : 0}</span>
                <span className="countdown-label">Days Left</span>
              </div>
            </div>

            <div style={{ marginTop: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                <span>Milestones: {completedMilestones}/{totalMilestones} ({milestonePercent}%)</span>
                <span>Deadline: {thesisConfig?.targetDate}</span>
              </div>
              <div className="thesis-progress__bar">
                <div
                  className="thesis-progress__fill"
                  style={{ width: `${milestonePercent}%` }}
                />
              </div>
            </div>

            <div className="thesis-milestones-checklist">
              {thesisConfig?.milestones?.map(m => (
                <label key={m.id} className="milestone-checkbox-item">
                  <input
                    type="checkbox"
                    checked={m.completed}
                    onChange={() => toggleThesisMilestone(m.id)}
                  />
                  <span className={m.completed ? 'milestone-title--done' : 'milestone-title'}>
                    {m.title}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Weekly Overview */}
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
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.25rem' }}>
              🔬 {stats.weekStats.thesisHours.toFixed(1)}h Thesis Deep Work logged this week
            </div>
          </div>
        </div>
      </div>

      {/* Shift Modal */}
      {showShiftModal && (
        <ShiftModal
          onClose={() => setShowShiftModal(false)}
          dateStr={today}
        />
      )}

      {/* Reflection Note Modal */}
      {noteModalAct && (
        <NoteModal
          activity={noteModalAct}
          onClose={() => setNoteModalAct(null)}
          onSaveNote={(note) => updateActivityNote(noteModalAct.id, note, today)}
        />
      )}
    </div>
  );
}
