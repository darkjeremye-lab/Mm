import {
  AcademicState,
  DayOfWeek,
  HabitItem,
  TaskItem,
  WeeklyNotes,
} from '../types';
import { getMondayOfWeek } from '../utils/dateUtils';

export function getDefaultNotes(baseMonday?: string): WeeklyNotes {
  return {
    startOfWeek: baseMonday || getMondayOfWeek(),
    focus: 'Master Quantum Mechanics problem sets & complete scholarship statement',
    reward: 'Weekend artisanal pour-over coffee & bookshop browsing',
    affirmation: 'Disciplined, quiet focus today compounds into extraordinary breakthroughs.',
  };
}

export function getDefaultAcademicState(): AcademicState {
  // Compute relative dates for realistic countdowns
  const today = new Date();
  const formatOffset = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  return {
    subjects: [
      {
        id: 'sub-physics',
        name: 'Physics (AP/Advanced Mechanics)',
        color: '#B88939', // Brass Gold
        weeklyTargetHours: 8.0,
        dailyHours: {
          Mon: 2.0,
          Tue: 1.5,
          Wed: 1.0,
          Thu: 0,
          Fri: 0,
          Sat: 0,
          Sun: 0,
        },
        currentTopic: 'Rotational Dynamics & Angular Momentum',
      },
      {
        id: 'sub-math',
        name: 'Mathematics (Calculus BC / Linear Algebra)',
        color: '#22543D', // Deep Emerald
        weeklyTargetHours: 10.0,
        dailyHours: {
          Mon: 2.5,
          Tue: 2.0,
          Wed: 1.5,
          Thu: 0,
          Fri: 0,
          Sat: 0,
          Sun: 0,
        },
        currentTopic: 'Taylor Series Approximations & Multivariable Intro',
      },
      {
        id: 'sub-chemistry',
        name: 'Chemistry (Organic & Physical)',
        color: '#7A223B', // Rich Burgundy
        weeklyTargetHours: 6.0,
        dailyHours: {
          Mon: 1.0,
          Tue: 1.5,
          Wed: 0,
          Thu: 0,
          Fri: 0,
          Sat: 0,
          Sun: 0,
        },
        currentTopic: 'Reaction Kinetics & Spectroscopic Analysis',
      },
      {
        id: 'sub-biology',
        name: 'Biology (Cellular & Molecular)',
        color: '#2C4F6B', // Sapphire
        weeklyTargetHours: 5.0,
        dailyHours: {
          Mon: 1.0,
          Tue: 0,
          Wed: 1.0,
          Thu: 0,
          Fri: 0,
          Sat: 0,
          Sun: 0,
        },
        currentTopic: 'CRISPR Gene Editing & Signal Transduction',
      },
      {
        id: 'sub-cs',
        name: 'Computer Science & Algorithms',
        color: '#6B4C7A', // Royal Plum
        weeklyTargetHours: 6.0,
        dailyHours: {
          Mon: 1.5,
          Tue: 1.0,
          Wed: 1.0,
          Thu: 0,
          Fri: 0,
          Sat: 0,
          Sun: 0,
        },
        currentTopic: 'Dynamic Programming & Graph Traversal',
      },
    ],
    deadlines: [
      {
        id: 'dl-1',
        title: 'Physics Mechanics Midterm Exam',
        subjectId: 'sub-physics',
        type: 'exam',
        dueDate: formatOffset(4), // in 4 days
        time: '09:00',
        priority: 'urgent',
        status: 'in_progress',
        notes: 'Covers Newton Laws, Energy Conservation, and Rigid Body Torque problem sets.',
      },
      {
        id: 'dl-2',
        title: 'Calculus BC Problem Set #4 & Proofs',
        subjectId: 'sub-math',
        type: 'assignment',
        dueDate: formatOffset(2), // in 2 days
        time: '23:59',
        priority: 'urgent',
        status: 'in_progress',
        notes: 'Complete Questions 1–15 with rigorous proof steps.',
      },
      {
        id: 'dl-3',
        title: 'Organic Synthesis Lab Report',
        subjectId: 'sub-chemistry',
        type: 'project',
        dueDate: formatOffset(9), // in 9 days
        time: '17:00',
        priority: 'high',
        status: 'pending',
        notes: 'Include NMR spectra analysis and percent yield calculations.',
      },
      {
        id: 'dl-4',
        title: 'Molecular Biology Quiz 3',
        subjectId: 'sub-biology',
        type: 'quiz',
        dueDate: formatOffset(14), // in 2 weeks
        time: '11:00',
        priority: 'normal',
        status: 'pending',
        notes: 'DNA replication enzymes and transcription factors review.',
      },
    ],
    longTermGoals: [
      {
        id: 'ltg-1',
        title: 'Pass National University Entrance Exam with Top 0.1% Percentile',
        category: 'exam',
        targetDate: '2027-06-15',
        whyItMatters: 'Secures admission into the elite honours engineering and natural sciences faculty.',
        milestones: [
          { id: 'm1', text: 'Complete past 10 years exam papers with timed simulations', completed: true },
          { id: 'm2', text: 'Master advanced Physics & Calculus mechanics modules', completed: true },
          { id: 'm3', text: 'Achieve >95% score on national mock trial examinations', completed: false },
          { id: 'm4', text: 'Maintain weekly error logbook review every Sunday', completed: false },
        ],
      },
      {
        id: 'ltg-2',
        title: 'Win International STEM & Leadership Scholarship',
        category: 'scholarship',
        targetDate: '2026-12-01',
        whyItMatters: 'Provides full tuition and research stipend for international study abroad.',
        milestones: [
          { id: 's1', text: 'Draft personal academic statement & research manifesto', completed: true },
          { id: 's2', text: 'Secure 2 faculty recommendation letters', completed: false },
          { id: 's3', text: 'Finalize extracurricular leadership portfolio', completed: false },
        ],
      },
      {
        id: 'ltg-3',
        title: 'Study Abroad at Global Top Research University (e.g. Oxford / MIT)',
        category: 'academic',
        targetDate: '2027-09-01',
        whyItMatters: 'Immerse in cutting-edge laboratory research and global peer collaboration.',
        milestones: [
          { id: 'a1', text: 'Complete SAT / Advanced Placement exams with 5/5 scores', completed: true },
          { id: 'a2', text: 'Submit CommonApp and UCAS international applications', completed: false },
          { id: 'a3', text: 'Prepare for rigorous subject admissions interviews', completed: false },
        ],
      },
    ],
  };
}


export function getDefaultTasks(): Record<DayOfWeek, TaskItem[]> {
  return {
    Mon: [
      { id: 'm-1', text: 'Review weekly roadmap & sprint goals', completed: true },
      { id: 'm-2', text: 'Wireframe component layout', completed: true },
      { id: 'm-3', text: 'Team sync meeting @ 10:00 AM', completed: false },
    ],
    Tue: [
      { id: 't-1', text: 'Implement theme switcher engine', completed: true },
      { id: 't-2', text: 'Build SVG circular progress rings', completed: true },
      { id: 't-3', text: 'Refactor state persistence layer', completed: false },
    ],
    Wed: [
      { id: 'w-1', text: 'Design habit tracker data grid', completed: true },
      { id: 'w-2', text: 'Connect weekly progress bar chart', completed: false },
      { id: 'w-3', text: '30-minute interval run / cardio', completed: false },
    ],
    Thu: [
      { id: 'th-1', text: 'Conduct cross-browser testing', completed: false },
      { id: 'th-2', text: 'Draft customer release changelog', completed: false },
    ],
    Fri: [
      { id: 'f-1', text: 'Final code review & lint checks', completed: false },
      { id: 'f-2', text: 'Publish deployment build', completed: false },
      { id: 'f-3', text: 'Weekly retrospective notes', completed: false },
    ],
    Sat: [
      { id: 'sa-1', text: 'Read 2 chapters of design book', completed: false },
      { id: 'sa-2', text: 'Meal prep for upcoming week', completed: false },
    ],
    Sun: [
      { id: 'su-1', text: 'Weekly plan review & inbox zero', completed: false },
      { id: 'su-2', text: 'Rest, recharge & family dinner', completed: false },
    ],
  };
}

export function getDefaultHabits(startOfWeekISO?: string): HabitItem[] {
  const baseMonday = startOfWeekISO ? new Date(startOfWeekISO) : new Date();
  const formatPastDate = (daysAgo: number) => {
    const d = new Date(baseMonday);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      id: 'h-1',
      name: '7+ Hours Sleep',
      bestStreak: 14,
      daysCompleted: {
        Mon: true,
        Tue: true,
        Wed: true,
        Thu: true,
        Fri: true,
        Sat: false,
        Sun: false,
      },
      history: {
        [formatPastDate(1)]: true,
        [formatPastDate(2)]: true,
        [formatPastDate(3)]: true,
        [formatPastDate(4)]: true,
        [formatPastDate(5)]: true,
        [formatPastDate(6)]: true,
        [formatPastDate(7)]: true,
      },
    },
    {
      id: 'h-2',
      name: 'Read 20 mins',
      bestStreak: 9,
      daysCompleted: {
        Mon: true,
        Tue: true,
        Wed: true,
        Thu: false,
        Fri: false,
        Sat: false,
        Sun: false,
      },
      history: {
        [formatPastDate(1)]: true,
        [formatPastDate(2)]: true,
        [formatPastDate(3)]: true,
      },
    },
    {
      id: 'h-3',
      name: '2L Water Intake',
      bestStreak: 21,
      daysCompleted: {
        Mon: true,
        Tue: true,
        Wed: true,
        Thu: true,
        Fri: true,
        Sat: true,
        Sun: false,
      },
      history: {
        [formatPastDate(1)]: true,
        [formatPastDate(2)]: true,
        [formatPastDate(3)]: true,
        [formatPastDate(4)]: true,
        [formatPastDate(5)]: true,
        [formatPastDate(6)]: true,
      },
    },
    {
      id: 'h-4',
      name: 'Daily Exercise / Walk',
      bestStreak: 12,
      daysCompleted: {
        Mon: true,
        Tue: true,
        Wed: false,
        Thu: false,
        Fri: false,
        Sat: false,
        Sun: false,
      },
      history: {
        [formatPastDate(1)]: true,
        [formatPastDate(2)]: true,
      },
    },
  ];
}
