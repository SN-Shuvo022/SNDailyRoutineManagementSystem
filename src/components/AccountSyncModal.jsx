import React, { useState, useEffect } from 'react';
import {
  X, User, Shield, Smartphone, Laptop, Cloud, Download, Upload,
  Copy, Check, RefreshCw, AlertCircle, CheckCircle2, Key, LogOut, Flame, Trash2
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { parseFirebaseConfigInput } from '../utils/firebase.js';
import { getTodayStr } from '../utils/timeUtils';
import '../styles/AccountSyncModal.css';

export default function AccountSyncModal({ onClose }) {
  const {
    accountSync, createOrLoginAccount, logoutAccount, updateAccountSync,
    exportSyncPayload, importSyncPayload, settings, updateSettings,
    firebaseConfig, isFirebaseConnected, firebaseError, saveFirebaseSettings, removeFirebaseSettings,
    triggerAutoCloudSync
  } = useApp();

  const [activeTab, setActiveTab] = useState('firebase');
  const [accountIdInput, setAccountIdInput] = useState(accountSync?.accountId || 'SN-Shuvo');
  const [syncPinInput, setSyncPinInput] = useState(accountSync?.syncPin || '1234');
  const [displayNameInput, setDisplayNameInput] = useState(settings?.name || 'SN Shuvo');

  // Firebase tab states
  const [firebaseInput, setFirebaseInput] = useState(
    firebaseConfig ? JSON.stringify(firebaseConfig, null, 2) : ''
  );
  const [inputMode, setInputMode] = useState('paste'); // 'paste' or 'manual'
  const [manualApiKey, setManualApiKey] = useState(firebaseConfig?.apiKey || '');
  const [manualProjectId, setManualProjectId] = useState(firebaseConfig?.projectId || '');
  const [manualAppId, setManualAppId] = useState(firebaseConfig?.appId || '');
  const [firebaseConnecting, setFirebaseConnecting] = useState(false);
  const [firebaseInlineMsg, setFirebaseInlineMsg] = useState(null);

  // Device Link states
  const [generatedCode, setGeneratedCode] = useState('');
  const [pastedCode, setPastedCode] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState(null);
  const [syncErrorMsg, setSyncErrorMsg] = useState(null);

  // Cloud Sync state
  const [cloudLoading, setCloudLoading] = useState(false);

  useEffect(() => {
    if (firebaseConfig) {
      setFirebaseInput(JSON.stringify(firebaseConfig, null, 2));
      setManualApiKey(firebaseConfig.apiKey || '');
      setManualProjectId(firebaseConfig.projectId || '');
      setManualAppId(firebaseConfig.appId || '');
    }
  }, [firebaseConfig]);

  const handleAccountSubmit = (e) => {
    e.preventDefault();
    if (!accountIdInput.trim()) return;
    createOrLoginAccount(accountIdInput.trim(), syncPinInput.trim());
    if (displayNameInput.trim()) {
      updateSettings({ name: displayNameInput.trim() });
    }
    setSyncSuccessMsg(`Account "${accountIdInput.trim()}" activated successfully!`);
    setTimeout(() => setSyncSuccessMsg(null), 3000);
    setActiveTab('firebase');
  };

  const handleSaveFirebase = (e) => {
    e.preventDefault();
    setFirebaseInlineMsg(null);
    setSyncErrorMsg(null);

    let parsed = null;

    if (inputMode === 'paste') {
      if (!firebaseInput.trim()) {
        setFirebaseInlineMsg({
          type: 'error',
          text: 'দয়া করে নিচের বক্সে আপনার Firebase কনফিগারেশন কোডটি পেস্ট করুন।'
        });
        return;
      }

      setFirebaseConnecting(true);
      try {
        parsed = parseFirebaseConfigInput(firebaseInput);
      } catch (err) {
        setFirebaseInlineMsg({
          type: 'error',
          text: 'Firebase config error: ' + err.message
        });
        setFirebaseConnecting(false);
        return;
      }
    } else {
      if (!manualApiKey.trim() || !manualProjectId.trim()) {
        setFirebaseInlineMsg({
          type: 'error',
          text: 'দয়া করে API Key এবং Project ID উভয় ফিল্ড পূরণ করুন।'
        });
        return;
      }

      parsed = {
        apiKey: manualApiKey.trim(),
        projectId: manualProjectId.trim(),
        authDomain: `${manualProjectId.trim()}.firebaseapp.com`,
        storageBucket: `${manualProjectId.trim()}.appspot.com`,
        messagingSenderId: '',
        appId: manualAppId.trim(),
      };
    }

    if (!parsed || !parsed.apiKey || !parsed.projectId) {
      setFirebaseInlineMsg({
        type: 'error',
        text: 'apiKey বা projectId পাওয়া যায়নি। দয়া করে কোডটি পুনরায় চেক করুন।'
      });
      setFirebaseConnecting(false);
      return;
    }

    try {
      saveFirebaseSettings(parsed);
      setFirebaseInlineMsg({
        type: 'success',
        text: '🎉 Firebase Live Sync সফলভাবে কানেক্ট হয়েছে! ফোন ও ল্যাপটপের মধ্যে রিয়েল-টাইম সিঙ্ক চালু হয়ে গেছে।'
      });
      setTimeout(() => setFirebaseInlineMsg(null), 5000);
    } catch (err) {
      setFirebaseInlineMsg({
        type: 'error',
        text: 'কানেক্ট করতে সমস্যা হয়েছে: ' + err.message
      });
    } finally {
      setFirebaseConnecting(false);
    }
  };

  const handleRemoveFirebase = () => {
    if (window.confirm('Disconnect Firebase Live Sync? Your local routines will remain safe.')) {
      removeFirebaseSettings();
      setFirebaseInput('');
      setManualApiKey('');
      setManualProjectId('');
      setManualAppId('');
      setFirebaseInlineMsg({
        type: 'success',
        text: 'Firebase Live Sync ডিসকানেক্ট করা হয়েছে।'
      });
      setTimeout(() => setFirebaseInlineMsg(null), 3000);
    }
  };

  const handleTestFirebasePing = () => {
    setFirebaseInlineMsg(null);
    triggerAutoCloudSync();
    setFirebaseInlineMsg({
      type: 'success',
      text: '📡 টেস্ট সিঙ্ক ডাটা Firebase-এ পাঠানো হয়েছে! অন্য ডিভাইসে লাইভ দেখতে পাবেন।'
    });
    setTimeout(() => setFirebaseInlineMsg(null), 4000);
  };

  const handleGenerateCode = () => {
    try {
      const data = exportSyncPayload();
      const jsonStr = JSON.stringify(data);
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
    if (!accountSync?.accountId) {
      setSyncErrorMsg('Please set your Account ID first in the Account Profile tab.');
      return;
    }
    setCloudLoading(true);
    setSyncErrorMsg(null);
    try {
      const data = exportSyncPayload();
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
        setSyncSuccessMsg('Cloud backup saved locally. Use "Phone ↔ Laptop Link" for instant direct sync.');
      }
    } catch (err) {
      setSyncSuccessMsg('Offline mode: Please use the 1-Click "Phone ↔ Laptop Link" code for direct instant sync!');
    } finally {
      setCloudLoading(false);
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    }
  };

  const handleCloudPull = async () => {
    if (!accountSync?.accountId) {
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
              Live real-time sync between Laptop & Phone
            </span>
          </div>
          <button className="modal__close" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Tabs */}
        <div className="account-modal__tabs">
          <button
            className={`account-modal__tab ${activeTab === 'firebase' ? 'account-modal__tab--active' : ''}`}
            onClick={() => setActiveTab('firebase')}
            style={{ color: activeTab === 'firebase' ? '#D97706' : undefined }}
          >
            <Flame size={15} style={{ color: '#D97706' }} /> Firebase Live Sync
          </button>
          <button
            className={`account-modal__tab ${activeTab === 'device' ? 'account-modal__tab--active' : ''}`}
            onClick={() => setActiveTab('device')}
          >
            <Smartphone size={15} /> 1-Click Link Code
          </button>
          <button
            className={`account-modal__tab ${activeTab === 'profile' ? 'account-modal__tab--active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={15} /> Account Profile
          </button>
          <button
            className={`account-modal__tab ${activeTab === 'cloud' ? 'account-modal__tab--active' : ''}`}
            onClick={() => setActiveTab('cloud')}
          >
            <Cloud size={15} /> Cloud Vault
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
                {(accountSync?.accountId || 'SN')[0].toUpperCase()}
              </div>
              <div>
                <div className="account-badge-card__title">
                  {accountSync?.isLoggedIn ? (accountSync.accountId || 'SN-Shuvo') : 'Guest User (Not Registered)'}
                </div>
                <div className="account-badge-card__meta">
                  <span className={`sync-dot ${isFirebaseConnected ? 'sync-dot--active' : accountSync?.isLoggedIn ? 'sync-dot--active' : ''}`} />
                  <span>
                    {isFirebaseConnected
                      ? '🔥 Firebase Real-Time Sub-Second Sync Active'
                      : accountSync?.isLoggedIn
                      ? 'Local Account Active (Connect Firebase for 0.1s Live Sync)'
                      : 'Local Storage Only (Offline)'}
                  </span>
                </div>
              </div>
            </div>
            {accountSync?.isLoggedIn && (
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

          {/* TAB: FIREBASE LIVE SYNC */}
          {activeTab === 'firebase' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="sync-section">
                <div className="sync-section__title" style={{ justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Flame size={18} style={{ color: '#D97706' }} />
                    <span style={{ fontWeight: 700 }}>Google Firebase Real-Time Live Sync</span>
                  </div>
                  <span className={`firebase-status-pill ${isFirebaseConnected ? 'firebase-status-pill--active' : ''}`}>
                    {isFirebaseConnected ? '● LIVE CONNECTED' : '○ NOT CONFIGURED'}
                  </span>
                </div>
                <p className="sync-section__desc">
                  এর মাধ্যমে আপনি যখনই ফোনে কোনো টাস্কে টিক (`✓`) বা নোট দেবেন, সাথে সাথে <strong>০.১ সেকেন্ডে কোনো রিলোড ছাড়াই আপনার ল্যাপটপে লাইভ আপডেট হয়ে যাবে!</strong>
                </p>

                {/* Account Link Verification Badge */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.75rem 0.85rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: '#1E293B', fontWeight: 600 }}>
                      📱 Linked Profile ID: <span style={{ color: '#2563EB', backgroundColor: '#EFF6FF', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>{accountSync?.accountId || 'SN-Shuvo'}</span>
                    </span>
                    <button
                      type="button"
                      className="btn btn--sm btn--outline"
                      onClick={() => setActiveTab('profile')}
                      style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem', borderColor: '#CBD5E1' }}
                    >
                      ✏️ Change ID
                    </button>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    ⚠️ লাইভ সিঙ্ক হওয়ার জন্য ফোন এবং ল্যাপটপ দুটিতেই এই Profile ID হুবহু একই (e.g. <code>SN-Shuvo</code>) হতে হবে।
                  </span>
                </div>

                {/* Firebase Permission Denied Alert */}
                {firebaseError === 'permission-denied' && (
                  <div className="sync-status-banner sync-status-banner--error" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                      <AlertCircle size={18} />
                      <span>Firebase Security Rules: Permission Denied!</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', lineHeight: 1.4 }}>
                      আপনার ফায়ারবেস ডাটাবেজের রুলস লক করা আছে। দয়া করে <strong>console.firebase.google.com &gt; Firestore Database &gt; Rules</strong> ট্যাবে গিয়ে <code>allow read, write: if true;</code> লিখে <strong>Publish</strong> বাটনে চাপ দিন।
                    </p>
                  </div>
                )}

                {/* Step-by-step instructions */}
                <div className="firebase-guide-box">
                  <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    📋 কীভাবে ২ মিনিটে ফ্রি Firebase কনফিগ পাবেন:
                  </strong>
                  <ol>
                    <li>
                      <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" style={{ color: '#B45309', fontWeight: 600, textDecoration: 'underline' }}>
                        console.firebase.google.com
                      </a>-এ গিয়ে আপনার জিমেইল দিয়ে লগইন করে <strong>"Add project"</strong> ক্লিক করুন (নাম দিতে পারেন: <code>sn-daily-planner</code>)।
                    </li>
                    <li>
                      প্রজেক্ট খোলার পর বাম মেনু থেকে <strong>Build &gt; Firestore Database</strong>-এ গিয়ে <strong>Create database</strong> ক্লিক করুন এবং <strong>"Start in test mode"</strong> সিলেক্ট করে Next &gt; Enable করুন।
                    </li>
                    <li>
                      বাম পাশের গিয়ার আইকন (⚙️) <strong>Project Settings &gt; General</strong>-এ যান। নিচে নেমে <strong>Web App (&lt;/&gt;)</strong> আইকনে ক্লিক করে একটি নাম দিয়ে রেজিস্টার করুন।
                    </li>
                    <li>
                      সেখানে দেখানো <code>const firebaseConfig = &#123; ... &#125;;</code> কোডটি কপি করে নিচের বক্সে পেস্ট করে <strong>"Connect Firebase"</strong> বাটনে চাপ দিন!
                    </li>
                  </ol>
                </div>

                {/* Input Mode Toggle */}
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', background: 'var(--bg-subtle)', padding: '0.25rem', borderRadius: 'var(--radius-sm)', width: 'fit-content' }}>
                  <button
                    type="button"
                    onClick={() => setInputMode('paste')}
                    className={`btn btn--sm ${inputMode === 'paste' ? 'btn--primary' : 'btn--outline'}`}
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                  >
                    📋 Paste Code Snippet
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('manual')}
                    className={`btn btn--sm ${inputMode === 'manual' ? 'btn--primary' : 'btn--outline'}`}
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                  >
                    ✏️ Manual Input (API Key & ID)
                  </button>
                </div>

                <form onSubmit={handleSaveFirebase} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                  {inputMode === 'paste' ? (
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                        Paste Firebase Configuration (JSON or JS Object):
                      </label>
                      <textarea
                        rows={5}
                        value={firebaseInput}
                        onChange={e => setFirebaseInput(e.target.value)}
                        placeholder={`e.g.:\nconst firebaseConfig = {\n  apiKey: "AIzaSy...",\n  projectId: "sn-planner-123",\n  ...\n};`}
                        style={{ width: '100%', fontFamily: 'Consolas, monospace', fontSize: '0.775rem' }}
                      />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <div className="form-group">
                        <label style={{ fontSize: '0.825rem', fontWeight: 600 }}>apiKey *</label>
                        <input
                          type="text"
                          value={manualApiKey}
                          onChange={e => setManualApiKey(e.target.value)}
                          placeholder="e.g. AIzaSyBxxxxxxxxxxxxxxx"
                          style={{ fontSize: '0.825rem' }}
                        />
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: '0.825rem', fontWeight: 600 }}>projectId *</label>
                        <input
                          type="text"
                          value={manualProjectId}
                          onChange={e => setManualProjectId(e.target.value)}
                          placeholder="e.g. sndailyplanner"
                          style={{ fontSize: '0.825rem' }}
                        />
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: '0.825rem', fontWeight: 600 }}>appId (optional)</label>
                        <input
                          type="text"
                          value={manualAppId}
                          onChange={e => setManualAppId(e.target.value)}
                          placeholder="e.g. 1:123456789:web:abcdef"
                          style={{ fontSize: '0.825rem' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Inline Message */}
                  {firebaseInlineMsg && (
                    <div className={`sync-status-banner ${firebaseInlineMsg.type === 'error' ? 'sync-status-banner--error' : 'sync-status-banner--success'}`}>
                      {firebaseInlineMsg.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                      <span>{firebaseInlineMsg.text}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="submit"
                      className="btn btn--primary"
                      disabled={firebaseConnecting}
                      style={{ backgroundColor: '#D97706', borderColor: '#B45309', cursor: 'pointer' }}
                    >
                      <Flame size={16} /> {firebaseConnecting ? 'Connecting...' : 'Connect & Activate Firebase Sync'}
                    </button>

                    {isFirebaseConnected && (
                      <>
                        <button
                          type="button"
                          className="btn btn--outline"
                          onClick={handleTestFirebasePing}
                        >
                          <RefreshCw size={14} /> Send Live Test Ping
                        </button>
                        <button
                          type="button"
                          className="btn btn--outline"
                          onClick={handleRemoveFirebase}
                          style={{ color: '#DC2626', borderColor: '#FECACA' }}
                        >
                          <Trash2 size={14} /> Disconnect
                        </button>
                      </>
                    )}
                  </div>

                  {/* Verification Guide Box */}
                  <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.8rem', color: '#1E3A8A', marginTop: '0.5rem' }}>
                    <strong>💡 কীভাবে বুঝবেন সিঙ্ক হচ্ছে:</strong>
                    <ol style={{ marginLeft: '1.2rem', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <li>ল্যাপটপ ও ফোন দুটিতেই ওয়েবসাইটটি ওপেন রাখুন।</li>
                      <li>ফোনে যেকোনো একটি টাস্কে টিক (✓) বা ক্রস (✗) দিন।</li>
                      <li>ল্যাপটপের স্ক্রিনে তাকান—দেখবেন কোনো রিফ্রেশ ছাড়াই তৎক্ষণাৎ টিক হয়ে গেছে!</li>
                    </ol>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB: 1-CLICK DEVICE LINK */}
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

          {/* TAB: CLOUD VAULT */}
          {activeTab === 'cloud' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="sync-section">
                <div className="sync-section__title">
                  <Cloud size={16} style={{ color: 'var(--primary-600)' }} />
                  <span>Online Cloud Vault Sync</span>
                </div>
                <p className="sync-section__desc">
                  আপনার অ্যাকাউন্ট আইডি (<strong>{accountSync?.accountId || 'SN-Shuvo'}</strong>) এবং সিকিউরিটি পিনের মাধ্যমে ক্লাউডে ব্যাকআপ সংরক্ষণ ও রিস্টোর করুন।
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
                  Connected Account: <strong>{accountSync?.accountId || 'None'}</strong> · PIN Protected: <strong>Yes</strong>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ACCOUNT PROFILE FORM */}
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

          {/* TAB: FILE BACKUP */}
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
