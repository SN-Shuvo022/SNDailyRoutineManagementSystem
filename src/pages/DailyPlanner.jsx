import React, { useState, useMemo } from 'react';
import {
  Plus, Edit3, Trash2, Copy, CalendarDays, AlertTriangle, FileText, Check,
  ChevronLeft, ChevronRight, FastForward, X, MessageSquare, Zap, BatteryLow
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
import NoteModal from '../components/NoteModal';
import Timeline from '../components/Timeline';
import '../styles/DailyPlanner.css';

export default function DailyPlanner() {
  const {
    selectedDate, setSelectedDate, getAllActivitiesForDate,
    deleteActivity, duplicateActivity, toggleActivityComplete,
    toggleActivityMissed, updateActivityNote,
    isMinimumViableDay, toggleMinimumViableDay,
    activities: storedActivities, setActivities
  } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [shiftFromTime, setShiftFromTime] = useState(null);
  const [noteActivity, setNoteActivity] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'timeline'
  const [filterType, setFilterType] = useState('All');

  // Fix: Include storedActivities so editing updates immediately without page refresh
  const activities = useMemo(
    () => getAllActivitiesForDate(selectedDate),
    [selectedDate, getAllActivitiesForDate, storedActivities]
  );

  const isMVD = isMinimumViableDay(selectedDate);

  const sortedActivities = useMemo(
    () => [...activities].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)),
    [activities]
  );

  const filteredActivities = useMemo(() => {
    let list = sortedActivities;
    if (filterType === 'Fixed') list = list.filter(a => a.type === 'Fixed Activity');
    else if (filterType === 'Flexible') list = list.filter(a => a.type === 'Flexible Activity');
    else if (filterType === 'Focus') list = list.filter(a => a.type === 'Focus Block');
    else if (filterType === 'Prayer') list = list.filter(a => a.category === 'Prayer');

    // If Minimum Viable Day is active and user didn't select a specific filter, prioritize essential ones
    return list;
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

  const isEssentialTask = (act) => {
    return act.category === 'Prayer' ||
      act.title.toLowerCase().includes('bath') ||
      act.title.toLowerCase().includes('fajr') ||
      act.title.toLowerCase().includes('zuhr') ||
      act.title.toLowerCase().includes('asr') ||
      act.title.toLowerCase().includes('maghrib') ||
      act.title.toLowerCase().includes('isha') ||
      act.title.toLowerCase().includes('sleep') ||
      act.title.toLowerCase().includes('thesis') ||
      act.title.toLowerCase().includes('lunch') ||
      act.title.toLowerCase().includes('dinner');
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
            className={`mvd-planner-btn ${isMVD ? 'mvd-planner-btn--active' : ''}`}
            onClick={() => toggleMinimumViableDay(selectedDate)}
            title="Toggle Minimum Viable Day mode (Low-Energy Day)"
          >
            <BatteryLow size={16} />
            {isMVD ? 'Low-Energy Day (Active)' : 'Low-Energy Mode'}
          </button>

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

      {/* MVD Banner when active */}
      {isMVD && (
        <div className="mvd-planner-banner">
          <div className="mvd-planner-banner__left">
            <span className="mvd-planner-banner__badge">🔋 MINIMUM VIABLE DAY</span>
            <span className="mvd-planner-banner__text">
              Low-energy day mode is active. Only essential tasks (5 Prayers, Bath, 30m Thesis, Rest) are highlighted. Optional tasks are de-emphasized.
            </span>
          </div>
          <button
            className="btn btn--sm btn--outline"
            onClick={() => toggleMinimumViableDay(selectedDate)}
            style={{ backgroundColor: '#FFFFFF', borderColor: '#D97706', color: '#B45309' }}
          >
            Switch to Normal Day
          </button>
        </div>
      )}

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
          onToggleMissed={(id) => toggleActivityMissed(id, selectedDate)}
          onOpenNote={(act) => setNoteActivity(act)}
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
            const isEssential = isEssentialTask(act);
            const cardOpacity = isMVD && !isEssential ? 0.5 : 1;

            return (
              <div
                key={act.id}
                className={`activity-card ${act.completed ? 'activity-card--done' : ''} ${act.missed ? 'activity-card--missed' : ''} ${hasOverlap ? 'activity-card--overlap' : ''}`}
                style={{ borderLeftColor: color, opacity: cardOpacity }}
              >
                {/* 3-Action Buttons Group */}
                <div className="activity-card__action-group">
                  <button
                    className={`activity-card__btn activity-card__btn--check ${act.completed ? 'active' : ''}`}
                    onClick={() => toggleActivityComplete(act.id, selectedDate)}
                    title={act.completed ? "Mark incomplete" : "Done (সম্পন্ন)"}
                  >
                    <Check size={14} />
                  </button>
                  <button
                    className={`activity-card__btn activity-card__btn--cross ${act.missed ? 'active' : ''}`}
                    onClick={() => toggleActivityMissed(act.id, selectedDate)}
                    title={act.missed ? "Clear missed status" : "Missed (করতে পারিনি)"}
                  >
                    <X size={14} />
                  </button>
                  <button
                    className={`activity-card__btn activity-card__btn--note ${act.reflectionNote ? 'active' : ''}`}
                    onClick={() => setNoteActivity(act)}
                    title={act.reflectionNote ? "Edit Note: " + act.reflectionNote : "Add Reflection Note (দেরি বা আগ-পিছের কারণ)"}
                  >
                    <MessageSquare size={13} />
                  </button>
                </div>

                <div className="activity-card__content">
                  <div className="activity-card__top">
                    <span className="activity-card__title">{act.title}</span>
                    {act.missed && (
                      <span className="activity-card__missed-tag">
                        <X size={12} /> Missed
                      </span>
                    )}
                    {act.isPrayerAuto && (
                      <span className="activity-card__auto-badge">Auto Prayer</span>
                    )}
                    {isMVD && isEssential && (
                      <span style={{ fontSize: '0.7rem', backgroundColor: '#FEF3C7', color: '#B45309', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                        ⭐ Essential
                      </span>
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

                  {/* Reflection Note Box */}
                  {act.reflectionNote && (
                    <div className="activity-card__reflection">
                      <MessageSquare size={14} style={{ flexShrink: 0 }} />
                      <span>{act.reflectionNote}</span>
                    </div>
                  )}
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

      {noteActivity && (
        <NoteModal
          activity={noteActivity}
          onClose={() => setNoteActivity(null)}
          onSaveNote={(note) => {
            updateActivityNote(noteActivity.id, note, selectedDate);
          }}
        />
      )}
    </div>
  );
}
