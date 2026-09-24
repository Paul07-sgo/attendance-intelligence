# Attendance Intelligence — Academic Attendance Operating System

A production-quality, mathematically deterministic personal college attendance operating system built for Autumn Term 2026-27 (Academic Section **K3P25UG**).

> **Core Product Principle**: *"How many classes can I miss while maintaining my chosen minimum attendance target?"*

---

## 🌟 Upgraded Portfolio Features

1. **Exact Mathematical Calculation Engine**:
   - Dynamic target selection (50% – 100%, preset buttons: 75%, 80%, 85%, 87%, 90%, 95%).
   - Integer math formula for maximum missable future classes ($m = \lfloor \frac{A}{R} - T \rfloor$).
   - Integer math formula for required consecutive attendances to recover ($n = \lceil \frac{R \cdot T - A}{1 - R} \rceil$).
   - Subject-specific target overrides & floating-point precision protection ($10^{-9}$).

2. **Signature "Can I Skip?" Class-by-Class Simulator**:
   - Interactive date picker to view all sessions scheduled on any given day.
   - **Multi-Class Checkbox Selector**: Toggle individual classes (e.g. skip Lecture 1, keep Practical 2).
   - Computes subject-by-subject percentage shift, impact, remaining buffer, and status badge.
   - Automatically highlights academic blackout dates & weekends.

3. **Command Palette (`Ctrl + K` / `Cmd + K`)**:
   - Global search across all enrolled subjects, faculty, course codes, and keywords.
   - Instant action shortcuts: navigate tabs, change target presets, toggle dark mode, export JSON backup.

4. **Deterministic Academic Calendar & Timetable Integration**:
   - Counts real scheduled future classes based on section **K3P25UG** timetable.
   - **Academic Blackout Exclusions** (0 regular classes counted during these dates):
     - **Mid Term Test (MTT)**: October 01 – October 09, 2026 inclusive
     - **Term Break**: November 07 – November 10, 2026 inclusive
     - **End Term Examination**: December 14 – December 30, 2026 inclusive
     - **Winter Vacation**: December 31, 2026 – January 10, 2027 inclusive
     - **Weekends**: Saturdays & Sundays

5. **Simulation & Runway Engine (`src/utils/simulationEngine.ts`)**:
   - Attendance runway calculation (weeks/classes remaining before target drop).
   - Multi-step absence trajectory generator for interactive modal visualizers.

6. **PWA & Offline Installation Support**:
   - Web App Manifest (`manifest.json`) for installing as a standalone desktop or mobile application.

---

## 📊 Preloaded Initial Dataset

**Baseline Date**: September 24, 2026 (Autumn Term 2026-27)

| Subject Code | Subject Name | Faculty | Attended | Delivered | Current % |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **CSE202** | Object Oriented Programming | Aryan Tyagi | 24 | 28 | 85.71% |
| **CSE205** | Data Structures and Algorithms | Aryan Tyagi | 29 | 32 | 90.63% |
| **CSE276** | Artificial Intelligence Foundations | Dr. Jimmy Singla | 23 | 24 | 95.83% |
| **CSE306** | Computer Networks | Sarabmeet Singh Masson | 24 | 25 | 96.00% |
| **INT335** | Design Thinking | Komal Gupta | 9 | 13 | 69.23% |
| **MTH401** | Discrete Mathematics | Dr. Babli Yadav | 23 | 27 | 85.18% |
| **PEL132** | Communication Skills-II | Namrata Sethi | 24 | 25 | 96.00% |

*Note: `GEN231` is excluded from the dataset.*

---

## 🧮 Core Mathematical Formulas

Given:
- $A$ = classes attended
- $T$ = total classes delivered
- $R = \frac{\text{Target}}{100}$ (target decimal, e.g. $0.87$)

### 1. Maximum Classes That Can Be Missed ($m$)
$$\frac{A}{T + m} \ge R \implies m = \left\lfloor \frac{A}{R} - T \right\rfloor$$

### 2. Classes Needed To Reach Target ($n$)
If $\frac{A}{T} < R$:
$$\frac{A + n}{T + n} \ge R \implies n = \left\lceil \frac{R \cdot T - A}{1 - R} \right\rceil$$

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18+ or v20+

### Installation & Execution
```bash
# Install dependencies
npm install

# Start Vite local development server
npm run dev

# Run Vitest test suite (27 automated tests across 3 suites)
npx vitest run

# Build production bundle
npm run build
```

---

## 📁 Project Architecture

```text
src/
├── __tests__/              # Vitest automated unit test suites
│   ├── attendanceEngine.test.ts
│   ├── calendarEngine.test.ts
│   └── simulationEngine.test.ts
├── components/             # React UI Components
│   ├── AcademicCalendarView.tsx
│   ├── CommandPalette.tsx    # Ctrl + K global command search modal
│   ├── DashboardSummary.tsx
│   ├── Header.tsx
│   ├── SettingsView.tsx
│   ├── SkipDayCalculator.tsx # Signature Multi-Class Skip Simulator
│   ├── SubjectCard.tsx
│   ├── SubjectDetailModal.tsx
│   ├── SubjectManagerModal.tsx
│   ├── TargetSelector.tsx
│   ├── TimetableManager.tsx
│   └── WhatIfCalculator.tsx
├── data/
│   └── initialData.ts
├── types/
│   └── index.ts
├── utils/
│   ├── attendanceEngine.ts  # Attendance math engine
│   ├── calendarEngine.ts    # Calendar & blackout engine
│   ├── simulationEngine.ts  # Multi-class skip & runway engine
│   └── storage.ts           # Persistence & backup import/export
├── App.tsx
├── index.css
└── main.tsx
```

---

## 🛡️ Verification Standard

- [x] Zero TypeScript errors.
- [x] Production build (`npm run build`) succeeds.
- [x] 27/27 unit tests passing across all calculation engines.
- [x] `GEN231` strictly excluded.
- [x] Baseline snapshot date fixed to September 24, 2026.
- [x] Widescreen layout scaled to `w-[min(92vw,1600px)]`.
