export const CATEGORIES = [
  'University Class',
  'Laboratory',
  'Prayer',
  'Tuition',
  'Thesis',
  'Personal',
  'Meal',
  'Bath / Personal Care',
  'Dawah',
  'Rest',
  'Travel / Commute',
  'PVsyst',
  'Solar System Design',
  'Research Paper',
  'Programming',
  'Reading',
  'Islamic Learning',
  'Personal Development',
  'Other',
];

export const ACTIVITY_TYPES = [
  'Fixed Activity',
  'Flexible Activity',
  'Focus Block',
];

export const TASK_CATEGORIES = [
  'Thesis',
  'PVsyst',
  'Solar System Design',
  'Research Paper',
  'Programming',
  'Reading',
  'Islamic Learning',
  'Personal Development',
];

export const PRIORITIES = ['High', 'Medium', 'Low'];

export const CATEGORY_COLORS = {
  'University Class': '#3B82F6',
  'Laboratory': '#6366F1',
  'Prayer': '#059669',
  'Tuition': '#D97706',
  'Thesis': '#8B5CF6',
  'Personal': '#64748B',
  'Meal': '#F97316',
  'Bath / Personal Care': '#06B6D4',
  'Dawah': '#10B981',
  'Rest': '#94A3B8',
  'Travel / Commute': '#78716C',
  'PVsyst': '#EC4899',
  'Solar System Design': '#F59E0B',
  'Research Paper': '#6366F1',
  'Programming': '#0EA5E9',
  'Reading': '#A855F7',
  'Islamic Learning': '#059669',
  'Personal Development': '#14B8A6',
  'Other': '#9CA3AF',
};

export const FOCUS_BLOCK_COLORS = {
  'fb1': '#3B82F6',
  'fb2': '#10B981',
  'fb3': '#8B5CF6',
  'fb4': '#F59E0B',
};

export const ENERGY_LEVELS = [
  { id: 'low', label: 'Low Energy', icon: '🟢', color: '#10B981', desc: 'Bayan, light reading, revision' },
  { id: 'medium', label: 'Medium Energy', icon: '🟡', color: '#F59E0B', desc: 'IEEE paper, notes, small tasks' },
  { id: 'high', label: 'High Energy', icon: '🔴', color: '#EF4444', desc: 'Deep focus, PVsyst, thesis math' },
];

export const DEFAULT_THESIS_MILESTONES = [
  { id: 'm1', title: 'Literature Review & IEEE Papers Synthesis', completed: true },
  { id: 'm2', title: 'Solar PV Sizing & Mathematical Modeling', completed: false },
  { id: 'm3', title: 'PVsyst 3D Shading & Horizon Loss Simulation', completed: false },
  { id: 'm4', title: 'Simulation Results, Sensitivity Analysis & Graphs', completed: false },
  { id: 'm5', title: 'Thesis Paper Drafting & Final Defense Presentation', completed: false },
];

