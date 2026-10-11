import React, { useState, useRef, useEffect } from 'react';
import { DayOfWeek, DAYS_OF_WEEK, WakeAlarmDifficulty, WakeAlarmItem, WakeAlarmSound, WakeChallengeType } from '../types';
import { playAlarmTone, stopAlarmAudio } from '../utils/audio';
import { saveCustomAudio, deleteCustomAudio, getCustomAudio } from '../utils/customAudioStorage';
import { formatTime12h } from '../utils/notificationService';
import {
  X,
  Bell,
  Volume2,
  Brain,
  Calculator,
  Type,
  BookOpen,
  Check,
  Music,
  Upload,
  Trash2,
  RefreshCw,
  AlertCircle,
  Square,
  Loader2,
} from 'lucide-react';

interface WakeAlarmEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (alarm: WakeAlarmItem) => void;
  initialAlarm?: WakeAlarmItem | null;
}

const SOUND_OPTIONS: { id: WakeAlarmSound; label: string; desc: string }[] = [
  { id: 'gentle_chime', label: 'Gentle Chime', desc: 'Soft progressive harmonic bells' },
  { id: 'luxury_chords', label: 'Luxury Chords', desc: 'Warm resonant golden chords' },
  { id: 'energetic_pulse', label: 'Energetic Pulse', desc: 'Crisp rhythmic wake pulses' },
  { id: 'classic_bell', label: 'Classic Bell', desc: 'Dual-frequency bell ring' },
  { id: 'zen_gong', label: 'Zen Gong', desc: 'Deep warm resonant gong' },
  { id: 'wake_up_motivation', label: 'Wake Up — Motivation', desc: 'Powerful morning wake-up motivation audio' },
  { id: 'custom', label: 'Custom Sound', desc: 'Choose an audio file from your Android device' },
];

const CHALLENGE_OPTIONS: { id: WakeChallengeType; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'math', label: 'Math Problem', desc: 'Arithmetic calculation (addition, multiplication)', icon: Calculator },
  { id: 'memory', label: 'Memory Sequence', desc: 'Remember & repeat flashing colored tile sequence', icon: Brain },
  { id: 'type_phrase', label: 'Type Phrase', desc: 'Type an energizing motivational quote accurately', icon: Type },
  { id: 'vocabulary', label: 'Quick Vocabulary', desc: 'Choose the correct definition for an academic word', icon: BookOpen },
];

const DIFFICULTY_OPTIONS: { id: WakeAlarmDifficulty; label: string; desc: string }[] = [
  { id: 'easy', label: 'Easy', desc: 'Gentle start' },
  { id: 'medium', label: 'Medium', desc: 'Active recall' },
  { id: 'hard', label: 'Hard', desc: 'Maximum alertness' },
];

export const WakeAlarmEditorModal: React.FC<WakeAlarmEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialAlarm,
}) => {
  const [time, setTime] = useState<string>(initialAlarm ? initialAlarm.time : '07:00');
  const [label, setLabel] = useState<string>(initialAlarm ? initialAlarm.label : 'Morning Wake Up');
  const [repeatDays, setRepeatDays] = useState<DayOfWeek[]>(
    initialAlarm ? initialAlarm.repeatDays : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  );
  const [sound, setSound] = useState<WakeAlarmSound>(initialAlarm ? initialAlarm.sound : 'gentle_chime');
  const [challengeType, setChallengeType] = useState<WakeChallengeType>(
    initialAlarm ? initialAlarm.challengeType : 'math'
  );
  const [difficulty, setDifficulty] = useState<WakeAlarmDifficulty>(
    initialAlarm ? initialAlarm.difficulty : 'easy'
  );
  const [enabled, setEnabled] = useState<boolean>(initialAlarm ? initialAlarm.enabled : true);

  // Custom Audio State
  const [customSoundId, setCustomSoundId] = useState<string | undefined>(initialAlarm?.customSoundId);
  const [customSoundName, setCustomSoundName] = useState<string | undefined>(initialAlarm?.customSoundName);
  const [pendingAudioData, setPendingAudioData] = useState<ArrayBuffer | undefined>(undefined);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Pre-load custom audio into memory if editing an existing custom alarm
  useEffect(() => {
    if (initialAlarm?.sound === 'custom' && initialAlarm.customSoundId) {
      getCustomAudio(initialAlarm.customSoundId).then((data) => {
        if (data) setPendingAudioData(data);
      });
    }
  }, [initialAlarm]);

  // Clean up any preview audio when unmounting or closing
  useEffect(() => {
    return () => {
      stopAlarmAudio();
    };
  }, []);

  if (!isOpen) return null;

  const handleToggleDay = (day: DayOfWeek) => {
    if (repeatDays.includes(day)) {
      setRepeatDays(repeatDays.filter((d) => d !== day));
    } else {
      setRepeatDays([...repeatDays, day]);
    }
  };

  const handleSelectAllDays = () => {
    setRepeatDays([...DAYS_OF_WEEK]);
  };

  const handleSelectWeekdays = () => {
    setRepeatDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  };

  const handleSelectWeekends = () => {
    setRepeatDays(['Sat', 'Sun']);
  };

  const handleTestSound = (soundId: WakeAlarmSound) => {
    if (isPlayingPreview) {
      stopAlarmAudio();
      setIsPlayingPreview(false);
      return;
    }

    if (soundId === 'custom') {
      if (!customSoundId && !pendingAudioData) {
        fileInputRef.current?.click();
        return;
      }
      playAlarmTone('custom', customSoundId, pendingAudioData);
    } else {
      playAlarmTone(soundId);
    }

    setIsPlayingPreview(true);
    setTimeout(() => {
      setIsPlayingPreview(false);
    }, 4500);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so re-selecting same file works
    e.target.value = '';

    if (file.size > 25 * 1024 * 1024) {
      setAudioError('Selected audio file is too large (max 25MB).');
      return;
    }

    setIsLoadingAudio(true);
    setAudioError(null);

    try {
      const buffer = await file.arrayBuffer();

      // Test decoding before committing
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        const testCtx = new AudioCtxClass();
        try {
          await testCtx.decodeAudioData(buffer.slice(0));
          testCtx.close();
        } catch {
          testCtx.close();
          setAudioError('Unsupported or unreadable audio format. Please choose an MP3, WAV, or M4A file.');
          setIsLoadingAudio(false);
          return;
        }
      }

      const newSoundId = `custom-audio-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      await saveCustomAudio(newSoundId, file.name, file.type, buffer);

      setCustomSoundId(newSoundId);
      setCustomSoundName(file.name);
      setPendingAudioData(buffer);
      setSound('custom');
      setIsLoadingAudio(false);

      // Play quick confirmation preview
      playAlarmTone('custom', newSoundId, buffer);
      setIsPlayingPreview(true);
      setTimeout(() => setIsPlayingPreview(false), 3000);
    } catch (err) {
      console.error('Audio load error:', err);
      setAudioError('Failed to load audio from device. Please try another file.');
      setIsLoadingAudio(false);
    }
  };

  const handleRemoveCustomSound = async (e: React.MouseEvent) => {
    e.stopPropagation();
    stopAlarmAudio();
    setIsPlayingPreview(false);
    if (customSoundId) {
      await deleteCustomAudio(customSoundId);
    }
    setCustomSoundId(undefined);
    setCustomSoundName(undefined);
    setPendingAudioData(undefined);
    setSound('gentle_chime');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    stopAlarmAudio();
    const finalAlarm: WakeAlarmItem = {
      id: initialAlarm ? initialAlarm.id : `alarm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      time: time || '07:00',
      label: label.trim() || 'Wake Challenge Alarm',
      repeatDays,
      sound,
      customSoundId: sound === 'custom' ? customSoundId : undefined,
      customSoundName: sound === 'custom' ? customSoundName : undefined,
      challengeType,
      difficulty,
      enabled,
      createdAt: initialAlarm ? initialAlarm.createdAt : Date.now(),
    };
    onSave(finalAlarm);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-lg bg-[#FDFBF7] dark:bg-[#1C1814] border border-[#D8CFBF] dark:border-[#3D3429] rounded-2xl p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)] flex flex-col gap-4 text-stone-900 dark:text-stone-100 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8DFC8] dark:border-[#2E271F] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#1C1917] dark:bg-[#25201A] text-[#D4AF37] border border-[#D4AF37]/30 shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900 dark:text-[#FDFBF7] tracking-tight">
                {initialAlarm ? 'Edit Wake Challenge Alarm' : 'New Wake Challenge Alarm'}
              </h3>
              <p className="text-xs font-sans text-stone-500 dark:text-stone-400">
                Configure your wake time, challenge type, and sounds
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-lg border border-[#D8CFBF] dark:border-[#3D3429] bg-white dark:bg-[#25201A] text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer shadow-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto max-h-[75vh] pr-1">
          {/* Time Picker & 12h display */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3.5 rounded-xl bg-white dark:bg-[#241F1A] border border-[#D8CFBF] dark:border-[#382E23]">
            <div className="flex-1">
              <label className="text-[11px] font-serif font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 block mb-1">
                Alarm Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full text-2xl font-mono font-bold py-1 px-2.5 rounded-lg bg-stone-50 dark:bg-[#1A1612] border border-[#D8CFBF] dark:border-[#45392B] text-stone-900 dark:text-[#FDFBF7] focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
            <div className="flex flex-col items-center sm:items-end justify-center px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40">
              <span className="text-[10px] font-mono uppercase text-amber-800 dark:text-amber-400 font-bold">
                12-Hour Preview
              </span>
              <span className="text-lg font-mono font-bold text-amber-900 dark:text-amber-200">
                {formatTime12h(time)}
              </span>
            </div>
          </div>

          {/* Alarm Label */}
          <div>
            <label className="text-[11px] font-serif font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 block mb-1.5">
              Alarm Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Morning Rise, Deep Study, Fitness"
              maxLength={40}
              className="w-full px-3.5 py-2 rounded-lg bg-white dark:bg-[#241F1A] border border-[#D8CFBF] dark:border-[#382E23] text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          {/* Repeat Days */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-serif font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                Repeat Days
              </label>
              <div className="flex items-center gap-1.5 text-[10px] font-serif font-semibold">
                <button
                  type="button"
                  onClick={handleSelectAllDays}
                  className="text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  All
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={handleSelectWeekdays}
                  className="text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  Weekdays
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={handleSelectWeekends}
                  className="text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  Weekends
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {DAYS_OF_WEEK.map((d) => {
                const isSelected = repeatDays.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleToggleDay(d)}
                    className={`py-2 rounded-lg text-xs font-serif font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1C1917] dark:bg-[#D4AF37] text-[#D4AF37] dark:text-[#1C1917] shadow-xs'
                        : 'bg-white dark:bg-[#241F1A] border border-[#D8CFBF] dark:border-[#382E23] text-stone-500 dark:text-stone-400 hover:border-amber-500'
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1">
              {repeatDays.length === 0
                ? 'Plays once on the next occurrence'
                : repeatDays.length === 7
                ? 'Repeats everyday'
                : `Repeats on ${repeatDays.join(', ')}`}
            </p>
          </div>

          {/* Wake Challenge Selector */}
          <div>
            <label className="text-[11px] font-serif font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 block mb-1.5">
              Wake Challenge Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CHALLENGE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = challengeType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setChallengeType(opt.id)}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-600/60 dark:border-amber-500 text-stone-900 dark:text-[#FDFBF7] shadow-xs'
                        : 'bg-white dark:bg-[#241F1A] border-[#D8CFBF] dark:border-[#382E23] text-stone-600 dark:text-stone-300 hover:border-amber-400'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isSelected
                          ? 'bg-[#1C1917] text-[#D4AF37]'
                          : 'bg-stone-100 dark:bg-[#1C1814] text-stone-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-serif font-bold text-stone-900 dark:text-[#FDFBF7]">
                        {opt.label}
                      </div>
                      <div className="text-[10px] font-sans text-stone-500 dark:text-stone-400 leading-tight mt-0.5 line-clamp-2">
                        {opt.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty Level */}
          <div>
            <label className="text-[11px] font-serif font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 block mb-1.5">
              Challenge Difficulty
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTY_OPTIONS.map((diff) => {
                const isSelected = difficulty === diff.id;
                return (
                  <button
                    key={diff.id}
                    type="button"
                    onClick={() => setDifficulty(diff.id)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1C1917] dark:bg-[#2E261E] border-amber-500 text-[#D4AF37] shadow-xs'
                        : 'bg-white dark:bg-[#241F1A] border-[#D8CFBF] dark:border-[#382E23] text-stone-600 dark:text-stone-300 hover:border-amber-400'
                    }`}
                  >
                    <div className="text-xs font-serif font-bold">{diff.label}</div>
                    <div className="text-[9px] text-stone-400 mt-0.5">{diff.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Alarm Sound */}
          <div>
            <label className="text-[11px] font-serif font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 block mb-1.5">
              Alarm Sound & Tone
            </label>
            <div className="flex flex-col gap-1.5">
              {/* Hidden file input for Android / OS audio file picking */}
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {SOUND_OPTIONS.map((snd) => {
                const isSelected = sound === snd.id;

                if (snd.id === 'custom') {
                  return (
                    <div
                      key={snd.id}
                      onClick={() => setSound('custom')}
                      className={`p-3 rounded-xl border flex flex-col gap-2.5 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-amber-50 dark:bg-[#29221B] border-amber-600/60 dark:border-amber-500/80 shadow-2xs'
                          : 'bg-white dark:bg-[#241F1A] border-[#D8CFBF] dark:border-[#382E23] hover:border-amber-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'border-amber-500 bg-amber-500 text-stone-950'
                                : 'border-stone-400 dark:border-stone-600'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-serif font-bold text-stone-900 dark:text-[#FDFBF7]">
                                {snd.label}
                              </span>
                              <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                                MP3 / WAV / M4A
                              </span>
                            </div>
                            <span className="text-[10px] text-stone-500 dark:text-stone-400 block font-sans">
                              {customSoundName ? `Current file: ${customSoundName}` : snd.desc}
                            </span>
                          </div>
                        </div>

                        {/* Quick preview/test button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTestSound('custom');
                          }}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-serif font-bold border transition-colors cursor-pointer ${
                            isPlayingPreview && sound === 'custom'
                              ? 'bg-amber-500 text-stone-950 border-amber-600'
                              : 'bg-stone-100 dark:bg-[#1A1612] hover:bg-stone-200 dark:hover:bg-stone-800 text-amber-700 dark:text-amber-400 border-[#D8CFBF] dark:border-[#3E3429]'
                          }`}
                          title={isPlayingPreview ? 'Stop preview' : 'Preview this custom sound'}
                        >
                          {isPlayingPreview && sound === 'custom' ? (
                            <>
                              <Square className="w-3 h-3 fill-current" />
                              <span>Stop</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3 h-3" />
                              <span>Preview</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Custom Audio Management Subpanel */}
                      {isSelected && (
                        <div
                          className="mt-1 pt-2.5 border-t border-amber-200/60 dark:border-amber-900/40 flex flex-col gap-2 cursor-default"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {isLoadingAudio && (
                            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-100/50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs">
                              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                              <span>Validating and caching audio file locally...</span>
                            </div>
                          )}

                          {audioError && (
                            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-xs">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span>{audioError}</span>
                            </div>
                          )}

                          {customSoundName ? (
                            <div className="p-2.5 rounded-lg bg-stone-100 dark:bg-[#171310] border border-[#D8CFBF] dark:border-[#3A3025] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="p-2 rounded-md bg-amber-500/20 text-amber-500 shrink-0">
                                  <Music className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-serif font-bold text-stone-900 dark:text-stone-100 truncate">
                                    {customSoundName}
                                  </div>
                                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                    <span>Saved locally for offline alarms</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-stone-200 dark:bg-[#25201A] hover:bg-stone-300 dark:hover:bg-[#302820] text-stone-700 dark:text-stone-200 text-[11px] font-serif font-semibold border border-stone-300 dark:border-stone-700 cursor-pointer"
                                  title="Pick another audio file from device"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  <span>Replace</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={handleRemoveCustomSound}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-[11px] font-serif font-semibold border border-rose-200 dark:border-rose-900/60 cursor-pointer"
                                  title="Remove custom sound and use default chime"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Remove</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full py-2.5 px-3 rounded-lg border-2 border-dashed border-amber-600/50 dark:border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-serif font-bold text-amber-900 dark:text-amber-200 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                            >
                              <Upload className="w-4 h-4 stroke-[2.5]" />
                              <span>Choose Audio File from Device</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }

                // Built-in Sound Row
                return (
                  <div
                    key={snd.id}
                    onClick={() => setSound(snd.id)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-50 dark:bg-[#29221B] border-amber-600/60 dark:border-amber-500/80 shadow-2xs'
                        : 'bg-white dark:bg-[#241F1A] border-[#D8CFBF] dark:border-[#382E23] hover:border-amber-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500 text-stone-950'
                            : 'border-stone-400 dark:border-stone-600'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <div>
                        <span className="text-xs font-serif font-bold text-stone-900 dark:text-[#FDFBF7]">
                          {snd.label}
                        </span>
                        <span className="text-[10px] text-stone-500 dark:text-stone-400 block font-sans">
                          {snd.desc}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTestSound(snd.id);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-stone-100 dark:bg-[#1A1612] hover:bg-stone-200 dark:hover:bg-stone-800 text-[10px] font-serif font-bold text-amber-700 dark:text-amber-400 border border-[#D8CFBF] dark:border-[#3E3429] cursor-pointer"
                      title="Preview this sound"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>Preview</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Enabled Switch */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#241F1A] border border-[#D8CFBF] dark:border-[#382E23]">
            <div>
              <span className="text-xs font-serif font-bold text-stone-900 dark:text-[#FDFBF7] block">
                Alarm Status
              </span>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 font-sans">
                {enabled ? 'Active and scheduled to ring' : 'Temporarily muted'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={`px-3 py-1.5 rounded-lg text-xs font-serif font-bold uppercase transition-all cursor-pointer ${
                enabled
                  ? 'bg-[#1C1917] dark:bg-[#D4AF37] text-[#D4AF37] dark:text-[#1C1917]'
                  : 'bg-stone-200 dark:bg-stone-800 text-stone-500'
              }`}
            >
              {enabled ? 'Active' : 'Disabled'}
            </button>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E8DFC8] dark:border-[#2E271F]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#D8CFBF] dark:border-[#382E23] text-xs font-serif font-bold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#B88939] via-[#D4AF37] to-[#8C6826] text-stone-950 font-serif font-bold text-xs uppercase tracking-wider shadow-md hover:brightness-105 active:scale-95 cursor-pointer"
            >
              {initialAlarm ? 'Save Changes' : 'Create Wake Alarm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
