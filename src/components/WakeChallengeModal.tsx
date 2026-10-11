import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WakeAlarmItem, WakeChallengeType } from '../types';
import {
  generateMathChallenge,
  generateMemoryChallenge,
  generatePhraseChallenge,
  generateVocabularyChallenge,
  MathChallengeData,
  MemoryChallengeData,
  PhraseChallengeData,
  VocabularyChallengeData,
} from '../utils/wakeChallenges';
import {
  startAlarmAudioLoop,
  playChallengeSuccessSound,
  playChallengeErrorSound,
  playToggleSound,
} from '../utils/audio';
import {
  Bell,
  Volume2,
  VolumeX,
  CheckCircle2,
  Clock,
  Lock,
  Unlock,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Brain,
  Calculator,
  Type,
  BookOpen,
  ArrowRight,
  Delete,
} from 'lucide-react';

interface WakeChallengeModalProps {
  alarm: WakeAlarmItem;
  isOpen: boolean;
  onDismiss: () => void;
  onSnooze: (alarm: WakeAlarmItem, minutes?: number) => void;
}

export const WakeChallengeModal: React.FC<WakeChallengeModalProps> = ({
  alarm,
  isOpen,
  onDismiss,
  onSnooze,
}) => {
  // Current time ticker for display
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  
  // Audio state
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const stopAudioRef = useRef<(() => void) | null>(null);

  // Active challenge state
  const [activeChallengeType, setActiveChallengeType] = useState<WakeChallengeType>(alarm.challengeType);
  const [isChallengeCompleted, setIsChallengeCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shakeError, setShakeError] = useState(false);

  // Specific challenge datasets
  const [mathData, setMathData] = useState<MathChallengeData | null>(null);
  const [mathInput, setMathInput] = useState('');

  const [memoryData, setMemoryData] = useState<MemoryChallengeData | null>(null);
  const [memoryPlaybackIndex, setMemoryPlaybackIndex] = useState<number | null>(null);
  const [memoryUserSteps, setMemoryUserSteps] = useState<number[]>([]);
  const [isMemoryPlayingSequence, setIsMemoryPlayingSequence] = useState(false);

  const [phraseData, setPhraseData] = useState<PhraseChallengeData | null>(null);
  const [phraseInput, setPhraseInput] = useState('');

  const [vocabData, setVocabData] = useState<VocabularyChallengeData | null>(null);
  const [selectedVocabIndex, setSelectedVocabIndex] = useState<number | null>(null);

  // Trigger error shake feedback
  const triggerError = useCallback((msg: string) => {
    playChallengeErrorSound();
    setErrorMessage(msg);
    setShakeError(true);
    setTimeout(() => {
      setShakeError(false);
    }, 600);
  }, []);

  // Initialize or re-generate challenges
  const initChallenge = useCallback((type: WakeChallengeType) => {
    setIsChallengeCompleted(false);
    setErrorMessage(null);
    setActiveChallengeType(type);

    if (type === 'math') {
      const data = generateMathChallenge(alarm.difficulty);
      setMathData(data);
      setMathInput('');
    } else if (type === 'memory') {
      const data = generateMemoryChallenge(alarm.difficulty);
      setMemoryData(data);
      setMemoryUserSteps([]);
      setIsMemoryPlayingSequence(true);
    } else if (type === 'type_phrase') {
      const data = generatePhraseChallenge(alarm.difficulty);
      setPhraseData(data);
      setPhraseInput('');
    } else if (type === 'vocabulary') {
      const data = generateVocabularyChallenge(alarm.difficulty);
      setVocabData(data);
      setSelectedVocabIndex(null);
    }
  }, [alarm.difficulty]);

  // Clock ticker
  useEffect(() => {
    if (!isOpen) return;
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Audio start & cleanup
  useEffect(() => {
    if (!isOpen) {
      if (stopAudioRef.current) {
        stopAudioRef.current();
        stopAudioRef.current = null;
      }
      return;
    }

    if (!isAudioMuted && !isChallengeCompleted) {
      stopAudioRef.current = startAlarmAudioLoop(alarm.sound, alarm.customSoundId);
    } else {
      if (stopAudioRef.current) {
        stopAudioRef.current();
        stopAudioRef.current = null;
      }
    }

    return () => {
      if (stopAudioRef.current) {
        stopAudioRef.current();
        stopAudioRef.current = null;
      }
    };
  }, [isOpen, isAudioMuted, alarm.sound, alarm.customSoundId, isChallengeCompleted]);

  // Initial challenge setup when opened
  useEffect(() => {
    if (isOpen) {
      initChallenge(alarm.challengeType);
    }
  }, [isOpen, alarm.challengeType, initChallenge]);

  // Memory sequence playback animation
  useEffect(() => {
    if (activeChallengeType !== 'memory' || !memoryData || !isMemoryPlayingSequence) return;

    let step = 0;
    setMemoryPlaybackIndex(null);

    const playInterval = setInterval(() => {
      if (step < memoryData.sequence.length) {
        setMemoryPlaybackIndex(memoryData.sequence[step]);
        playToggleSound();
        setTimeout(() => {
          setMemoryPlaybackIndex(null);
        }, 450);
        step++;
      } else {
        clearInterval(playInterval);
        setIsMemoryPlayingSequence(false);
      }
    }, 700);

    return () => clearInterval(playInterval);
  }, [activeChallengeType, memoryData, isMemoryPlayingSequence]);

  if (!isOpen) return null;

  // On successfully solving any challenge
  const handleChallengeSuccess = () => {
    playChallengeSuccessSound();
    setIsChallengeCompleted(true);
    setErrorMessage(null);
    // Mute alarm loop on success
    if (stopAudioRef.current) {
      stopAudioRef.current();
      stopAudioRef.current = null;
    }
  };

  // Math submission
  const handleMathSubmit = () => {
    if (!mathData) return;
    const parsed = parseInt(mathInput.trim(), 10);
    if (parsed === mathData.answer) {
      handleChallengeSuccess();
    } else {
      triggerError(`Incorrect answer. Try again!`);
      setMathInput('');
    }
  };

  // Memory tap
  const handleMemoryTileClick = (tileIndex: number) => {
    if (isMemoryPlayingSequence || isChallengeCompleted || !memoryData) return;
    playToggleSound();

    const nextStepIndex = memoryUserSteps.length;
    if (memoryData.sequence[nextStepIndex] === tileIndex) {
      const newSteps = [...memoryUserSteps, tileIndex];
      setMemoryUserSteps(newSteps);

      if (newSteps.length === memoryData.sequence.length) {
        handleChallengeSuccess();
      }
    } else {
      triggerError('Wrong tile! Memorize and try again.');
      setMemoryUserSteps([]);
      setIsMemoryPlayingSequence(true);
    }
  };

  // Phrase verification
  const handlePhraseSubmit = () => {
    if (!phraseData) return;
    const targetClean = phraseData.phrase.trim().toLowerCase().replace(/[.,!?;:'"’“”]/g, '');
    const userClean = phraseInput.trim().toLowerCase().replace(/[.,!?;:'"’“”]/g, '');

    if (userClean === targetClean) {
      handleChallengeSuccess();
    } else {
      triggerError('Phrase does not match yet. Check spelling and punctuate carefully.');
    }
  };

  // Vocab choice selection
  const handleVocabSelect = (idx: number) => {
    if (!vocabData || isChallengeCompleted) return;
    setSelectedVocabIndex(idx);
    if (idx === vocabData.correctIndex) {
      handleChallengeSuccess();
    } else {
      triggerError('Incorrect definition. Read closely and try another!');
    }
  };

  // Dismiss button handler
  const handleAttemptDismiss = () => {
    if (isChallengeCompleted) {
      onDismiss();
    } else {
      triggerError('Wake Challenge is locked! Complete the task to dismiss the alarm.');
    }
  };

  const MEMORY_TILE_COLORS = [
    { label: 'Gold', active: 'bg-amber-400 text-stone-950 shadow-[0_0_24px_rgba(251,191,36,0.8)] scale-105', idle: 'bg-[#2A2318] border-amber-500/40 text-amber-300 hover:border-amber-400' },
    { label: 'Emerald', active: 'bg-emerald-400 text-stone-950 shadow-[0_0_24px_rgba(52,211,153,0.8)] scale-105', idle: 'bg-[#14261C] border-emerald-500/40 text-emerald-300 hover:border-emerald-400' },
    { label: 'Ruby', active: 'bg-rose-400 text-stone-950 shadow-[0_0_24px_rgba(251,113,133,0.8)] scale-105', idle: 'bg-[#2A141A] border-rose-500/40 text-rose-300 hover:border-rose-400' },
    { label: 'Sapphire', active: 'bg-sky-400 text-stone-950 shadow-[0_0_24px_rgba(56,189,248,0.8)] scale-105', idle: 'bg-[#15232E] border-sky-500/40 text-sky-300 hover:border-sky-400' },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-[#100D0B] text-[#FDFBF7] flex flex-col justify-between overflow-y-auto p-4 sm:p-6 md:p-8 animate-fadeIn select-none">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none opacity-30 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-gradient-to-br from-amber-600/30 to-amber-900/10 blur-3xl animate-pulse" />
      </div>

      {/* Top Header: Clock, Alarm details & Sound Toggle */}
      <header className="relative z-10 w-full max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#2E2822] pb-4">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#B88939] to-[#D4AF37] text-stone-950 shadow-[0_0_20px_rgba(212,175,55,0.4)] animate-bounce">
              <Bell className="w-6 h-6 fill-current" />
            </div>
            {!isChallengeCompleted && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-[#FDFBF7]">
                {currentTimeStr || alarm.time}
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700/50">
                Alarm Active
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-serif font-bold text-stone-300">
              {alarm.label || 'Wake Up Challenge'}
            </h2>
          </div>
        </div>

        {/* Audio Mute & Sound info */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAudioMuted((prev) => !prev)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-serif font-semibold tracking-wide transition-all cursor-pointer ${
              isAudioMuted
                ? 'bg-[#2A231C] border-[#4A3D2F] text-stone-400 hover:text-stone-200'
                : 'bg-amber-950/40 border-amber-600/40 text-amber-300 shadow-sm'
            }`}
            title={isAudioMuted ? 'Unmute alarm sound' : 'Mute alarm sound while solving'}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-pulse" />}
            <span className="hidden xs:inline">{isAudioMuted ? 'Muted' : 'Ringing'}</span>
          </button>

          {/* Difficulty Badge */}
          <div className="px-2.5 py-1.5 rounded-lg bg-[#241F1A] border border-[#3D352B] text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
            {alarm.difficulty}
          </div>
        </div>
      </header>

      {/* Main Challenge Center Canvas */}
      <main className="relative z-10 w-full max-w-xl mx-auto my-auto py-6 sm:py-8 flex flex-col gap-6">
        {/* Status Callout Banner */}
        {isChallengeCompleted ? (
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/80 to-[#12261C] border border-emerald-500/50 text-emerald-200 shadow-[0_0_30px_rgba(16,185,129,0.2)] flex items-center gap-3.5 animate-fadeIn">
            <div className="p-2 rounded-lg bg-emerald-500 text-stone-950 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
                <span>Wake Challenge Complete!</span>
                <Sparkles className="w-4 h-4 text-emerald-400 fill-current" />
              </h3>
              <p className="text-xs text-emerald-300/90 font-sans mt-0.5">
                Your brain is awake and primed for the day. You can now dismiss the alarm.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-[#221C16] border border-[#3E3224] flex items-center justify-between gap-3 text-stone-300">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-amber-500/20 text-amber-400">
                <Brain className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-serif font-bold text-[#FDFBF7] block">
                  Complete Task to Dismiss
                </span>
                <span className="text-[11px] text-stone-400 font-sans">
                  Prove alertness to turn off the alarm
                </span>
              </div>
            </div>

            {/* Switch challenge switcher */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => initChallenge('math')}
                className={`p-1.5 rounded-md border text-xs cursor-pointer transition-colors ${
                  activeChallengeType === 'math'
                    ? 'bg-[#B88939] text-stone-950 border-[#D4AF37]'
                    : 'bg-[#1C1814] text-stone-400 border-[#382E23] hover:text-stone-200'
                }`}
                title="Math Challenge"
              >
                <Calculator className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => initChallenge('memory')}
                className={`p-1.5 rounded-md border text-xs cursor-pointer transition-colors ${
                  activeChallengeType === 'memory'
                    ? 'bg-[#B88939] text-stone-950 border-[#D4AF37]'
                    : 'bg-[#1C1814] text-stone-400 border-[#382E23] hover:text-stone-200'
                }`}
                title="Memory Sequence"
              >
                <Brain className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => initChallenge('type_phrase')}
                className={`p-1.5 rounded-md border text-xs cursor-pointer transition-colors ${
                  activeChallengeType === 'type_phrase'
                    ? 'bg-[#B88939] text-stone-950 border-[#D4AF37]'
                    : 'bg-[#1C1814] text-stone-400 border-[#382E23] hover:text-stone-200'
                }`}
                title="Type Phrase"
              >
                <Type className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => initChallenge('vocabulary')}
                className={`p-1.5 rounded-md border text-xs cursor-pointer transition-colors ${
                  activeChallengeType === 'vocabulary'
                    ? 'bg-[#B88939] text-stone-950 border-[#D4AF37]'
                    : 'bg-[#1C1814] text-stone-400 border-[#382E23] hover:text-stone-200'
                }`}
                title="Vocabulary Question"
              >
                <BookOpen className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Error notification banner */}
        {errorMessage && (
          <div
            className={`p-3 rounded-lg bg-rose-950/80 border border-rose-600/60 text-rose-200 text-xs font-sans text-center transition-all ${
              shakeError ? 'animate-shake' : ''
            }`}
          >
            {errorMessage}
          </div>
        )}

        {/* Challenge Interactive Body */}
        <div className="bg-[#1C1814] border border-[#352D24] rounded-2xl p-5 sm:p-7 shadow-[0_12px_40px_rgba(0,0,0,0.5)] flex flex-col gap-5">
          {/* 1. MATH CHALLENGE */}
          {activeChallengeType === 'math' && mathData && (
            <div className="flex flex-col items-center gap-5">
              <div className="text-center">
                <span className="text-[11px] font-serif font-bold uppercase tracking-wider text-amber-400/90 block">
                  Solve to Wake Up
                </span>
                <div className="text-3xl sm:text-4xl font-mono font-bold text-[#FDFBF7] tracking-wider mt-2 py-3 px-6 bg-[#25201A] border border-[#44382A] rounded-xl inline-block shadow-inner">
                  {mathData.question} = {mathInput || '?'}
                </div>
              </div>

              {/* Number pad for mobile & desktop speed */}
              {!isChallengeCompleted && (
                <div className="w-full max-w-xs grid grid-cols-3 gap-2 mt-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        playToggleSound();
                        setMathInput((prev) => (prev.length < 5 ? prev + num : prev));
                      }}
                      className="p-3 sm:p-3.5 rounded-xl bg-[#27211B] border border-[#3D3429] hover:bg-[#342C24] text-xl font-mono font-bold text-[#FDFBF7] cursor-pointer active:scale-95 transition-all shadow-xs"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      playToggleSound();
                      setMathInput('');
                    }}
                    className="p-3 sm:p-3.5 rounded-xl bg-[#27211B] border border-[#3D3429] text-xs font-serif font-bold text-stone-400 hover:text-stone-200 cursor-pointer active:scale-95"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playToggleSound();
                      setMathInput((prev) => (prev.length < 5 ? prev + '0' : prev));
                    }}
                    className="p-3 sm:p-3.5 rounded-xl bg-[#27211B] border border-[#3D3429] hover:bg-[#342C24] text-xl font-mono font-bold text-[#FDFBF7] cursor-pointer active:scale-95 transition-all shadow-xs"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playToggleSound();
                      setMathInput((prev) => prev.slice(0, -1));
                    }}
                    aria-label="Backspace"
                    className="p-3 sm:p-3.5 rounded-xl bg-[#27211B] border border-[#3D3429] flex items-center justify-center text-stone-400 hover:text-stone-200 cursor-pointer active:scale-95"
                  >
                    <Delete className="w-5 h-5" />
                  </button>
                </div>
              )}

              {!isChallengeCompleted && (
                <button
                  type="button"
                  onClick={handleMathSubmit}
                  disabled={!mathInput}
                  className={`w-full max-w-xs py-3 rounded-xl font-serif font-bold uppercase tracking-wider text-xs transition-all shadow-md cursor-pointer ${
                    mathInput
                      ? 'bg-gradient-to-r from-[#B88939] to-[#D4AF37] text-stone-950 hover:brightness-110'
                      : 'bg-[#2A231C] text-stone-600 cursor-not-allowed border border-[#382E24]'
                  }`}
                >
                  Submit Answer
                </button>
              )}
            </div>
          )}

          {/* 2. MEMORY SEQUENCE CHALLENGE */}
          {activeChallengeType === 'memory' && memoryData && (
            <div className="flex flex-col items-center gap-5">
              <div className="text-center">
                <span className="text-[11px] font-serif font-bold uppercase tracking-wider text-amber-400/90 block">
                  {isMemoryPlayingSequence
                    ? 'Watch & Memorize Sequence...'
                    : `Tap the Sequence (${memoryUserSteps.length}/${memoryData.sequence.length})`}
                </span>
                <p className="text-xs text-stone-400 font-sans mt-1">
                  {isMemoryPlayingSequence
                    ? 'Pay close attention as the tiles illuminate in order'
                    : 'Tap the pads in the exact order they flashed'}
                </p>
              </div>

              {/* 4 Interactive Memory Pads */}
              <div className="grid grid-cols-2 gap-3.5 w-full max-w-xs sm:max-w-sm">
                {MEMORY_TILE_COLORS.map((tile, idx) => {
                  const isHighlighted = memoryPlaybackIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isMemoryPlayingSequence || isChallengeCompleted}
                      onClick={() => handleMemoryTileClick(idx)}
                      className={`h-24 sm:h-28 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 font-serif font-bold text-sm tracking-wide transition-all cursor-pointer ${
                        isHighlighted ? tile.active : tile.idle
                      } active:scale-95`}
                    >
                      <span className="text-lg">{idx + 1}</span>
                      <span className="text-xs uppercase font-mono tracking-wider opacity-80">
                        {tile.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Progress step indicators */}
              <div className="flex items-center gap-2 mt-1">
                {memoryData.sequence.map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full transition-all ${
                      i < memoryUserSteps.length
                        ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                        : 'bg-[#2E271F] border border-[#4D4133]'
                    }`}
                  />
                ))}
              </div>

              {!isMemoryPlayingSequence && !isChallengeCompleted && (
                <button
                  type="button"
                  onClick={() => {
                    setMemoryUserSteps([]);
                    setIsMemoryPlayingSequence(true);
                  }}
                  className="flex items-center gap-1.5 text-xs font-serif text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Replay Sequence</span>
                </button>
              )}
            </div>
          )}

          {/* 3. TYPE DISPLAYED PHRASE CHALLENGE */}
          {activeChallengeType === 'type_phrase' && phraseData && (
            <div className="flex flex-col gap-4">
              <div className="text-center">
                <span className="text-[11px] font-serif font-bold uppercase tracking-wider text-amber-400/90 block">
                  Type the Mindful Phrase
                </span>
                <p className="text-xs text-stone-400 font-sans mt-0.5">
                  Type the text accurately to awaken your cognitive focus
                </p>
              </div>

              {/* Target phrase card */}
              <div className="p-4 rounded-xl bg-[#25201A] border border-[#44382A] text-center shadow-inner">
                <p className="text-base sm:text-lg font-serif italic text-[#FDFBF7] leading-relaxed">
                  “{phraseData.phrase}”
                </p>
                {phraseData.author && (
                  <span className="text-[11px] font-sans font-semibold text-amber-400/90 uppercase tracking-wider mt-2 block">
                    — {phraseData.author}
                  </span>
                )}
              </div>

              {!isChallengeCompleted ? (
                <div className="flex flex-col gap-3">
                  <textarea
                    rows={3}
                    value={phraseInput}
                    onChange={(e) => setPhraseInput(e.target.value)}
                    placeholder="Type the exact phrase above..."
                    autoFocus
                    className="w-full p-3.5 rounded-xl bg-[#171410] border border-[#3E3427] text-sm text-[#FDFBF7] placeholder-stone-600 focus:outline-none focus:border-amber-500 font-sans resize-none shadow-inner"
                  />

                  <button
                    type="button"
                    onClick={handlePhraseSubmit}
                    disabled={!phraseInput.trim()}
                    className={`w-full py-3 rounded-xl font-serif font-bold uppercase tracking-wider text-xs transition-all shadow-md cursor-pointer ${
                      phraseInput.trim()
                        ? 'bg-gradient-to-r from-[#B88939] to-[#D4AF37] text-stone-950 hover:brightness-110'
                        : 'bg-[#2A231C] text-stone-600 cursor-not-allowed border border-[#382E24]'
                    }`}
                  >
                    Verify Phrase
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* 4. VOCABULARY QUESTION CHALLENGE */}
          {activeChallengeType === 'vocabulary' && vocabData && (
            <div className="flex flex-col gap-4">
              <div className="text-center">
                <span className="text-[11px] font-serif font-bold uppercase tracking-wider text-amber-400/90 block">
                  Quick Vocabulary Challenge
                </span>
                <h3 className="text-2xl sm:text-3xl font-serif font-black tracking-wide text-white mt-1">
                  {vocabData.word}
                </h3>
                <p className="text-xs text-stone-400 font-sans mt-0.5">
                  Select the precise definition for this term
                </p>
              </div>

              {/* 4 Options */}
              <div className="flex flex-col gap-2.5 mt-1">
                {vocabData.options.map((option, idx) => {
                  const isSelected = selectedVocabIndex === idx;
                  const isCorrect = idx === vocabData.correctIndex;

                  let style =
                    'bg-[#25201A] border-[#3E3427] text-stone-200 hover:bg-[#2F2821] hover:border-amber-600/50';
                  if (isSelected) {
                    if (isCorrect) {
                      style = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold';
                    } else {
                      style = 'bg-rose-950/80 border-rose-600 text-rose-200';
                    }
                  } else if (isChallengeCompleted && isCorrect) {
                    style = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isChallengeCompleted}
                      onClick={() => handleVocabSelect(idx)}
                      className={`p-3.5 rounded-xl border text-left text-xs sm:text-sm font-sans transition-all cursor-pointer flex items-start gap-3 ${style}`}
                    >
                      <span className="w-5 h-5 rounded-full bg-[#1C1814] border border-[#44382A] text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1">{option}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Action Footer: Snooze & Dismiss */}
      <footer className="relative z-10 w-full max-w-2xl mx-auto border-t border-[#2E2822] pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Snooze Options */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onSnooze(alarm, 5)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#241F1A] border border-[#3E3429] text-stone-300 hover:text-white hover:bg-[#2F2820] text-xs font-serif font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-xs"
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Snooze (5 Min)</span>
          </button>
          <button
            type="button"
            onClick={() => onSnooze(alarm, 10)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-3 rounded-xl bg-[#241F1A] border border-[#3E3429] text-stone-300 hover:text-white hover:bg-[#2F2820] text-xs font-serif font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-xs"
          >
            <span>+10m</span>
          </button>
        </div>

        {/* Dismiss Button (Unlocked ONLY after challenge completed) */}
        <button
          type="button"
          onClick={handleAttemptDismiss}
          className={`w-full sm:w-auto flex-1 flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl font-serif font-bold uppercase tracking-wider text-xs sm:text-sm transition-all shadow-lg cursor-pointer ${
            isChallengeCompleted
              ? 'bg-gradient-to-r from-[#B88939] via-[#D4AF37] to-[#E2BE7A] text-stone-950 hover:brightness-110 active:scale-95 shadow-[0_0_24px_rgba(212,175,55,0.4)]'
              : 'bg-[#1C1814] text-stone-500 border border-[#382E23] hover:text-stone-400 hover:border-amber-800/40'
          }`}
        >
          {isChallengeCompleted ? (
            <>
              <Unlock className="w-4 h-4 text-stone-950" />
              <span>Challenge Complete — Dismiss Alarm</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 text-amber-500/60" />
              <span>Dismiss Alarm (Solve Challenge First)</span>
            </>
          )}
        </button>
      </footer>
    </div>
  );
};
