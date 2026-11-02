import React, { useState, useMemo } from 'react';
import { X, Lightbulb, Plus, Check, ChevronRight, Zap, Battery, Coffee } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { getSuggestionsForSlot } from '../utils/suggestions';
import { formatTimeDisplay, formatDuration } from '../utils/timeUtils';
import '../styles/SuggestionPanel.css';

export default function SuggestionPanel({ freeSlot, onClose, onAssignTask }) {
  const { taskLibrary, settings, getAllActivitiesForDate, selectedDate } = useApp();
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [energyFilter, setEnergyFilter] = useState('all'); // 'all', 'high', 'medium', 'low'

  const allActivities = getAllActivitiesForDate(selectedDate);

  const { taskSuggestions, ruleSuggestions } = useMemo(() => {
    return getSuggestionsForSlot(freeSlot, taskLibrary, allActivities, settings, energyFilter);
  }, [freeSlot, taskLibrary, allActivities, settings, energyFilter]);

  const filteredLibrary = showAllTasks
    ? taskLibrary.filter(t => {
        if (t.completed || t.estimatedDuration > freeSlot.duration) return false;
        if (energyFilter !== 'all' && t.energyLevel && t.energyLevel !== energyFilter) return false;
        return true;
      })
    : [];

  const renderEnergyBadge = (level) => {
    if (!level) return null;
    const l = level.toLowerCase();
    if (l === 'high') {
      return (
        <span className="suggestion-card__energy-badge suggestion-card__energy-badge--high" title="High Energy Focus">
          <Zap size={10} /> High Energy
        </span>
      );
    }
    if (l === 'medium') {
      return (
        <span className="suggestion-card__energy-badge suggestion-card__energy-badge--medium" title="Medium Energy">
          <Battery size={10} /> Medium Energy
        </span>
      );
    }
    if (l === 'low') {
      return (
        <span className="suggestion-card__energy-badge suggestion-card__energy-badge--low" title="Low Energy / Light">
          <Coffee size={10} /> Low Energy
        </span>
      );
    }
    return null;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal suggestion-panel" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <div>
            <h3><Lightbulb size={18} /> Smart Suggestions</h3>
            <p className="suggestion-panel__slot-info">
              {formatTimeDisplay(freeSlot.startTime)} – {formatTimeDisplay(freeSlot.endTime)} ({formatDuration(freeSlot.duration)})
            </p>
          </div>
          <button className="modal__close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="suggestion-panel__content">
          {/* Energy Level Filter Tabs */}
          <div className="suggestion-section">
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              🔋 Filter by Current Energy Level:
            </span>
            <div className="energy-filter-group">
              <button
                className={`energy-filter-btn ${energyFilter === 'all' ? 'energy-filter-btn--active' : ''}`}
                onClick={() => setEnergyFilter('all')}
              >
                All Levels
              </button>
              <button
                className={`energy-filter-btn energy-filter-btn--high ${energyFilter === 'high' ? 'energy-filter-btn--active' : ''}`}
                onClick={() => setEnergyFilter('high')}
              >
                <Zap size={12} /> High Energy (Thesis / PVsyst)
              </button>
              <button
                className={`energy-filter-btn energy-filter-btn--medium ${energyFilter === 'medium' ? 'energy-filter-btn--active' : ''}`}
                onClick={() => setEnergyFilter('medium')}
              >
                <Battery size={12} /> Medium Energy (Reading / Prep)
              </button>
              <button
                className={`energy-filter-btn energy-filter-btn--low ${energyFilter === 'low' ? 'energy-filter-btn--active' : ''}`}
                onClick={() => setEnergyFilter('low')}
              >
                <Coffee size={12} /> Low Energy (Review / Rest)
              </button>
            </div>
          </div>

          {ruleSuggestions.length > 0 && (
            <div className="suggestion-section">
              <h4>💡 Recommended for {formatDuration(freeSlot.duration)} slot</h4>
              <ul className="rule-suggestions">
                {ruleSuggestions.map((s, i) => (
                  <li key={i}><ChevronRight size={14} /> {s}</li>
                ))}
              </ul>
            </div>
          )}

          {taskSuggestions.length > 0 && (
            <div className="suggestion-section">
              <h4>📋 Matching Tasks from Your Library ({taskSuggestions.length})</h4>
              <div className="suggestion-list">
                {taskSuggestions.map(task => (
                  <div key={task.id} className="suggestion-card">
                    <div className="suggestion-card__info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span className="suggestion-card__title">{task.title}</span>
                        {renderEnergyBadge(task.energyLevel)}
                      </div>
                      <span className="suggestion-card__meta">
                        {task.category} · {formatDuration(task.estimatedDuration)} · Priority: {task.priority}
                      </span>
                    </div>
                    <button
                      className="btn btn--sm btn--primary"
                      onClick={() => {
                        onAssignTask(task, freeSlot);
                        onClose();
                      }}
                    >
                      <Check size={14} /> Assign
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {taskSuggestions.length === 0 && (
            <div className="suggestion-section">
              <p className="empty-text">
                {energyFilter !== 'all'
                  ? `No matching ${energyFilter}-energy tasks found under ${formatDuration(freeSlot.duration)}. Try switching energy level or add one to your library.`
                  : 'No matching tasks found. Try adding tasks to your library or choosing manually.'}
              </p>
            </div>
          )}

          <div className="suggestion-section">
            <button
              className="btn btn--secondary btn--full"
              onClick={() => setShowAllTasks(!showAllTasks)}
            >
              {showAllTasks ? 'Hide Full Task List' : 'Browse All Available Tasks'}
            </button>

            {showAllTasks && (
              <div className="suggestion-list" style={{ marginTop: '0.5rem' }}>
                {filteredLibrary.length > 0 ? filteredLibrary.map(task => (
                  <div key={task.id} className="suggestion-card">
                    <div className="suggestion-card__info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span className="suggestion-card__title">{task.title}</span>
                        {renderEnergyBadge(task.energyLevel)}
                      </div>
                      <span className="suggestion-card__meta">
                        {task.category} · {formatDuration(task.estimatedDuration)}
                      </span>
                    </div>
                    <button
                      className="btn btn--sm btn--primary"
                      onClick={() => {
                        onAssignTask(task, freeSlot);
                        onClose();
                      }}
                    >
                      <Check size={14} /> Assign
                    </button>
                  </div>
                )) : (
                  <p className="empty-text">No tasks fit within this slot duration.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
