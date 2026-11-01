import { timeToMinutes } from './timeUtils.js';

const DEFAULT_PRIORITY_ORDER = {
  'High': 3,
  'Medium': 2,
  'Low': 1,
};

// Get task suggestions for a free slot
export function getSuggestionsForSlot(freeSlot, taskLibrary, scheduledActivities, settings) {
  const slotDuration = freeSlot.duration;
  const rules = settings?.suggestionRules || [];

  // Filter tasks: not completed, fits in slot, not already scheduled at overlapping time
  const availableTasks = taskLibrary.filter(task => {
    if (task.completed) return false;
    if (task.estimatedDuration > slotDuration) return false;

    // Check if already scheduled at overlapping time
    const isScheduled = scheduledActivities.some(act =>
      act.taskId === task.id &&
      timeToMinutes(act.startTime) < timeToMinutes(freeSlot.endTime) &&
      timeToMinutes(act.endTime) > timeToMinutes(freeSlot.startTime)
    );
    if (isScheduled) return false;

    return true;
  });

  // Score tasks
  const scored = availableTasks.map(task => {
    let score = 0;

    // Priority score
    score += (DEFAULT_PRIORITY_ORDER[task.priority] || 1) * 10;

    // Deadline urgency
    if (task.deadline) {
      const daysUntil = Math.ceil((new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysUntil <= 1) score += 30;
      else if (daysUntil <= 3) score += 20;
      else if (daysUntil <= 7) score += 10;
    }

    // Duration fit - prefer tasks that fit well in the slot
    const durationRatio = task.estimatedDuration / slotDuration;
    if (durationRatio >= 0.5 && durationRatio <= 1.0) score += 15;
    else if (durationRatio >= 0.3) score += 10;
    else score += 5;

    // Rule-based category match
    const matchingRule = rules.find(r =>
      slotDuration >= r.minMinutes && slotDuration <= r.maxMinutes
    );
    if (matchingRule) {
      const taskLower = (task.title + ' ' + (task.category || '')).toLowerCase();
      const matches = matchingRule.suggestions.some(s => taskLower.includes(s.toLowerCase()));
      if (matches) score += 12;
    }

    return { ...task, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Also generate generic suggestions from rules
  const ruleBasedSuggestions = [];
  const matchingRule = rules.find(r =>
    slotDuration >= r.minMinutes && slotDuration <= r.maxMinutes
  );
  if (matchingRule) {
    ruleBasedSuggestions.push(...matchingRule.suggestions);
  }

  return {
    taskSuggestions: scored.slice(0, 5),
    ruleSuggestions: ruleBasedSuggestions,
  };
}

// Get default task library
export function getDefaultTasks() {
  return [
    {
      id: 'task_thesis_1',
      title: 'Solar Energy Thesis Research',
      category: 'Thesis',
      estimatedDuration: 90,
      priority: 'High',
      deadline: '',
      description: 'Deep work session on thesis research and writing',
      completed: false,
    },
    {
      id: 'task_pvsyst_1',
      title: 'PVsyst Simulation Practice',
      category: 'PVsyst',
      estimatedDuration: 60,
      priority: 'High',
      deadline: '',
      description: 'Practice PVsyst software for solar system simulation',
      completed: false,
    },
    {
      id: 'task_solar_1',
      title: 'Solar System Design Study',
      category: 'Solar System Design',
      estimatedDuration: 60,
      priority: 'High',
      deadline: '',
      description: 'Study solar system design principles and calculations',
      completed: false,
    },
    {
      id: 'task_ieee_1',
      title: 'IEEE Research Paper Reading',
      category: 'Research Paper',
      estimatedDuration: 30,
      priority: 'Medium',
      deadline: '',
      description: 'Read and annotate IEEE research papers on solar energy',
      completed: false,
    },
    {
      id: 'task_prog_1',
      title: 'Programming Practice',
      category: 'Programming',
      estimatedDuration: 45,
      priority: 'Medium',
      deadline: '',
      description: 'Practice programming and technical skills',
      completed: false,
    },
    {
      id: 'task_book_1',
      title: 'Book Reading',
      category: 'Reading',
      estimatedDuration: 20,
      priority: 'Low',
      deadline: '',
      description: 'Read educational or self-improvement books',
      completed: false,
    },
    {
      id: 'task_bayan_1',
      title: 'Listen to Islamic Bayan',
      category: 'Islamic Learning',
      estimatedDuration: 15,
      priority: 'Low',
      deadline: '',
      description: 'Listen to Islamic lectures and bayan',
      completed: false,
    },
    {
      id: 'task_revision_1',
      title: 'Daily Revision & Review',
      category: 'Personal Development',
      estimatedDuration: 20,
      priority: 'Medium',
      deadline: '',
      description: 'Review notes and revise daily learning',
      completed: false,
    },
  ];
}
