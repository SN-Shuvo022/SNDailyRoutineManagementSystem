import React, { useState, useMemo } from 'react';
import { X, Lightbulb, Plus, Check, ChevronRight } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { getSuggestionsForSlot } from '../utils/suggestions';
import { formatTimeDisplay, formatDuration } from '../utils/timeUtils';
import '../styles/SuggestionPanel.css';

export default function SuggestionPanel({ freeSlot, onClose, onAssignTask }) {
  const { taskLibrary, settings, getAllActivitiesForDate, selectedDate } = useApp();
  const [showAllTasks, setShowAllTasks] = useState(false);

  const allActivities = getAllActivitiesForDate(selectedDate);

  const { taskSuggestions, ruleSuggestions } = useMemo(() => {
    return getSuggestionsForSlot(freeSlot, taskLibrary, allActivities, settings);
  }, [freeSlot, taskLibrary, allActivities, settings]);

  const filteredLibrary = showAllTasks
    ? taskLibrary.filter(t => !t.completed && t.estimatedDuration <= freeSlot.duration)
    : [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal suggestion-panel" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <div>
            <h3><Lightbulb size={18} /> Suggestions</h3>
            <p className="suggestion-panel__slot-info">
              {formatTimeDisplay(freeSlot.startTime)} – {formatTimeDisplay(freeSlot.endTime)} ({formatDuration(freeSlot.duration)})
            </p>
          </div>
          <button className="modal__close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="suggestion-panel__content">
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
              <h4>📋 Matching Tasks from Your Library</h4>
              <div className="suggestion-list">
                {taskSuggestions.map(task => (
                  <div key={task.id} className="suggestion-card">
                    <div className="suggestion-card__info">
                      <span className="suggestion-card__title">{task.title}</span>
                      <span className="suggestion-card__meta">
                        {task.category} · {formatDuration(task.estimatedDuration)} · {task.priority}
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
              <p className="empty-text">No matching tasks found. Try adding tasks to your library or choosing manually.</p>
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
                      <span className="suggestion-card__title">{task.title}</span>
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
                      <Plus size={14} /> Add
                    </button>
                  </div>
                )) : (
                  <p className="empty-text">No tasks fit in this time slot.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
