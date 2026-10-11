import React, { useState, useEffect, useRef } from 'react';
import { UserAvatar } from './UserAvatar';
import {
  AcademicState,
  AICoachMessage,
  DayOfWeek,
  DAYS_OF_WEEK,
  HabitItem,
  OffDaysMap,
  TaskItem,
  ThemeConfig,
  UserProfile,
  WeeklyNotes,
} from '../types';
import {
  Bot,
  Send,
  Sparkles,
  CheckCircle2,
  Trash2,
  RefreshCw,
  TrendingUp,
  Flame,
  GraduationCap,
  Moon,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Square,
} from 'lucide-react';
import { getCurrentDayOfWeek } from '../utils/notificationService';
import {
  speakText,
  stopSpeaking,
  createSpeechRecognizer,
} from '../utils/speechService';

interface AICoachPageProps {
  userProfile: UserProfile;
  tasksByDay: Record<DayOfWeek, TaskItem[]>;
  habits: HabitItem[];
  notes: WeeklyNotes;
  startOfWeek: string;
  theme: ThemeConfig;
  dayDates: Record<DayOfWeek, { label: string; fullDate: string; isToday: boolean }>;
  offDays?: OffDaysMap;
  academicContext?: AcademicState;
  onAddTask: (day: DayOfWeek, text: string) => void;
  onAddHabit: (name: string) => void;
}

const STORAGE_CHAT_KEY = 'mw_ai_coach_messages_v2';

export const AICoachPage: React.FC<AICoachPageProps> = ({
  userProfile,
  tasksByDay,
  habits,
  notes,
  startOfWeek,
  theme,
  dayDates,
  offDays = {},
  academicContext,
  onAddTask,
  onAddHabit,
}) => {
  const currentDay = getCurrentDayOfWeek();
  const currentDateStr = dayDates[currentDay]?.fullDate || new Date().toLocaleDateString();

  // Tasks statistics
  const taskLists = Object.values(tasksByDay) as TaskItem[][];
  const totalTasks = taskLists.reduce((acc: number, list: TaskItem[]) => acc + list.length, 0);
  const completedTasks = taskLists.reduce(
    (acc: number, list: TaskItem[]) => acc + list.filter((t) => t.completed).length,
    0
  );
  const overallRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Habits statistics
  const totalHabitSlots = habits.length * 7;
  const completedHabits = habits.reduce(
    (acc, h) => acc + Object.values(h.daysCompleted).filter(Boolean).length,
    0
  );

  // Chat messages state
  const [messages, setMessages] = useState<AICoachMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CHAT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    // Default initial grounded greeting
    const primaryGoal = userProfile.goals[0] || 'your core aspirations';
    return [
      {
        id: 'initial-greeting',
        sender: 'assistant',
        text: `Greetings ${userProfile.name || 'friend'}. I am your dedicated AI Coach and Academic Advisor, grounded in your vision: **${primaryGoal}** and your desire to feel **${userProfile.desiredFeelings.join(', ')}**.\n\nI have full visibility into your **${totalTasks} weekly tasks** (${completedTasks} completed), **${habits.length} habits**, plus your school subjects, exams, and scholarship timeline.\n\nHow can I help you sharpen your focus or optimize your schedule today?`,
        timestamp: Date.now(),
      },
    ];
  });

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice Response & Speech Input States
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('mw_coach_voice_auto') !== 'false';
    } catch {
      return true;
    }
  });
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const speechRecognizerRef = useRef<{ start: () => void; stop: () => void; isSupported: boolean } | null>(null);

  // Persist voice setting
  useEffect(() => {
    try {
      localStorage.setItem('mw_coach_voice_auto', String(voiceEnabled));
    } catch (e) {
      console.error(e);
    }
  }, [voiceEnabled]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      speechRecognizerRef.current?.stop();
    };
  }, []);

  const handleToggleSpeak = (msgId: string, text: string) => {
    if (currentlySpeakingId === msgId) {
      stopSpeaking();
      setCurrentlySpeakingId(null);
    } else {
      stopSpeaking();
      setCurrentlySpeakingId(msgId);
      speakText(text, {
        voice: 'Kore',
        langCode: 'en-US',
        onStart: () => setCurrentlySpeakingId(msgId),
        onEnd: () => setCurrentlySpeakingId(null),
        onError: () => setCurrentlySpeakingId(null),
      });
    }
  };

  const handleToggleSpeechInput = () => {
    if (isListening) {
      speechRecognizerRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognizer = createSpeechRecognizer('en-US', {
      onResult: (transcript) => {
        setInputPrompt(transcript);
      },
      onError: (err) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    if (!recognizer.isSupported) {
      alert('Speech recognition is not supported in this browser. You can type your question directly.');
      return;
    }

    speechRecognizerRef.current = recognizer;
    recognizer.start();
    setIsListening(true);
  };

  // Save chat to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(messages));
    } catch (e) {
      console.error(e);
    }
  }, [messages]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Build current week context payload for Gemini
  const buildWeekContextPayload = () => {
    const daysSummary = DAYS_OF_WEEK.map((d) => {
      const dateISO = dayDates[d]?.fullDate;
      const isOff = !!offDays[dateISO]?.isOff;
      const offReason = offDays[dateISO]?.reason || 'rest';
      const list = tasksByDay[d] || [];
      const done = list.filter((t) => t.completed).map((t) => `[x] ${t.text}`);
      const pending = list.filter((t) => !t.completed).map((t) => `[ ] ${t.text}`);
      if (isOff) {
        return `${d} (${dayDates[d]?.label || d}): [QUIET MODE / REST DAY - REASON: ${offReason.toUpperCase()}] - Tasks & habits on this day are exempt from misses and streaks.`;
      }
      return `${d} (${dayDates[d]?.label || d}): ${list.length} tasks (${done.length} done). Pending: ${
        pending.length > 0 ? pending.join(', ') : 'None'
      }`;
    }).join('\n');

    const offDaysList = Object.entries(offDays || {})
      .filter(([_, cfg]) => Boolean((cfg as any)?.isOff))
      .map(([date, cfg]) => `${date} (${(cfg as any)?.reason || 'rest'})`);

    const habitsSummary =
      habits.length > 0
        ? habits
            .map((h) => {
              const checkedDays = Object.entries(h.daysCompleted)
                .filter(([_, v]) => v)
                .map(([day]) => day);
              const count = checkedDays.length;
              return `- Habit "${h.name}": ${count}/7 days completed (${checkedDays.join(', ') || 'none yet'})`;
            })
            .join('\n')
        : 'No habits currently added';

    return {
      startOfWeek,
      currentDay,
      currentDate: currentDateStr,
      focus: notes.focus,
      reward: notes.reward,
      affirmation: notes.affirmation,
      totalTasksCount: totalTasks,
      completedTasksCount: completedTasks,
      overallCompletionRate: overallRate,
      offDaysSummary: offDaysList.length > 0 ? offDaysList.join(', ') : 'None',
      habitsCount: habits.length,
      daysSummary,
      habitsSummary,
    };
  };

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || inputPrompt).trim();
    if (!prompt || isLoading) return;

    const userMsg: AICoachMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: prompt,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const payload = {
        message: prompt,
        history: messages.slice(-6),
        userProfile,
        currentWeekContext: buildWeekContextPayload(),
        academicContext,
      };

      const res = await fetch('/api/ai-coach/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const replyText = data.reply || "I analyzed your planner and academic schedule. What else would you like to plan?";

      const assistantMsg: AICoachMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (voiceEnabled) {
        handleToggleSpeak(assistantMsg.id, assistantMsg.text);
      }
    } catch (err: any) {
      console.error('Error contacting coach:', err);
      // Helpful fallback grounded message
      const fallbackMsg: AICoachMessage = {
        id: `assistant-fallback-${Date.now()}`,
        sender: 'assistant',
        text: `I've reviewed your current weekly goals for **${userProfile.goals[0] || 'excellence'}** and your ${completedTasks}/${totalTasks} completed tasks.\n\n💡 **Executive Coaching Recommendation for ${currentDay}**:\nDedicate a protected 45-minute deep work block to your most critical deliverable or exam topic before tackling reactive items. Consistency compounds into mastery.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      if (voiceEnabled) {
        handleToggleSpeak(fallbackMsg.id, fallbackMsg.text);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear your AI Coach chat history?')) {
      const initial: AICoachMessage = {
        id: 'initial-greeting-reset',
        sender: 'assistant',
        text: `Chat history reset. I am ready to advise you, ${userProfile.name || 'Planner'}. Grounded in: **${userProfile.goals.join(', ')}**.\n\nWhat would you like to focus on right now?`,
        timestamp: Date.now(),
      };
      setMessages([initial]);
      try {
        localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify([initial]));
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-5">
      {/* Top Banner & Context Summary */}
      <div className="bg-[#FDFBF7] border border-[#D8CFBF] rounded-lg p-4 sm:p-5 shadow-[0_4px_20px_rgba(20,18,15,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-lg bg-[#1C1917] text-[#D4AF37] shadow-xs border border-amber-900/30">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg sm:text-xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                AI Coach & Academic Strategist
              </h1>
              <span className="text-[10px] font-sans font-bold uppercase bg-[#1C1917] text-[#D4AF37] px-2 py-0.5 rounded border border-amber-900/30">
                Gemini Intelligence
              </span>
            </div>
            <p className="text-xs font-sans text-stone-500 dark:text-stone-400 font-medium mt-0.5">
              Grounded in: {userProfile.goals.slice(0, 2).join(' • ') || 'Personal Mastery'}
            </p>
          </div>
        </div>

        {/* Live Context Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-sans font-semibold text-stone-700 dark:text-stone-300">
          <div className="px-3 py-1 bg-white dark:bg-[#24201B] border border-[#D8CFBF] dark:border-[#3D352B] rounded-md flex items-center gap-1.5 shadow-xs">
            <TrendingUp className="w-3.5 h-3.5 text-[#B88939] dark:text-[#E2BE7A]" />
            <span>
              Tasks: {completedTasks}/{totalTasks} ({overallRate}%)
            </span>
          </div>

          <div className="px-3 py-1 bg-white dark:bg-[#24201B] border border-[#D8CFBF] dark:border-[#3D352B] rounded-md flex items-center gap-1.5 shadow-xs">
            <Flame className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>
              Habits: {completedHabits}/{totalHabitSlots}
            </span>
          </div>

          {/* Voice Response Auto Toggle */}
          <button
            type="button"
            onClick={() => {
              if (voiceEnabled) {
                stopSpeaking();
                setCurrentlySpeakingId(null);
              }
              setVoiceEnabled((prev) => !prev);
            }}
            className={`px-3 py-1 rounded-md flex items-center gap-1.5 text-xs font-serif font-bold transition-all cursor-pointer shadow-xs ${
              voiceEnabled
                ? 'bg-[#1C1917] text-[#D4AF37] border border-amber-900/40'
                : 'bg-white dark:bg-[#24201B] text-stone-500 dark:text-stone-400 border border-[#D8CFBF] dark:border-[#3D352B] hover:text-stone-800 dark:hover:text-stone-200'
            }`}
            title={voiceEnabled ? 'Voice responses active (click to mute)' : 'Voice responses muted (click to enable)'}
          >
            {voiceEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-[#D4AF37]" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
            <span>{voiceEnabled ? 'Voice On' : 'Voice Off'}</span>
          </button>

          <button
            type="button"
            onClick={handleClearHistory}
            title="Clear Chat History"
            className="p-1.5 bg-white dark:bg-[#24201B] hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700 dark:hover:text-red-400 border border-[#D8CFBF] dark:border-[#3D352B] text-stone-400 rounded-md cursor-pointer transition-colors shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Action feedback toast */}
      {actionFeedback && (
        <div className="bg-[#1C1917] text-[#D4AF37] px-4 py-2 rounded-md border border-amber-900/40 text-xs font-bold flex items-center gap-2 shadow-md animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Main Chat Container */}
      <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg p-4 sm:p-6 shadow-[0_4px_24px_rgba(20,18,15,0.06)] flex flex-col min-h-[520px] max-h-[680px]">
        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-[#1C1917] text-[#D4AF37] border border-[#B88939]/40 flex items-center justify-center shrink-0 font-serif font-bold text-xs shadow-xs">
                    AI
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] p-4 rounded-lg text-xs sm:text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-[#1C1917] text-[#FDFBF7] border border-[#2E2822]'
                      : 'bg-white dark:bg-[#24201B] text-stone-900 dark:text-stone-100 border border-[#E0D7C9] dark:border-[#3D352B]'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans">{msg.text}</div>

                  <div
                    className={`text-[10px] font-mono mt-2 pt-1 border-t flex items-center justify-between gap-2 ${
                      isUser ? 'border-stone-700 text-stone-400' : 'border-stone-100 dark:border-[#332B20] text-stone-400 dark:text-stone-500'
                    }`}
                  >
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => handleToggleSpeak(msg.id, msg.text)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-sans font-bold transition-all cursor-pointer ${
                          currentlySpeakingId === msg.id
                            ? 'bg-[#1C1917] text-[#D4AF37] border border-amber-900/40 animate-pulse'
                            : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-[#2E2822]'
                        }`}
                        title={currentlySpeakingId === msg.id ? 'Stop audio' : 'Listen to voice response'}
                      >
                        {currentlySpeakingId === msg.id ? (
                          <>
                            <Square className="w-2.5 h-2.5 fill-current" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-2.5 h-2.5" />
                            <span>Listen</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {isUser && (
                  <UserAvatar
                    avatar={userProfile.avatar}
                    name={userProfile.name}
                    size="sm"
                    shape="circle"
                    className="shrink-0"
                  />
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-full bg-[#1C1917] text-[#D4AF37] flex items-center justify-center shrink-0 font-serif font-bold text-xs">
                AI
              </div>
              <div className="p-3 bg-white dark:bg-[#24201B] border border-[#D8CFBF] dark:border-[#3D352B] rounded-md text-xs font-sans font-semibold text-stone-700 dark:text-stone-200 flex items-center gap-2 shadow-xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#B88939] dark:text-[#E2BE7A]" />
                <span>Consulting your academic & weekly schedule...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Listening Indicator */}
        {isListening && (
          <div className="mb-2 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-serif text-rose-800 dark:text-rose-300 flex items-center justify-between shadow-xs animate-pulse">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
              </span>
              <span className="font-bold">Listening...</span>
              <span className="text-stone-600 dark:text-stone-400 font-sans">Speak your question aloud clearly</span>
            </div>
            <button
              type="button"
              onClick={handleToggleSpeechInput}
              className="text-[10px] font-sans font-bold text-rose-700 dark:text-rose-400 hover:underline uppercase"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            onClick={handleToggleSpeechInput}
            title={isListening ? 'Stop listening' : 'Dictate with voice'}
            className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
              isListening
                ? 'bg-rose-600 text-white border-rose-700 shadow-md animate-pulse'
                : 'bg-white dark:bg-[#24201B] hover:bg-stone-100 dark:hover:bg-[#2C261F] text-stone-600 dark:text-stone-300 border-[#D8CFBF] dark:border-[#3D352B] shadow-xs'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            placeholder={
              isListening
                ? 'Listening... speak now'
                : 'Ask your coach about schedule optimization, exam prep, or habit building...'
            }
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={isLoading}
            className="flex-1 text-xs sm:text-sm font-medium px-4 py-2.5 bg-white dark:bg-[#24201B] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-1 focus:ring-[#B88939] shadow-xs"
          />

          <button
            type="submit"
            disabled={isLoading || !inputPrompt.trim()}
            className={`px-4 sm:px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs ${
              isLoading || !inputPrompt.trim()
                ? 'bg-stone-200 dark:bg-stone-800 text-stone-400 dark:text-stone-600 border border-stone-300 dark:border-stone-700 cursor-not-allowed'
                : 'bg-[#1C1917] hover:bg-stone-800 text-[#D4AF37] border border-amber-900/30 cursor-pointer active:scale-95'
            }`}
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
