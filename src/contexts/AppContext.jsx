import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getActivitiesForDate, saveActivitiesForDate, getAllActivities,
  getTaskLibrary, saveTaskLibrary,
  getPrayerSettings, savePrayerSettings,
  getSettings, saveSettings,
  getCompletionHistory, saveCompletionHistory,
  getLearningTracker, saveLearningTracker,
} from '../utils/storage';
import { getTodayStr, generateId } from '../utils/timeUtils';
import { getDefaultTasks } from '../utils/suggestions';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [activities, setActivities] = useState([]);
  const [taskLibrary, setTaskLibrary] = useState([]);
  const [prayerSettings, setPrayerSettings] = useState(null);
  const [settings, setSettings] = useState(null);
  const [completionHistory, setCompletionHistory] = useState({});
  const [learningTracker, setLearningTracker] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load initial data
  useEffect(() => {
    const s = getSettings();
    setSettings(s);
    const p = getPrayerSettings();
    setPrayerSettings(p);
    const tasks = getTaskLibrary();
    setTaskLibrary(tasks.length > 0 ? tasks : getDefaultTasks());
    const history = getCompletionHistory();
    setCompletionHistory(history);
    const learning = getLearningTracker();
    setLearningTracker(learning);
  }, []);

  // Load activities when date changes
  useEffect(() => {
    const acts = getActivitiesForDate(selectedDate);
    setActivities(acts);
  }, [selectedDate]);

  // Save task library when it changes
  useEffect(() => {
    if (taskLibrary.length > 0) {
      saveTaskLibrary(taskLibrary);
    }
  }, [taskLibrary]);

  // Get prayer activities for a date
  const getPrayerActivitiesForDate = useCallback((dateStr) => {
    if (!prayerSettings || !prayerSettings.autoInsert) return [];
    const overrides = prayerSettings.overrides?.[dateStr] || {};
    return prayerSettings.prayers
      .filter(p => p.enabled)
      .map(prayer => {
        const override = overrides[prayer.id];
        return {
          id: `prayer_${prayer.id}_${dateStr}`,
          title: `${prayer.name} Prayer`,
          startTime: override?.startTime || prayer.startTime,
          endTime: override?.endTime || prayer.endTime,
          category: 'Prayer',
          type: 'Fixed Activity',
          notes: '',
          completed: false,
          isPrayerAuto: true,
          prayerId: prayer.id,
        };
      });
  }, [prayerSettings]);

  // Get all activities for a date including auto-inserted prayers
  const getAllActivitiesForDate = useCallback((dateStr) => {
    const stored = getActivitiesForDate(dateStr);
    if (!prayerSettings?.autoInsert) return stored;

    const prayerActs = getPrayerActivitiesForDate(dateStr);
    // Don't add prayer auto-activities if manually added ones with same prayer ID exist
    const manualPrayerIds = stored
      .filter(a => a.prayerId)
      .map(a => a.prayerId);

    const filtered = prayerActs.filter(p => !manualPrayerIds.includes(p.prayerId));
    // Also don't add if there's already a manually-added prayer for that slot
    const manualPrayerTimes = stored
      .filter(a => a.category === 'Prayer' && !a.isPrayerAuto)
      .map(a => `${a.startTime}-${a.endTime}`);

    const finalPrayers = filtered.filter(p =>
      !manualPrayerTimes.includes(`${p.startTime}-${p.endTime}`)
    );

    return [...stored, ...finalPrayers];
  }, [prayerSettings, getPrayerActivitiesForDate]);

  // Activity CRUD
  const addActivity = useCallback((activity) => {
    const newAct = { ...activity, id: generateId(), completed: false };
    const updated = [...getActivitiesForDate(selectedDate), newAct];
    saveActivitiesForDate(selectedDate, updated);
    setActivities(updated);
    return newAct;
  }, [selectedDate]);

  const updateActivity = useCallback((id, updates) => {
    const current = getActivitiesForDate(selectedDate);
    const updated = current.map(a => a.id === id ? { ...a, ...updates } : a);
    saveActivitiesForDate(selectedDate, updated);
    setActivities(updated);
  }, [selectedDate]);

  const deleteActivity = useCallback((id) => {
    const current = getActivitiesForDate(selectedDate);
    const updated = current.filter(a => a.id !== id);
    saveActivitiesForDate(selectedDate, updated);
    setActivities(updated);
  }, [selectedDate]);

  const duplicateActivity = useCallback((id) => {
    const current = getActivitiesForDate(selectedDate);
    const source = current.find(a => a.id === id);
    if (source) {
      const newAct = { ...source, id: generateId(), completed: false };
      const updated = [...current, newAct];
      saveActivitiesForDate(selectedDate, updated);
      setActivities(updated);
    }
  }, [selectedDate]);

  const toggleActivityComplete = useCallback((id, targetDateStr) => {
    const targetDate = targetDateStr || selectedDate;
    const current = getActivitiesForDate(targetDate);
    const existingIndex = current.findIndex(a => a.id === id);

    let updated;
    let nowCompleted = false;
    let targetAct = null;

    if (existingIndex !== -1) {
      nowCompleted = !current[existingIndex].completed;
      updated = current.map(a => {
        if (a.id === id) {
          targetAct = { ...a, completed: nowCompleted };
          return targetAct;
        }
        return a;
      });
    } else {
      // It's a dynamically generated auto-prayer or template activity
      const all = getAllActivitiesForDate(targetDate);
      const found = all.find(a => a.id === id);
      if (found) {
        nowCompleted = true;
        targetAct = { ...found, completed: true };
        updated = [...current, targetAct];
      } else {
        return;
      }
    }

    // Update completion history
    const history = getCompletionHistory();
    if (!history[targetDate]) history[targetDate] = {};
    history[targetDate][id] = {
      completed: nowCompleted,
      completedAt: nowCompleted ? new Date().toISOString() : null,
      title: targetAct.title,
      category: targetAct.category,
      duration: targetAct.startTime && targetAct.endTime ? `${targetAct.startTime}-${targetAct.endTime}` : null,
    };
    saveCompletionHistory(history);
    setCompletionHistory({ ...history });

    saveActivitiesForDate(targetDate, updated);
    if (targetDate === selectedDate) {
      setActivities(updated);
    } else {
      setActivities([...getActivitiesForDate(selectedDate)]);
    }
  }, [selectedDate, getAllActivitiesForDate]);

  // Task library CRUD
  const addTask = useCallback((task) => {
    const newTask = { ...task, id: generateId(), completed: false };
    setTaskLibrary(prev => {
      const updated = [...prev, newTask];
      saveTaskLibrary(updated);
      return updated;
    });
    return newTask;
  }, []);

  const updateTask = useCallback((id, updates) => {
    setTaskLibrary(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      saveTaskLibrary(updated);
      return updated;
    });
  }, []);

  const deleteTask = useCallback((id) => {
    setTaskLibrary(prev => {
      const updated = prev.filter(t => t.id !== id);
      saveTaskLibrary(updated);
      return updated;
    });
  }, []);

  // Settings updates
  const updateSettings = useCallback((updates) => {
    setSettings(prev => {
      const updated = { ...prev, ...updates };
      saveSettings(updated);
      return updated;
    });
  }, []);

  const updatePrayerSettings = useCallback((updates) => {
    setPrayerSettings(prev => {
      const updated = { ...prev, ...updates };
      savePrayerSettings(updated);
      return updated;
    });
  }, []);

  // Learning tracker CRUD
  const addLearningItem = useCallback((item) => {
    setLearningTracker(prev => {
      const updated = [...prev, { ...item, id: generateId() }];
      saveLearningTracker(updated);
      return updated;
    });
  }, []);

  const updateLearningItem = useCallback((id, updates) => {
    setLearningTracker(prev => {
      const updated = prev.map(i => i.id === id ? { ...i, ...updates } : i);
      saveLearningTracker(updated);
      return updated;
    });
  }, []);

  const deleteLearningItem = useCallback((id) => {
    setLearningTracker(prev => {
      const updated = prev.filter(i => i.id !== id);
      saveLearningTracker(updated);
      return updated;
    });
  }, []);

  const value = {
    currentPage, setCurrentPage,
    selectedDate, setSelectedDate,
    activities, setActivities,
    taskLibrary, setTaskLibrary,
    prayerSettings, setPrayerSettings,
    settings,
    completionHistory,
    learningTracker,
    sidebarOpen, setSidebarOpen,
    getAllActivitiesForDate,
    addActivity, updateActivity, deleteActivity, duplicateActivity,
    toggleActivityComplete,
    addTask, updateTask, deleteTask,
    updateSettings, updatePrayerSettings,
    addLearningItem, updateLearningItem, deleteLearningItem,
  };

  if (!settings || !prayerSettings) return null; // Loading

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
