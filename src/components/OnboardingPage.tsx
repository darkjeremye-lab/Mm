import React, { useState } from 'react';
import { ThemeConfig, UserProfile } from '../types';
import { Compass, Target, ArrowRight, Plus, X } from 'lucide-react';

interface OnboardingPageProps {
  theme: ThemeConfig;
  initialProfile?: UserProfile;
  onComplete: (profile: UserProfile) => void;
  isEditing?: boolean;
  onCancelEdit?: () => void;
}

const FEELING_PRESETS = [
  'Focused',
  'Disciplined',
  'Healthy & Vital',
  'Calm & Grounded',
  'Energized',
  'Creative',
  'Present',
  'Confident',
  'Productive',
  'Masterful',
];

export const OnboardingPage: React.FC<OnboardingPageProps> = ({
  theme,
  initialProfile,
  onComplete,
  isEditing = false,
  onCancelEdit,
}) => {
  const [name, setName] = useState(initialProfile?.name || '');
  const [goals, setGoals] = useState<string[]>(
    initialProfile?.goals && initialProfile.goals.length > 0
      ? initialProfile.goals
      : ['', '', '']
  );
  const [selectedFeelings, setSelectedFeelings] = useState<string[]>(
    initialProfile?.desiredFeelings && initialProfile.desiredFeelings.length > 0
      ? initialProfile.desiredFeelings
      : ['Focused', 'Disciplined', 'Healthy & Vital']
  );
  const [customFeeling, setCustomFeeling] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoalChange = (index: number, val: string) => {
    const updated = [...goals];
    updated[index] = val;
    setGoals(updated);
  };

  const handleAddGoalField = () => {
    if (goals.length < 5) {
      setGoals([...goals, '']);
    }
  };

  const handleRemoveGoalField = (index: number) => {
    if (goals.length > 1) {
      setGoals(goals.filter((_, i) => i !== index));
    }
  };

  const toggleFeeling = (feeling: string) => {
    if (selectedFeelings.includes(feeling)) {
      setSelectedFeelings(selectedFeelings.filter((f) => f !== feeling));
    } else {
      setSelectedFeelings([...selectedFeelings, feeling]);
    }
  };

  const handleAddCustomFeeling = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFeeling.trim()) return;
    const trimmed = customFeeling.trim();
    if (!selectedFeelings.includes(trimmed)) {
      setSelectedFeelings([...selectedFeelings, trimmed]);
    }
    setCustomFeeling('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter your name to personalize your executive planner.');
      return;
    }

    const filteredGoals = goals.map((g) => g.trim()).filter((g) => g.length > 0);
    if (filteredGoals.length === 0) {
      setErrorMsg('Please enter at least 1 core life goal or dream.');
      return;
    }

    const newProfile: UserProfile = {
      name: name.trim(),
      goals: filteredGoals,
      desiredFeelings: selectedFeelings.length > 0 ? selectedFeelings : ['Focused', 'Disciplined'],
      onboarded: true,
      createdAt: initialProfile?.createdAt || new Date().toISOString(),
      avatar: initialProfile?.avatar,
      bio: initialProfile?.bio,
      learningGoals: initialProfile?.learningGoals,
      learningLanguages: initialProfile?.learningLanguages,
      dailyStudyMinutes: initialProfile?.dailyStudyMinutes,
    };

    onComplete(newProfile);
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-6 px-4">
      <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-xl p-6 sm:p-10 shadow-[0_12px_40px_rgba(20,18,15,0.12)]">
        {/* Header Badge & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8DFC8] dark:border-[#2E2820] pb-6 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-lg bg-[#1C1917] text-[#D4AF37] shadow-sm border border-amber-900/30">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-block text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded bg-[#1C1917] text-[#D4AF37] mb-1">
                {isEditing ? 'PROFILE & CORE INTENTIONS' : 'FIRST LAUNCH CALIBRATION'}
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                {isEditing ? 'Edit Life Compass' : 'Welcome to My Week'}
              </h1>
            </div>
          </div>
          {isEditing && onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="text-xs font-serif font-bold uppercase px-3.5 py-2 rounded border border-[#D8CFBF] dark:border-[#3D352B] bg-white dark:bg-[#24201C] text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>

        <p className="text-xs sm:text-sm font-sans text-stone-600 dark:text-stone-300 mb-6 leading-relaxed">
          Ground your weekly planning, habit streaks, and AI Coach in your actual aspirations and academic milestones.
        </p>

        {errorMsg && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200 text-xs font-sans font-semibold rounded-md">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* 1. Name */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-serif font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#1C1917] text-[#D4AF37] flex items-center justify-center text-[10px] font-mono">1</span>
              <span>What should your planner and coach call you?</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Alex, Jordan, Taylor..."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrorMsg(null);
              }}
              className="w-full text-sm font-medium px-4 py-2.5 bg-white dark:bg-[#24201C] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-1 focus:ring-[#B88939] shadow-2xs"
            />
          </div>

          {/* 2. Top 2-3 Life Goals / Dreams */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-serif font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#1C1917] text-[#D4AF37] flex items-center justify-center text-[10px] font-mono">2</span>
                <Target className="w-3.5 h-3.5 text-[#B88939]" />
                <span>Your Top 2–3 Life Goals or Dreams</span>
              </label>
              <span className="text-[10px] font-sans text-stone-500 dark:text-stone-400">
                Core Aspirations
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {goals.map((goal, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-[#2A241E] text-[#D4AF37] text-xs font-mono font-bold flex items-center justify-center shrink-0">
                    G{idx + 1}
                  </div>
                  <input
                    type="text"
                    placeholder={`e.g. ${
                      idx === 0
                        ? 'Master machine learning and build a startup'
                        : idx === 1
                        ? 'Score top marks in finals and publish research'
                        : 'Run a marathon & maintain daily vitality'
                    }`}
                    value={goal}
                    onChange={(e) => handleGoalChange(idx, e.target.value)}
                    className="flex-1 text-xs sm:text-sm font-medium px-3.5 py-2 bg-white dark:bg-[#24201C] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-1 focus:ring-[#B88939] shadow-2xs"
                  />
                  {goals.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveGoalField(idx)}
                      className="p-2 text-stone-400 hover:text-red-700 dark:hover:text-red-400 cursor-pointer"
                      title="Remove goal"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {goals.length < 5 && (
              <button
                type="button"
                onClick={handleAddGoalField}
                className="self-start text-[11px] font-serif font-bold uppercase text-[#B88939] hover:text-[#8C6826] flex items-center gap-1 mt-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add another goal</span>
              </button>
            )}
          </div>

          {/* 3. Desired Feelings */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-serif font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#1C1917] text-[#D4AF37] flex items-center justify-center text-[10px] font-mono">3</span>
                <span>What do you want to feel more of day to day?</span>
              </label>
              <span className="text-[10px] font-sans text-stone-500 dark:text-stone-400">
                Emotional Anchor
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {FEELING_PRESETS.map((feeling) => {
                const isSelected = selectedFeelings.includes(feeling);
                return (
                  <button
                    key={feeling}
                    type="button"
                    onClick={() => toggleFeeling(feeling)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1C1917] text-[#D4AF37] border border-[#B88939] shadow-xs'
                        : 'bg-white dark:bg-[#24201C] text-stone-700 dark:text-stone-300 border border-[#D8CFBF] dark:border-[#3D352B] hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    {feeling}
                  </button>
                );
              })}
            </div>

            {/* Custom Feeling Input */}
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                placeholder="Or add a custom feeling state..."
                value={customFeeling}
                onChange={(e) => setCustomFeeling(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomFeeling(e);
                  }
                }}
                className="flex-1 text-xs font-medium px-3.5 py-2 bg-white dark:bg-[#24201C] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomFeeling}
                className="px-3 py-2 bg-[#1C1917] text-[#D4AF37] rounded-lg text-xs font-serif font-bold uppercase cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-[#E8DFC8] dark:border-[#2E2820] flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-[#B88939] via-[#D4AF37] to-[#8C6826] text-[#1C1917] font-serif font-bold text-sm uppercase tracking-wider rounded-lg shadow-md hover:brightness-105 active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <span>{isEditing ? 'Save Life Compass' : 'Enter My Week'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
