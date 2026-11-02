import React from 'react';
import { Check, X, FileEdit, Clock } from 'lucide-react';
import { timeToMinutes, formatTimeDisplay, formatDuration } from '../utils/timeUtils';
import { CATEGORY_COLORS, FOCUS_BLOCK_COLORS } from '../utils/constants';
import '../styles/Timeline.css';

export default function Timeline({
  activities,
  onToggleComplete,
  onToggleMissed,
  onOpenNote,
  compact = false,
  dateStr
}) {
  const sorted = [...activities].sort((a, b) =>
    timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );

  if (sorted.length === 0) {
    return (
      <div className="timeline-empty">
        <Clock size={40} />
        <p>No activities planned yet</p>
      </div>
    );
  }

  return (
    <div className={`timeline ${compact ? 'timeline--compact' : ''}`}>
      {sorted.map((act, idx) => {
        const color = act.focusBlock
          ? FOCUS_BLOCK_COLORS[act.focusBlock] || CATEGORY_COLORS[act.category]
          : CATEGORY_COLORS[act.category] || '#94A3B8';
        const duration = timeToMinutes(act.endTime) - timeToMinutes(act.startTime);

        const isMissed = act.status === 'missed';
        const isCompleted = act.completed || act.status === 'completed';

        return (
          <div
            key={act.id || idx}
            className={`timeline__item ${isCompleted ? 'timeline__item--done' : ''} ${isMissed ? 'timeline__item--missed' : ''} ${act.type === 'Focus Block' ? 'timeline__item--focus' : ''}`}
          >
            <div className="timeline__time">
              <span>{formatTimeDisplay(act.startTime)}</span>
              <span className="timeline__duration">{formatDuration(duration)}</span>
            </div>
            <div className="timeline__dot-line">
              <div
                className="timeline__dot"
                style={{ backgroundColor: isMissed ? '#EF4444' : color }}
              />
              {idx < sorted.length - 1 && <div className="timeline__line" />}
            </div>
            <div className="timeline__content" style={{ borderLeftColor: isMissed ? '#EF4444' : color }}>
              <div className="timeline__content-header">
                <div className="timeline__title-wrapper">
                  <span className={`timeline__title ${isMissed ? 'timeline__title--missed' : ''}`}>
                    {act.title}
                  </span>
                  {isMissed && (
                    <span className="timeline__missed-tag">✕ Missed</span>
                  )}
                </div>

                <div className="timeline__action-group">
                  {/* 1. Mark Done Checkbox */}
                  {onToggleComplete && (
                    <button
                      type="button"
                      className={`timeline__btn timeline__btn--check ${isCompleted ? 'timeline__btn--check-done' : ''}`}
                      onClick={() => onToggleComplete(act.id, dateStr)}
                      title={isCompleted ? 'Mark as pending' : 'Mark as completed (done)'}
                      aria-label={`Mark ${act.title} completed`}
                    >
                      <Check size={14} />
                    </button>
                  )}

                  {/* 2. Mark Missed / Cross Button */}
                  {onToggleMissed && (
                    <button
                      type="button"
                      className={`timeline__btn timeline__btn--cross ${isMissed ? 'timeline__btn--cross-active' : ''}`}
                      onClick={() => onToggleMissed(act.id, dateStr)}
                      title={isMissed ? 'Unmark missed' : 'Mark as missed / could not do'}
                      aria-label={`Mark ${act.title} missed`}
                    >
                      <X size={14} />
                    </button>
                  )}

                  {/* 3. Add / Edit Reflection Note Button */}
                  {onOpenNote && (
                    <button
                      type="button"
                      className={`timeline__btn timeline__btn--note ${act.reflectionNote ? 'timeline__btn--note-active' : ''}`}
                      onClick={() => onOpenNote(act, dateStr)}
                      title={act.reflectionNote ? 'View / Edit Note' : 'Add Note (describe why delayed / shifted)'}
                      aria-label={`Add reflection note for ${act.title}`}
                    >
                      <FileEdit size={13} />
                    </button>
                  )}
                </div>
              </div>

              {act.reflectionNote && (
                <div
                  className="timeline__reflection-box"
                  onClick={() => onOpenNote && onOpenNote(act, dateStr)}
                  title="Click to edit reflection note"
                >
                  <span className="timeline__reflection-icon">📝</span>
                  <span className="timeline__reflection-text">{act.reflectionNote}</span>
                </div>
              )}

              {!compact && (
                <div className="timeline__meta">
                  <span className="timeline__badge" style={{ backgroundColor: color + '22', color }}>
                    {act.category}
                  </span>
                  <span className="timeline__type-badge">{act.type}</span>
                  {act.notes && <span className="timeline__notes">{act.notes}</span>}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
