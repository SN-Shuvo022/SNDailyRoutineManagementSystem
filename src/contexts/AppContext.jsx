import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  getActivitiesForDate, saveActivitiesForDate, getAllActivities,
  getTaskLibrary, saveTaskLibrary,
  getPrayerSettings, savePrayerSettings,
  getSettings, saveSettings,
  getCompletionHistory, saveCompletionHistory,
  getLearningTracker, saveLearningTracker,
  getMvdDates, saveMvdDates,
  getThesisConfig, saveThesisConfig,
  getAccountSync, saveAccountSync,
  exportAllData, importAllData,
} from '../utils/storage';
import { getTodayStr, generateId, timeToMinutes, minutesToTime } from '../utils/timeUtils';
import { getDefaultTasks } from '../utils/suggestions';
import {
  getStoredFirebaseConfig, saveStoredFirebaseConfig,
  pushToFirestore, listenToFirestore, isFirebaseReady
} from '../utils/firebase.js';

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
  const [mvdDates, setMvdDates] = useState({});
  const [thesisConfig, setThesisConfig] = useState(null);
  const [accountSync, setAccountSync] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [firebaseConfig, setFirebaseConfig] = useState(getStoredFirebaseConfig());
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(isFirebaseReady());
  const [firebaseError, setFirebaseError] = useState(null);

  const lastLocalWriteTimeRef = useRef(0);
  const isSyncingFromRemoteRef = useRef(false);
  const cloudSyncTimeoutRef = useRef(null);

  // Trigger debounced cloud push whenever local state updates
  const triggerAutoCloudSync = useCallback(() => {
    if (isSyncingFromRemoteRef.current) return;
    if (cloudSyncTimeoutRef.current) clearTimeout(cloudSyncTimeoutRef.current);

    cloudSyncTimeoutRef.current = setTimeout(async () => {
      lastLocalWriteTimeRef.current = Date.now();
      const currentAccount = getAccountSync();
      const activeId = currentAccount?.accountId || 'SN-Shuvo';

      const payload = exportAllData();
      if (isFirebaseReady()) {
        const res = await pushToFirestore(activeId, { data: payload });
        if (res && res.success) {
          setIsFirebaseConnected(true);
          setFirebaseError(null);
        } else if (res && res.code === 'permission-denied') {
          setFirebaseError('permission-denied');
        }
      }

      setAccountSync(prev => {
        const up = {
          ...(prev || {}),
          accountId: activeId,
          isLoggedIn: true,
          lastSyncedAt: new Date().toISOString()
        };
        saveAccountSync(up);
        return up;
      });
    }, 400);
  }, []);

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
    const mvd = getMvdDates();
    setMvdDates(mvd);
    const tc = getThesisConfig();
    setThesisConfig(tc);

    let as = getAccountSync();
    if (!as || !as.accountId) {
      as = {
        accountId: 'SN-Shuvo',
        syncPin: '1234',
        isLoggedIn: true,
        lastSyncedAt: new Date().toISOString(),
        autoSync: true,
      };
      saveAccountSync(as);
    }
    setAccountSync(as);
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
  const addActivity = useCallback((activity, targetDateStr = null) => {
    const targetDate = targetDateStr || selectedDate;
    const newAct = { ...activity, id: generateId(), completed: false, status: 'pending' };
    const current = getActivitiesForDate(targetDate);
    const updated = [...current, newAct];
    saveActivitiesForDate(targetDate, updated);
    setActivities([...updated]);
    triggerAutoCloudSync();
    return newAct;
  }, [selectedDate, triggerAutoCloudSync]);

  const updateActivity = useCallback((id, updates, targetDateStr = null) => {
    const targetDate = targetDateStr || selectedDate;
    const current = getActivitiesForDate(targetDate);
    const existingIndex = current.findIndex(a => a.id === id);

    let updated;
    if (existingIndex !== -1) {
      updated = current.map(a => a.id === id ? { ...a, ...updates } : a);
    } else {
      const all = getAllActivitiesForDate(targetDate);
      const found = all.find(a => a.id === id);
      if (found) {
        updated = [...current, { ...found, ...updates }];
      } else {
        updated = current;
      }
    }
    saveActivitiesForDate(targetDate, updated);
    setActivities([...updated]);
    triggerAutoCloudSync();
  }, [selectedDate, getAllActivitiesForDate, triggerAutoCloudSync]);

  const deleteActivity = useCallback((id, targetDateStr = null) => {
    const targetDate = targetDateStr || selectedDate;
    const current = getActivitiesForDate(targetDate);
    const updated = current.filter(a => a.id !== id);
    saveActivitiesForDate(targetDate, updated);
    setActivities([...updated]);
    triggerAutoCloudSync();
  }, [selectedDate, triggerAutoCloudSync]);

  const duplicateActivity = useCallback((id, targetDateStr = null) => {
    const targetDate = targetDateStr || selectedDate;
    const current = getActivitiesForDate(targetDate);
    const source = current.find(a => a.id === id);
    if (source) {
      const newAct = { ...source, id: generateId(), completed: false, status: 'pending' };
      const updated = [...current, newAct];
      saveActivitiesForDate(targetDate, updated);
      setActivities([...updated]);
      triggerAutoCloudSync();
    }
  }, [selectedDate, triggerAutoCloudSync]);

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
          targetAct = {
            ...a,
            completed: nowCompleted,
            status: nowCompleted ? 'completed' : 'pending'
          };
          return targetAct;
        }
        return a;
      });
    } else {
      const all = getAllActivitiesForDate(targetDate);
      const found = all.find(a => a.id === id);
      if (found) {
        nowCompleted = true;
        targetAct = { ...found, completed: true, status: 'completed' };
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
      status: nowCompleted ? 'completed' : 'pending',
      completedAt: nowCompleted ? new Date().toISOString() : null,
      title: targetAct.title,
      category: targetAct.category,
      duration: targetAct.startTime && targetAct.endTime ? `${targetAct.startTime}-${targetAct.endTime}` : null,
    };
    saveCompletionHistory(history);
    setCompletionHistory({ ...history });

    saveActivitiesForDate(targetDate, updated);
    setActivities([...updated]);
    triggerAutoCloudSync();
  }, [selectedDate, getAllActivitiesForDate, triggerAutoCloudSync]);

  const toggleActivityMissed = useCallback((id, targetDateStr) => {
    const targetDate = targetDateStr || selectedDate;
    const current = getActivitiesForDate(targetDate);
    const existingIndex = current.findIndex(a => a.id === id);

    let updated;
    let nowMissed = false;
    let targetAct = null;

    if (existingIndex !== -1) {
      const act = current[existingIndex];
      nowMissed = act.status !== 'missed';
      updated = current.map(a => {
        if (a.id === id) {
          targetAct = {
            ...a,
            status: nowMissed ? 'missed' : 'pending',
            completed: false
          };
          return targetAct;
        }
        return a;
      });
    } else {
      const all = getAllActivitiesForDate(targetDate);
      const found = all.find(a => a.id === id);
      if (found) {
        nowMissed = true;
        targetAct = { ...found, status: 'missed', completed: false };
        updated = [...current, targetAct];
      } else {
        return;
      }
    }

    const history = getCompletionHistory();
    if (!history[targetDate]) history[targetDate] = {};
    history[targetDate][id] = {
      completed: false,
      status: nowMissed ? 'missed' : 'pending',
      missedAt: nowMissed ? new Date().toISOString() : null,
      title: targetAct.title,
      category: targetAct.category,
    };
    saveCompletionHistory(history);
    setCompletionHistory({ ...history });

    saveActivitiesForDate(targetDate, updated);
    setActivities([...updated]);
    triggerAutoCloudSync();
  }, [selectedDate, getAllActivitiesForDate, triggerAutoCloudSync]);

  const updateActivityNote = useCallback((id, reflectionNote, targetDateStr) => {
    const targetDate = targetDateStr || selectedDate;
    const current = getActivitiesForDate(targetDate);
    const existingIndex = current.findIndex(a => a.id === id);

    let updated;
    if (existingIndex !== -1) {
      updated = current.map(a => a.id === id ? { ...a, reflectionNote } : a);
    } else {
      const all = getAllActivitiesForDate(targetDate);
      const found = all.find(a => a.id === id);
      if (found) {
        updated = [...current, { ...found, reflectionNote }];
      } else {
        return;
      }
    }

    saveActivitiesForDate(targetDate, updated);
    setActivities([...updated]);
    triggerAutoCloudSync();
  }, [selectedDate, getAllActivitiesForDate, triggerAutoCloudSync]);

  // Task library CRUD
  const addTask = useCallback((task) => {
    const newTask = { ...task, id: generateId(), completed: false };
    setTaskLibrary(prev => {
      const updated = [...prev, newTask];
      saveTaskLibrary(updated);
      return updated;
    });
    triggerAutoCloudSync();
    return newTask;
  }, [triggerAutoCloudSync]);

  const updateTask = useCallback((id, updates) => {
    setTaskLibrary(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      saveTaskLibrary(updated);
      return updated;
    });
    triggerAutoCloudSync();
  }, [triggerAutoCloudSync]);

  const deleteTask = useCallback((id) => {
    setTaskLibrary(prev => {
      const updated = prev.filter(t => t.id !== id);
      saveTaskLibrary(updated);
      return updated;
    });
    triggerAutoCloudSync();
  }, [triggerAutoCloudSync]);

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

  const shiftActivities = useCallback((shiftMinutes, fromTime = null, targetDateStr = null) => {
    const targetDate = targetDateStr || selectedDate;
    const current = getActivitiesForDate(targetDate);
    if (!current || current.length === 0) return 0;

    let thresholdMinutes = 0;
    if (fromTime) {
      thresholdMinutes = timeToMinutes(fromTime);
    } else {
      const today = getTodayStr();
      if (targetDate === today) {
        const now = new Date();
        thresholdMinutes = now.getHours() * 60 + now.getMinutes();
      } else {
        thresholdMinutes = timeToMinutes(settings?.dayStartTime || '05:00');
      }
    }

    let shiftedCount = 0;
    const updated = current.map(act => {
      // 1. Prayer activities are locked & untouched
      if (act.category === 'Prayer' || act.isPrayerAuto) {
        return act;
      }

      // 2. Already completed activities are not altered
      if (act.completed) {
        return act;
      }

      const actStart = timeToMinutes(act.startTime);
      // 3. Shift activities starting at or after threshold
      if (actStart >= thresholdMinutes) {
        const duration = timeToMinutes(act.endTime) - actStart;
        const newStartMin = Math.max(0, actStart + shiftMinutes);
        const newEndMin = Math.min(24 * 60 - 1, newStartMin + duration);

        shiftedCount++;
        return {
          ...act,
          startTime: minutesToTime(newStartMin),
          endTime: minutesToTime(newEndMin)
        };
      }

      return act;
    });

    saveActivitiesForDate(targetDate, updated);
    if (targetDate === selectedDate) {
      setActivities(updated);
    } else {
      setActivities([...getActivitiesForDate(selectedDate)]);
    }
    return shiftedCount;
  }, [selectedDate, settings]);

  // Minimum Viable Day (MVD) helpers
  const isMinimumViableDay = useCallback((dateStr) => {
    const target = dateStr || selectedDate;
    return Boolean(mvdDates[target]);
  }, [mvdDates, selectedDate]);

  const toggleMinimumViableDay = useCallback((dateStr) => {
    const target = dateStr || selectedDate;
    setMvdDates(prev => {
      const updated = { ...prev, [target]: !prev[target] };
      saveMvdDates(updated);
      return updated;
    });
  }, [selectedDate]);

  // Thesis Config & Milestone helpers
  const updateThesisConfig = useCallback((updates) => {
    setThesisConfig(prev => {
      const updated = { ...prev, ...updates };
      saveThesisConfig(updated);
      return updated;
    });
  }, []);

  const toggleThesisMilestone = useCallback((milestoneId) => {
    setThesisConfig(prev => {
      const updatedMilestones = prev.milestones.map(m =>
        m.id === milestoneId ? { ...m, completed: !m.completed } : m
      );
      const updated = { ...prev, milestones: updatedMilestones };
      saveThesisConfig(updated);
      return updated;
    });
  }, []);

  const addThesisMilestone = useCallback((title) => {
    if (!title || !title.trim()) return;
    setThesisConfig(prev => {
      const newMilestone = { id: generateId(), title: title.trim(), completed: false };
      const updated = { ...prev, milestones: [...prev.milestones, newMilestone] };
      saveThesisConfig(updated);
      return updated;
    });
  }, []);

  const deleteThesisMilestone = useCallback((milestoneId) => {
    setThesisConfig(prev => {
      const updated = { ...prev, milestones: prev.milestones.filter(m => m.id !== milestoneId) };
      saveThesisConfig(updated);
      return updated;
    });
  }, []);

  // Account & Sync helpers
  const updateAccountSync = useCallback((updates) => {
    setAccountSync(prev => {
      const updated = { ...prev, ...updates };
      saveAccountSync(updated);
      return updated;
    });
  }, []);

  const createOrLoginAccount = useCallback((accountId, syncPin) => {
    const updated = {
      accountId: accountId.trim(),
      syncPin: syncPin.trim(),
      isLoggedIn: true,
      lastSyncedAt: new Date().toISOString(),
      autoSync: true,
    };
    setAccountSync(updated);
    saveAccountSync(updated);
    return updated;
  }, []);

  const logoutAccount = useCallback(() => {
    const updated = {
      accountId: '',
      syncPin: '',
      isLoggedIn: false,
      lastSyncedAt: null,
      autoSync: false,
    };
    setAccountSync(updated);
    saveAccountSync(updated);
  }, []);

  const exportSyncPayload = useCallback(() => {
    return exportAllData();
  }, []);

  const importSyncPayload = useCallback((payload) => {
    try {
      importAllData(payload);
      setSettings(getSettings());
      setPrayerSettings(getPrayerSettings());
      setTaskLibrary(getTaskLibrary());
      setCompletionHistory(getCompletionHistory());
      setLearningTracker(getLearningTracker());
      setMvdDates(getMvdDates());
      setThesisConfig(getThesisConfig());
      setActivities(getActivitiesForDate(selectedDate));
      return true;
    } catch (e) {
      console.error('Import sync error:', e);
      return false;
    }
  }, [selectedDate]);

  const saveFirebaseSettings = useCallback((config, accountIdHint = null) => {
    saveStoredFirebaseConfig(config);
    setFirebaseConfig(config);
    setIsFirebaseConnected(Boolean(config && config.apiKey && config.projectId));

    // Ensure account is logged in and active
    const current = getAccountSync();
    if (!current?.accountId || !current?.isLoggedIn) {
      const activeId = accountIdHint || current?.accountId || settings?.name || 'SN-Shuvo';
      const updated = {
        accountId: activeId.trim(),
        syncPin: current?.syncPin || '1234',
        isLoggedIn: true,
        lastSyncedAt: new Date().toISOString(),
        autoSync: true,
      };
      setAccountSync(updated);
      saveAccountSync(updated);
    }

    triggerAutoCloudSync();
  }, [settings, triggerAutoCloudSync]);

  const removeFirebaseSettings = useCallback(() => {
    saveStoredFirebaseConfig(null);
    setFirebaseConfig(null);
    setIsFirebaseConnected(false);
  }, []);

  // Listen to remote changes in Firestore from other devices (Phone <-> Laptop)
  useEffect(() => {
    if (!isFirebaseReady()) {
      setIsFirebaseConnected(false);
      return;
    }

    const activeAccountId = accountSync?.accountId || 'SN-Shuvo';

    setIsFirebaseConnected(true);
    const unsubscribe = listenToFirestore(activeAccountId, (remoteDoc) => {
      if (!remoteDoc || !remoteDoc.data) return;
      // Prevent echo if change originated from this client within 1.5 seconds
      if (Date.now() - lastLocalWriteTimeRef.current < 1500) return;

      isSyncingFromRemoteRef.current = true;
      try {
        importSyncPayload(remoteDoc.data);
      } finally {
        setTimeout(() => {
          isSyncingFromRemoteRef.current = false;
        }, 300);
      }
    }, (err) => {
      if (err && (err.code === 'permission-denied' || (err.message && err.message.includes('permission')))) {
        setFirebaseError('permission-denied');
      }
    });

    return () => unsubscribe();
  }, [accountSync?.accountId, firebaseConfig, importSyncPayload]);

  const value = {
    currentPage, setCurrentPage,
    selectedDate, setSelectedDate,
    activities, setActivities,
    taskLibrary, setTaskLibrary,
    prayerSettings, setPrayerSettings,
    settings,
    completionHistory,
    learningTracker,
    mvdDates,
    thesisConfig,
    accountSync,
    isSyncModalOpen, setIsSyncModalOpen,
    firebaseConfig,
    isFirebaseConnected,
    firebaseError,
    saveFirebaseSettings,
    removeFirebaseSettings,
    triggerAutoCloudSync,
    sidebarOpen, setSidebarOpen,
    getAllActivitiesForDate,
    addActivity, updateActivity, deleteActivity, duplicateActivity,
    toggleActivityComplete,
    toggleActivityMissed,
    updateActivityNote,
    addTask, updateTask, deleteTask,
    updateSettings, updatePrayerSettings,
    addLearningItem, updateLearningItem, deleteLearningItem,
    shiftActivities,
    isMinimumViableDay, toggleMinimumViableDay,
    updateThesisConfig, toggleThesisMilestone, addThesisMilestone, deleteThesisMilestone,
    updateAccountSync, createOrLoginAccount, logoutAccount,
    exportSyncPayload, importSyncPayload,
  };

  if (!settings || !prayerSettings || !thesisConfig || !accountSync) return null; // Loading

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
