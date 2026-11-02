import React, { useState } from 'react';
import { Clock, FastForward, Shield, X, ArrowRight, Check } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { formatTimeDisplay, getTodayStr, minutesToTime, timeToMinutes } from '../utils/timeUtils';
import '../styles/ActivityForm.css';

export default function ShiftModal({ onClose, defaultFromTime = null, dateStr = null }) {
  const { shiftActivities, selectedDate, settings } = useApp();
  const targetDate = dateStr || selectedDate;
  const isToday = targetDate === getTodayStr();

  // Current time rounded to nearest 5 mins
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + Math.ceil(now.getMinutes() / 5) * 5;
  const currentTimeStr = minutesToTime(currentMinutes);

  const [shiftAmount, setShiftAmount] = useState(30); // in minutes
  const [fromMode, setFromMode] = useState(defaultFromTime ? 'custom' : (isToday ? 'now' : 'start'));
  const [customTime, setCustomTime] = useState(defaultFromTime || currentTimeStr);
  const [appliedCount, setAppliedCount] = useState(null);

  const getEffectiveFromTime = () => {
    if (fromMode === 'now') return currentTimeStr;
    if (fromMode === 'start') return settings?.dayStartTime || '05:00';
    return customTime;
  };

  const handleApplyShift = (e) => {
    e.preventDefault();
    const effectiveTime = getEffectiveFromTime();
    const count = shiftActivities(shiftAmount, effectiveTime, targetDate);
    setAppliedCount(count);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '460px' }}>
        <div className="modal__header">
          <h3>
            <FastForward size={18} style={{ color: 'var(--primary-600)' }} />
            Quick Shift Schedule
          </h3>
          <button className="modal__close" onClick={onClose}><X size={20} /></button>
        </div>

        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            Class ran late or traffic delayed you? Shift your remaining commitments forward or backward without touching fixed prayer times.
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--success-50)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8rem',
            color: 'var(--success-600)',
            fontWeight: '500'
          }}>
            <Shield size={18} style={{ flexShrink: 0 }} />
            <span>
              <strong>Prayer Times Protected:</strong> All 5 prayers (Fajr, Zuhr, Asr, Maghrib, Isha) remain strictly unchanged.
            </span>
          </div>

          <form onSubmit={handleApplyShift} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Shift Amount Presets */}
            <div className="form-group">
              <label>Select Shift Duration:</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginTop: '0.25rem' }}>
                {[15, 30, 45, 60].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    className={`btn ${shiftAmount === mins ? 'btn--primary' : 'btn--outline'}`}
                    style={{ padding: '0.45rem 0.25rem', fontSize: '0.85rem' }}
                    onClick={() => setShiftAmount(mins)}
                  >
                    +{mins}m
                  </button>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginTop: '0.5rem' }}>
                {[-15, -30].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    className={`btn ${shiftAmount === mins ? 'btn--primary' : 'btn--secondary'}`}
                    style={{ padding: '0.4rem 0.25rem', fontSize: '0.8rem' }}
                    onClick={() => setShiftAmount(mins)}
                  >
                    Pull earlier ({mins}m)
                  </button>
                ))}
              </div>
            </div>

            {/* Shift From */}
            <div className="form-group">
              <label>Shift Activities Starting From:</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.25rem' }}>
                {isToday && (
                  <label className="checkbox-label" style={{ fontSize: '0.85rem' }}>
                    <input
                      type="radio"
                      name="fromMode"
                      checked={fromMode === 'now'}
                      onChange={() => setFromMode('now')}
                    />
                    <span>From current time ({formatTimeDisplay(currentTimeStr)})</span>
                  </label>
                )}
                <label className="checkbox-label" style={{ fontSize: '0.85rem' }}>
                  <input
                    type="radio"
                    name="fromMode"
                    checked={fromMode === 'custom'}
                    onChange={() => setFromMode('custom')}
                  />
                  <span>From a specific time</span>
                </label>
              </div>

              {fromMode === 'custom' && (
                <div style={{ marginTop: '0.5rem' }}>
                  <input
                    type="time"
                    value={customTime}
                    onChange={e => setCustomTime(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>

            {appliedCount !== null ? (
              <div style={{
                padding: '0.75rem',
                backgroundColor: 'var(--success-50)',
                color: 'var(--success-600)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                <Check size={18} />
                Successfully shifted {appliedCount} activities by {shiftAmount > 0 ? `+${shiftAmount}` : shiftAmount} minutes!
              </div>
            ) : (
              <div className="form-actions" style={{ marginTop: '0.75rem' }}>
                <button type="button" className="btn btn--secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary">
                  <FastForward size={16} />
                  Apply Shift ({shiftAmount > 0 ? `+${shiftAmount}` : shiftAmount}m)
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

