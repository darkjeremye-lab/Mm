export type ThemeType = 'black' | 'green' | 'pink';

export type AppearanceMode = 'light' | 'dark' | 'system';
export type ResolvedAppearance = 'light' | 'dark';

export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export const DAYS_OF_WEEK: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const DAY_FULL_NAMES: Record<DayOfWeek, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

export type NavigationTab =
  | 'dashboard'
  | 'study'
  | 'focus'
  | 'academic'
  | 'habits'
  | 'coach'
  | 'languages'
  | 'monthly'
  | 'more';

export type FocusTimerMode = '25_5' | '50_10' | '90_15' | 'custom';

export interface FocusSession {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  durationMinutes: number;
  subjectOrTask: string;
  taskId?: string;
  subjectId?: string;
  completed: boolean; // true if finished naturally, false if stopped early
  xpEarned: number;
  createdAt: number;
}

export type DashboardLayout = 'grid' | 'list';

export interface UserProfile {
  name: string;
  goals: string[]; // 2-3 life goals or dreams
  desiredFeelings: string[]; // e.g. "Focused", "Healthy", "Disciplined", "Energized"
  onboarded: boolean;
  createdAt: string;
  // Optional profile extensions (backward-compatible)
  avatar?: string; // base64 data URL (compact 256x256 square WebP/JPEG)
  bio?: string; // Short personal bio / motto
  learningGoals?: string[]; // Academic and skill learning goals
  learningLanguages?: string[]; // Languages currently being studied
  dailyStudyMinutes?: number; // Target daily study / learning duration in minutes
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type RecurrenceFrequency = 'daily' | 'weekdays' | 'weekly' | 'custom';

export interface TaskRecurrence {
  frequency: RecurrenceFrequency;
  days?: DayOfWeek[]; // Custom specific weekdays e.g. ['Mon', 'Wed', 'Fri']
  sourceTaskId?: string; // Grouping identifier for occurrences
}

export interface TaskReminder {
  id?: string;
  time: string; // "HH:MM" 24h
  isRecurring: boolean; // true = daily, false = specific day
  enabled: boolean;
}

export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
  priority?: TaskPriority; // Defaults to 'medium' if unspecified
  duration?: string; // e.g. '15 min', '30 min', '1 hour', '2 hours'
  recurrence?: TaskRecurrence; // Optional recurring rule
  reminder?: TaskReminder;
  dueDate?: string; // Optional YYYY-MM-DD
  createdAt?: number;
}

export interface WeeklyNotes {
  startOfWeek: string; // YYYY-MM-DD
  focus: string;
  reward: string;
  affirmation: string;
  focusAchievement?: 'achieved' | 'partial' | 'in_progress' | 'missed';
}

export interface HabitReminder {
  id?: string;
  time: string; // "HH:MM" 24h
  isRecurring: boolean; // true = daily, false = specific day
  day?: DayOfWeek; // If not recurring, specific day
  enabled: boolean;
}

export interface HabitItem {
  id: string;
  name: string;
  daysCompleted: Record<DayOfWeek, boolean>;
  reminder?: HabitReminder;
  bestStreak?: number; // Highest personal record consecutive streak
  history?: Record<string, boolean>; // Map of fullDate (YYYY-MM-DD) -> completed (true/false)
}

// Off-day / Quiet Mode tracking
export interface OffDayConfig {
  isOff: boolean;
  reason?: 'rest' | 'sick' | 'travel' | 'retreat';
  note?: string;
}

// Map of ISO Date String (YYYY-MM-DD) -> OffDayConfig
export type OffDaysMap = Record<string, OffDayConfig>;

// Monthly overview summary per week
export interface MonthWeekSummary {
  startOfWeek: string;
  endOfWeek: string;
  weekNumber: number;
  label: string; // e.g. "Aug 03 – Aug 09"
  focus: string;
  focusAchievement: 'achieved' | 'partial' | 'in_progress' | 'missed';
  tasksCompleted: number;
  totalTasks: number;
  taskPercent: number;
  habitsConsistency: number;
  studyHoursLogged: number;
  studyHoursTarget: number;
  overallCompletionPercent: number;
  trend: 'up' | 'down' | 'steady';
  trendDiff: number; // percentage difference from previous week
  deadlinesCount: number;
  isCurrentWeek: boolean;
  offDaysCount: number;
}

// Daily rotating quote / fact item
export interface DailyQuoteItem {
  id: string;
  text: string;
  author: string;
  field: string;
  type: 'quote' | 'fact';
  context?: string;
}

// Academic types for the school year
export interface AcademicSubject {
  id: string;
  name: string;
  color: string; // Hex code or luxury accent
  weeklyTargetHours: number; // e.g. 6.0 hours/week
  dailyHours: Record<DayOfWeek, number>; // hours logged per day e.g. { Mon: 1.5, Tue: 2.0, ... }
  currentTopic?: string;
}

export type DeadlineType = 'exam' | 'assignment' | 'project' | 'quiz' | 'test';
export type DeadlinePriority = 'urgent' | 'high' | 'normal';
export type DeadlineStatus = 'pending' | 'in_progress' | 'completed';

export interface AcademicDeadline {
  id: string;
  title: string;
  subjectId: string;
  type: DeadlineType;
  dueDate: string; // YYYY-MM-DD
  time?: string; // HH:MM
  priority: DeadlinePriority;
  status: DeadlineStatus;
  notes?: string;
}

export interface LongTermMilestone {
  id: string;
  text: string;
  completed: boolean;
}

export interface LongTermGoal {
  id: string;
  title: string;
  category: 'academic' | 'scholarship' | 'exam' | 'career';
  targetDate?: string;
  whyItMatters?: string;
  milestones: LongTermMilestone[];
}

export interface AcademicState {
  subjects: AcademicSubject[];
  deadlines: AcademicDeadline[];
  longTermGoals: LongTermGoal[];
}

export interface ThemeConfig {
  id: ThemeType;
  name: string;
  appearance?: ResolvedAppearance;
  isDark?: boolean;
  headerBg: string;
  headerText: string;
  accentBg: string;
  accentText: string;
  ringTrackHex: string;
  ringProgressHex: string;
  barColorHex: string;
  cardBorder: string;
  habitCheckedBg: string;
  habitCheckedText: string;
  badgeBg: string;
  badgeText: string;
  activeNavBg: string;
  activeNavText: string;
  pillBorder: string;
  subtleBg: string;
  goldAccent: string;
  creamBg: string;
  surfaceBg?: string;
  cardBg?: string;
}

export interface AICoachMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  audioBase64?: string;
  suggestedTasks?: { day: DayOfWeek; text: string }[];
  suggestedHabits?: string[];
  suggestedStudyBlocks?: { subject: string; duration: string }[];
}

export type TargetLanguageCode =
  | 'es'
  | 'fr'
  | 'de'
  | 'it'
  | 'ja'
  | 'zh'
  | 'pt'
  | 'ko'
  | 'ar'
  | 'ru'
  | 'en'
  | 'custom';

export type LanguageProficiency = 'beginner' | 'intermediate' | 'advanced';

export type LanguagePracticeMode = 'conversation' | 'roleplay' | 'writing_critique' | 'pronunciation';

export interface LanguageCorrection {
  original: string;
  improved: string;
  explanation: string;
}

export interface VocabularyWord {
  word: string;
  phonetic?: string;
  translation: string;
  notes?: string;
}

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

export type ReviewStatus = 'new' | 'learning' | 'review' | 'mastered';

export interface SavedVocabularyItem {
  id: string;
  word: string;
  translation: string;
  pronunciation?: string;
  exampleSentence?: string;
  language: string;
  languageCode: TargetLanguageCode | string;
  dateAdded: number;
  reviewStatus: ReviewStatus;
  lastReviewed?: number;
  nextReviewDate: number;
  reviewCount: number;
  consecutiveCorrect: number;
  notes?: string;
}

export interface VocabularyStats {
  total: number;
  reviewed: number;
  mastered: number;
  due: number;
}

export interface LanguageMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  translation?: string;
  pronunciationGuide?: string;
  corrections?: LanguageCorrection[];
  vocabulary?: VocabularyWord[];
  timestamp: number;
  audioBase64?: string;
}

export interface LanguageOption {
  code: TargetLanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  speechLangCode: string; // e.g. "es-ES", "fr-FR", "ja-JP"
  voiceName: string; // Gemini TTS prebuiltVoiceConfig or default
}

export interface PlannerSnapshot {
  tasksByDay: Record<DayOfWeek, TaskItem[]>;
  habits: HabitItem[];
  notes: WeeklyNotes;
  academicState?: AcademicState;
  actionLabel?: string;
}

export interface TriggeredReminderAlert {
  id: string;
  title: string;
  subtitle: string;
  type: 'task' | 'habit' | 'deadline';
  day?: DayOfWeek;
  taskId?: string;
  habitId?: string;
  deadlineId?: string;
  time: string;
  timestamp: number;
}

// Wake Challenge Alarm System types
export type WakeChallengeType = 'math' | 'memory' | 'type_phrase' | 'vocabulary';
export type WakeAlarmDifficulty = 'easy' | 'medium' | 'hard';
export type WakeAlarmSound = 'gentle_chime' | 'luxury_chords' | 'energetic_pulse' | 'classic_bell' | 'zen_gong' | 'wake_up_motivation' | 'custom';

export interface WakeAlarmItem {
  id: string;
  time: string; // "HH:MM" 24h format
  label: string;
  repeatDays: DayOfWeek[]; // Empty array means once; or subset of DAYS_OF_WEEK
  sound: WakeAlarmSound;
  customSoundId?: string; // ID referencing custom sound in IndexedDB
  customSoundName?: string; // Display file name e.g. "morning_rise.mp3"
  challengeType: WakeChallengeType;
  difficulty: WakeAlarmDifficulty;
  enabled: boolean;
  snoozedUntil?: number; // timestamp in ms when snooze ends
  createdAt: number;
}
