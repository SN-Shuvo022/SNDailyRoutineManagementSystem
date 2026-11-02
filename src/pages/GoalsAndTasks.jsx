import React, { useState, useMemo } from 'react';
import {
  Plus, Edit3, Trash2, Check, Filter, BookOpen, Target, Search, Clock, AlertCircle, ArrowUpRight
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { TASK_CATEGORIES, PRIORITIES } from '../utils/constants';
import { formatDuration } from '../utils/timeUtils';
import TaskForm from '../components/TaskForm';
import '../styles/GoalsAndTasks.css';

export default function GoalsAndTasks() {
  const {
    taskLibrary, addTask, updateTask, deleteTask,
    learningTracker, addLearningItem, updateLearningItem, deleteLearningItem
  } = useApp();

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [energyFilter, setEnergyFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' or 'learning'

  // Learning tracker form modal state
  const [showLearningForm, setShowLearningForm] = useState(false);
  const [editingLearning, setEditingLearning] = useState(null);
  const [learningForm, setLearningForm] = useState({
    topic: '', status: 'Not Started', timeSpent: 0, notes: '', nextStep: ''
  });

  const filteredTasks = useMemo(() => {
    return taskLibrary.filter(task => {
      if (filter === 'completed' && !task.completed) return false;
      if (filter === 'pending' && task.completed) return false;
      if (filter === 'high' && task.priority !== 'High') return false;
      if (categoryFilter !== 'all' && task.category !== categoryFilter) return false;
      if (energyFilter !== 'all' && (task.energyLevel || 'medium').toLowerCase() !== energyFilter) return false;
      if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !(task.description || '').toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [taskLibrary, filter, categoryFilter, energyFilter, searchTerm]);

  const handleSaveTask = (formData) => {
    if (editingTask) {
      updateTask(editingTask.id, formData);
    } else {
      addTask(formData);
    }
    setShowTaskForm(false);
    setEditingTask(null);
  };

  const handleSaveLearning = (e) => {
    e.preventDefault();
    if (!learningForm.topic.trim()) return;
    if (editingLearning) {
      updateLearningItem(editingLearning.id, learningForm);
    } else {
      addLearningItem(learningForm);
    }
    setShowLearningForm(false);
    setEditingLearning(null);
    setLearningForm({ topic: '', status: 'Not Started', timeSpent: 0, notes: '', nextStep: '' });
  };

  const stats = useMemo(() => {
    const total = taskLibrary.length;
    const completed = taskLibrary.filter(t => t.completed).length;
    const highPriority = taskLibrary.filter(t => t.priority === 'High' && !t.completed).length;
    const thesisCount = taskLibrary.filter(t => t.category === 'Thesis').length;
    const pvsystCount = taskLibrary.filter(t => t.category === 'PVsyst').length;
    return { total, completed, highPriority, pending: total - completed, thesisCount, pvsystCount };
  }, [taskLibrary]);

  return (
    <div className="goals">
      <div className="goals__header">
        <div>
          <h2>Goals & Task Library</h2>
          <p className="goals__subtitle">Manage your research priorities, learning goals, and long-term tasks</p>
        </div>
        <div className="goals__header-actions">
          {activeTab === 'tasks' ? (
            <button className="btn btn--primary" onClick={() => {
              setEditingTask(null);
              setShowTaskForm(true);
            }}>
              <Plus size={16} /> New Task
            </button>
          ) : (
            <button className="btn btn--primary" onClick={() => {
              setEditingLearning(null);
              setLearningForm({ topic: '', status: 'Not Started', timeSpent: 0, notes: '', nextStep: '' });
              setShowLearningForm(true);
            }}>
              <Plus size={16} /> New Learning Topic
            </button>
          )}
        </div>
      </div>

      <div className="goals__stats">
        <div className="mini-stat">
          <span className="mini-stat__value">{stats.total}</span>
          <span className="mini-stat__label">Total Tasks</span>
        </div>
        <div className="mini-stat mini-stat--green">
          <span className="mini-stat__value">{stats.completed}</span>
          <span className="mini-stat__label">Completed</span>
        </div>
        <div className="mini-stat mini-stat--orange">
          <span className="mini-stat__value">{stats.pending}</span>
          <span className="mini-stat__label">Pending</span>
        </div>
        <div className="mini-stat mini-stat--purple">
          <span className="mini-stat__value">{stats.highPriority}</span>
          <span className="mini-stat__label">High Priority</span>
        </div>
        <div className="mini-stat mini-stat--blue">
          <span className="mini-stat__value">{stats.thesisCount + stats.pvsystCount}</span>
          <span className="mini-stat__label">Thesis & PVsyst</span>
        </div>
      </div>

      <div className="goals__tabs">
        <button
          className={`tab-btn ${activeTab === 'tasks' ? 'tab-btn--active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <Target size={16} /> Task Library ({taskLibrary.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'learning' ? 'tab-btn--active' : ''}`}
          onClick={() => setActiveTab('learning')}
        >
          <BookOpen size={16} /> Learning Tracker ({learningTracker.length})
        </button>
      </div>

      {activeTab === 'tasks' && (
        <>
          <div className="goals__toolbar">
            <div className="goals__search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search tasks by name or description..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="goals__filters">
              <select value={filter} onChange={e => setFilter(e.target.value)} aria-label="Status filter">
                <option value="all">All Status</option>
                <option value="pending">Pending Only</option>
                <option value="completed">Completed Only</option>
                <option value="high">High Priority</option>
              </select>
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} aria-label="Category filter">
                <option value="all">All Categories</option>
                {TASK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={energyFilter} onChange={e => setEnergyFilter(e.target.value)} aria-label="Energy filter">
                <option value="all">⚡ All Energy Levels</option>
                <option value="high">⚡ High Energy</option>
                <option value="medium">🔋 Medium Energy</option>
                <option value="low">☕ Low Energy</option>
              </select>
            </div>
          </div>

          <div className="goals__list">
            {filteredTasks.length === 0 ? (
              <div className="empty-state">
                <Target size={48} />
                <h3>No tasks match your criteria</h3>
                <p>Create a task to build your productivity library.</p>
                <button className="btn btn--primary" onClick={() => {
                  setEditingTask(null);
                  setShowTaskForm(true);
                }}>
                  <Plus size={16} /> Add First Task
                </button>
              </div>
            ) : (
              filteredTasks.map(task => (
                <div key={task.id} className={`task-card ${task.completed ? 'task-card--done' : ''}`}>
                  <div className="task-card__checkbox">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => updateTask(task.id, { completed: !task.completed })}
                      aria-label={`Mark ${task.title} as ${task.completed ? 'incomplete' : 'complete'}`}
                    />
                  </div>
                  <div className="task-card__content">
                    <div className="task-card__title">{task.title}</div>
                    <div className="task-card__meta">
                      <span className={`priority-badge priority-badge--${task.priority.toLowerCase()}`}>
                        {task.priority} Priority
                      </span>
                      {task.energyLevel && (
                        <span className={`priority-badge priority-badge--${task.energyLevel.toLowerCase() === 'high' ? 'high' : task.energyLevel.toLowerCase() === 'medium' ? 'medium' : 'low'}`} style={{ backgroundColor: task.energyLevel.toLowerCase() === 'high' ? '#FEE2E2' : task.energyLevel.toLowerCase() === 'medium' ? '#FEF3C7' : '#D1FAE5', color: task.energyLevel.toLowerCase() === 'high' ? '#DC2626' : task.energyLevel.toLowerCase() === 'medium' ? '#D97706' : '#059669' }}>
                          {task.energyLevel.toLowerCase() === 'high' ? '⚡ High' : task.energyLevel.toLowerCase() === 'medium' ? '🔋 Medium' : '☕ Low'}
                        </span>
                      )}
                      <span className="task-card__category">{task.category}</span>
                      <span className="task-card__duration">
                        <Clock size={12} /> {formatDuration(task.estimatedDuration)}
                      </span>
                      {task.deadline && (
                        <span className="task-card__deadline">Due: {task.deadline}</span>
                      )}
                    </div>
                    {task.description && (
                      <p className="task-card__desc">{task.description}</p>
                    )}
                  </div>
                  <div className="task-card__actions">
                    <button className="icon-btn" onClick={() => {
                      setEditingTask(task);
                      setShowTaskForm(true);
                    }} title="Edit Task">
                      <Edit3 size={16} />
                    </button>
                    <button className="icon-btn icon-btn--danger" onClick={() => {
                      if (window.confirm(`Delete "${task.title}"?`)) deleteTask(task.id);
                    }} title="Delete Task">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === 'learning' && (
        <>
          <div className="goals__list">
            {learningTracker.length === 0 ? (
              <div className="empty-state">
                <BookOpen size={48} />
                <h3>No Learning Topics Added Yet</h3>
                <p>Track your Solar Energy thesis topics, PVsyst mastery, and technical skills.</p>
                <button className="btn btn--primary" onClick={() => {
                  setEditingLearning(null);
                  setLearningForm({ topic: '', status: 'Not Started', timeSpent: 0, notes: '', nextStep: '' });
                  setShowLearningForm(true);
                }}>
                  <Plus size={16} /> Add Topic
                </button>
              </div>
            ) : (
              learningTracker.map(item => (
                <div key={item.id} className="learning-card">
                  <div className="learning-card__content">
                    <div className="learning-card__top">
                      <span className="learning-card__title">{item.topic}</span>
                      <span className={`status-badge status-badge--${(item.status || 'Not Started').toLowerCase().replace(/\s+/g, '-')}`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="learning-card__meta">
                      <span>⏱️ <strong>{item.timeSpent || 0}h</strong> invested</span>
                      {item.nextStep && (
                        <span>🎯 Next: <strong>{item.nextStep}</strong></span>
                      )}
                    </div>
                    {item.notes && <p className="learning-card__notes">{item.notes}</p>}
                  </div>
                  <div className="learning-card__actions">
                    <button className="icon-btn" onClick={() => {
                      setEditingLearning(item);
                      setLearningForm({
                        topic: item.topic || '',
                        status: item.status || 'Not Started',
                        timeSpent: item.timeSpent || 0,
                        notes: item.notes || '',
                        nextStep: item.nextStep || ''
                      });
                      setShowLearningForm(true);
                    }} title="Edit Topic">
                      <Edit3 size={16} />
                    </button>
                    <button className="icon-btn icon-btn--danger" onClick={() => {
                      if (window.confirm(`Delete topic "${item.topic}"?`)) deleteLearningItem(item.id);
                    }} title="Delete Topic">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {showLearningForm && (
        <div className="modal-overlay" onClick={() => setShowLearningForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3>{editingLearning ? 'Edit Learning Topic' : 'Add Learning Topic'}</h3>
              <button className="modal__close" onClick={() => setShowLearningForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveLearning} className="activity-form">
              <div className="form-group">
                <label>Topic / Skill *</label>
                <input
                  type="text"
                  placeholder="e.g., PVsyst 3D Shading Scene, Solar Cell Efficiency Equations..."
                  value={learningForm.topic}
                  onChange={e => setLearningForm(p => ({ ...p, topic: e.target.value }))}
                  required
                  autoFocus
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={learningForm.status}
                    onChange={e => setLearningForm(p => ({ ...p, status: e.target.value }))}
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Time Spent (Hours)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={learningForm.timeSpent}
                    onChange={e => setLearningForm(p => ({ ...p, timeSpent: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Notes & Key Concepts</label>
                <textarea
                  rows={3}
                  placeholder="Key insights, equations, or takeaways..."
                  value={learningForm.notes}
                  onChange={e => setLearningForm(p => ({ ...p, notes: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Next Action Step</label>
                <input
                  type="text"
                  placeholder="e.g., Simulate 1MW plant in PVsyst, read Section 3 of IEEE paper..."
                  value={learningForm.nextStep}
                  onChange={e => setLearningForm(p => ({ ...p, nextStep: e.target.value }))}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn--secondary" onClick={() => setShowLearningForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary">
                  {editingLearning ? 'Update Topic' : 'Add Topic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTaskForm && (
        <TaskForm
          task={editingTask}
          onSave={handleSaveTask}
          onClose={() => {
            setShowTaskForm(false);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
}

