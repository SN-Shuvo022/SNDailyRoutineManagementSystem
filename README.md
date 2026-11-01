# SN Daily Planner Management System
> **Plan Your Day. Protect Your Time. Achieve Your Goals.**

A personal, offline-first productivity dashboard and daily schedule management system tailored for university students balancing fluctuating class timetables, laboratory sessions, prayer times, and academic research goals (such as Solar Energy thesis, PVsyst simulations, and IEEE paper reviews).

---

## 🌟 Key Features

1. **Automated Free Time Detection Engine**
   - Automatically computes free intervals between busy activities (university classes, labs, prayers, tuition).
   - Configurable daily planning window (default `05:00 AM – 11:00 PM`).
   - Merges overlapping busy intervals without altering individual activities.
   - Detects and warns about overlapping commitments.
   - Categorizes free slots (Micro break `<20m`, Short study `<45m`, Deep work `45–90m`, Extended block `>90m`).

2. **Smart Task Suggestion Engine**
   - Rule-based suggestion algorithm prioritizing:
     1. Solar Energy Thesis
     2. PVsyst Simulation Practice
     3. Solar System Design
     4. IEEE Research Paper Reading
     5. Programming / Technical skills
     6. Book reading
     7. Islamic bayan
     8. Daily revision
   - Recommends fitting tasks based on slot duration, task priority, deadline urgency, and completion status.
   - Instant assignment of tasks into free slots.

3. **Dynamic Daily Planner**
   - No hardcoded weekly routine: plan each day independently (usually the night before).
   - Support for 12+ categories (`University Class`, `Laboratory`, `Prayer`, `Tuition`, `Thesis`, `PVsyst`, `Rest`, `Meal`, etc.).
   - Activity types: `Fixed Activity` (busy time), `Flexible Activity`, `Focus Block`.
   - Full CRUD: Add, edit, duplicate, delete activities with instant free-time updates.
   - Visual Chronological Timeline view with color-coded badges and status checkboxes.
   - Optional sample Monday routine template loader.

4. **Bangladesh Prayer Time Management**
   - Editable default times for Fajr, Zuhr, Asr, Maghrib, and Isha.
   - Optional automatic insertion into every day's schedule.
   - Per-date override support for seasonal shifts without requiring external APIs or internet access.

5. **Focus Block System**
   - Distinct, color-coded focus blocks (`Morning Deep Work`, `Skill Development`, `Thesis / Research Deep Work`, `Light Study / Daily Review`).
   - Track focus time and completed blocks per day.

6. **Goals & Task Library + Learning Tracker**
   - Persistent task bank with priority, estimated duration, deadline, and notes.
   - Dedicated Learning Tracker for solar energy topics, time invested, status, and next action steps.

7. **Productivity Analytics & Progress Charts**
   - Visual charts powered by Recharts.
   - Tracks weekly completed vs planned tasks, daily focus hours, thesis research time, and PVsyst simulation hours.
   - Honest empty states when historical data is not yet recorded.

8. **100% Offline & Local Storage**
   - Data stored in browser LocalStorage (`mdp_v1_` versioned keys).
   - JSON export and import for seamless backup and transfer across devices (laptop and mobile).
   - Emergency data reset option with confirmation guards.

---

## 🚀 How to Run

### Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173` (or the port Vite prints in your terminal).

### Production Build & Preview
```bash
npm run build
npm run preview
```

### Run Automated Tests
```bash
npm test
```
Executes the comprehensive 12-scenario test suite covering all scheduling constraints, free-time detection, overlap handling, and suggestion rules.

---

## 🧪 Verified Test Scenarios

The automated test suite (`tests/scenarios.test.js`) verifies all 12 core requirements:
- [x] Day with only prayer activities (correct slot breakdown & free-time total)
- [x] Day with 8:00 AM class (pre-class and post-class slots preserved)
- [x] Day with 10:50 AM class (large 4h 40m morning study window detected)
- [x] Day with morning laboratory (09:00–12:30 blocked)
- [x] Day with afternoon laboratory (14:00–17:00 blocked, safely merged with overlapping Asr prayer)
- [x] Day with no university classes (full deep-work availability)
- [x] Two overlapping activities (overlap detected and warned, merged for free-time calculation)
- [x] Free slots shorter than 20 minutes (micro-breaks recommended, heavy tasks filtered out)
- [x] Thesis task allocation into free slots
- [x] Task completion tracking & analytics update
- [x] Storage schema and default settings integrity
- [x] Date-specific isolation (changing one date leaves other dates untouched)
