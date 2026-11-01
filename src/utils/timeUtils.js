// Convert "HH:MM" to minutes since midnight
export function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

// Convert minutes since midnight to "HH:MM"
export function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Format minutes to human-readable duration
export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// Format time for display e.g. "08:00" -> "8:00 AM"
export function formatTimeDisplay(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
}

// Check if two intervals overlap
export function intervalsOverlap(start1, end1, start2, end2) {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && s2 < e1;
}

// Detect overlaps among activities
export function detectOverlaps(activities) {
  const overlaps = [];
  for (let i = 0; i < activities.length; i++) {
    for (let j = i + 1; j < activities.length; j++) {
      const a = activities[i];
      const b = activities[j];
      if (intervalsOverlap(a.startTime, a.endTime, b.startTime, b.endTime)) {
        overlaps.push({ activity1: a, activity2: b });
      }
    }
  }
  return overlaps;
}

// Calculate free time slots between busy intervals within day bounds
export function calculateFreeSlots(activities, dayStart, dayEnd) {
  const dayStartMin = timeToMinutes(dayStart);
  const dayEndMin = timeToMinutes(dayEnd);

  // Build busy intervals from all activities
  const busyIntervals = activities
    .filter(a => a.startTime && a.endTime)
    .map(a => ({
      start: timeToMinutes(a.startTime),
      end: timeToMinutes(a.endTime),
    }))
    .filter(i => i.start < i.end) // valid intervals only
    .sort((a, b) => a.start - b.start);

  // Merge overlapping busy intervals
  const merged = [];
  for (const interval of busyIntervals) {
    // Clip to day bounds
    const clippedStart = Math.max(interval.start, dayStartMin);
    const clippedEnd = Math.min(interval.end, dayEndMin);
    if (clippedStart >= clippedEnd) continue;

    if (merged.length === 0 || clippedStart > merged[merged.length - 1].end) {
      merged.push({ start: clippedStart, end: clippedEnd });
    } else {
      merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, clippedEnd);
    }
  }

  // Find gaps
  const freeSlots = [];
  let cursor = dayStartMin;

  for (const interval of merged) {
    if (cursor < interval.start) {
      freeSlots.push({
        startTime: minutesToTime(cursor),
        endTime: minutesToTime(interval.start),
        duration: interval.start - cursor,
      });
    }
    cursor = Math.max(cursor, interval.end);
  }

  if (cursor < dayEndMin) {
    freeSlots.push({
      startTime: minutesToTime(cursor),
      endTime: minutesToTime(dayEndMin),
      duration: dayEndMin - cursor,
    });
  }

  return freeSlots;
}

// Get today's date as YYYY-MM-DD
export function getTodayStr() {
  return formatDateStr(new Date());
}

// Format Date to YYYY-MM-DD
export function formatDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Get tomorrow's date as YYYY-MM-DD
export function getTomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return formatDateStr(d);
}

// Get display date e.g. "Monday, November 2, 2026"
export function formatDateDisplay(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Get greeting based on hour
export function getGreeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Good Night';
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  if (h < 21) return 'Good Evening';
  return 'Good Night';
}

// Generate unique ID
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
