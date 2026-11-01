import React, { useState, useMemo } from 'react';
import { Clock, Plus, Lightbulb, CalendarDays, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import {
  calculateFreeSlots, formatTimeDisplay, formatDuration, formatDateDisplay,
  timeToMinutes, formatDateStr
} from '../utils/timeUtils';
import SuggestionPanel from '../components/SuggestionPanel';
import ActivityForm from '../components/ActivityForm';
import '../styles/FreeTime.css';

export default function FreeTime() {
  const {
    selectedDate, setSelectedDate, settings,
    getAllActivitiesForDate, addActivity
  } = useApp();

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormDefaults, setAddFormDefaults] = useState(null);

  const activities = useMemo(
    () => getAllActivitiesForDate(selectedDate),
    [selectedDate, getAllActivitiesForDate]
  );

  const freeSlots = useMemo(
    () => calculateFreeSlots(activities, settings.dayStartTime, settings.dayEndTime),
    [activities, settings.dayStartTime, settings.dayEndTime]
  );

  const totalWindowMinutes = timeToMinutes(settings.dayEndTime) - timeToMinutes(settings.dayStartTime);
  const totalFreeMinutes = freeSlots.reduce((s, f) => s + f.duration, 0);
  const totalBusyMinutes = Math.max(0, totalWindowMinutes - totalFreeMinutes);
  const freePercent = totalWindowMinutes > 0 ? Math.round((totalFreeMinutes / totalWindowMinutes) * 100) : 0;

  const handleAddTask = (slot) => {
    setAddFormDefaults({
      startTime: slot.startTime,
      endTime: slot.endTime,
    });
    setShowAddForm(true);
  };

  const handleGetSuggestions = (slot) => {
    setSelectedSlot(slot);
    setShowSuggestions(true);
  };

  const handleAssignTask = (task, slot) => {
    // If the task has estimatedDuration shorter than the slot, we can allocate either estimated duration or full slot
    const taskEndMinutes = Math.min(
      timeToMinutes(slot.startTime) + (task.estimatedDuration || slot.duration),
      timeToMinutes(slot.endTime)
    );
    const endH = Math.floor(taskEndMinutes / 60) % 24;
    const endM = taskEndMinutes % 60;
    const computedEndTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    addActivity({
      title: task.title,
      startTime: slot.startTime,
      endTime: computedEndTime,
      category: task.category || 'Other',
      type: task.category === 'Thesis' || task.category === 'PVsyst' ? 'Focus Block' : 'Flexible Activity',
      focusBlock: task.category === 'Thesis' ? 'fb3' : task.category === 'PVsyst' ? 'fb2' : '',
      notes: `From task library: ${task.description || ''}`,
      taskId: task.id,
    });
  };

  const changeDateBy = (days) => {
    const current = new Date(selectedDate + 'T00:00:00');
    current.setDate(current.getDate() + days);
    setSelectedDate(formatDateStr(current));
  };

  return (
    <div className="freetime">
      <div className="freetime__header">
        <div>
          <h2>Free Time Analysis</h2>
          <p className="freetime__subtitle">{formatDateDisplay(selectedDate)}</p>
        </div>
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
      </div>

      <div className="freetime__summary">
        <div className="freetime__summary-card freetime__summary-card--free">
          <Clock size={24} />
          <div>
            <span className="freetime__summary-value">{formatDuration(totalFreeMinutes)}</span>
            <span className="freetime__summary-label">Available Free Time ({freePercent}%)</span>
          </div>
        </div>
        <div className="freetime__summary-card freetime__summary-card--busy">
          <CalendarDays size={24} />
          <div>
            <span className="freetime__summary-value">{formatDuration(totalBusyMinutes)}</span>
            <span className="freetime__summary-label">Occupied / Busy Time</span>
          </div>
        </div>
        <div className="freetime__summary-card freetime__summary-card--slots">
          <Lightbulb size={24} />
          <div>
            <span className="freetime__summary-value">{freeSlots.length}</span>
            <span className="freetime__summary-label">Free Slots Found</span>
          </div>
        </div>
      </div>

      <div className="freetime__banner">
        <p>
          🕒 Active Planning Window: <strong>{formatTimeDisplay(settings.dayStartTime)} – {formatTimeDisplay(settings.dayEndTime)}</strong> ({formatDuration(totalWindowMinutes)} total).
          {' '}{activities.length} scheduled activities are accounted for.
        </p>
      </div>

      {freeSlots.length === 0 ? (
        <div className="empty-state">
          <AlertCircle size={48} />
          <h3>No Free Time Slots Available</h3>
          <p>
            Your schedule for this date is either completely booked across the configured window or extends past the day boundaries.
          </p>
        </div>
      ) : (
        <div className="freetime__slots">
          {freeSlots.map((slot, idx) => {
            let slotTypeClass = 'free-slot--normal';
            let slotLabel = '⚡ Regular Slot';
            let recommendedAction = 'Good for study, reading, or focused practice.';

            if (slot.duration < 20) {
              slotTypeClass = 'free-slot--short';
              slotLabel = '☕ Micro Break / Light Revision';
              recommendedAction = 'Quick break, dhikr, quick review, or bayan.';
            } else if (slot.duration < 45) {
              slotTypeClass = 'free-slot--medium';
              slotLabel = '📖 Short Study Block';
              recommendedAction = 'IEEE paper reading, note taking, or short revision.';
            } else if (slot.duration < 90) {
              slotTypeClass = 'free-slot--long';
              slotLabel = '💻 Deep Work / Practice';
              recommendedAction = 'PVsyst simulation, thesis research, or programming.';
            } else {
              slotTypeClass = 'free-slot--extended';
              slotLabel = '🔥 Extended Deep Work Block';
              recommendedAction = 'High-value thesis chapter writing, large simulation, or solar design.';
            }

            return (
              <div key={idx} className={`free-slot ${slotTypeClass}`}>
                <div className="free-slot__header">
                  <div className="free-slot__times">
                    <span className="free-slot__range">
                      {formatTimeDisplay(slot.startTime)} – {formatTimeDisplay(slot.endTime)}
                    </span>
                    <span className="free-slot__duration">{formatDuration(slot.duration)}</span>
                  </div>
                  <span className="free-slot__badge">{slotLabel}</span>
                </div>

                <p className="free-slot__recommendation">{recommendedAction}</p>

                <div className="free-slot__actions">
                  <button
                    className="btn btn--outline btn--sm"
                    onClick={() => handleAddTask(slot)}
                  >
                    <Plus size={14} /> Add Activity
                  </button>
                  <button
                    className="btn btn--primary btn--sm"
                    onClick={() => handleGetSuggestions(slot)}
                  >
                    <Lightbulb size={14} /> Get Suggestions
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showSuggestions && selectedSlot && (
        <SuggestionPanel
          freeSlot={selectedSlot}
          onClose={() => {
            setShowSuggestions(false);
            setSelectedSlot(null);
          }}
          onAssignTask={handleAssignTask}
        />
      )}

      {showAddForm && (
        <ActivityForm
          activity={addFormDefaults ? {
            title: '',
            startTime: addFormDefaults.startTime,
            endTime: addFormDefaults.endTime,
            category: 'Thesis',
            type: 'Focus Block',
            focusBlock: 'fb3',
            notes: '',
          } : null}
          onClose={() => {
            setShowAddForm(false);
            setAddFormDefaults(null);
          }}
          dateStr={selectedDate}
        />
      )}
    </div>
  );
}

