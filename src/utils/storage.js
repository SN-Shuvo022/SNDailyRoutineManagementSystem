const STORAGE_VERSION = 'mdp_v1_';

const KEYS = {
  ACTIVITIES: 'activities',
  TASKS: 'tasks',
  PRAYER_SETTINGS: 'prayerSettings',
  SETTINGS: 'settings',
  COMPLETION_HISTORY: 'completionHistory',
  LEARNING_TRACKER: 'learningTracker',
  MVD_DATES: 'mvdDates',
  THESIS_CONFIG: 'thesisConfig',
  ACCOUNT_SYNC: 'accountSync',
};

function getKey(key) {
  return STORAGE_VERSION + key;
}

export function loadData(key) {
  try {
    const raw = localStorage.getItem(getKey(key));
    if (raw === null) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error loading ${key}:`, e);
    return null;
  }
}

export function saveData(key, data) {
  try {
    localStorage.setItem(getKey(key), JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving ${key}:`, e);
  }
}

export function removeData(key) {
  localStorage.removeItem(getKey(key));
}

export function clearAllData() {
  Object.values(KEYS).forEach(key => {
    localStorage.removeItem(getKey(key));
  });
}

export function exportAllData() {
  const data = {};
  Object.entries(KEYS).forEach(([name, key]) => {
    data[name] = loadData(key);
  });
  data._exportDate = new Date().toISOString();
  data._version = STORAGE_VERSION;
  return data;
}

export function importAllData(data) {
  if (!data || !data._version) {
    throw new Error('Invalid backup file');
  }
  Object.entries(KEYS).forEach(([name, key]) => {
    if (data[name] !== undefined && data[name] !== null) {
      saveData(key, data[name]);
    }
  });
}

// Helper: get activities for a specific date (YYYY-MM-DD)
export function getActivitiesForDate(dateStr) {
  const all = loadData(KEYS.ACTIVITIES) || {};
  return all[dateStr] || [];
}

export function saveActivitiesForDate(dateStr, activities) {
  const all = loadData(KEYS.ACTIVITIES) || {};
  all[dateStr] = activities;
  saveData(KEYS.ACTIVITIES, all);
}

export function getAllActivities() {
  return loadData(KEYS.ACTIVITIES) || {};
}

// Tasks library
export function getTaskLibrary() {
  return loadData(KEYS.TASKS) || [];
}

export function saveTaskLibrary(tasks) {
  saveData(KEYS.TASKS, tasks);
}

// Prayer settings
export function getPrayerSettings() {
  return loadData(KEYS.PRAYER_SETTINGS) || getDefaultPrayerSettings();
}

export function savePrayerSettings(settings) {
  saveData(KEYS.PRAYER_SETTINGS, settings);
}

export function getDefaultPrayerSettings() {
  return {
    autoInsert: true,
    prayers: [
      { id: 'fajr', name: 'Fajr', startTime: '05:40', endTime: '06:10', enabled: true },
      { id: 'zuhr', name: 'Zuhr', startTime: '13:00', endTime: '13:30', enabled: true },
      { id: 'asr', name: 'Asr', startTime: '16:00', endTime: '16:30', enabled: true },
      { id: 'maghrib', name: 'Maghrib', startTime: '17:45', endTime: '18:15', enabled: true },
      { id: 'isha', name: 'Isha', startTime: '20:00', endTime: '20:30', enabled: true },
    ],
    overrides: {} // { 'YYYY-MM-DD': { fajr: { startTime, endTime }, ... } }
  };
}

// App settings
export function getSettings() {
  return loadData(KEYS.SETTINGS) || getDefaultSettings();
}

export function saveSettings(settings) {
  saveData(KEYS.SETTINGS, settings);
}

export function getDefaultSettings() {
  return {
    name: '',
    dayStartTime: '05:00',
    dayEndTime: '23:00',
    theme: 'light',
    categories: [
      'Thesis', 'PVsyst', 'Solar System Design', 'Research Paper',
      'Programming', 'Reading', 'Islamic Learning', 'Personal Development'
    ],
    focusBlockLabels: [
      { id: 'fb1', name: 'Morning Deep Work', color: '#3B82F6' },
      { id: 'fb2', name: 'Skill Development', color: '#10B981' },
      { id: 'fb3', name: 'Thesis / Research Deep Work', color: '#8B5CF6' },
      { id: 'fb4', name: 'Light Study / Daily Review', color: '#F59E0B' },
    ],
    suggestionRules: [
      { minMinutes: 10, maxMinutes: 20, suggestions: ['Short reading', 'Islamic bayan', 'Revision'] },
      { minMinutes: 20, maxMinutes: 40, suggestions: ['IEEE paper reading', 'Notes', 'Small learning tasks'] },
      { minMinutes: 40, maxMinutes: 60, suggestions: ['PVsyst practice', 'Technical skill practice'] },
      { minMinutes: 60, maxMinutes: 90, suggestions: ['Thesis deep work', 'Simulation'] },
      { minMinutes: 90, maxMinutes: 999, suggestions: ['Long thesis session', 'Solar system design', 'Extended simulation'] },
    ],
  };
}

// Completion history
export function getCompletionHistory() {
  return loadData(KEYS.COMPLETION_HISTORY) || {};
}

export function saveCompletionHistory(history) {
  saveData(KEYS.COMPLETION_HISTORY, history);
}

// Learning tracker
export function getLearningTracker() {
  return loadData(KEYS.LEARNING_TRACKER) || [];
}

export function saveLearningTracker(items) {
  saveData(KEYS.LEARNING_TRACKER, items);
}

// Minimum Viable Day (MVD) dates
export function getMvdDates() {
  return loadData(KEYS.MVD_DATES) || {};
}

export function saveMvdDates(dates) {
  saveData(KEYS.MVD_DATES, dates);
}

// Thesis configuration & milestones
export function getThesisConfig() {
  const stored = loadData(KEYS.THESIS_CONFIG);
  if (stored) return stored;

  const target = new Date();
  target.setDate(target.getDate() + 75);
  const targetStr = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`;

  return {
    title: 'Solar Energy Thesis (PVsyst & Solar PV Simulation)',
    targetDate: targetStr,
    milestones: [
      { id: 'm1', title: 'Literature Review & IEEE Papers Synthesis', completed: true },
      { id: 'm2', title: 'Solar PV Sizing & Mathematical Modeling', completed: false },
      { id: 'm3', title: 'PVsyst 3D Shading & Horizon Loss Simulation', completed: false },
      { id: 'm4', title: 'Simulation Results, Sensitivity Analysis & Graphs', completed: false },
      { id: 'm5', title: 'Thesis Paper Drafting & Final Defense Presentation', completed: false },
    ],
  };
}

export function saveThesisConfig(config) {
  saveData(KEYS.THESIS_CONFIG, config);
}

// Account & Multi-Device Sync settings
export function getAccountSync() {
  return loadData(KEYS.ACCOUNT_SYNC) || {
    accountId: '',
    syncPin: '',
    isLoggedIn: false,
    autoSync: false,
    lastSyncedAt: null,
  };
}

export function saveAccountSync(sync) {
  saveData(KEYS.ACCOUNT_SYNC, sync);
}

export { KEYS };
