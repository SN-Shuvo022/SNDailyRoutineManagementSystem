import React, { useState } from 'react';
import {
  Settings as SettingsIcon, Save, Download, Upload, Trash2, Clock, Check,
  AlertTriangle, FileText, User, Smartphone, Compass, Plus, X, Flame
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { exportAllData, importAllData, clearAllData, saveActivitiesForDate } from '../utils/storage';
import { getMondaySampleTemplate } from '../utils/sampleData';
import { getTodayStr } from '../utils/timeUtils';
import AccountSyncModal from '../components/AccountSyncModal';
import '../styles/Settings.css';

export default function Settings() {
  const {
    settings, updateSettings, prayerSettings, updatePrayerSettings,
    thesisConfig, updateThesisConfig, toggleThesisMilestone, addThesisMilestone, deleteThesisMilestone,
    accountSync, isFirebaseConnected, setIsSyncModalOpen, setSelectedDate, setCurrentPage, setActivities
  } = useApp();

  const [formSettings, setFormSettings] = useState({ ...settings });
  const [formPrayers, setFormPrayers] = useState({ ...prayerSettings });
  const [formThesis, setFormThesis] = useState({ ...thesisConfig });
  const [newMilestoneText, setNewMilestoneText] = useState('');
  const [savedMessage, setSavedMessage] = useState(false);
  const [importError, setImportError] = useState(null);

  const handleSettingsChange = (field, value) => {
    setFormSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleThesisChange = (field, value) => {
    setFormThesis(prev => ({ ...prev, [field]: value }));
  };

  const handlePrayerTimeChange = (id, field, value) => {
    setFormPrayers(prev => ({
      ...prev,
      prayers: prev.prayers.map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  const handlePrayerToggle = (id) => {
    setFormPrayers(prev => ({
      ...prev,
      prayers: prev.prayers.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p)
    }));
  };

  const handleSaveAll = (e) => {
    e.preventDefault();
    updateSettings(formSettings);
    updatePrayerSettings(formPrayers);
    updateThesisConfig(formThesis);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const handleAddMilestone = (e) => {
    e.preventDefault();
    if (!newMilestoneText.trim()) return;
    addThesisMilestone(newMilestoneText.trim());
    setNewMilestoneText('');
  };

  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sn-routine-backup-${getTodayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        importAllData(json);
        alert('Data imported successfully! The page will refresh now.');
        window.location.reload();
      } catch (err) {
        setImportError('Invalid backup file format: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    if (window.confirm('⚠️ Are you sure you want to delete ALL data? This will clear all activities, custom tasks, and history. This cannot be undone.')) {
      if (window.confirm('Please confirm again: Delete all local data completely?')) {
        clearAllData();
        window.location.reload();
      }
    }
  };

  const handleLoadSampleMonday = () => {
    const today = getTodayStr();
    if (window.confirm(`Load the sample Monday schedule into today (${today})? Existing activities for today will be preserved.`)) {
      const template = getMondaySampleTemplate();
      saveActivitiesForDate(today, template);
      setActivities(template);
      setSelectedDate(today);
      setCurrentPage('planner');
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-page__header">
        <div>
          <h2>Application Settings</h2>
          <p className="settings-page__subtitle">Configure your planning parameters, prayer timings, thesis milestones, and device sync</p>
        </div>
        <button className="btn btn--primary" onClick={handleSaveAll}>
          <Save size={16} /> Save Changes
        </button>
      </div>

      {savedMessage && (
        <div className="settings-alert settings-alert--success">
          <Check size={18} /> Settings saved successfully!
        </div>
      )}

      {importError && (
        <div className="settings-alert settings-alert--error">
          <AlertTriangle size={18} /> {importError}
        </div>
      )}

      <form onSubmit={handleSaveAll} className="settings-grid">
        {/* Profile & Planning Window */}
        <div className="settings-card">
          <div className="settings-card__header">
            <h3><User size={18} /> Profile & Planning Window</h3>
          </div>
          <div className="form-group">
            <label>Your Name / Nickname</label>
            <input
              type="text"
              placeholder="e.g., SN Shuvo"
              value={formSettings.name || ''}
              onChange={e => handleSettingsChange('name', e.target.value)}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Daily Planning Window Start *</label>
              <input
                type="time"
                value={formSettings.dayStartTime}
                onChange={e => handleSettingsChange('dayStartTime', e.target.value)}
                required
              />
              <span className="field-hint">e.g., 05:00 AM (Fajr / Wake up)</span>
            </div>
            <div className="form-group">
              <label>Daily Planning Window End *</label>
              <input
                type="time"
                value={formSettings.dayEndTime}
                onChange={e => handleSettingsChange('dayEndTime', e.target.value)}
                required
              />
              <span className="field-hint">e.g., 23:00 PM (11:00 PM sleep time)</span>
            </div>
          </div>
        </div>

        {/* Thesis Compass & Milestone Settings (Feature 6) */}
        <div className="settings-card">
          <div className="settings-card__header">
            <div>
              <h3><Compass size={18} /> Thesis Compass & Milestone Tracker</h3>
              <p className="settings-card__desc">Track days remaining to your solar thesis submission & manage core milestones.</p>
            </div>
          </div>

          <div className="form-group">
            <label>Thesis / Research Title</label>
            <input
              type="text"
              value={formThesis.title || ''}
              onChange={e => handleThesisChange('title', e.target.value)}
              placeholder="e.g. Solar PV System Design & PVsyst Simulation Thesis"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Target Submission Date</label>
              <input
                type="date"
                value={formThesis.targetDate || ''}
                onChange={e => handleThesisChange('targetDate', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Daily Minimum Target (mins)</label>
              <input
                type="number"
                min="15"
                max="360"
                value={formThesis.dailyTargetMinutes || 30}
                onChange={e => handleThesisChange('dailyTargetMinutes', parseInt(e.target.value) || 30)}
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ marginBottom: '0.4rem', display: 'block' }}>Milestones Checklist</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {(thesisConfig.milestones || []).map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.6rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input
                      type="checkbox"
                      checked={m.completed}
                      onChange={() => toggleThesisMilestone(m.id)}
                    />
                    <span style={{ textDecoration: m.completed ? 'line-through' : 'none', color: m.completed ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                      {m.title}
                    </span>
                  </label>
                  <button
                    type="button"
                    className="icon-btn icon-btn--danger"
                    onClick={() => deleteThesisMilestone(m.id)}
                    title="Delete milestone"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
              <input
                type="text"
                placeholder="Add milestone (e.g., PVsyst Inverter Loss Analysis)..."
                value={newMilestoneText}
                onChange={e => setNewMilestoneText(e.target.value)}
                style={{ fontSize: '0.85rem' }}
              />
              <button type="button" className="btn btn--secondary btn--sm" onClick={handleAddMilestone}>
                <Plus size={14} /> Add
              </button>
            </div>
          </div>
        </div>

        {/* Multi-Device Sync Card */}
        <div className="settings-card">
          <div className="settings-card__header">
            <div>
              <h3><Smartphone size={18} /> Multi-Device & Account Sync</h3>
              <p className="settings-card__desc">Sync your routines seamlessly between your laptop and phone.</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  Account: {accountSync?.isLoggedIn ? accountSync.accountId : 'Not Connected'}
                </div>
                <div style={{ fontSize: '0.75rem', color: isFirebaseConnected ? '#059669' : 'var(--text-muted)', fontWeight: isFirebaseConnected ? 600 : 400 }}>
                  {isFirebaseConnected
                    ? '🔥 Firebase Real-time Sub-Second Sync: Active'
                    : accountSync?.isLoggedIn
                    ? '⚡ Local Account Active · Connect Firebase for 0.1s Live Sync'
                    : 'Activate an account to enable instant sync'}
                </div>
              </div>
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => setIsSyncModalOpen(true)}
              >
                <Smartphone size={14} /> Open Sync Manager
              </button>
            </div>
          </div>
        </div>

        {/* Prayer Time Settings */}
        <div className="settings-card">
          <div className="settings-card__header">
            <div>
              <h3><Clock size={18} /> Prayer Timings (Bangladesh)</h3>
              <p className="settings-card__desc">Adjust default prayer times. They automatically insert into your daily timeline.</p>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formPrayers.autoInsert}
                onChange={e => setFormPrayers(p => ({ ...p, autoInsert: e.target.checked }))}
              />
              <span>Automatically insert prayer blocks into each day's schedule</span>
            </label>
          </div>

          <div className="prayers-table">
            <div className="prayers-table__header">
              <span>Prayer</span>
              <span>Enabled</span>
              <span>Start</span>
              <span>End</span>
            </div>
            {formPrayers.prayers.map(prayer => (
              <div key={prayer.id} className="prayers-table__row">
                <span className="prayer-name">{prayer.name}</span>
                <input
                  type="checkbox"
                  checked={prayer.enabled}
                  onChange={() => handlePrayerToggle(prayer.id)}
                  aria-label={`Enable ${prayer.name}`}
                />
                <input
                  type="time"
                  value={prayer.startTime}
                  onChange={e => handlePrayerTimeChange(prayer.id, 'startTime', e.target.value)}
                />
                <input
                  type="time"
                  value={prayer.endTime}
                  onChange={e => handlePrayerTimeChange(prayer.id, 'endTime', e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Focus Block Categories */}
        <div className="settings-card">
          <div className="settings-card__header">
            <h3>Focus Block Customization</h3>
          </div>
          <div className="focus-blocks-config">
            {formSettings.focusBlockLabels.map((fb, idx) => (
              <div key={fb.id} className="focus-block-row">
                <span className="focus-block-color-indicator" style={{ backgroundColor: fb.color }} />
                <span className="focus-block-label">Block {idx + 1}:</span>
                <input
                  type="text"
                  value={fb.name}
                  onChange={e => {
                    const newLabels = [...formSettings.focusBlockLabels];
                    newLabels[idx].name = e.target.value;
                    handleSettingsChange('focusBlockLabels', newLabels);
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Quick Template & Data Management */}
        <div className="settings-card">
          <div className="settings-card__header">
            <h3>Backup, Export & Templates</h3>
          </div>
          <div className="settings-actions-list">
            <div className="action-item">
              <div>
                <strong>Sample Routine Template</strong>
                <p>Load the full Monday sample schedule into today to test scheduling and free-time detection.</p>
              </div>
              <button type="button" className="btn btn--outline" onClick={handleLoadSampleMonday}>
                <FileText size={16} /> Load Sample
              </button>
            </div>

            <div className="action-item">
              <div>
                <strong>Export Local Backup</strong>
                <p>Download all your activities, tasks, and settings to a JSON file.</p>
              </div>
              <button type="button" className="btn btn--outline" onClick={handleExport}>
                <Download size={16} /> Export JSON
              </button>
            </div>

            <div className="action-item">
              <div>
                <strong>Import Backup</strong>
                <p>Restore your data from a previously saved JSON file.</p>
              </div>
              <label className="btn btn--outline" style={{ cursor: 'pointer' }}>
                <Upload size={16} /> Import JSON
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            <div className="action-item action-item--danger">
              <div>
                <strong>Clear All Application Data</strong>
                <p>Erase all data stored in browser LocalStorage. Use with caution.</p>
              </div>
              <button type="button" className="btn btn--danger" onClick={handleClearData}>
                <Trash2 size={16} /> Clear All
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
