import React, { useState, useMemo } from 'react';
import {
  Plus, Edit3, Trash2, Copy, CalendarDays, AlertTriangle, FileText, Check, ChevronLeft, ChevronRight, FastForward
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import {
  formatDateDisplay, formatTimeDisplay, formatDuration, timeToMinutes,
  detectOverlaps, getTodayStr, formatDateStr
} from '../utils/timeUtils';
import { CATEGORY_COLORS, FOCUS_BLOCK_COLORS } from '../utils/constants';
import { getMondaySampleTemplate } from '../utils/sampleData';
import { saveActivitiesForDate, getActivitiesForDate } from '../utils/storage';
import ActivityForm from '../components/ActivityForm';
import ShiftModal from '../components/ShiftModal';
import Timeline from '../components/Timeline';
import '../styles/DailyPlanner.css';

export default function DailyPlanner() {
  const {
    selectedDate, setSelectedDate, getAllActivitiesForDate,
    deleteActivity, duplicateActivity, toggleActivityComplete,
    setActivities
  } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [shiftFromTime, setShiftFromTime] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'timeline'
  const [filterType, setFilterType] = useState('All');

  const activities = useMemo(
    () => getAllActivitiesForDate(selectedDate),
    [selectedDate, getAllActivitiesForDate]
  );

  const sortedActivities = useMemo(
    () => [...activities].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)),
    [activities]
  );

  const filteredActivities = useMemo(() => {
    if (filterType === 'All') return sortedActivities;
    if (filterType === 'Fixed') return sortedActivities.filter(a => a.type === 'Fixed Activity');
    if (filterType === 'Flexible') return sortedActivities.filter(a => a.type === 'Flexible Activity');
    if (filterType === 'Focus') return sortedActivities.filter(a => a.type === 'Focus Block');
    if (filterType === 'Prayer') return sortedActivities.filter(a => a.category === 'Prayer');
    return sortedActivities;
  }, [sortedActivities, filterType]);

  const overlaps = useMemo(() => detectOverlaps(activities), [activities]);

  const handleEdit = (activity) => {
    setEditingActivity(activity);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingActivity(null);
    setShowForm(true);
  };

  const handleLoadTemplate = () => {
    if (activities.length > 0) {
      if (!window.confirm('This will append sample Monday activities to the current date. Continue?')) return;
    }
    const template = getMondaySampleTemplate();
    const current = getActivitiesForDate(selectedDate);
    const updated = [...current, ...template];
    saveActivitiesForDate(selectedDate, updated);
    setActivities(updated);
  };

  const changeDateBy = (days) => {
    const current = new Date(selectedDate + 'T00:00:00');
    current.setDate(current.getDate() + days);
    setSelectedDate(formatDateStr(current));
  };

  return (
    <div className="planner">
      <div className="planner__header">
        <div>
          <h2>Daily Planner</h2>
          <p className="planner__subtitle">{formatDateDisplay(selectedDate)}</p>
        </div>
        <div className="planner__header-actions">
          <div className="date-navigator">
            <button className="icon-btn" onClick={() => changeDateBy(-1)} title="Previous Day">
              <ChevronLeft size={18} />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="date-input"
            />
            <button className="icon-btn" onClick={() => changeDateBy(1)} title="Next Day">
              <ChevronRight size={18} />
            </button>
          </div>
          <button
            className="btn btn--outline"
            onClick={() => {
              setShiftFromTime(null);
              setShowShiftModal(true);
            }}
            title="Shift remaining activities (+30m, +15m) without changing prayer times"
          >
            <FastForward size={16} /> Quick Shift (+30m)
          </button>
          <button className="btn btn--outline" onClick={handleLoadTemplate} title="Load Monday routine template">
            <FileText size={16} /> Sample Template
          </button>
          <button className="btn btn--primary" onClick={handleAdd}>
            <Plus size={16} /> Add Activity
          </button>
        </div>
      </div>

      {overlaps.length > 0 && (
        <div className="planner__warnings">
          {overlaps.map((o, i) => (
            <div key={i} className="overlap-warning">
              <AlertTriangle size={18} />
              <span>
                <strong>{o.activity1.title}</strong> ({formatTimeDisplay(o.activity1.startTime)}–{formatTimeDisplay(o.activity1.endTime)}) overlaps with <strong>{o.activity2.title}</strong> ({formatTimeDisplay(o.activity2.startTime)}–{formatTimeDisplay(o.activity2.endTime)})
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="planner__controls">
        <div className="planner__view-toggle">
          <button
            className={`toggle-btn ${viewMode === 'list' ? 'toggle-btn--active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            List View
          </button>
          <button
            className={`toggle-btn ${viewMode === 'timeline' ? 'toggle-btn--active' : ''}`}
            onClick={() => setViewMode('timeline')}
          >
            Visual Timeline
          </button>
        </div>

        <div className="planner__filters">
          {['All', 'Fixed', 'Flexible', 'Focus', 'Prayer'].map(t => (
            <button
              key={t}
              className={`filter-chip ${filterType === t ? 'filter-chip--active' : ''}`}
              onClick={() => setFilterType(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <span className="planner__count">{filteredActivities.length} activities</span>
      </div>

      {filteredActivities.length === 0 ? (
        <div className="empty-state">
          <CalendarDays size={56} />
          <h3>No activities scheduled for this date</h3>
          <p>Start planning tomorrow's activities, or load the optional Monday template to get started.</p>
          <div className="empty-state__actions">
            <button className="btn btn--primary" onClick={handleAdd}>
              <Plus size={16} /> Add Activity
            </button>
            <button className="btn btn--secondary" onClick={handleLoadTemplate}>
              <FileText size={16} /> Load Monday Template
            </button>
          </div>
        </div>
      ) : viewMode === 'timeline' ? (
        <Timeline
          activities={filteredActivities}
          onToggleComplete={(id) => toggleActivityComplete(id, selectedDate)}
          dateStr={selectedDate}
        />
      ) : (
        <div className="planner__list">
          {filteredActivities.map(act => {
            const color = act.focusBlock
              ? FOCUS_BLOCK_COLORS[act.focusBlock] || CATEGORY_COLORS[act.category]
              : CATEGORY_COLORS[act.category] || '#94A3B8';
            const duration = timeToMinutes(act.endTime) - timeToMinutes(act.startTime);
            const hasOverlap = overlaps.some(
              o => o.activity1.id === act.id || o.activity2.id === act.id
            );

            return (
              <div
                key={act.id}
                className={`activity-card ${act.completed ? 'activity-card--done' : ''} ${hasOverlap ? 'activity-card--overlap' : ''}`}
                style={{ borderLeftColor: color }}
              >
                <div className="activity-card__checkbox">
                  <input
                    type="checkbox"
                    checked={act.completed || false}
                    onChange={() => toggleActivityComplete(act.id, selectedDate)}
                    aria-label={`Mark ${act.title} completed`}
                  />
                </div>
                <div className="activity-card__content">
                  <div className="activity-card__top">
                    <span className="activity-card__title">{act.title}</span>
                    {act.isPrayerAuto && (
                      <span className="activity-card__auto-badge">Auto Prayer</span>
                    )}
                  </div>
                  <div className="activity-card__meta">
                    <span className="activity-card__time">
                      {formatTimeDisplay(act.startTime)} – {formatTimeDisplay(act.endTime)}
                    </span>
                    <span className="activity-card__duration">({formatDuration(duration)})</span>
                    <span className="activity-card__badge" style={{ backgroundColor: color + '22', color }}>
                      {act.category}
                    </span>
                    <span className="activity-card__type">{act.type}</span>
                  </div>
                  {act.notes && <p className="activity-card__notes">{act.notes}</p>}
                </div>
                <div className="activity-card__actions">
                  <button
                    className="icon-btn"
                    onClick={() => {
                      setShiftFromTime(act.endTime);
                      setShowShiftModal(true);
                    }}
                    title={`Shift all activities after "${act.title}"`}
                  >
                    <FastForward size={16} />
                  </button>
                  <button className="icon-btn" onClick={() => handleEdit(act)} title="Edit Activity">
                    <Edit3 size={16} />
                  </button>
                  <button className="icon-btn" onClick={() => duplicateActivity(act.id)} title="Duplicate Activity">
                    <Copy size={16} />
                  </button>
                  <button
                    className="icon-btn icon-btn--danger"
                    onClick={() => {
                      if (window.confirm(`Delete "${act.title}"?`)) deleteActivity(act.id);
                    }}
                    title="Delete Activity"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <ActivityForm
          activity={editingActivity}
          onClose={() => {
            setShowForm(false);
            setEditingActivity(null);
          }}
          dateStr={selectedDate}
        />
      )}

      {showShiftModal && (
        <ShiftModal
          onClose={() => {
            setShowShiftModal(false);
            setShiftFromTime(null);
          }}
          defaultFromTime={shiftFromTime}
          dateStr={selectedDate}
        />
      )}
    </div>
  );
}

