import React, { useState, useEffect } from 'react';
import { X, Plus, Save } from 'lucide-react';
import { TASK_CATEGORIES, PRIORITIES } from '../utils/constants';
import '../styles/ActivityForm.css';

export default function TaskForm({ task, onSave, onClose }) {
  const [form, setForm] = useState({
    title: '',
    category: 'Thesis',
    estimatedDuration: 30,
    priority: 'Medium',
    deadline: '',
    description: '',
    completed: false,
  });

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        category: task.category || 'Thesis',
        estimatedDuration: task.estimatedDuration || 30,
        priority: task.priority || 'Medium',
        deadline: task.deadline || '',
        description: task.description || '',
        completed: task.completed || false,
      });
    }
  }, [task]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave(form);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h3>{task ? 'Edit Task' : 'New Task'}</h3>
          <button className="modal__close" onClick={onClose}><X size={20} /></button>
        </div>

        <form className="activity-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Task Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => handleChange('title', e.target.value)}
              placeholder="e.g., Read IEEE Paper on Solar Cells..."
              required
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select value={form.category} onChange={e => handleChange('category', e.target.value)}>
                {TASK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select value={form.priority} onChange={e => handleChange('priority', e.target.value)}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Estimated Duration (minutes)</label>
              <input
                type="number"
                min="5"
                max="480"
                value={form.estimatedDuration}
                onChange={e => handleChange('estimatedDuration', parseInt(e.target.value) || 30)}
              />
            </div>
            <div className="form-group">
              <label>Deadline (optional)</label>
              <input
                type="date"
                value={form.deadline}
                onChange={e => handleChange('deadline', e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
              placeholder="What does this task involve?"
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn--secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary">
              {task ? <><Save size={16} /> Update Task</> : <><Plus size={16} /> Add Task</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
