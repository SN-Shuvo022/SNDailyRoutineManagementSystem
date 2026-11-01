import React from 'react';
import { Check, Clock } from 'lucide-react';
import { timeToMinutes, formatTimeDisplay, formatDuration } from '../utils/timeUtils';
import { CATEGORY_COLORS, FOCUS_BLOCK_COLORS } from '../utils/constants';
import '../styles/Timeline.css';

export default function Timeline({ activities, onToggleComplete, compact = false, dateStr }) {
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

        return (
          <div
            key={act.id || idx}
            className={`timeline__item ${act.completed ? 'timeline__item--done' : ''} ${act.type === 'Focus Block' ? 'timeline__item--focus' : ''}`}
          >
            <div className="timeline__time">
              <span>{formatTimeDisplay(act.startTime)}</span>
              <span className="timeline__duration">{formatDuration(duration)}</span>
            </div>
            <div className="timeline__dot-line">
              <div className="timeline__dot" style={{ backgroundColor: color }} />
              {idx < sorted.length - 1 && <div className="timeline__line" />}
            </div>
            <div className="timeline__content" style={{ borderLeftColor: color }}>
              <div className="timeline__content-header">
                <span className="timeline__title">{act.title}</span>
                {onToggleComplete && (
                  <button
                    type="button"
                    className={`timeline__check ${act.completed ? 'timeline__check--done' : ''}`}
                    onClick={() => onToggleComplete(act.id, dateStr)}
                    title={act.completed ? 'Click to mark as pending' : 'Click to mark as completed'}
                    aria-label={`Mark ${act.title} as ${act.completed ? 'pending' : 'completed'}`}
                  >
                    <Check size={14} />
                  </button>
                )}
              </div>
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
