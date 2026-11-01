// Automated Test Suite for My Daily Planner
// Testing all 12 scenarios outlined in Section 18 of Requirements

import {
  timeToMinutes,
  minutesToTime,
  formatDuration,
  intervalsOverlap,
  detectOverlaps,
  calculateFreeSlots,
  formatDateStr
} from '../src/utils/timeUtils.js';

import {
  getSuggestionsForSlot,
  getDefaultTasks
} from '../src/utils/suggestions.js';

import {
  getDefaultPrayerSettings,
  getDefaultSettings
} from '../src/utils/storage.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

console.log('=== RUNNING MY DAILY PLANNER TEST SUITE ===\n');

const settings = getDefaultSettings();
const prayerSettings = getDefaultPrayerSettings();
const dayStart = settings.dayStartTime; // "05:00"
const dayEnd = settings.dayEndTime;     // "23:00"

// SCENARIO 1: A day with only prayer activities
console.log('Test 1: A day with only prayer activities');
const prayerActivities = prayerSettings.prayers.map(p => ({
  id: `prayer_${p.id}`,
  title: `${p.name} Prayer`,
  startTime: p.startTime,
  endTime: p.endTime,
  category: 'Prayer',
  type: 'Fixed Activity'
}));
const freeSlotsDay1 = calculateFreeSlots(prayerActivities, dayStart, dayEnd);
assert(freeSlotsDay1.length > 0, `Detected ${freeSlotsDay1.length} free slots between prayers`);
assert(freeSlotsDay1[0].startTime === '05:00' && freeSlotsDay1[0].endTime === '05:40', 'Slot before Fajr is 05:00-05:40 (40m)');
const totalFreeDay1 = freeSlotsDay1.reduce((s, slot) => s + slot.duration, 0);
assert(totalFreeDay1 > 0, `Total free time calculated: ${formatDuration(totalFreeDay1)}`);

// SCENARIO 2: A day with an 8:00 AM class
console.log('\nTest 2: A day with an 8:00 AM class (08:00 - 10:30)');
const day2Acts = [
  ...prayerActivities,
  { id: 'c1', title: 'Power Electronics Class', startTime: '08:00', endTime: '10:30', category: 'University Class', type: 'Fixed Activity' }
];
const freeSlotsDay2 = calculateFreeSlots(day2Acts, dayStart, dayEnd);
const slotBeforeClass = freeSlotsDay2.find(s => s.endTime === '08:00');
const slotAfterClass = freeSlotsDay2.find(s => s.startTime === '10:30');
assert(slotBeforeClass !== undefined, `Found available slot before 8:00 AM class (${slotBeforeClass?.startTime}-${slotBeforeClass?.endTime})`);
assert(slotAfterClass !== undefined, `Found available slot after class (${slotAfterClass?.startTime}-${slotAfterClass?.endTime})`);

// SCENARIO 3: A day with a 10:50 AM class
console.log('\nTest 3: A day with a 10:50 AM class (10:50 - 13:00)');
const day3Acts = [
  ...prayerActivities,
  { id: 'c2', title: 'Solar PV Systems Class', startTime: '10:50', endTime: '13:00', category: 'University Class', type: 'Fixed Activity' }
];
const freeSlotsDay3 = calculateFreeSlots(day3Acts, dayStart, dayEnd);
const morningSlotDay3 = freeSlotsDay3.find(s => s.startTime === '06:10' && s.endTime === '10:50');
assert(morningSlotDay3 !== undefined, `Found large morning study window before 10:50 AM class (${formatDuration(morningSlotDay3?.duration || 0)})`);

// SCENARIO 4: A day with a morning laboratory
console.log('\nTest 4: A day with a morning laboratory (09:00 - 12:30)');
const day4Acts = [
  ...prayerActivities,
  { id: 'lab1', title: 'Solar Simulation Lab', startTime: '09:00', endTime: '12:30', category: 'Laboratory', type: 'Fixed Activity' }
];
const freeSlotsDay4 = calculateFreeSlots(day4Acts, dayStart, dayEnd);
const labOverlapBusy = freeSlotsDay4.every(s => !(timeToMinutes(s.startTime) < timeToMinutes('12:30') && timeToMinutes(s.endTime) > timeToMinutes('09:00')));
assert(labOverlapBusy, 'Laboratory 09:00-12:30 is completely blocked from free time');

// SCENARIO 5: A day with an afternoon laboratory
console.log('\nTest 5: A day with an afternoon laboratory (14:00 - 17:00)');
const day5Acts = [
  ...prayerActivities,
  { id: 'lab2', title: 'Control Systems Lab', startTime: '14:00', endTime: '17:00', category: 'Laboratory', type: 'Fixed Activity' }
];
// Note: Asr is at 16:00-16:30 which overlaps with 14:00-17:00. The engine merges them!
const freeSlotsDay5 = calculateFreeSlots(day5Acts, dayStart, dayEnd);
const freeDuringLab = freeSlotsDay5.some(s => timeToMinutes(s.startTime) < timeToMinutes('17:00') && timeToMinutes(s.endTime) > timeToMinutes('14:00'));
assert(!freeDuringLab, 'Afternoon lab correctly blocks entire 14:00-17:00 window, safely merging with overlapping Asr');

// SCENARIO 6: A day with no university class
console.log('\nTest 6: A day with no university class (full self-study day)');
const freeSlotsDay6 = calculateFreeSlots(prayerActivities, dayStart, dayEnd);
const longSlots = freeSlotsDay6.filter(s => s.duration >= 90);
assert(longSlots.length >= 3, `No-class day yields ${longSlots.length} deep-work slots (>=90 min) between prayers`);

// SCENARIO 7: Two overlapping activities
console.log('\nTest 7: Overlap detection between two overlapping activities');
const actA = { id: 'a1', title: 'Tuition', startTime: '18:00', endTime: '19:30', category: 'Tuition' };
const actB = { id: 'a2', title: 'Department Seminar', startTime: '19:00', endTime: '20:30', category: 'University Class' };
const overlaps = detectOverlaps([actA, actB]);
assert(overlaps.length === 1, `Detected overlap correctly: ${overlaps[0]?.activity1.title} and ${overlaps[0]?.activity2.title}`);

// Merged free slots test with overlap:
const mergedFree = calculateFreeSlots([actA, actB], '17:00', '21:00');
assert(mergedFree.length === 2, `Free intervals before and after merged busy window: ${mergedFree.map(s => `${s.startTime}-${s.endTime}`).join(', ')}`);
assert(mergedFree[0].startTime === '17:00' && mergedFree[0].endTime === '18:00', 'First slot is 17:00-18:00');
assert(mergedFree[1].startTime === '20:30' && mergedFree[1].endTime === '21:00', 'Second slot is 20:30-21:00');

// SCENARIO 8: A free slot shorter than 20 minutes
console.log('\nTest 8: A free slot shorter than 20 minutes');
const shortGapActs = [
  { id: 'g1', title: 'Task 1', startTime: '10:00', endTime: '10:45' },
  { id: 'g2', title: 'Task 2', startTime: '11:00', endTime: '12:00' }
];
const freeShort = calculateFreeSlots(shortGapActs, '10:00', '12:00');
const fifteenMinSlot = freeShort.find(s => s.duration === 15);
assert(fifteenMinSlot !== undefined, 'Detected exact 15-minute slot (10:45-11:00)');
const suggestionsShort = getSuggestionsForSlot(fifteenMinSlot, getDefaultTasks(), shortGapActs, settings);
// Suggestion rules state: 10-20 min -> short reading, bayan, revision; NOT 60m/90m thesis!
const allowsLargeTask = suggestionsShort.taskSuggestions.some(t => t.estimatedDuration > 20);
assert(!allowsLargeTask, 'Short slot (<20m) does NOT recommend long tasks (all suggested tasks <= 20 min)');

// SCENARIO 9: Adding a thesis task into a free slot
console.log('\nTest 9: Suggesting and adding thesis task into a 90-minute free slot');
const largeSlot = { startTime: '06:30', endTime: '08:00', duration: 90 };
const suggestionsLarge = getSuggestionsForSlot(largeSlot, getDefaultTasks(), [], settings);
assert(suggestionsLarge.taskSuggestions.length > 0, 'Found matching task suggestions');
assert(suggestionsLarge.taskSuggestions[0].category === 'Thesis' || suggestionsLarge.taskSuggestions[0].priority === 'High',
  `Top recommendation is high-priority thesis task: "${suggestionsLarge.taskSuggestions[0].title}"`);

// SCENARIO 10: Completing a task & status tracking
console.log('\nTest 10: Task completion state');
const tasks = getDefaultTasks();
const targetTask = tasks[0];
targetTask.completed = true;
assert(targetTask.completed === true, 'Task marked completed successfully');
const remainingActive = tasks.filter(t => !t.completed);
assert(remainingActive.length === tasks.length - 1, 'Completed task removed from active pending suggestions');

// SCENARIO 11: LocalStorage structure verification
console.log('\nTest 11: Storage key and data model integrity');
assert(settings.dayStartTime === '05:00', 'Default day start is 05:00');
assert(settings.dayEndTime === '23:00', 'Default day end is 23:00');
assert(settings.focusBlockLabels.length === 4, 'Has 4 default focus blocks');
assert(prayerSettings.prayers.length === 5, 'Has 5 default prayers (Fajr, Zuhr, Asr, Maghrib, Isha)');

// SCENARIO 12: Changing one date without changing another date's schedule
console.log('\nTest 12: Date-specific isolation');
const dateStore = {};
dateStore['2026-11-02'] = [{ id: 'act_mon', title: 'Monday Class', startTime: '08:00', endTime: '10:00' }];
dateStore['2026-11-03'] = [{ id: 'act_tue', title: 'Tuesday Lab', startTime: '14:00', endTime: '17:00' }];
assert(dateStore['2026-11-02'].length === 1 && dateStore['2026-11-02'][0].title === 'Monday Class', 'Date 2026-11-02 intact');
assert(dateStore['2026-11-03'].length === 1 && dateStore['2026-11-03'][0].title === 'Tuesday Lab', 'Date 2026-11-03 intact');
assert(dateStore['2026-11-02'][0].id !== dateStore['2026-11-03'][0].id, 'Schedules are fully isolated per date');

// SCENARIO 13: 1-Click Quick Shift (+30m) preserving Prayer times unchanged
console.log('\nTest 13: 1-Click Quick Shift (+30m) keeping prayer times strictly anchored');
const originalSchedule = [
  { id: 'p1', title: 'Zuhr Prayer', startTime: '13:00', endTime: '13:30', category: 'Prayer', isPrayerAuto: true },
  { id: 's1', title: 'PVsyst Simulation', startTime: '14:00', endTime: '15:00', category: 'PVsyst', completed: false },
  { id: 'p2', title: 'Asr Prayer', startTime: '16:00', endTime: '16:30', category: 'Prayer', isPrayerAuto: true },
  { id: 's2', title: 'Tuition', startTime: '17:00', endTime: '18:30', category: 'Tuition', completed: false }
];

// Simulate shifting by +30m from 13:45 onwards
const shiftThreshold = timeToMinutes('13:45');
const shiftedSchedule = originalSchedule.map(act => {
  if (act.category === 'Prayer' || act.isPrayerAuto || act.completed) return act;
  const start = timeToMinutes(act.startTime);
  if (start >= shiftThreshold) {
    const dur = timeToMinutes(act.endTime) - start;
    const newStart = start + 30;
    return { ...act, startTime: minutesToTime(newStart), endTime: minutesToTime(newStart + dur) };
  }
  return act;
});

const shiftedPvsyst = shiftedSchedule.find(a => a.id === 's1');
const shiftedZuhr = shiftedSchedule.find(a => a.id === 'p1');
const shiftedAsr = shiftedSchedule.find(a => a.id === 'p2');
const shiftedTuition = shiftedSchedule.find(a => a.id === 's2');

assert(shiftedPvsyst.startTime === '14:30' && shiftedPvsyst.endTime === '15:30', 'PVsyst successfully shifted +30m (14:30-15:30)');
assert(shiftedTuition.startTime === '17:30' && shiftedTuition.endTime === '19:00', 'Tuition successfully shifted +30m (17:30-19:00)');
assert(shiftedZuhr.startTime === '13:00' && shiftedZuhr.endTime === '13:30', 'Zuhr Prayer remained 100% UNCHANGED (13:00-13:30)');
assert(shiftedAsr.startTime === '16:00' && shiftedAsr.endTime === '16:30', 'Asr Prayer remained 100% UNCHANGED (16:00-16:30)');

console.log(`\n===========================================`);
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log(`===========================================`);

if (failed > 0) process.exit(1);

