import React, { useState, useEffect } from 'react';
import { X, Plus, Save } from 'lucide-react';
import { CATEGORIES, ACTIVITY_TYPES } from '../utils/constants';
import { useApp } from '../contexts/AppContext';
import { intervalsOverlap } from '../utils/timeUtils';
import '../styles/ActivityForm.css';

export default function ActivityForm({ activity, onClose, dateStr }) {
  const { addActivity, updateActivity, getAllActivitiesForDate, settings, selectedDate } = useApp();
  const targetDate = dateStr || selectedDate;

  const [form, setForm] = useState({
    title: '',
    startTime: '',
    endTime: '',
    category: 'Other',
    type: 'Fixed Activity',
    focusBlock: '',
    notes: '',
    taskId: '',
  });
  const [overlapWarning, setOverlapWarning] = useState(null);

  useEffect(() => {
    if (activity) {
      setForm({
        title: activity.title || '',
        startTime: activity.startTime || '',
        endTime: activity.endTime || '',
        category: activity.category || 'Other',
        type: activity.type || 'Fixed Activity',
        focusBlock: activity.focusBlock || '',
        notes: activity.notes || '',
        taskId: activity.taskId || '',
      });
    }
  }, [activity]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear overlap warning when times change
    if (field === 'startTime' || field === 'endTime') {
      setOverlapWarning(null);
    }
  };

  const checkOverlap = () => {
    if (!form.startTime || !form.endTime) return false;
    const existing = getAllActivitiesForDate(targetDate);
    const conflicts = existing.filter(a => {
      if (activity && a.id === activity.id) return false;
      return intervalsOverlap(form.startTime, form.endTime, a.startTime, a.endTime);
    });
    if (conflicts.length > 0) {
      setOverlapWarning(`This overlaps with: ${conflicts.map(c => c.title).join(', ')}`);
      return true;
    }
    return false;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.startTime || !form.endTime) return;
    if (form.startTime >= form.endTime) {
      setOverlapWarning('End time must be after start time');
      return;
    }

    const hasOverlap = checkOverlap();
    if (hasOverlap && !window.confirm('There is a time overlap. Add anyway?')) {
      return;
    }

    if (activity) {
      updateActivity(activity.id, form);
    } else {
      addActivity(form);
    }
    onClose();
  };

  const focusBlocks = settings?.focusBlockLabels || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h3>{activity ? 'Edit Activity' : 'Add Activity'}</h3>
          <button className="modal__close" onClick={onClose}><X size={20} /></button>
        </div>

        <form className="activity-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Activity Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => handleChange('title', e.target.value)}
              placeholder="e.g., University Class, Thesis Work..."
              required
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Time *</label>
              <input
                type="time"
                value={form.startTime}
                onChange={e => handleChange('startTime', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>End Time *</label>
              <input
                type="time"
                value={form.endTime}
                onChange={e => handleChange('endTime', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select value={form.category} onChange={e => handleChange('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Activity Type</label>
              <select value={form.type} onChange={e => handleChange('type', e.target.value)}>
                {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {form.type === 'Focus Block' && (
            <div className="form-group">
              <label>Focus Block Category</label>
              <select value={form.focusBlock} onChange={e => handleChange('focusBlock', e.target.value)}>
                <option value="">Select focus block...</option>
                {focusBlocks.map(fb => (
                  <option key={fb.id} value={fb.id}>{fb.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={form.notes}
              onChange={e => handleChange('notes', e.target.value)}
              placeholder="Optional notes..."
              rows={2}
            />
          </div>

          {overlapWarning && (
            <div className="form-warning">
              ⚠️ {overlapWarning}
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn--secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary">
              {activity ? <><Save size={16} /> Update</> : <><Plus size={16} /> Add Activity</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
