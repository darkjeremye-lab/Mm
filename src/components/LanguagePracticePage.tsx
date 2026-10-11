import React, { useState, useEffect, useRef } from 'react';
import { UserAvatar } from './UserAvatar';
import {
  Languages,
  Send,
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Square,
  Trash2,
  BookOpen,
  MessageSquare,
  Theater,
  PenTool,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Award,
  Globe2,
  SlidersHorizontal,
  Compass,
  Headphones,
  Check,
  RotateCcw,
  Sparkle,
  Bookmark,
  BookmarkCheck,
  Layers,
  ChevronRight,
} from 'lucide-react';
import {
  ThemeConfig,
  LanguageMessage,
  LanguageOption,
  LanguageProficiency,
  LanguagePracticeMode,
  SavedVocabularyItem,
  VocabularyWord,
} from '../types';
import {
  speakText,
  stopSpeaking,
  createSpeechRecognizer,
} from '../utils/speechService';
import {
  loadSavedVocabulary,
  saveVocabularyItem,
  isWordSaved,
  calculateVocabularyStats,
} from '../utils/vocabularyStorage';
import { VocabularyFlashcardDeck } from './VocabularyFlashcardDeck';

const AVAILABLE_LANGUAGES: LanguageOption[] = [
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    speechLangCode: 'es-ES',
    voiceName: 'Kore',
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    speechLangCode: 'fr-FR',
    voiceName: 'Zephyr',
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    speechLangCode: 'de-DE',
    voiceName: 'Fenrir',
  },
  {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    speechLangCode: 'it-IT',
    voiceName: 'Puck',
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    speechLangCode: 'ja-JP',
    voiceName: 'Kore',
  },
  {
    code: 'zh',
    name: 'Mandarin Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
    speechLangCode: 'zh-CN',
    voiceName: 'Kore',
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇧🇷',
    speechLangCode: 'pt-BR',
    voiceName: 'Zephyr',
  },
  {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    speechLangCode: 'ko-KR',
    voiceName: 'Kore',
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    speechLangCode: 'ar-SA',
    voiceName: 'Charon',
  },
  {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    speechLangCode: 'ru-RU',
    voiceName: 'Fenrir',
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English (Advanced)',
    flag: '🇬🇧',
    speechLangCode: 'en-US',
    voiceName: 'Kore',
  },
];

const ROLEPLAY_SCENARIOS: Record<string, string[]> = {
  es: [
    'Ordering tapas and wine at a bodega in Madrid',
    'Checking into a boutique hotel in Barcelona',
    'Asking for directions in Seville’s historic center',
    'Casual catch-up with a local friend in Valencia',
  ],
  fr: [
    'Ordering espresso and croissants at a Parisian café',
    'Visiting a contemporary art exhibition in Lyon',
    'Discussing literature and cinema at a bistro',
    'Browsing at a local farmers market in Provence',
  ],
  de: [
    'Ordering pretzels and coffee at a Munich bakery',
    'University seminar discussion in Berlin',
    'Booking a train journey at Frankfurt Hauptbahnhof',
    'Discussing weekend hiking plans in the Black Forest',
  ],
  it: [
    'Ordering handmade pasta and gelato in Florence',
    'Discussing architectural heritage in Rome',
    'Checking into an agriturismo in Tuscany',
    'Ordering espresso at a local Venetian bar',
  ],
  ja: [
    'Ordering ramen at an authentic counter in Shibuya',
    'Asking for train transfers in Tokyo Station',
    'Visiting a historic shrine in Kyoto',
    'Purchasing matcha sweets at a traditional shop',
  ],
  zh: [
    'Ordering dim sum and tea at a traditional tea house',
    'Bargaining politely at a silk and tea market',
    'Discussing daily university life in Beijing',
    'Taking a high-speed rail journey from Shanghai',
  ],
  default: [
    'Ordering at a local café or bakery',
    'Asking for directions and travel recommendations',
    'Introducing yourself and discussing your aspirations',
    'Checking in at a hotel and asking about the city',
  ],
};

const PRACTICE_MODES = [
  {
    id: 'conversation',
    label: 'Free Dialogue',
    icon: MessageSquare,
    desc: 'Unscripted organic discourse with situational expansions',
  },
  {
    id: 'roleplay',
    label: 'Scenario Immersion',
    icon: Theater,
    desc: 'Structured simulation across cultural and vocational settings',
  },
  {
    id: 'writing_critique',
    label: 'Writing Workshop',
    icon: PenTool,
    desc: 'Editorial precision, grammatical nuances, and idiomatic flow',
  },
  {
    id: 'pronunciation',
    label: 'Phonetic Drill',
    icon: Headphones,
    desc: 'Cadence, stress patterns, and spoken articulatory clarity',
  },
] as const;

const CEFR_LEVELS: { id: LanguageProficiency; label: string; tier: string; desc: string }[] = [
  {
    id: 'beginner',
    label: 'Beginner',
    tier: 'A1 – A2',
    desc: 'Essential grammar, concise structures & vocabulary scaffolds',
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    tier: 'B1 – B2',
    desc: 'Conversational autonomy, authentic idioms & natural pacing',
  },
  {
    id: 'advanced',
    label: 'Advanced',
    tier: 'C1 – C2',
    desc: 'Academic nuances, stylized rhetoric & native register',
  },
];

interface LanguagePracticePageProps {
  theme: ThemeConfig;
  userName?: string;
  userAvatar?: string;
}

export const LanguagePracticePage: React.FC<LanguagePracticePageProps> = ({
  theme,
  userName,
  userAvatar,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>(
    AVAILABLE_LANGUAGES[0]
  );
  const [proficiency, setProficiency] = useState<LanguageProficiency>('intermediate');
  const [practiceMode, setPracticeMode] = useState<LanguagePracticeMode>('conversation');
  const [selectedScenario, setSelectedScenario] = useState<string>(
    ROLEPLAY_SCENARIOS.es[0]
  );

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [speechRate, setSpeechRate] = useState<number>(1.0); // 1.0 = normal, 0.8 = slow
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});

  // Language dropdown menu state
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  // Curriculum configuration drawer collapse toggle
  const [isConfigCollapsed, setIsConfigCollapsed] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechRecognizerRef = useRef<{ start: () => void; stop: () => void; isSupported: boolean } | null>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Active Studio Mode: 'dialogue' (AI conversation) or 'flashcards' (Vocabulary review)
  const [studioTab, setStudioTab] = useState<'dialogue' | 'flashcards'>('dialogue');

  // Offline-first saved vocabulary items
  const [savedVocabulary, setSavedVocabulary] = useState<SavedVocabularyItem[]>(() =>
    loadSavedVocabulary()
  );

  // Temporary feedback toast when a word is saved
  const [saveToast, setSaveToast] = useState<{ word: string; visible: boolean } | null>(null);

  // Helper to save a vocabulary word from the conversation
  const handleSaveWord = (
    vocab: VocabularyWord,
    msgContext?: { pronunciationGuide?: string; text?: string }
  ) => {
    const { updatedItems } = saveVocabularyItem(
      {
        word: vocab.word,
        translation: vocab.translation,
        pronunciation: vocab.phonetic || msgContext?.pronunciationGuide,
        exampleSentence: vocab.notes || msgContext?.text,
        language: selectedLanguage.name,
        languageCode: selectedLanguage.code,
        notes: vocab.notes,
      },
      savedVocabulary
    );
    setSavedVocabulary(updatedItems);
    setSaveToast({ word: vocab.word, visible: true });
    setTimeout(() => {
      setSaveToast((prev) => (prev?.word === vocab.word ? null : prev));
    }, 3500);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Storage key for per-language history
  const storageKey = `mw_lang_practice_${selectedLanguage.code}_${proficiency}`;

  // Initial welcome message generator
  const getInitialMessage = (lang: LanguageOption, level: LanguageProficiency): LanguageMessage => {
    if (lang.code === 'es') {
      return {
        id: 'init-es',
        sender: 'assistant',
        text: `¡Hola ${userName || 'amigo'}! Te doy la bienvenida al Language Studio. Estoy a tu disposición para ayudarte a perfeccionar tu fluidez tanto hablada como escrita. ¿De qué te gustaría conversar hoy, o prefieres abordar un escenario específico?`,
        translation: `Hello ${userName || 'friend'}! Welcome to the Language Studio. I am here to help you refine your spoken and written fluency. What would you like to discuss today, or would you prefer a specific scenario?`,
        pronunciationGuide: 'OH-lah! Teh DOH-ee lah b-yen-veh-NEE-dah ahl Language Studio...',
        vocabulary: [
          { word: 'Perfeccionar', translation: 'To perfect / polish', notes: 'Expresses refined linguistic craft' },
          { word: 'Fluidez', translation: 'Fluency / ease of expression', notes: 'Key objective in language mastery' },
        ],
        timestamp: Date.now(),
      };
    } else if (lang.code === 'fr') {
      return {
        id: 'init-fr',
        sender: 'assistant',
        text: `Bonjour ${userName || 'mon ami'} ! Bienvenue dans votre Language Studio. Je suis ravi d'être votre interlocuteur pour développer votre aisance à l'oral comme à l'écrit. Quel sujet souhaitez-vous explorer aujourd'hui ?`,
        translation: `Hello ${userName || 'my friend'}! Welcome to your Language Studio. I am delighted to be your dialogue partner to develop your oral and written ease. What topic would you like to explore today?`,
        pronunciationGuide: 'Bohn-zhoor! Byen-veh-noo dahn vohtr Language Studio...',
        vocabulary: [
          { word: 'Interlocuteur', translation: 'Dialogue partner / conversationalist', notes: 'Formal register for a speaking companion' },
          { word: 'Aisance', translation: 'Ease / articulacy / fluidity', notes: 'Sign of authentic mastery' },
        ],
        timestamp: Date.now(),
      };
    } else if (lang.code === 'ja') {
      return {
        id: 'init-ja',
        sender: 'assistant',
        text: `こんにちは、${userName || 'さん'}！Language Studioへようこそ。発音・会話の聞き取りから文章構成まで、丁寧にサポートいたします。本日はどのようなテーマで練習を始めましょうか？`,
        translation: `Hello, ${userName || 'friend'}! Welcome to Language Studio. From pronunciation and listening comprehension to prose composition, I will support you attentively. What theme shall we begin with today?`,
        pronunciationGuide: 'Konnichiwa! Language Studio e youkoso. Hatsuon, kaiwa no kikitori kara bunshou kousei made, teinei ni sapooto itashimasu.',
        vocabulary: [
          { word: '丁寧 (ていねい)', translation: 'Attentive / thorough / polite', notes: 'Adjective expressing care and dedication' },
          { word: '上達 (じょうたつ)', translation: 'Progress / skill advancement', notes: 'Continuous milestone in learning' },
        ],
        timestamp: Date.now(),
      };
    } else if (lang.code === 'de') {
      return {
        id: 'init-de',
        sender: 'assistant',
        text: `Guten Tag ${userName || 'Freund'}! Herzlich willkommen im Language Studio. Gerne begleite ich Sie dabei, Ihre mündliche und schriftliche Ausdrucksfähigkeit zu verfeinern. Worüber möchten Sie sich heute austauschen?`,
        translation: `Good day ${userName || 'friend'}! Warm welcome to the Language Studio. I am glad to accompany you in refining your oral and written expression. What would you like to exchange thoughts on today?`,
        pronunciationGuide: 'GOO-ten TAHK! HERTZ-likh vil-KOM-men im Language Studio...',
        vocabulary: [
          { word: 'Ausdrucksfähigkeit', translation: 'Expressive ability / articulacy', notes: 'Compound noun: Ausdruck + Fähigkeit' },
          { word: 'Verfeinern', translation: 'To refine / polish', notes: 'Verb indicating subtle improvement' },
        ],
        timestamp: Date.now(),
      };
    }
    return {
      id: `init-${lang.code}`,
      sender: 'assistant',
      text: `Welcome to the ${lang.name} Language Studio. I am ready to converse, guide pronunciation cadence, and analyze your spoken and written expression. What would you like to practice today?`,
      translation: `Welcome to your ${lang.name} Language Studio.`,
      timestamp: Date.now(),
    };
  };

  const [messages, setMessages] = useState<LanguageMessage[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [getInitialMessage(selectedLanguage, proficiency)];
  });

  // When language or proficiency changes, load appropriate history
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        setMessages([getInitialMessage(selectedLanguage, proficiency)]);
      }
    } catch {
      setMessages([getInitialMessage(selectedLanguage, proficiency)]);
    }
    // Update scenario options
    const scenarios = ROLEPLAY_SCENARIOS[selectedLanguage.code] || ROLEPLAY_SCENARIOS.default;
    setSelectedScenario(scenarios[0]);
    stopSpeaking();
    setCurrentlySpeakingId(null);
  }, [selectedLanguage.code, proficiency]);

  // Save messages to storage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (e) {
      console.error(e);
    }
  }, [messages, storageKey]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Clean up on unmount
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
        voice: selectedLanguage.voiceName,
        langCode: selectedLanguage.speechLangCode,
        rate: speechRate,
        onStart: () => setCurrentlySpeakingId(msgId),
        onEnd: () => setCurrentlySpeakingId(null),
        onError: () => setCurrentlySpeakingId(null),
      });
    }
  };

  // Speech Recognition / Dictation
  const handleToggleSpeechInput = () => {
    if (isListening) {
      speechRecognizerRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognizer = createSpeechRecognizer(selectedLanguage.speechLangCode, {
      onResult: (transcript, isFinal) => {
        setInputPrompt(transcript);
        if (isFinal) {
          setIsListening(false);
        }
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
      alert(
        'Speech recognition is not fully supported in this browser window. You can type directly in the input box below!'
      );
      return;
    }

    speechRecognizerRef.current = recognizer;
    recognizer.start();
    setIsListening(true);
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputPrompt.trim();
    if (!textToSend || isLoading) return;

    if (isListening) {
      speechRecognizerRef.current?.stop();
      setIsListening(false);
    }

    const userMsg: LanguageMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/language-practice/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          targetLanguage: selectedLanguage.name,
          proficiency,
          practiceMode,
          scenario: practiceMode === 'roleplay' ? selectedScenario : undefined,
          history: messages.slice(-6),
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const assistantMsg: LanguageMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || `Great progress in ${selectedLanguage.name}!`,
        translation: data.translation,
        pronunciationGuide: data.pronunciationGuide,
        corrections: data.corrections || [],
        vocabulary: data.vocabulary || [],
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Auto-speak if enabled
      if (autoSpeak) {
        handleToggleSpeak(assistantMsg.id, assistantMsg.text);
      }
    } catch (err: any) {
      console.error('Error in language chat:', err);
      const fallbackMsg: LanguageMessage = {
        id: `assistant-fallback-${Date.now()}`,
        sender: 'assistant',
        text: `You are making steady progress in ${selectedLanguage.name}. Feel free to continue exploring or ask for vocabulary clarifiers.`,
        translation: 'You are making steady progress.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      if (autoSpeak) {
        handleToggleSpeak(fallbackMsg.id, fallbackMsg.text);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm(`Clear your ${selectedLanguage.name} session history?`)) {
      stopSpeaking();
      const initial = getInitialMessage(selectedLanguage, proficiency);
      setMessages([initial]);
      try {
        localStorage.removeItem(storageKey);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const toggleDetails = (msgId: string) => {
    setExpandedDetails((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  const currentScenarios = ROLEPLAY_SCENARIOS[selectedLanguage.code] || ROLEPLAY_SCENARIOS.default;

  const vocabStats = calculateVocabularyStats(savedVocabulary);

  return (
    <div id="language-practice-container" className="space-y-4 max-w-6xl mx-auto">
      {/* 1. Header Toolbar */}
      <header
        id="language-studio-header"
        className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-[#1C1917] text-[#D4AF37] border border-[#B88939]/30 flex items-center justify-center shadow-xs shrink-0">
            <Languages className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                Language Studio
              </h1>
              <span className="text-[10px] font-mono font-semibold uppercase bg-stone-100 dark:bg-[#2A241F] text-stone-700 dark:text-stone-300 px-2 py-0.5 rounded border border-stone-200 dark:border-[#3D352B]">
                CEFR Standard
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-sans mt-0.5">
              Comprehensive verbal and written mastery powered by native speech synthesis & phonetic analysis.
            </p>
          </div>
        </div>

        {/* Global Toolbar Controls & View Switcher */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
          {/* Main Studio View Switcher */}
          <div className="flex items-center bg-stone-100 dark:bg-[#24201C] p-1 rounded-lg border border-[#D8CFBF] dark:border-[#3D352B] shadow-2xs">
            <button
              type="button"
              id="studio-tab-dialogue"
              onClick={() => setStudioTab('dialogue')}
              className={`px-3 py-1.5 rounded-md text-xs font-sans font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                studioTab === 'dialogue'
                  ? 'bg-white dark:bg-[#1C1917] text-stone-900 dark:text-[#D4AF37] shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Dialogue</span>
            </button>
            <button
              type="button"
              id="studio-tab-flashcards"
              onClick={() => setStudioTab('flashcards')}
              className={`px-3 py-1.5 rounded-md text-xs font-sans font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                studioTab === 'flashcards'
                  ? 'bg-white dark:bg-[#1C1917] text-stone-900 dark:text-[#D4AF37] shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Flashcards</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  vocabStats.due > 0
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-700'
                    : 'bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                }`}
              >
                {vocabStats.due > 0 ? `${vocabStats.due} due` : `${vocabStats.total}`}
              </span>
            </button>
          </div>

          {studioTab === 'dialogue' && (
            <>
              {/* Collapse/Expand Curriculum Tray */}
              <button
                type="button"
                onClick={() => setIsConfigCollapsed((prev) => !prev)}
                className={`px-3 py-1.5 rounded-md text-xs font-sans font-semibold flex items-center gap-1.5 border transition-all cursor-pointer shadow-2xs ${
                  isConfigCollapsed
                    ? 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 border-stone-300 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-700'
                    : 'bg-white dark:bg-[#24201C] text-stone-800 dark:text-stone-200 border-[#D8CFBF] dark:border-[#3D352B] hover:border-stone-400'
                }`}
                title="Toggle Curriculum Setup Panel"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400" />
                <span className="hidden sm:inline">{isConfigCollapsed ? 'Show Setup' : 'Hide Setup'}</span>
              </button>

              {/* Voice Speed Toggle */}
              <button
                type="button"
                onClick={() => setSpeechRate((prev) => (prev === 1.0 ? 0.8 : 1.0))}
                className="px-2.5 py-1.5 bg-white dark:bg-[#24201C] border border-[#D8CFBF] dark:border-[#3D352B] rounded-md text-xs font-mono font-semibold text-stone-700 dark:text-stone-200 hover:border-[#B88939] transition-all cursor-pointer shadow-2xs"
                title="Toggle speech articulation speed"
              >
                {speechRate === 1.0 ? '1.0x' : '0.8x'}
              </button>

              {/* Auto-Voice Response Toggle */}
              <button
                type="button"
                onClick={() => {
                  if (autoSpeak) {
                    stopSpeaking();
                    setCurrentlySpeakingId(null);
                  }
                  setAutoSpeak((prev) => !prev);
                }}
                className={`px-2.5 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-sans font-semibold transition-all cursor-pointer shadow-2xs ${
                  autoSpeak
                    ? 'bg-[#1C1917] text-[#D4AF37] border border-[#2E2822]'
                    : 'bg-white dark:bg-[#24201C] text-stone-600 dark:text-stone-300 border border-[#D8CFBF] dark:border-[#3D352B] hover:text-stone-900 dark:hover:text-stone-100'
                }`}
                title={autoSpeak ? 'Audio playback enabled upon reply' : 'Audio playback muted'}
              >
                {autoSpeak ? (
                  <Volume2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-stone-400" />
                )}
                <span className="hidden sm:inline">Voice: {autoSpeak ? 'On' : 'Off'}</span>
              </button>

              {/* Reset / Clear Session */}
              <button
                type="button"
                onClick={handleClearHistory}
                title="Reset conversation transcript for this language"
                className="p-1.5 sm:p-2 bg-white dark:bg-[#24201C] hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-400 border border-[#D8CFBF] dark:border-[#3D352B] text-stone-400 rounded-md cursor-pointer transition-colors shadow-2xs"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </header>

      {studioTab === 'flashcards' ? (
        <VocabularyFlashcardDeck
          vocabulary={savedVocabulary}
          onVocabularyChange={setSavedVocabulary}
          availableLanguages={AVAILABLE_LANGUAGES}
          currentLanguage={selectedLanguage}
          theme={theme}
          onSwitchToDialogue={() => setStudioTab('dialogue')}
        />
      ) : (
        <>
          {/* 2. Structured Curriculum & Target Language Bar */}
          {!isConfigCollapsed && (
            <section
              id="curriculum-setup-panel"
              className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg p-4 sm:p-5 shadow-xs space-y-4"
            >
          {/* Target Language Dropdown Selector with Rich Preview */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EAE3D5] dark:border-[#2E2820]">
            <div className="flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-stone-600 dark:text-stone-400" />
              <span className="text-xs font-sans font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                Target Language
              </span>
            </div>

            {/* Custom Select Box */}
            <div className="relative" ref={langDropdownRef}>
              <button
                type="button"
                id="target-language-dropdown-button"
                onClick={() => setIsLangDropdownOpen((prev) => !prev)}
                className="w-full sm:w-72 px-3 py-2 bg-white dark:bg-[#24201C] border border-[#D8CFBF] dark:border-[#3D352B] hover:border-stone-400 rounded-lg flex items-center justify-between text-xs font-medium text-stone-900 dark:text-stone-100 shadow-2xs cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="text-lg leading-none">{selectedLanguage.flag}</span>
                  <span className="font-semibold text-stone-900 dark:text-stone-100">{selectedLanguage.name}</span>
                  <span className="text-stone-400 font-serif">({selectedLanguage.nativeName})</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-stone-500 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isLangDropdownOpen && (
                <div
                  id="target-language-menu"
                  className="absolute right-0 mt-1.5 w-full sm:w-80 bg-white dark:bg-[#24201C] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg shadow-lg z-30 max-h-72 overflow-y-auto py-1"
                >
                  <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100 dark:border-stone-800">
                    Available Languages ({AVAILABLE_LANGUAGES.length})
                  </div>
                  {AVAILABLE_LANGUAGES.map((lang) => {
                    const isSelected = selectedLanguage.code === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          setSelectedLanguage(lang);
                          setIsLangDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#1C1917] dark:bg-[#151210] text-[#D4AF37] font-semibold border-l-2 border-[#D4AF37]'
                            : 'text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{lang.flag}</span>
                          <span>{lang.name}</span>
                          <span className={`text-[11px] font-serif ${isSelected ? 'text-[#D4AF37]/80' : 'text-stone-400'}`}>
                            {lang.nativeName}
                          </span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#D4AF37]" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Dual Column Setup: Practice Focus Modality & CEFR Proficiency */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Practice Focus Modality (7 cols) */}
            <div className="lg:col-span-7 space-y-2">
              <div className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400" />
                <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                  Practice Modality
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRACTICE_MODES.map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = practiceMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      id={`practice-mode-${mode.id}`}
                      onClick={() => setPracticeMode(mode.id as LanguagePracticeMode)}
                      className={`p-2.5 rounded-lg text-left transition-all border cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#1C1917] text-[#D4AF37] border-[#1C1917] shadow-xs'
                          : 'bg-white dark:bg-[#24201C] text-stone-700 dark:text-stone-200 border-[#D8CFBF] dark:border-[#3D352B] hover:border-stone-400'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-sans font-bold text-xs">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{mode.label}</span>
                      </div>
                      <p className={`text-[11px] font-sans mt-1 leading-snug ${
                        isSelected ? 'text-[#D4AF37]/80 font-normal' : 'text-stone-500 dark:text-stone-400'
                      }`}>
                        {mode.desc}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Scenario selector if Roleplay mode */}
              {practiceMode === 'roleplay' && (
                <div className="pt-2">
                  <label
                    htmlFor="scenario-select"
                    className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block mb-1"
                  >
                    Active Roleplay Scenario:
                  </label>
                  <select
                    id="scenario-select"
                    value={selectedScenario}
                    onChange={(e) => setSelectedScenario(e.target.value)}
                    className="w-full text-xs font-sans px-3 py-2 bg-white dark:bg-[#24201C] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-600 shadow-2xs"
                  >
                    {currentScenarios.map((scen, i) => (
                      <option key={i} value={scen}>
                        {scen}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* CEFR Proficiency Selector (5 cols) */}
            <div className="lg:col-span-5 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400" />
                  <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                    CEFR Proficiency Level
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {CEFR_LEVELS.map((lvl) => {
                    const isSelected = proficiency === lvl.id;
                    return (
                      <button
                        key={lvl.id}
                        type="button"
                        id={`proficiency-level-${lvl.id}`}
                        onClick={() => setProficiency(lvl.id)}
                        className={`p-2 rounded-lg text-center transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-[#1C1917] text-[#D4AF37] border-[#1C1917] shadow-xs'
                            : 'bg-white dark:bg-[#24201C] text-stone-700 dark:text-stone-200 border-[#D8CFBF] dark:border-[#3D352B] hover:border-stone-400'
                        }`}
                      >
                        <div className="font-sans font-bold text-xs">{lvl.label}</div>
                        <div className={`text-[10px] font-mono mt-0.5 ${
                          isSelected ? 'text-[#D4AF37]/90 font-semibold' : 'text-stone-500 dark:text-stone-400'
                        }`}>
                          {lvl.tier}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pedagogical Description Callout */}
              <div className="text-[11px] text-stone-600 dark:text-stone-300 font-sans bg-white dark:bg-[#24201C] p-2.5 rounded-lg border border-[#D8CFBF] dark:border-[#3D352B]">
                <span className="font-semibold text-stone-800 dark:text-stone-100">
                  {proficiency === 'beginner' ? 'A1–A2 Scaffold: ' : proficiency === 'intermediate' ? 'B1–B2 Autonomy: ' : 'C1–C2 Mastery: '}
                </span>
                {CEFR_LEVELS.find((l) => l.id === proficiency)?.desc}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. Main Practice Interface & Audio Dialogue Room */}
      <main
        id="language-dialogue-room"
        className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg p-4 sm:p-6 shadow-xs flex flex-col min-h-[560px] max-h-[740px]"
      >
        {/* Dialogue Stream */}
        <div
          id="dialogue-messages-stream"
          className="flex-1 overflow-y-auto pr-2 space-y-4 pb-4 focus:outline-none"
          tabIndex={0}
          aria-label="Conversation Messages Stream"
        >
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isSpeakingThis = currentlySpeakingId === msg.id;
            const isDetailsOpen = expandedDetails[msg.id];
            const hasCorrections = Boolean(msg.corrections && msg.corrections.length > 0);
            const hasVocab = Boolean(msg.vocabulary && msg.vocabulary.length > 0);

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div
                    className="w-8 h-8 rounded-md bg-[#1C1917] text-[#D4AF37] border border-[#B88939]/30 flex items-center justify-center shrink-0 font-serif font-bold text-xs shadow-2xs"
                    title={`${selectedLanguage.name} Tutor`}
                  >
                    {selectedLanguage.flag}
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-lg p-4 sm:p-5 transition-shadow shadow-xs ${
                    isUser
                      ? 'bg-[#1C1917] text-[#FDFBF7] border border-[#2E2822]'
                      : 'bg-white dark:bg-[#24201C] text-stone-900 dark:text-stone-100 border border-[#D8CFBF] dark:border-[#3D352B]'
                  }`}
                >
                  {/* Primary Language Text */}
                  <div className="whitespace-pre-wrap font-sans font-medium text-sm sm:text-base leading-relaxed tracking-normal">
                    {msg.text}
                  </div>

                  {/* Phonetic / Pronunciation Breakdown */}
                  {msg.pronunciationGuide && (
                    <div className="mt-2.5 text-xs font-mono text-stone-800 dark:text-stone-200 bg-stone-50 dark:bg-[#1A1816] p-2.5 rounded border border-stone-200 dark:border-[#3D352B]">
                      <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-0.5 flex items-center gap-1">
                        <Headphones className="w-3 h-3 text-stone-600 dark:text-stone-400" />
                        <span>Phonetic Cadence / Reading:</span>
                      </div>
                      <div className="font-mono text-stone-700 dark:text-stone-300">{msg.pronunciationGuide}</div>
                    </div>
                  )}

                  {/* English Translation */}
                  {!isUser && msg.translation && (
                    <div className="mt-2.5 text-xs text-stone-700 dark:text-stone-300 bg-[#FDFBF7] dark:bg-[#1A1816] p-2.5 rounded border border-[#EAE3D5] dark:border-[#3D352B] font-sans">
                      <span className="font-bold text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 block mb-0.5">
                        Translation:
                      </span>
                      {msg.translation}
                    </div>
                  )}

                  {/* Linguistic Corrections & Vocabulary Accordion */}
                  {!isUser && (hasCorrections || hasVocab) && (
                    <div className="mt-3 pt-2.5 border-t border-stone-200 dark:border-[#3D352B]">
                      <button
                        type="button"
                        onClick={() => toggleDetails(msg.id)}
                        className="text-xs font-sans font-semibold text-stone-800 dark:text-stone-200 hover:text-stone-950 dark:hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {isDetailsOpen ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400" />
                            <span>Collapse Linguistic Notes</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400" />
                            <span>
                              Linguistic Notes ({hasCorrections ? 'Grammar Audit' : ''}
                              {hasCorrections && hasVocab ? ' & ' : ''}
                              {hasVocab ? `${msg.vocabulary?.length} Lexicon Items` : ''})
                            </span>
                          </>
                        )}
                      </button>

                      {isDetailsOpen && (
                        <div className="mt-3 space-y-3">
                          {/* Grammar & Phrasing Refinements */}
                          {hasCorrections && (
                            <div className="p-3 bg-stone-50 dark:bg-[#1A1816] border border-stone-300 dark:border-[#3D352B] rounded-md text-xs space-y-2">
                              <div className="font-sans font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                                <span>Phrasing & Syntax Refinement:</span>
                              </div>
                              {msg.corrections?.map((c, idx) => (
                                <div key={idx} className="space-y-1 font-sans border-t border-stone-200 dark:border-[#3D352B] pt-1.5 first:border-0 first:pt-0">
                                  {c.original && (
                                    <div className="text-stone-500 line-through text-[11px]">
                                      {c.original}
                                    </div>
                                  )}
                                  <div className="text-stone-900 dark:text-stone-100 font-semibold">
                                    ➜ {c.improved}
                                  </div>
                                  <div className="text-stone-600 dark:text-stone-300 text-[11px]">
                                    {c.explanation}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Lexicon / Vocabulary Items */}
                          {hasVocab && (
                            <div className="p-3 bg-[#FDFBF7] dark:bg-[#1A1816] border border-[#D8CFBF] dark:border-[#3D352B] rounded-md text-xs space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="font-sans font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                                  <BookOpen className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
                                  <span>Lexicon Items:</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setStudioTab('flashcards')}
                                  className="text-[10px] font-mono text-[#B88939] hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <span>Open Flashcards</span>
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {msg.vocabulary?.map((v, vIdx) => {
                                  const isSaved = isWordSaved(v.word, selectedLanguage.code, savedVocabulary);

                                  return (
                                    <div
                                      key={vIdx}
                                      className="p-2.5 bg-white dark:bg-[#24201C] rounded border border-stone-200 dark:border-[#3D352B] shadow-2xs flex flex-col justify-between"
                                    >
                                      <div>
                                        <div className="font-bold text-stone-900 dark:text-stone-100 flex items-center justify-between gap-1">
                                          <span className="text-sm font-serif font-bold">{v.word}</span>
                                          <div className="flex items-center gap-1">
                                            <button
                                              type="button"
                                              onClick={() =>
                                                speakText(v.word, {
                                              voice: selectedLanguage.voiceName,
                                              langCode: selectedLanguage.speechLangCode,
                                              rate: 0.8,
                                            })
                                          }
                                          className="text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer p-1"
                                          title="Hear slow pronunciation"
                                        >
                                          <Volume2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleSaveWord(v, {
                                              pronunciationGuide: msg.pronunciationGuide,
                                              text: msg.text,
                                            })
                                          }
                                          className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold flex items-center gap-1 transition-all cursor-pointer border ${
                                            isSaved
                                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                              : 'bg-[#1C1917] hover:bg-stone-800 text-[#D4AF37] border border-[#B88939]/40'
                                          }`}
                                          title={isSaved ? 'Word is saved to your flashcard deck' : 'Save to your flashcard deck'}
                                        >
                                          {isSaved ? (
                                            <>
                                              <BookmarkCheck className="w-3 h-3" />
                                              <span>Saved</span>
                                            </>
                                          ) : (
                                            <>
                                              <Bookmark className="w-3 h-3" />
                                              <span>Save</span>
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                    <div className="text-stone-700 dark:text-stone-300 text-[11px] font-sans mt-0.5">
                                      {v.translation}
                                    </div>
                                    {v.phonetic && (
                                      <div className="text-stone-500 dark:text-stone-400 text-[10px] font-mono mt-0.5">
                                        🗣️ {v.phonetic}
                                      </div>
                                    )}
                                    {v.notes && (
                                      <div className="text-stone-500 dark:text-stone-400 text-[10px] mt-0.5 font-sans">
                                        {v.notes}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Action Footer: Timestamp & Audio Speak */}
                  <div
                    className={`text-[11px] font-mono mt-3 pt-2 border-t flex items-center justify-between gap-2 ${
                      isUser
                        ? 'border-stone-800 text-stone-400'
                        : 'border-stone-200 dark:border-[#3D352B] text-stone-500 dark:text-stone-400'
                    }`}
                  >
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleToggleSpeak(msg.id, msg.text)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-sans font-semibold transition-all cursor-pointer ${
                        isSpeakingThis
                          ? 'bg-[#1C1917] text-[#D4AF37] border border-[#2E2822]'
                          : isUser
                          ? 'text-stone-300 hover:text-white hover:bg-stone-800'
                          : 'text-stone-700 dark:text-stone-200 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-300 dark:border-stone-700'
                      }`}
                      title={isSpeakingThis ? 'Halt speech output' : 'Listen with native vocalization'}
                    >
                      {isSpeakingThis ? (
                        <>
                          <Square className="w-3 h-3 fill-current" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Listen</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {isUser && (
                  <UserAvatar
                    avatar={userAvatar}
                    name={userName}
                    size="sm"
                    shape="rounded"
                    className="shrink-0"
                  />
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-md bg-[#1C1917] text-[#D4AF37] flex items-center justify-center shrink-0 font-serif font-bold text-xs">
                {selectedLanguage.flag}
              </div>
              <div className="p-3 bg-white dark:bg-[#24201C] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg text-xs font-sans font-medium text-stone-700 dark:text-stone-200 flex items-center gap-2 shadow-xs">
                <Sparkles className="w-4 h-4 text-stone-600 animate-spin" />
                <span>Formulating natural response in {selectedLanguage.name}...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Speech Dictation Active Indicator Banner */}
        {isListening && (
          <div
            id="speech-active-banner"
            className="mb-3 px-3 py-2 bg-stone-900 border border-stone-700 text-white rounded-lg text-xs font-sans flex items-center justify-between shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <span className="font-semibold">
                Listening for {selectedLanguage.name} ({selectedLanguage.speechLangCode})...
              </span>
              <span className="text-stone-300 hidden sm:inline">
                Speak your sentence clearly into your microphone.
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleSpeechInput}
              className="text-[11px] font-mono text-stone-300 hover:text-white uppercase font-bold tracking-wider underline cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Message Input & Speech Recognition Controls */}
        <form
          id="dialogue-input-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 pt-2"
        >
          {/* Microphone Dictation Trigger */}
          <button
            type="button"
            id="microphone-dictation-button"
            onClick={handleToggleSpeechInput}
            title={
              isListening
                ? 'Stop audio input'
                : `Dictate verbally in ${selectedLanguage.name} (${selectedLanguage.speechLangCode})`
            }
            className={`p-2.5 sm:p-3 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              isListening
                ? 'bg-rose-600 text-white border-rose-700 shadow-md animate-pulse'
                : 'bg-white dark:bg-[#24201C] hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 border-[#D8CFBF] dark:border-[#3D352B] shadow-2xs'
            }`}
          >
            {isListening ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4 text-stone-700 dark:text-stone-300" />
            )}
            <span className="hidden md:inline text-xs font-sans font-semibold">
              {isListening ? 'Halt Audio' : 'Speak'}
            </span>
          </button>

          {/* Primary Text Input Field */}
          <input
            type="text"
            id="dialogue-text-input"
            placeholder={
              isListening
                ? `Recording audio in ${selectedLanguage.name}...`
                : `Compose or dictate in ${selectedLanguage.name} (or English for guidance)...`
            }
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={isLoading}
            className="flex-1 text-xs sm:text-sm font-sans font-medium px-4 py-2.5 bg-white dark:bg-[#24201C] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-600 shadow-2xs"
          />

          {/* Submission Button */}
          <button
            type="submit"
            id="dialogue-send-button"
            disabled={isLoading || !inputPrompt.trim()}
            className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg text-xs font-sans font-semibold tracking-wide flex items-center gap-1.5 transition-all shadow-2xs shrink-0 ${
              isLoading || !inputPrompt.trim()
                ? 'bg-stone-200 dark:bg-stone-800 text-stone-400 dark:text-stone-600 border border-stone-300 dark:border-stone-700 cursor-not-allowed'
                : 'bg-[#1C1917] hover:bg-stone-800 text-[#D4AF37] border border-[#2E2822] cursor-pointer active:scale-95'
            }`}
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </main>
    </>
  )}

  {/* Floating Save Notification Toast */}
  {saveToast && saveToast.visible && (
    <div
      id="save-vocab-toast"
      className="fixed bottom-6 right-6 z-50 bg-[#1C1917] text-white border border-[#B88939]/70 shadow-2xl rounded-xl p-3.5 flex items-center gap-3 animate-fade-in max-w-sm"
    >
      <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-700/50 flex items-center justify-center shrink-0">
        <CheckCircle2 className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-sans font-bold text-stone-100">
          Saved to Flashcards
        </div>
        <div className="text-[11px] font-sans text-stone-300 truncate">
          "<span className="font-semibold text-[#D4AF37]">{saveToast.word}</span>" added to your deck.
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          setStudioTab('flashcards');
          setSaveToast(null);
        }}
        className="px-2.5 py-1.5 bg-[#2A241F] hover:bg-[#382F27] text-[#D4AF37] rounded-lg text-xs font-sans font-semibold border border-[#B88939]/40 cursor-pointer shrink-0 transition-colors"
      >
        Review
      </button>
    </div>
  )}
</div>
);
};
