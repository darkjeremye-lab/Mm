import React, { useState } from 'react';
import {
  AcademicDeadline,
  AcademicState,
  AcademicSubject,
  DayOfWeek,
  DAYS_OF_WEEK,
  DeadlinePriority,
  DeadlineStatus,
  DeadlineType,
  LongTermGoal,
  ThemeConfig,
  UserProfile,
} from '../types';
import {
  GraduationCap,
  BookOpen,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Check,
  AlertTriangle,
  Sparkles,
  Flame,
  Award,
  Compass,
  ArrowRight,
  TrendingUp,
  Target,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Timer,
} from 'lucide-react';
import { PomodoroStudyTimer } from './PomodoroStudyTimer';

interface AcademicPageProps {
  academicState: AcademicState;
  theme: ThemeConfig;
  userProfile?: UserProfile;
  dayDates?: Record<DayOfWeek, { label: string; fullDate: string; isToday: boolean }>;
  onUpdateAcademicState?: (newState: AcademicState) => void;
  onUpdateSubject?: (subject: AcademicSubject) => void;
  onAddSubject?: (newSubject: Omit<AcademicSubject, 'id'>) => void;
  onDeleteSubject?: (subjectId: string) => void;
  onLogStudyHours?: (subjectId: string, day: DayOfWeek, hours: number) => void;
  onAddDeadline?: (newDeadline: Omit<AcademicDeadline, 'id'>) => void;
  onUpdateDeadline?: (deadline: AcademicDeadline) => void;
  onDeleteDeadline?: (deadlineId: string) => void;
  onAddLongTermGoal?: (newGoal: Omit<LongTermGoal, 'id'>) => void;
  onUpdateLongTermGoal?: (goal: LongTermGoal) => void;
  onDeleteLongTermGoal?: (goalId: string) => void;
  onToggleMilestone?: (goalId: string, milestoneId: string) => void;
  onOpenAICoachWithPrompt?: (prompt: string) => void;
}

// Calculate days remaining from today to target date
export function getDaysRemaining(dueDateStr: string): {
  days: number;
  label: string;
  isUrgent: boolean;
  isToday: boolean;
  isPast: boolean;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const days = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (days < 0) {
    return {
      days,
      label: `${Math.abs(days)}d ago`,
      isUrgent: false,
      isToday: false,
      isPast: true,
    };
  }
  if (days === 0) {
    return {
      days,
      label: 'Due Today!',
      isUrgent: true,
      isToday: true,
      isPast: false,
    };
  }
  if (days === 1) {
    return {
      days,
      label: 'Tomorrow',
      isUrgent: true,
      isToday: false,
      isPast: false,
    };
  }
  if (days <= 3) {
    return {
      days,
      label: `${days} days left`,
      isUrgent: true,
      isToday: false,
      isPast: false,
    };
  }
  if (days <= 7) {
    return {
      days,
      label: `In ${days} days`,
      isUrgent: false,
      isToday: false,
      isPast: false,
    };
  }
  return {
    days,
    label: `In ${Math.ceil(days / 7)} weeks`,
    isUrgent: false,
    isToday: false,
    isPast: false,
  };
}

const defaultDayDates: Record<DayOfWeek, { label: string; fullDate: string; isToday: boolean }> = {
  Mon: { label: 'Mon', fullDate: 'Monday', isToday: false },
  Tue: { label: 'Tue', fullDate: 'Tuesday', isToday: false },
  Wed: { label: 'Wed', fullDate: 'Wednesday', isToday: false },
  Thu: { label: 'Thu', fullDate: 'Thursday', isToday: false },
  Fri: { label: 'Fri', fullDate: 'Friday', isToday: false },
  Sat: { label: 'Sat', fullDate: 'Saturday', isToday: false },
  Sun: { label: 'Sun', fullDate: 'Sunday', isToday: false },
};

export const AcademicPage: React.FC<AcademicPageProps> = ({
  academicState,
  theme,
  userProfile,
  dayDates = defaultDayDates,
  onUpdateAcademicState,
  onUpdateSubject,
  onAddSubject,
  onDeleteSubject,
  onLogStudyHours,
  onAddDeadline,
  onUpdateDeadline,
  onDeleteDeadline,
  onAddLongTermGoal,
  onUpdateLongTermGoal,
  onDeleteLongTermGoal,
  onToggleMilestone,
  onOpenAICoachWithPrompt,
}) => {
  // Selected Subject for Pomodoro Study Timer
  const [selectedPomodoroSubjectId, setSelectedPomodoroSubjectId] = useState<string>(
    academicState.subjects[0]?.id || ''
  );

  // Unified Handler Fallbacks (guarantees persistence whether granular props or onUpdateAcademicState is passed)
  const handleLogStudyHoursInternal = (subjectId: string, day: DayOfWeek, hours: number) => {
    if (onLogStudyHours) {
      onLogStudyHours(subjectId, day, hours);
    } else if (onUpdateAcademicState) {
      const updatedSubjects = academicState.subjects.map((sub) => {
        if (sub.id === subjectId) {
          return {
            ...sub,
            dailyHours: {
              ...sub.dailyHours,
              [day]: hours,
            },
          };
        }
        return sub;
      });
      onUpdateAcademicState({
        ...academicState,
        subjects: updatedSubjects,
      });
    }
  };

  const handleAddSubjectInternal = (newSubject: Omit<AcademicSubject, 'id'>) => {
    if (onAddSubject) {
      onAddSubject(newSubject);
    } else if (onUpdateAcademicState) {
      const subject: AcademicSubject = {
        ...newSubject,
        id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };
      onUpdateAcademicState({
        ...academicState,
        subjects: [...academicState.subjects, subject],
      });
    }
  };

  const handleUpdateSubjectInternal = (subject: AcademicSubject) => {
    if (onUpdateSubject) {
      onUpdateSubject(subject);
    } else if (onUpdateAcademicState) {
      onUpdateAcademicState({
        ...academicState,
        subjects: academicState.subjects.map((s) => (s.id === subject.id ? subject : s)),
      });
    }
  };

  const handleDeleteSubjectInternal = (subjectId: string) => {
    if (onDeleteSubject) {
      onDeleteSubject(subjectId);
    } else if (onUpdateAcademicState) {
      onUpdateAcademicState({
        ...academicState,
        subjects: academicState.subjects.filter((s) => s.id !== subjectId),
      });
    }
  };

  const handleAddDeadlineInternal = (newDl: Omit<AcademicDeadline, 'id'>) => {
    if (onAddDeadline) {
      onAddDeadline(newDl);
    } else if (onUpdateAcademicState) {
      const deadline: AcademicDeadline = {
        ...newDl,
        id: `dl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };
      onUpdateAcademicState({
        ...academicState,
        deadlines: [...academicState.deadlines, deadline],
      });
    }
  };

  const handleUpdateDeadlineInternal = (dl: AcademicDeadline) => {
    if (onUpdateDeadline) {
      onUpdateDeadline(dl);
    } else if (onUpdateAcademicState) {
      onUpdateAcademicState({
        ...academicState,
        deadlines: academicState.deadlines.map((d) => (d.id === dl.id ? dl : d)),
      });
    }
  };

  const handleDeleteDeadlineInternal = (dlId: string) => {
    if (onDeleteDeadline) {
      onDeleteDeadline(dlId);
    } else if (onUpdateAcademicState) {
      onUpdateAcademicState({
        ...academicState,
        deadlines: academicState.deadlines.filter((d) => d.id !== dlId),
      });
    }
  };

  const handleAddLongTermGoalInternal = (newGoal: Omit<LongTermGoal, 'id'>) => {
    if (onAddLongTermGoal) {
      onAddLongTermGoal(newGoal);
    } else if (onUpdateAcademicState) {
      const goal: LongTermGoal = {
        ...newGoal,
        id: `goal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };
      onUpdateAcademicState({
        ...academicState,
        longTermGoals: [...academicState.longTermGoals, goal],
      });
    }
  };

  const handleUpdateLongTermGoalInternal = (goal: LongTermGoal) => {
    if (onUpdateLongTermGoal) {
      onUpdateLongTermGoal(goal);
    } else if (onUpdateAcademicState) {
      onUpdateAcademicState({
        ...academicState,
        longTermGoals: academicState.longTermGoals.map((g) => (g.id === goal.id ? goal : g)),
      });
    }
  };

  const handleDeleteLongTermGoalInternal = (goalId: string) => {
    if (onDeleteLongTermGoal) {
      onDeleteLongTermGoal(goalId);
    } else if (onUpdateAcademicState) {
      onUpdateAcademicState({
        ...academicState,
        longTermGoals: academicState.longTermGoals.filter((g) => g.id !== goalId),
      });
    }
  };

  const handleToggleMilestoneInternal = (goalId: string, milestoneId: string) => {
    if (onToggleMilestone) {
      onToggleMilestone(goalId, milestoneId);
    } else if (onUpdateAcademicState) {
      onUpdateAcademicState({
        ...academicState,
        longTermGoals: academicState.longTermGoals.map((g) => {
          if (g.id === goalId) {
            return {
              ...g,
              milestones: g.milestones.map((m) =>
                m.id === milestoneId ? { ...m, completed: !m.completed } : m
              ),
            };
          }
          return g;
        }),
      });
    }
  };

  // Modal / Form states
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubTarget, setNewSubTarget] = useState('6.0');
  const [newSubColor, setNewSubColor] = useState('#B88939');
  const [newSubTopic, setNewSubTopic] = useState('');

  // Editing subject inline
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editingSubName, setEditingSubName] = useState('');
  const [editingSubTarget, setEditingSubTarget] = useState('6.0');
  const [editingSubTopic, setEditingSubTopic] = useState('');

  // Delete subject confirmation
  const [confirmDeleteSubId, setConfirmDeleteSubId] = useState<string | null>(null);

  // Add Deadline state
  const [isAddDeadlineOpen, setIsAddDeadlineOpen] = useState(false);
  const [newDlTitle, setNewDlTitle] = useState('');
  const [newDlSubjectId, setNewDlSubjectId] = useState(
    academicState.subjects[0]?.id || ''
  );
  const [newDlType, setNewDlType] = useState<DeadlineType>('exam');
  const [newDlDueDate, setNewDlDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [newDlPriority, setNewDlPriority] = useState<DeadlinePriority>('high');
  const [newDlNotes, setNewDlNotes] = useState('');

  // Delete deadline confirmation
  const [confirmDeleteDlId, setConfirmDeleteDlId] = useState<string | null>(null);

  // Add Long-Term Goal state
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState<'academic' | 'scholarship' | 'exam' | 'career'>('scholarship');
  const [newGoalTargetDate, setNewGoalTargetDate] = useState('2027-06-01');
  const [newGoalWhy, setNewGoalWhy] = useState('');
  const [newGoalMilestoneInput, setNewGoalMilestoneInput] = useState('');
  const [newGoalMilestones, setNewGoalMilestones] = useState<string[]>([
    'Draft initial application & requirements checklist',
    'Complete primary study materials and mock tests',
  ]);

  // Delete goal confirmation
  const [confirmDeleteGoalId, setConfirmDeleteGoalId] = useState<string | null>(null);

  // New milestone inline adding for existing goal
  const [addingMilestoneGoalId, setAddingMilestoneGoalId] = useState<string | null>(null);
  const [newMilestoneText, setNewMilestoneText] = useState('');

  // Calculate totals
  const totalWeeklyTargetHours = academicState.subjects.reduce(
    (acc, s) => acc + (s.weeklyTargetHours || 0),
    0
  );
  const totalLoggedHoursThisWeek = academicState.subjects.reduce((acc: number, s) => {
    const hoursArray = Object.values(s.dailyHours || {}) as number[];
    let sum = 0;
    for (const h of hoursArray) {
      sum += Number(h) || 0;
    }
    return acc + sum;
  }, 0);

  const overallStudyPercent =
    totalWeeklyTargetHours > 0
      ? Math.min(100, Math.round((totalLoggedHoursThisWeek / totalWeeklyTargetHours) * 100))
      : 0;

  // Sorted upcoming deadlines by due date
  const sortedDeadlines = [...academicState.deadlines].sort((a, b) => {
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const urgentCount = sortedDeadlines.filter((d) => {
    if (d.status === 'completed') return false;
    const remaining = getDaysRemaining(d.dueDate);
    return remaining.days >= 0 && remaining.days <= 3;
  }).length;

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;
    handleAddSubjectInternal({
      name: newSubName.trim(),
      weeklyTargetHours: parseFloat(newSubTarget) || 5,
      color: newSubColor,
      dailyHours: {
        Mon: 0,
        Tue: 0,
        Wed: 0,
        Thu: 0,
        Fri: 0,
        Sat: 0,
        Sun: 0,
      },
      currentTopic: newSubTopic.trim() || undefined,
    });
    setNewSubName('');
    setNewSubTopic('');
    setIsAddSubjectOpen(false);
  };

  const startEditSubject = (sub: AcademicSubject) => {
    setEditingSubjectId(sub.id);
    setEditingSubName(sub.name);
    setEditingSubTarget(String(sub.weeklyTargetHours));
    setEditingSubTopic(sub.currentTopic || '');
  };

  const saveEditSubject = (sub: AcademicSubject) => {
    if (editingSubName.trim()) {
      handleUpdateSubjectInternal({
        ...sub,
        name: editingSubName.trim(),
        weeklyTargetHours: parseFloat(editingSubTarget) || sub.weeklyTargetHours,
        currentTopic: editingSubTopic.trim() || undefined,
      });
    }
    setEditingSubjectId(null);
  };

  const handleCreateDeadline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDlTitle.trim()) return;
    handleAddDeadlineInternal({
      title: newDlTitle.trim(),
      subjectId: newDlSubjectId || academicState.subjects[0]?.id || 'general',
      type: newDlType,
      dueDate: newDlDueDate,
      priority: newDlPriority,
      status: 'pending',
      notes: newDlNotes.trim() || undefined,
    });
    setNewDlTitle('');
    setNewDlNotes('');
    setIsAddDeadlineOpen(false);
  };

  const handleCreateLongTermGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    const milestones = newGoalMilestones
      .filter((m) => m.trim().length > 0)
      .map((text, idx) => ({
        id: `ms-${Date.now()}-${idx}`,
        text: text.trim(),
        completed: false,
      }));

    handleAddLongTermGoalInternal({
      title: newGoalTitle.trim(),
      category: newGoalCategory,
      targetDate: newGoalTargetDate,
      whyItMatters: newGoalWhy.trim() || undefined,
      milestones,
    });
    setNewGoalTitle('');
    setNewGoalWhy('');
    setIsAddGoalOpen(false);
  };

  const handleAddMilestoneToGoal = (goalId: string) => {
    if (!newMilestoneText.trim()) return;
    const goal = academicState.longTermGoals.find((g) => g.id === goalId);
    if (!goal) return;

    const newM = {
      id: `ms-${Date.now()}`,
      text: newMilestoneText.trim(),
      completed: false,
    };
    handleUpdateLongTermGoalInternal({
      ...goal,
      milestones: [...goal.milestones, newM],
    });
    setNewMilestoneText('');
    setAddingMilestoneGoalId(null);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1500px] mx-auto animate-fade-in">
      {/* 1. Academic Executive Header */}
      <header className="bg-gradient-to-r from-[#1C1917] via-[#2A241E] to-[#1C1917] border border-[#D4AF37]/30 rounded-lg p-5 sm:p-6 text-stone-100 shadow-[0_10px_30px_rgba(20,18,15,0.15)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#9E742A] p-0.5 shadow-md flex items-center justify-center flex-shrink-0">
            <div className="w-full h-full bg-[#1C1917] rounded-[7px] flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-[#E2BE7A]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-100 tracking-tight">
                Academic & Long-Term Mastery
              </h1>
              <span className="hidden sm:inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#E2BE7A]">
                School Year 2026–2027
              </span>
            </div>
            <p className="text-xs text-stone-400 font-sans mt-0.5">
              Subject hours tracking, focus timer, exam countdowns, and lifelong ambition roadmaps
            </p>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap self-stretch md:self-auto justify-between md:justify-end">
          <div className="bg-[#141210] border border-stone-800 rounded-md px-3 py-2 flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-stone-400">Weekly Study</span>
            <span className="text-sm sm:text-base font-serif font-bold text-[#E2BE7A]">
              {totalLoggedHoursThisWeek.toFixed(1)} / {totalWeeklyTargetHours.toFixed(0)} hrs
            </span>
          </div>

          <div className="bg-[#141210] border border-stone-800 rounded-md px-3 py-2 flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-stone-400">Target Pace</span>
            <span className="text-sm sm:text-base font-serif font-bold text-emerald-400">
              {overallStudyPercent}%
            </span>
          </div>

          {urgentCount > 0 && (
            <div className="bg-amber-950/40 border border-amber-600/40 rounded-md px-3 py-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-amber-300">Urgent Exams</span>
                <span className="text-xs font-bold text-amber-200">
                  {urgentCount} deadline{urgentCount > 1 ? 's' : ''} in &lt;3 days
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 2. Pomodoro Study Timer (Auto-logs Study Hours to Chosen Subject) */}
      <section id="pomodoro-study-timer-section" className="scroll-mt-6">
        <PomodoroStudyTimer
          subjects={academicState.subjects}
          onLogStudyHours={handleLogStudyHoursInternal}
          theme={theme}
          selectedSubjectId={selectedPomodoroSubjectId}
          onSelectSubjectId={setSelectedPomodoroSubjectId}
        />
      </section>

      {/* 3. Top Split: Subjects Study Hours Tracker & Upcoming Deadlines Countdown */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column (8 cols on XL): Subject Study Hours Matrix */}
        <section className="xl:col-span-8 bg-[#FBF9F4] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg p-5 shadow-[0_4px_20px_rgba(20,18,15,0.04)] flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E6DEC8] dark:border-[#2E2820] pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-[#1C1917] text-[#D4AF37]">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                  Subject Study Hours Tracker
                </h2>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                  Log hours dedicated to each academic discipline across the 7-day cycle
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAddSubjectOpen(true)}
              className="self-start sm:self-auto flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-md bg-[#1C1917] hover:bg-stone-800 text-[#F5F2EB] border border-amber-900/30 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Add Subject</span>
            </button>
          </div>

          {/* Add Subject Modal / Dropdown */}
          {isAddSubjectOpen && (
            <form
              onSubmit={handleCreateSubject}
              className="p-4 bg-[#F2EDE2] dark:bg-[#24201B] border border-[#CFC3B0] dark:border-[#3D352B] rounded-md flex flex-col gap-3 animate-fade-in"
            >
              <div className="flex items-center justify-between border-b border-[#D8CFBF] dark:border-[#3D352B] pb-2">
                <span className="text-xs font-serif font-bold text-stone-900 dark:text-stone-100 uppercase">
                  Add Academic Subject
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddSubjectOpen(false)}
                  className="text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-200"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-stone-600 dark:text-stone-400">
                    Subject Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Physics (Mechanics & Waves)"
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    className="text-xs font-medium px-3 py-1.5 bg-white dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-700"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-stone-600 dark:text-stone-400">
                    Weekly Goal (Hours)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="40"
                    value={newSubTarget}
                    onChange={(e) => setNewSubTarget(e.target.value)}
                    className="text-xs font-medium px-3 py-1.5 bg-white dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-stone-600 dark:text-stone-400">
                    Current Syllabus Topic
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Thermodynamics & Heat Capacity"
                    value={newSubTopic}
                    onChange={(e) => setNewSubTopic(e.target.value)}
                    className="text-xs font-medium px-3 py-1.5 bg-white dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-700"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-stone-600 dark:text-stone-400">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    {['#B88939', '#22543D', '#7A223B', '#2C4F6B', '#6B4C7A', '#9E472A'].map(
                      (c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewSubColor(c)}
                          className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                            newSubColor === c ? 'scale-110 border-black dark:border-white ring-1 ring-white' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#D8CFBF] dark:border-[#3D352B]">
                <button
                  type="button"
                  onClick={() => setIsAddSubjectOpen(false)}
                  className="px-3 py-1 text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold uppercase rounded bg-[#1C1917] text-[#D4AF37] hover:bg-stone-800 cursor-pointer shadow-sm"
                >
                  Save Subject
                </button>
              </div>
            </form>
          )}

          {/* Subjects Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-[#D8CFBF] dark:border-[#3D352B] text-[11px] font-serif font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                  <th className="py-2.5 px-3 w-[260px]">Subject & Syllabus Focus</th>
                  {DAYS_OF_WEEK.map((day) => (
                    <th
                      key={day}
                      className={`py-2 px-1 text-center w-[48px] ${
                        dayDates[day]?.isToday ? 'bg-amber-100/60 dark:bg-amber-950/40 rounded-t' : ''
                      }`}
                    >
                      <span className="block font-bold text-stone-900 dark:text-stone-100">{day}</span>
                      <span className="text-[9px] font-sans text-stone-500 dark:text-stone-400 font-normal">
                        {dayDates[day]?.label.split(' ')[1]}
                      </span>
                    </th>
                  ))}
                  <th className="py-2.5 px-3 w-[150px] text-right">Week Progress</th>
                  <th className="py-2.5 px-2 w-[40px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE6D8] dark:divide-[#2E2820]">
                {academicState.subjects.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-10 text-stone-400">
                      <BookOpen className="w-6 h-6 mx-auto mb-1 text-stone-300 dark:text-stone-600" />
                      <p className="text-xs font-medium">No subjects added yet.</p>
                      <p className="text-[11px] text-stone-400">
                        Click "Add Subject" to begin tracking Physics, Chemistry, Math, etc.
                      </p>
                    </td>
                  </tr>
                ) : (
                  academicState.subjects.map((sub) => {
                    const isEditing = editingSubjectId === sub.id;
                    const hoursList = Object.values(sub.dailyHours || {}) as number[];
                    let subLoggedTotal = 0;
                    for (const h of hoursList) {
                      subLoggedTotal += Number(h) || 0;
                    }
                    const subPercent = Math.min(
                      100,
                      Math.round((subLoggedTotal / (sub.weeklyTargetHours || 1)) * 100)
                    );
                    const isConfirmingDelete = confirmDeleteSubId === sub.id;

                    return (
                      <tr
                        key={sub.id}
                        className="group hover:bg-[#F5F0E5]/60 dark:hover:bg-[#2A241E] transition-colors"
                      >
                        {/* Subject Name Column */}
                        <td className="py-3 px-3">
                          {isEditing ? (
                            <div className="flex flex-col gap-1 pr-2">
                              <input
                                type="text"
                                value={editingSubName}
                                onChange={(e) => setEditingSubName(e.target.value)}
                                className="text-xs font-bold px-2 py-1 bg-white dark:bg-[#24201B] border border-[#D8CFBF] dark:border-[#3D352B] text-stone-900 dark:text-stone-100 rounded"
                                placeholder="Subject name"
                              />
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={editingSubTopic}
                                  onChange={(e) => setEditingSubTopic(e.target.value)}
                                  className="text-[10px] px-2 py-0.5 bg-white dark:bg-[#24201B] border border-[#D8CFBF] dark:border-[#3D352B] text-stone-900 dark:text-stone-100 rounded flex-1"
                                  placeholder="Current topic"
                                />
                                <input
                                  type="number"
                                  step="0.5"
                                  value={editingSubTarget}
                                  onChange={(e) => setEditingSubTarget(e.target.value)}
                                  className="text-[10px] px-1.5 py-0.5 w-14 bg-white dark:bg-[#24201B] border border-[#D8CFBF] dark:border-[#3D352B] text-stone-900 dark:text-stone-100 rounded"
                                  title="Weekly target hours"
                                />
                                <button
                                  type="button"
                                  onClick={() => saveEditSubject(sub)}
                                  className="p-1 bg-[#1C1917] text-white rounded hover:bg-stone-800"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: sub.color || '#B88939' }}
                                />
                                <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                                  {sub.name}
                                </span>
                              </div>
                              {sub.currentTopic && (
                                <span className="text-[10px] text-stone-500 dark:text-stone-400 font-medium ml-4 mt-0.5 truncate max-w-[220px]">
                                  {sub.currentTopic}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Daily Hour Inputs / Quick Adjust */}
                        {DAYS_OF_WEEK.map((day) => {
                          const val = Number(sub.dailyHours?.[day]) || 0;
                          return (
                            <td
                              key={day}
                              className={`py-2 px-1 text-center ${
                                dayDates[day]?.isToday ? 'bg-amber-50/50 dark:bg-amber-950/30' : ''
                              }`}
                            >
                              <div className="flex flex-col items-center gap-0.5">
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  max="24"
                                  value={val === 0 ? '' : val}
                                  placeholder="0"
                                  onChange={(e) => {
                                    const parsed = parseFloat(e.target.value) || 0;
                                    handleLogStudyHoursInternal(sub.id, day, parsed);
                                  }}
                                  className={`w-10 text-center text-xs font-bold py-1 rounded border transition-colors focus:outline-none focus:ring-1 focus:ring-amber-700 ${
                                    val > 0
                                      ? 'bg-white dark:bg-[#24201B] border-[#C4B59D] dark:border-[#3D352B] text-stone-900 dark:text-stone-100 font-serif'
                                      : 'bg-[#EDE6D8]/50 dark:bg-[#221E1A] border-transparent text-stone-400 dark:text-stone-500 hover:border-[#D8CFBF] dark:hover:border-[#3D352B]'
                                  }`}
                                />
                              </div>
                            </td>
                          );
                        })}

                        {/* Week Progress Bar */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-baseline gap-1">
                              <span className="text-xs font-serif font-bold text-stone-900 dark:text-stone-100">
                                {subLoggedTotal.toFixed(1)}h
                              </span>
                              <span className="text-[10px] text-stone-500 dark:text-stone-400">
                                / {sub.weeklyTargetHours}h
                              </span>
                            </div>
                            <div className="w-24 h-2 bg-[#E6DEC8] dark:bg-[#3D352B] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${subPercent}%`,
                                  backgroundColor: sub.color || '#B88939',
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Actions (Focus / Edit / Delete Confirmation) */}
                        <td className="py-3 px-2 text-right">
                          {isConfirmingDelete ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  handleDeleteSubjectInternal(sub.id);
                                  setConfirmDeleteSubId(null);
                                }}
                                className="px-1.5 py-0.5 bg-red-600 text-white text-[9px] font-bold rounded cursor-pointer"
                              >
                                Del
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteSubId(null)}
                                className="px-1.5 py-0.5 bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[9px] font-bold rounded cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="opacity-0 group-hover:opacity-100 flex items-center justify-end gap-1 transition-opacity">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPomodoroSubjectId(sub.id);
                                  document.getElementById('pomodoro-study-timer-section')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                title="Start Pomodoro Focus Block for this Subject"
                                className="p-1 text-stone-500 hover:text-[#B88939] rounded hover:bg-amber-100/70 dark:hover:bg-[#2A241E] cursor-pointer"
                              >
                                <Timer className="w-3 h-3 text-[#B88939] dark:text-[#E2BE7A]" />
                              </button>
                              <button
                                type="button"
                                onClick={() => startEditSubject(sub)}
                                title="Edit subject"
                                className="p-1 text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 rounded hover:bg-stone-200/60 dark:hover:bg-[#2A241E] cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteSubId(sub.id)}
                                title="Delete subject"
                                className="p-1 text-stone-500 hover:text-red-700 rounded hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right Column (4 cols on XL): Upcoming Exams & Deadlines Countdown */}
        <section className="xl:col-span-4 bg-[#FBF9F4] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg p-5 shadow-[0_4px_20px_rgba(20,18,15,0.04)] flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#E6DEC8] dark:border-[#2E2820] pb-3.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-[#1C1917] text-[#D4AF37]">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                  Exams & Deadlines
                </h2>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">
                  Live countdown to critical evaluations
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAddDeadlineOpen(true)}
              className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-[#1C1917] text-[#D4AF37] hover:bg-stone-800 transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
          </div>

          {/* Add Deadline Form Modal */}
          {isAddDeadlineOpen && (
            <form
              onSubmit={handleCreateDeadline}
              className="p-3.5 bg-[#F2EDE2] dark:bg-[#24201B] border border-[#CFC3B0] dark:border-[#3D352B] rounded-md flex flex-col gap-2.5 text-xs animate-fade-in"
            >
              <div className="flex items-center justify-between border-b border-[#D8CFBF] dark:border-[#3D352B] pb-1.5">
                <span className="font-serif font-bold text-stone-900 dark:text-stone-100 uppercase">
                  Add Exam / Assignment
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddDeadlineOpen(false)}
                  className="text-stone-500 hover:text-stone-900 dark:hover:text-stone-200"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-stone-600 dark:text-stone-400">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Physics Midterm Examination"
                  value={newDlTitle}
                  onChange={(e) => setNewDlTitle(e.target.value)}
                  className="px-2.5 py-1 bg-white dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] text-stone-900 dark:text-stone-100 rounded"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-stone-600 dark:text-stone-400">Subject</label>
                  <select
                    value={newDlSubjectId}
                    onChange={(e) => setNewDlSubjectId(e.target.value)}
                    className="px-2 py-1 bg-white dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] text-stone-900 dark:text-stone-100 rounded text-xs"
                  >
                    {academicState.subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                    <option value="general">General / Other</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-stone-600 dark:text-stone-400">Type</label>
                  <select
                    value={newDlType}
                    onChange={(e) => setNewDlType(e.target.value as DeadlineType)}
                    className="px-2 py-1 bg-white dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] text-stone-900 dark:text-stone-100 rounded text-xs"
                  >
                    <option value="exam">Exam / Midterm</option>
                    <option value="assignment">Assignment / P-Set</option>
                    <option value="project">Project / Lab Report</option>
                    <option value="quiz">Quiz / Assessment</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-stone-600 dark:text-stone-400">Due Date</label>
                  <input
                    type="date"
                    value={newDlDueDate}
                    onChange={(e) => setNewDlDueDate(e.target.value)}
                    className="px-2 py-1 bg-white dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] text-stone-900 dark:text-stone-100 rounded text-xs"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-stone-600 dark:text-stone-400">Priority</label>
                  <select
                    value={newDlPriority}
                    onChange={(e) => setNewDlPriority(e.target.value as DeadlinePriority)}
                    className="px-2 py-1 bg-white dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] text-stone-900 dark:text-stone-100 rounded text-xs"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-stone-600 dark:text-stone-400">Notes / Syllabus</label>
                <input
                  type="text"
                  placeholder="e.g. Chapters 1–6, Formula Sheet allowed"
                  value={newDlNotes}
                  onChange={(e) => setNewDlNotes(e.target.value)}
                  className="px-2.5 py-1 bg-white dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] text-stone-900 dark:text-stone-100 rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1 border-t border-[#D8CFBF] dark:border-[#3D352B]">
                <button
                  type="button"
                  onClick={() => setIsAddDeadlineOpen(false)}
                  className="px-2.5 py-1 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 font-bold uppercase rounded bg-[#1C1917] text-[#D4AF37]"
                >
                  Add Deadline
                </button>
              </div>
            </form>
          )}

          {/* Deadlines List */}
          <div className="flex flex-col gap-2.5 max-h-[460px] overflow-y-auto pr-1">
            {sortedDeadlines.length === 0 ? (
              <div className="text-center py-8 text-stone-400">
                <p className="text-xs">No upcoming exams or assignments scheduled.</p>
              </div>
            ) : (
              sortedDeadlines.map((dl) => {
                const sub = academicState.subjects.find((s) => s.id === dl.subjectId);
                const countdown = getDaysRemaining(dl.dueDate);
                const isCompleted = dl.status === 'completed';
                const isConfirmingDelete = confirmDeleteDlId === dl.id;

                return (
                  <div
                    key={dl.id}
                    className={`p-3 rounded-lg border transition-all flex flex-col gap-2 ${
                      isCompleted
                        ? 'bg-[#EDE7DB]/50 dark:bg-[#221E1A] border-[#D8CFBF] dark:border-[#3D352B] opacity-70'
                        : countdown.isUrgent
                        ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 shadow-xs'
                        : 'bg-white dark:bg-[#24201B] border-[#D8CFBF] dark:border-[#3D352B] shadow-xs hover:border-[#C4B59D]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        {/* Status Check Toggle */}
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateDeadlineInternal({
                              ...dl,
                              status: isCompleted ? 'in_progress' : 'completed',
                            })
                          }
                          className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border transition-colors cursor-pointer ${
                            isCompleted
                              ? 'bg-[#1C1917] text-[#D4AF37] border-[#1C1917]'
                              : 'bg-white dark:bg-[#1C1917] border-stone-400 dark:border-stone-600 hover:border-stone-800'
                          }`}
                        >
                          {isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>

                        <div>
                          <h3
                            className={`text-xs font-bold leading-snug ${
                              isCompleted
                                ? 'line-through text-stone-500 dark:text-stone-500'
                                : 'text-stone-900 dark:text-stone-100'
                            }`}
                          >
                            {dl.title}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {sub && (
                              <span
                                className="text-[9px] font-bold px-1.5 py-0.2 rounded text-white"
                                style={{ backgroundColor: sub.color || '#B88939' }}
                              >
                                {sub.name.split(' ')[0]}
                              </span>
                            )}
                            <span className="text-[9px] uppercase font-bold text-stone-500 dark:text-stone-400">
                              {dl.type}
                            </span>
                            <span className="text-[9px] text-stone-400">•</span>
                            <span className="text-[10px] font-serif text-stone-600 dark:text-stone-300">
                              {dl.dueDate}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Live Countdown Badge */}
                      <div className="flex flex-col items-end gap-1">
                        {!isCompleted ? (
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded tracking-wider flex items-center gap-1 ${
                              countdown.isUrgent
                                ? 'bg-amber-600 text-white font-mono animate-pulse'
                                : 'bg-[#1C1917] text-[#E2BE7A]'
                            }`}
                          >
                            <Clock className="w-2.5 h-2.5" />
                            <span>{countdown.label}</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
                            Completed
                          </span>
                        )}

                        {/* Delete confirmation */}
                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-1 mt-1">
                            <button
                              type="button"
                              onClick={() => {
                                handleDeleteDeadlineInternal(dl.id);
                                setConfirmDeleteDlId(null);
                              }}
                              className="px-1.5 py-0.2 text-[9px] bg-red-600 text-white rounded font-bold"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteDlId(null)}
                              className="px-1 py-0.2 text-[9px] text-stone-500"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteDlId(dl.id)}
                            className="text-[10px] text-stone-400 hover:text-red-700 mt-0.5 cursor-pointer"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>

                    {dl.notes && (
                      <p className="text-[10px] text-stone-600 dark:text-stone-300 font-sans italic bg-[#F8F5EE] dark:bg-[#1E1A16] p-1.5 rounded border border-[#EDE6D8] dark:border-[#2E2820]">
                        {dl.notes}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* 3. Long-Term Ambitions & Academic Goals (Persisting across all weeks) */}
      <section className="bg-[#FBF9F4] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg p-5 sm:p-6 shadow-[0_4px_20px_rgba(20,18,15,0.04)] flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E6DEC8] dark:border-[#2E2820] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-[#1C1917] text-[#D4AF37]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                  Long-Term Academic & Career Ambitions
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
                  Persistent Across Weeks
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                High-stakes milestones (National University Exams, Scholarships, Study Abroad) that ground your weekly execution
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenAICoachWithPrompt && (
              <button
                type="button"
                onClick={() =>
                  onOpenAICoachWithPrompt(
                    'Analyze how my daily study hours and tasks this week align with my long-term scholarship and university entrance goals.'
                  )
                }
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-md bg-[#F2EDE2] dark:bg-[#24201B] hover:bg-[#EAE2D2] dark:hover:bg-[#2C2620] text-stone-800 dark:text-stone-200 border border-[#CFC3B0] dark:border-[#3D352B] transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#B88939] dark:text-[#E2BE7A]" />
                <span>Coach Strategy Audit</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsAddGoalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-md bg-[#1C1917] hover:bg-stone-800 text-[#F5F2EB] border border-amber-900/30 transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>New Ambition</span>
            </button>
          </div>
        </div>

        {/* Add Long-Term Goal Form */}
        {isAddGoalOpen && (
          <form
            onSubmit={handleCreateLongTermGoal}
            className="p-4 bg-[#F2EDE2] border border-[#CFC3B0] rounded-md flex flex-col gap-3 animate-fade-in"
          >
            <div className="flex items-center justify-between border-b border-[#D8CFBF] pb-2">
              <span className="text-xs font-serif font-bold text-stone-900 uppercase">
                Define Long-Term Ambition
              </span>
              <button
                type="button"
                onClick={() => setIsAddGoalOpen(false)}
                className="text-xs text-stone-500 hover:text-stone-900"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-stone-600">
                  Ambition Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Win International STEM & Leadership Scholarship"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  className="text-xs font-medium px-3 py-1.5 bg-white border border-[#D8CFBF] rounded text-stone-900"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-stone-600">
                  Target Date
                </label>
                <input
                  type="date"
                  value={newGoalTargetDate}
                  onChange={(e) => setNewGoalTargetDate(e.target.value)}
                  className="text-xs font-medium px-3 py-1.5 bg-white border border-[#D8CFBF] rounded text-stone-900"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-stone-600">
                Why this matters to my future (Motivation Anchor)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Secures full funding and research placement at premier institution..."
                value={newGoalWhy}
                onChange={(e) => setNewGoalWhy(e.target.value)}
                className="text-xs font-medium px-3 py-1.5 bg-white border border-[#D8CFBF] rounded text-stone-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#D8CFBF]">
              <button
                type="button"
                onClick={() => setIsAddGoalOpen(false)}
                className="px-3 py-1 text-xs text-stone-600 hover:text-stone-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold uppercase rounded bg-[#1C1917] text-[#D4AF37] hover:bg-stone-800"
              >
                Save Ambition
              </button>
            </div>
          </form>
        )}

        {/* Goals Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {academicState.longTermGoals.map((goal) => {
            const completedMilestones = goal.milestones.filter((m) => m.completed).length;
            const totalMilestones = goal.milestones.length;
            const progress =
              totalMilestones > 0
                ? Math.round((completedMilestones / totalMilestones) * 100)
                : 0;
            const isConfirmingDelete = confirmDeleteGoalId === goal.id;
            const isAddingM = addingMilestoneGoalId === goal.id;

            return (
              <div
                key={goal.id}
                className="bg-white border border-[#D8CFBF] rounded-lg p-4 shadow-xs flex flex-col justify-between gap-3 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-stone-100 border border-stone-300 text-stone-800">
                      {goal.category}
                    </span>
                    {goal.targetDate && (
                      <span className="text-[10px] font-serif text-stone-500 font-medium">
                        Target: {goal.targetDate}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-serif font-bold text-stone-900 leading-snug">
                    {goal.title}
                  </h3>

                  {goal.whyItMatters && (
                    <p className="text-[11px] text-stone-600 font-sans italic bg-[#FAF7F2] p-2 rounded border border-[#EDE6D8]">
                      "{goal.whyItMatters}"
                    </p>
                  )}

                  {/* Milestones Checklist */}
                  <div className="flex flex-col gap-1.5 mt-1 pt-2 border-t border-[#EDE6D8]">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase text-stone-600">
                      <span>Key Milestones ({completedMilestones}/{totalMilestones})</span>
                      <span className="text-[#B88939]">{progress}%</span>
                    </div>

                    <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden mb-1">
                      <div
                        className="h-full bg-gradient-to-r from-[#B88939] to-[#D4AF37] rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="flex flex-col gap-1 max-h-[160px] overflow-y-auto pr-1">
                      {goal.milestones.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => handleToggleMilestoneInternal(goal.id, m.id)}
                          className="flex items-start gap-1.5 text-xs text-stone-800 cursor-pointer hover:bg-stone-50 p-1 rounded transition-colors"
                        >
                          <button
                            type="button"
                            className={`w-3.5 h-3.5 mt-0.5 rounded flex items-center justify-center border flex-shrink-0 ${
                              m.completed
                                ? 'bg-[#1C1917] text-[#D4AF37] border-[#1C1917]'
                                : 'bg-white border-stone-300'
                            }`}
                          >
                            {m.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </button>
                          <span
                            className={`text-[11px] leading-tight select-none ${
                              m.completed ? 'line-through text-stone-400' : 'text-stone-800'
                            }`}
                          >
                            {m.text}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Add Milestone Quick Inline */}
                    {isAddingM ? (
                      <div className="flex items-center gap-1 mt-1">
                        <input
                          type="text"
                          placeholder="Milestone description..."
                          value={newMilestoneText}
                          onChange={(e) => setNewMilestoneText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddMilestoneToGoal(goal.id);
                            if (e.key === 'Escape') setAddingMilestoneGoalId(null);
                          }}
                          autoFocus
                          className="text-[10px] px-2 py-1 bg-white border border-[#D8CFBF] rounded flex-1 text-stone-900"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddMilestoneToGoal(goal.id)}
                          className="p-1 bg-[#1C1917] text-white rounded"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAddingMilestoneGoalId(goal.id)}
                        className="text-[10px] font-bold text-[#B88939] hover:underline self-start mt-0.5 cursor-pointer"
                      >
                        + Add Milestone
                      </button>
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-[#EDE6D8] text-[10px]">
                  {onOpenAICoachWithPrompt && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenAICoachWithPrompt(
                          `Suggest 2 concrete weekly tasks to make progress toward my long-term ambition: "${goal.title}".`
                        )
                      }
                      className="text-stone-600 hover:text-stone-900 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-[#B88939]" />
                      <span>Plan Next Step</span>
                    </button>
                  )}

                  {isConfirmingDelete ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          handleDeleteLongTermGoalInternal(goal.id);
                          setConfirmDeleteGoalId(null);
                        }}
                        className="px-1.5 py-0.5 bg-red-600 text-white rounded font-bold cursor-pointer"
                      >
                        Confirm Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteGoalId(null)}
                        className="px-1 py-0.5 text-stone-500 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteGoalId(goal.id)}
                      className="text-stone-400 hover:text-red-700 cursor-pointer ml-auto"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
