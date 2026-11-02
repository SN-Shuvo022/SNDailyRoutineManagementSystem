import React, { useState } from 'react';
import { X, FileEdit, Check, Trash2, MessageSquare } from 'lucide-react';
import { formatTimeDisplay } from '../utils/timeUtils';
import '../styles/ActivityForm.css';

const QUICK_CHIPS = [
  'ল্যাব/ক্লাস দীর্ঘ হওয়ায় দেরি হয়েছে',
  'যানজট ও যাতায়াতে বেশি সময় লেগেছে',
  'অতিরিক্ত ক্লান্তির কারণে করতে পারিনি',
  'সময়মতো শুরু করতে পারিনি, আগ-পিছ হয়েছে',
  'আলহামদুলিল্লাহ, খুব ভালোভাবেই সম্পন্ন হয়েছে',
];

export default function NoteModal({ activity, onClose, onSaveNote }) {
  const [noteText, setNoteText] = useState(activity.reflectionNote || '');

  const handleChipClick = (chip) => {
    if (!noteText.trim()) {
      setNoteText(chip);
    } else {
      setNoteText(prev => `${prev}; ${chip}`);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSaveNote(noteText.trim());
    onClose();
  };

  const handleClear = () => {
    onSaveNote('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal__header">
          <h3>
            <FileEdit size={18} style={{ color: 'var(--primary-600)' }} />
            Add Activity Reflection Note
          </h3>
          <button className="modal__close" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSave} style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{activity.title}</h4>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {formatTimeDisplay(activity.startTime)} – {formatTimeDisplay(activity.endTime)} ({activity.category})
            </span>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              কী কারণে সময়মতো করতে পারেননি বা কাজের বর্তমান অবস্থা কী?
            </label>
            <textarea
              rows={3}
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="e.g., কাজটা সময়মতো করতে পারিনি, একটু আগ-পিছ হয়েছে / ল্যাব দীর্ঘ হওয়ায় পিছিয়ে নিতে হয়েছে..."
              autoFocus
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              ⚡ Quick Suggestions (Click to add):
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {QUICK_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleChipClick(chip)}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.55rem',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-full)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary-500)'}
                  onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
                >
                  + {chip}
                </button>
              ))}
            </div>
          </div>

          <div className="form-actions" style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {activity.reflectionNote ? (
              <button
                type="button"
                className="btn btn--danger btn--sm"
                onClick={handleClear}
                title="Delete this note"
              >
                <Trash2 size={14} /> Clear Note
              </button>
            ) : <div />}

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn btn--secondary btn--sm" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn--primary btn--sm">
                <Check size={14} /> Save Note
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

