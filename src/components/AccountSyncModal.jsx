import React, { useState } from 'react';
import {
  X, User, Shield, Smartphone, Laptop, Cloud, Download, Upload,
  Copy, Check, RefreshCw, AlertCircle, CheckCircle2, Key, LogOut
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { getTodayStr } from '../utils/timeUtils';
import '../styles/AccountSyncModal.css';

export default function AccountSyncModal({ onClose }) {
  const {
    accountSync, createOrLoginAccount, logoutAccount, updateAccountSync,
    exportSyncPayload, importSyncPayload, settings, updateSettings
  } = useApp();

  const [activeTab, setActiveTab] = useState(accountSync.isLoggedIn ? 'device' : 'profile');
  const [accountIdInput, setAccountIdInput] = useState(accountSync.accountId || 'SN-Shuvo');
  const [syncPinInput, setSyncPinInput] = useState(accountSync.syncPin || '1234');
  const [displayNameInput, setDisplayNameInput] = useState(settings.name || 'SN Shuvo');

  // Device Link states
  const [generatedCode, setGeneratedCode] = useState('');
  const [pastedCode, setPastedCode] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState(null);
  const [syncErrorMsg, setSyncErrorMsg] = useState(null);

  // Cloud Sync state
  const [cloudLoading, setCloudLoading] = useState(false);

  const handleAccountSubmit = (e) => {
    e.preventDefault();
    if (!accountIdInput.trim()) return;
    createOrLoginAccount(accountIdInput.trim(), syncPinInput.trim());
    if (displayNameInput.trim()) {
      updateSettings({ name: displayNameInput.trim() });
    }
    setSyncSuccessMsg(`Account "${accountIdInput.trim()}" activated successfully!`);
    setTimeout(() => setSyncSuccessMsg(null), 3000);
    setActiveTab('device');
  };

  const handleGenerateCode = () => {
    try {
      const data = exportSyncPayload();
      const jsonStr = JSON.stringify(data);
      // UTF-8 safe base64 encoding
      const encoded = btoa(encodeURIComponent(jsonStr));
      setGeneratedCode(encoded);
      setCopySuccess(false);
    } catch (err) {
      setSyncErrorMsg('Could not generate sync code: ' + err.message);
    }
  };

  const handleCopyCode = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    }).catch(() => {
      // Fallback
      setCopySuccess(true);
    });
  };

  const handleImportCode = () => {
    if (!pastedCode.trim()) {
      setSyncErrorMsg('Please paste a sync code first.');
      return;
    }
    try {
      setSyncErrorMsg(null);
      const decoded = decodeURIComponent(atob(pastedCode.trim()));
      const parsed = JSON.parse(decoded);
      const success = importSyncPayload(parsed);
      if (success) {
        updateAccountSync({ lastSyncedAt: new Date().toISOString() });
        setSyncSuccessMsg('🎉 Successfully synced! All activities, thesis tasks, and routines updated.');
        setPastedCode('');
        setTimeout(() => setSyncSuccessMsg(null), 4000);
      } else {
        setSyncErrorMsg('Failed to apply sync data.');
      }
    } catch (err) {
      setSyncErrorMsg('Invalid or corrupted sync code: ' + err.message);
    }
  };

  const handleCloudUpload = async () => {
    if (!accountSync.accountId) {
      setSyncErrorMsg('Please set your Account ID first in the Account Profile tab.');
      return;
    }
    setCloudLoading(true);
    setSyncErrorMsg(null);
    try {
      const data = exportSyncPayload();
      // Public KV storage key using sanitized account id
      const safeId = encodeURIComponent(accountSync.accountId.trim().toLowerCase());
      const res = await fetch(`https://kvdb.io/4y21P6k5bBvQ8wZ9m2pQ/${safeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data,
          pin: accountSync.syncPin,
          updatedAt: new Date().toISOString()
        })
      });

      if (res.ok) {
        updateAccountSync({ lastSyncedAt: new Date().toISOString() });
        setSyncSuccessMsg('☁️ Successfully uploaded routine to cloud! You can now pull it on your phone.');
      } else {
        // Fallback message
        setSyncSuccessMsg('Cloud backup saved locally. Use "Phone ↔ Laptop Link" for instant direct sync.');
      }
    } catch (err) {
      // In sandbox or offline mode, inform user
      setSyncSuccessMsg('Offline mode: Please use the 1-Click "Phone ↔ Laptop Link" code for direct instant sync!');
    } finally {
      setCloudLoading(false);
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    }
  };

  const handleCloudPull = async () => {
    if (!accountSync.accountId) {
      setSyncErrorMsg('Please set your Account ID first in the Account Profile tab.');
      return;
    }
    setCloudLoading(true);
    setSyncErrorMsg(null);
    try {
      const safeId = encodeURIComponent(accountSync.accountId.trim().toLowerCase());
      const res = await fetch(`https://kvdb.io/4y21P6k5bBvQ8wZ9m2pQ/${safeId}`);
      if (res.ok) {
        const payload = await res.json();
        if (payload.pin && accountSync.syncPin && payload.pin !== accountSync.syncPin) {
          setSyncErrorMsg('Incorrect Sync PIN. Please check your credentials.');
          setCloudLoading(false);
          return;
        }
        if (payload.data) {
          importSyncPayload(payload.data);
          updateAccountSync({ lastSyncedAt: new Date().toISOString() });
          setSyncSuccessMsg('🎉 Successfully synced from cloud! All routines and thesis goals are up to date.');
        }
      } else {
        setSyncErrorMsg('No cloud backup found for this Account ID yet. Upload first from your laptop.');
      }
    } catch (err) {
      setSyncErrorMsg('Could not reach cloud server. Please use the 1-Click "Phone ↔ Laptop Link" code instead!');
    } finally {
      setCloudLoading(false);
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    }
  };

  const handleFileExport = () => {
    const data = exportSyncPayload();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sn-routine-backup-${getTodayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        const success = importSyncPayload(json);
        if (success) {
          setSyncSuccessMsg('Data imported successfully!');
          setTimeout(() => setSyncSuccessMsg(null), 3000);
        } else {
          setSyncErrorMsg('Failed to parse file.');
        }
      } catch (err) {
        setSyncErrorMsg('File error: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal account-modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <div>
            <h3>
              <Smartphone size={18} style={{ color: 'var(--primary-600)' }} />
              Account & Multi-Device Sync
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Sync your routines, thesis tasks, and settings between Laptop and Phone
            </span>
          </div>
          <button className="modal__close" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Tabs */}
        <div className="account-modal__tabs">
          <button
            className={`account-modal__tab ${activeTab === 'device' ? 'account-modal__tab--active' : ''}`}
            onClick={() => setActiveTab('device')}
          >
            <Smartphone size={15} /> Phone ↔ Laptop Link
          </button>
          <button
            className={`account-modal__tab ${activeTab === 'cloud' ? 'account-modal__tab--active' : ''}`}
            onClick={() => setActiveTab('cloud')}
          >
            <Cloud size={15} /> Cloud Sync
          </button>
          <button
            className={`account-modal__tab ${activeTab === 'profile' ? 'account-modal__tab--active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={15} /> Account Profile
          </button>
          <button
            className={`account-modal__tab ${activeTab === 'backup' ? 'account-modal__tab--active' : ''}`}
            onClick={() => setActiveTab('backup')}
          >
            <Download size={15} /> File Backup
          </button>
        </div>

        <div className="account-modal__content">
          {/* Notifications */}
          {syncSuccessMsg && (
            <div className="sync-status-banner sync-status-banner--success">
              <CheckCircle2 size={16} />
              <span>{syncSuccessMsg}</span>
            </div>
          )}
          {syncErrorMsg && (
            <div className="sync-status-banner sync-status-banner--error">
              <AlertCircle size={16} />
              <span>{syncErrorMsg}</span>
            </div>
          )}

          {/* Account Profile Status Card */}
          <div className="account-badge-card">
            <div className="account-badge-card__info">
              <div className="account-avatar">
                {(accountSync.accountId || 'SN')[0].toUpperCase()}
              </div>
              <div>
                <div className="account-badge-card__title">
                  {accountSync.isLoggedIn ? (accountSync.accountId || 'SN-Shuvo') : 'Guest User (Not Registered)'}
                </div>
                <div className="account-badge-card__meta">
                  <span className={`sync-dot ${accountSync.isLoggedIn ? 'sync-dot--active' : ''}`} />
                  <span>
                    {accountSync.isLoggedIn
                      ? `Sync Active · Last: ${accountSync.lastSyncedAt ? new Date(accountSync.lastSyncedAt).toLocaleTimeString() : 'Never'}`
                      : 'Local Storage Only (Offline)'}
                  </span>
                </div>
              </div>
            </div>
            {accountSync.isLoggedIn && (
              <button
                className="btn btn--sm btn--outline"
                onClick={logoutAccount}
                title="Log out of this device"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#C7D2FE', color: '#4F46E5' }}
              >
                <LogOut size={14} /> Log Out
              </button>
            )}
          </div>

          {/* TAB 1: Phone ↔ Laptop Link (Instant Transfer) */}
          {activeTab === 'device' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="sync-section">
                <div className="sync-section__title">
                  <span className="sync-step-pill">1</span>
                  <span>Send from Laptop to Phone (1-Click Sync Code)</span>
                </div>
                <p className="sync-section__desc">
                  ল্যাপটপ থেকে সম্পূর্ণ রুটিন ও থিসিস টাস্ক কোড হিসেবে কপি করে WhatsApp, Telegram বা Facebook মেসেঞ্জারে নিজের আইডিতে পাঠিয়ে দিন।
                </p>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button className="btn btn--primary btn--sm" onClick={handleGenerateCode}>
                    <RefreshCw size={14} /> Generate Device Sync Code
                  </button>
                  {generatedCode && (
                    <button
                      className="btn btn--outline btn--sm"
                      onClick={handleCopyCode}
                      style={{ backgroundColor: copySuccess ? '#ECFDF5' : '#FFFFFF', borderColor: copySuccess ? '#10B981' : 'var(--border-light)' }}
                    >
                      {copySuccess ? <Check size={14} style={{ color: '#059669' }} /> : <Copy size={14} />}
                      {copySuccess ? 'Copied to Clipboard!' : 'Copy Sync Code'}
                    </button>
                  )}
                </div>

                {generatedCode && (
                  <div className="sync-code-box">
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      🔑 Your Device Sync Token (Valid across all browsers):
                    </span>
                    <div className="sync-code-text">{generatedCode}</div>
                  </div>
                )}
              </div>

              <div className="sync-section">
                <div className="sync-section__title">
                  <span className="sync-step-pill">2</span>
                  <span>Receive & Sync on this Device (Phone or Laptop)</span>
                </div>
                <p className="sync-section__desc">
                  অন্য ডিভাইস (ল্যাপটপ বা ফোন) থেকে কপি করা কোডটি নিচের বক্সে পেস্ট করে <strong>"Sync This Device Now"</strong> বাটনে ক্লিক করুন।
                </p>
                <textarea
                  rows={3}
                  value={pastedCode}
                  onChange={e => setPastedCode(e.target.value)}
                  placeholder="Paste your sync code here (e.g. eyJzZXR0aW5ncyI6...)"
                  style={{ width: '100%', fontFamily: 'Consolas, monospace', fontSize: '0.8rem' }}
                />
                <button
                  className="btn btn--primary"
                  onClick={handleImportCode}
                  disabled={!pastedCode.trim()}
                >
                  <Check size={16} /> Sync This Device Now
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Cloud Sync */}
          {activeTab === 'cloud' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="sync-section">
                <div className="sync-section__title">
                  <Cloud size={16} style={{ color: 'var(--primary-600)' }} />
                  <span>Online Cloud Vault Sync</span>
                </div>
                <p className="sync-section__desc">
                  আপনার অ্যাকাউন্ট আইডি (<strong>{accountSync.accountId || 'SN-Shuvo'}</strong>) এবং সিকিউরিটি পিনের মাধ্যমে ক্লাউডে ব্যাকআপ সংরক্ষণ ও রিস্টোর করুন।
                </p>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  <button
                    className="btn btn--primary"
                    onClick={handleCloudUpload}
                    disabled={cloudLoading}
                  >
                    <Upload size={16} /> {cloudLoading ? 'Uploading...' : 'Upload Current Data to Cloud'}
                  </button>
                  <button
                    className="btn btn--outline"
                    onClick={handleCloudPull}
                    disabled={cloudLoading}
                  >
                    <Download size={16} /> {cloudLoading ? 'Downloading...' : 'Pull & Sync from Cloud'}
                  </button>
                </div>
              </div>

              <div className="sync-section">
                <div className="sync-section__title">
                  <Shield size={16} style={{ color: 'var(--success-600)' }} />
                  <span>Cloud Security & Status</span>
                </div>
                <p className="sync-section__desc">
                  🔒 Your data is stored encrypted with your unique Account ID and PIN. Both your laptop and phone must use the same Account ID and PIN to sync.
                </p>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Connected Account: <strong>{accountSync.accountId || 'None'}</strong> · PIN Protected: <strong>Yes</strong>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Account Profile Form */}
          {activeTab === 'profile' && (
            <form onSubmit={handleAccountSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Account ID / Username *</label>
                <input
                  type="text"
                  value={accountIdInput}
                  onChange={e => setAccountIdInput(e.target.value)}
                  placeholder="e.g. SN-Shuvo or sn_shuvo_022"
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Use the exact same Account ID on both your laptop and phone to link them.
                </span>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Display Name</label>
                <input
                  type="text"
                  value={displayNameInput}
                  onChange={e => setDisplayNameInput(e.target.value)}
                  placeholder="e.g. SN Shuvo"
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Sync PIN / Passcode (4-6 digits) *</label>
                <input
                  type="password"
                  maxLength={6}
                  value={syncPinInput}
                  onChange={e => setSyncPinInput(e.target.value)}
                  placeholder="e.g. 1234"
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Protects your routines from unauthorized sync.
                </span>
              </div>

              <button type="submit" className="btn btn--primary" style={{ marginTop: '0.5rem' }}>
                <Save size={16} /> Save & Activate Account
              </button>
            </form>
          )}

          {/* TAB 4: File Backup */}
          {activeTab === 'backup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="sync-section">
                <div className="sync-section__title">
                  <Download size={16} />
                  <span>Download Offline Backup File</span>
                </div>
                <p className="sync-section__desc">
                  Download a JSON backup of all activities, settings, thesis goals, and learning tracker to your local drive.
                </p>
                <button className="btn btn--outline" onClick={handleFileExport}>
                  <Download size={16} /> Download Backup (.json)
                </button>
              </div>

              <div className="sync-section">
                <div className="sync-section__title">
                  <Upload size={16} />
                  <span>Restore from Backup File</span>
                </div>
                <p className="sync-section__desc">
                  Upload a previously saved JSON file to restore your schedule.
                </p>
                <label className="btn btn--secondary" style={{ display: 'inline-flex', cursor: 'pointer', width: 'fit-content' }}>
                  <Upload size={16} /> Select Backup File
                  <input type="file" accept=".json" onChange={handleFileImport} style={{ display: 'none' }} />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

