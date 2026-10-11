import React, { useState, useMemo } from 'react';
import {
  SavedVocabularyItem,
  ReviewRating,
  LanguageOption,
  ThemeConfig,
} from '../types';
import {
  rateFlashcard,
  removeVocabularyItem,
  saveVocabularyItem,
  calculateVocabularyStats,
  isCardDue,
} from '../utils/vocabularyStorage';
import { speakText, stopSpeaking } from '../utils/speechService';
import {
  BookOpen,
  Volume2,
  RotateCcw,
  Sparkles,
  Plus,
  Search,
  Trash2,
  Clock,
  CheckCircle2,
  Flame,
  ArrowRight,
  Filter,
  Check,
  ChevronRight,
  X,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface VocabularyFlashcardDeckProps {
  vocabulary: SavedVocabularyItem[];
  onVocabularyChange: (updated: SavedVocabularyItem[]) => void;
  availableLanguages: LanguageOption[];
  currentLanguage: LanguageOption;
  theme: ThemeConfig;
  onSwitchToDialogue?: () => void;
}

export const VocabularyFlashcardDeck: React.FC<VocabularyFlashcardDeckProps> = ({
  vocabulary,
  onVocabularyChange,
  availableLanguages,
  currentLanguage,
  theme,
  onSwitchToDialogue,
}) => {
  // Active view: 'review' (1-by-1 card carousel) or 'browse' (lexicon card grid/list)
  const [activeSubTab, setActiveSubTab] = useState<'review' | 'browse'>('review');

  // Filter by language ('all' or specific language code)
  const [selectedLangFilter, setSelectedLangFilter] = useState<string>('all');

  // Search query in browse mode
  const [searchQuery, setSearchQuery] = useState('');

  // Status filter in browse mode: 'all' | 'due' | 'learning' | 'mastered' | 'new'
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Manual Add Word modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newTranslation, setNewTranslation] = useState('');
  const [newPronunciation, setNewPronunciation] = useState('');
  const [newExample, setNewExample] = useState('');
  const [newLangCode, setNewLangCode] = useState(currentLanguage.code);

  // Review session state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [reviewedInSessionCount, setReviewedInSessionCount] = useState(0);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // Helper map of language code to info
  const languageMap = useMemo(() => {
    const map = new Map<string, LanguageOption>();
    availableLanguages.forEach((l) => map.set(l.code, l));
    return map;
  }, [availableLanguages]);

  // Language counts for language pills
  const languageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    vocabulary.forEach((item) => {
      counts[item.languageCode] = (counts[item.languageCode] || 0) + 1;
    });
    return counts;
  }, [vocabulary]);

  // Filtered vocabulary based on language
  const languageFilteredVocab = useMemo(() => {
    if (selectedLangFilter === 'all') return vocabulary;
    return vocabulary.filter((item) => item.languageCode === selectedLangFilter);
  }, [vocabulary, selectedLangFilter]);

  // Overall stats for the selected language filter
  const stats = useMemo(() => {
    return calculateVocabularyStats(languageFilteredVocab);
  }, [languageFilteredVocab]);

  // Due cards for review session
  const dueCards = useMemo(() => {
    return languageFilteredVocab.filter((item) => isCardDue(item));
  }, [languageFilteredVocab]);

  // Review queue (defaults to due cards, or if none due, allow reviewing all in category)
  const [reviewAllOverride, setReviewAllOverride] = useState(false);
  const reviewDeck = useMemo(() => {
    if (reviewAllOverride || dueCards.length === 0) {
      return languageFilteredVocab;
    }
    return dueCards;
  }, [languageFilteredVocab, dueCards, reviewAllOverride]);

  const currentCard: SavedVocabularyItem | undefined = reviewDeck[currentCardIndex];

  // Handle rating a flashcard (Again, Hard, Good, Easy)
  const handleRateCard = (rating: ReviewRating) => {
    if (!currentCard) return;

    // Rate card and get updated version
    const updatedCard = rateFlashcard(currentCard, rating);
    const updatedList = vocabulary.map((v) => (v.id === updatedCard.id ? updatedCard : v));
    onVocabularyChange(updatedList);

    setReviewedInSessionCount((prev) => prev + 1);
    setIsCardFlipped(false);

    if (currentCardIndex + 1 < reviewDeck.length) {
      setCurrentCardIndex((prev) => prev + 1);
    } else {
      setSessionCompleted(true);
    }
  };

  // Speak word audio using TTS
  const handleSpeakWord = (word: string, langCode: string) => {
    stopSpeaking();
    const langOpt = languageMap.get(langCode) || currentLanguage;
    speakText(word, {
      voice: langOpt.voiceName,
      langCode: langOpt.speechLangCode,
      rate: 0.85,
    });
  };

  // Reset review session
  const handleRestartReview = (all = false) => {
    setReviewAllOverride(all);
    setCurrentCardIndex(0);
    setIsCardFlipped(false);
    setReviewedInSessionCount(0);
    setSessionCompleted(false);
  };

  // Add new custom vocabulary word
  const handleCreateWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim() || !newTranslation.trim()) return;

    const langOpt = languageMap.get(newLangCode) || currentLanguage;
    const { updatedItems } = saveVocabularyItem(
      {
        word: newWord.trim(),
        translation: newTranslation.trim(),
        pronunciation: newPronunciation.trim() || undefined,
        exampleSentence: newExample.trim() || undefined,
        language: langOpt.name,
        languageCode: langOpt.code,
      },
      vocabulary
    );

    onVocabularyChange(updatedItems);
    setNewWord('');
    setNewTranslation('');
    setNewPronunciation('');
    setNewExample('');
    setIsAddModalOpen(false);
  };

  // Delete vocabulary word
  const handleDeleteWord = (id: string) => {
    const updated = removeVocabularyItem(id, vocabulary);
    onVocabularyChange(updated);
  };

  // Browse list filtered items
  const browseItems = useMemo(() => {
    let result = languageFilteredVocab;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.word.toLowerCase().includes(q) ||
          item.translation.toLowerCase().includes(q) ||
          item.exampleSentence?.toLowerCase().includes(q) ||
          item.notes?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      if (statusFilter === 'due') {
        result = result.filter((item) => isCardDue(item));
      } else {
        result = result.filter((item) => item.reviewStatus === statusFilter);
      }
    }
    return result;
  }, [languageFilteredVocab, searchQuery, statusFilter]);

  return (
    <div id="vocabulary-flashcard-system" className="space-y-5">
      {/* 1. Header & Navigation Sub-Tabs */}
      <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="p-1.5 bg-[#1C1917] dark:bg-[#2A241F] text-[#D4AF37] border border-[#B88939]/30 rounded-md">
              <Layers className="w-4 h-4" />
            </span>
            <h2 className="text-lg sm:text-xl font-serif font-bold text-stone-900 dark:text-stone-100">
              Vocabulary & Flashcards
            </h2>
            <span className="text-[10px] font-mono font-semibold uppercase bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/40">
              Offline-First Deck
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-sans mt-1">
            Retain vocabulary acquired from conversation with structured review intervals.
          </p>
        </div>

        {/* Action Controls & Sub-tabs */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Sub-tab Switcher */}
          <div className="flex items-center bg-stone-100 dark:bg-[#24201C] p-0.5 rounded-lg border border-[#D8CFBF] dark:border-[#3D352B]">
            <button
              type="button"
              id="flashcard-tab-review"
              onClick={() => setActiveSubTab('review')}
              className={`px-3 py-1.5 rounded-md text-xs font-sans font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'review'
                  ? 'bg-white dark:bg-[#1C1917] text-stone-900 dark:text-[#D4AF37] shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Review Deck</span>
              {stats.due > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-pulse" />
              )}
            </button>
            <button
              type="button"
              id="flashcard-tab-browse"
              onClick={() => setActiveSubTab('browse')}
              className={`px-3 py-1.5 rounded-md text-xs font-sans font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'browse'
                  ? 'bg-white dark:bg-[#1C1917] text-stone-900 dark:text-[#D4AF37] shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>All Words ({languageFilteredVocab.length})</span>
            </button>
          </div>

          {/* Add Word Button */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            id="add-custom-word-btn"
            className="px-3 py-1.5 bg-stone-900 dark:bg-[#2A241F] text-[#D4AF37] hover:bg-stone-800 border border-[#B88939]/40 rounded-lg text-xs font-sans font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Word</span>
          </button>
        </div>
      </div>

      {/* 2. Language Filter Pills Bar */}
      <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg p-3 sm:p-4 shadow-xs space-y-2">
        <div className="flex items-center gap-1.5 text-[11px] font-sans font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter by Language</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* All Languages Pill */}
          <button
            type="button"
            onClick={() => {
              setSelectedLangFilter('all');
              handleRestartReview();
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-sans font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              selectedLangFilter === 'all'
                ? 'bg-[#1C1917] text-[#D4AF37] border-[#1C1917] shadow-xs'
                : 'bg-white dark:bg-[#24201C] text-stone-700 dark:text-stone-300 border-[#D8CFBF] dark:border-[#3D352B] hover:border-stone-400'
            }`}
          >
            <span>🌐 All Languages</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-stone-200/60 dark:bg-stone-800 rounded-full">
              {vocabulary.length}
            </span>
          </button>

          {/* Individual Language Filter Pills */}
          {availableLanguages.map((lang) => {
            const count = languageCounts[lang.code] || 0;
            if (count === 0 && selectedLangFilter !== lang.code && lang.code !== currentLanguage.code) {
              return null;
            }
            const isSelected = selectedLangFilter === lang.code;

            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setSelectedLangFilter(lang.code);
                  handleRestartReview();
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-sans font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-[#1C1917] text-[#D4AF37] border-[#1C1917] shadow-xs'
                    : 'bg-white dark:bg-[#24201C] text-stone-700 dark:text-stone-300 border-[#D8CFBF] dark:border-[#3D352B] hover:border-stone-400'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-stone-200/60 dark:bg-stone-800 rounded-full">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Learning Progress Statistics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Stat 1: Total Words Saved */}
        <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg p-3.5 shadow-xs">
          <div className="text-[11px] font-sans font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400" />
            <span>Total Words</span>
          </div>
          <div className="mt-1.5 text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
            {stats.total}
          </div>
          <div className="text-[10px] font-sans text-stone-500 dark:text-stone-400 mt-0.5">
            Saved across dialogue sessions
          </div>
        </div>

        {/* Stat 2: Words Due for Review */}
        <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg p-3.5 shadow-xs">
          <div className="text-[11px] font-sans font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Due for Review</span>
          </div>
          <div className="mt-1.5 text-2xl font-serif font-bold text-amber-900 dark:text-amber-300">
            {stats.due}
          </div>
          <div className="text-[10px] font-sans text-stone-500 dark:text-stone-400 mt-0.5">
            Scheduled for spaced recall
          </div>
        </div>

        {/* Stat 3: Words Reviewed */}
        <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg p-3.5 shadow-xs">
          <div className="text-[11px] font-sans font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Words Reviewed</span>
          </div>
          <div className="mt-1.5 text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
            {stats.reviewed}
          </div>
          <div className="text-[10px] font-sans text-stone-500 dark:text-stone-400 mt-0.5">
            Active recall attempts completed
          </div>
        </div>

        {/* Stat 4: Words Mastered */}
        <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg p-3.5 shadow-xs">
          <div className="text-[11px] font-sans font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Words Mastered</span>
          </div>
          <div className="mt-1.5 text-2xl font-serif font-bold text-emerald-800 dark:text-emerald-300">
            {stats.mastered}
          </div>
          <div className="text-[10px] font-sans text-stone-500 dark:text-stone-400 mt-0.5">
            Long-term retention achieved
          </div>
        </div>
      </div>

      {/* 4. Active Area: REVIEW MODE */}
      {activeSubTab === 'review' && (
        <section id="flashcard-review-area" className="space-y-4">
          {sessionCompleted ? (
            /* Session Completed Screen */
            <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-xl p-8 sm:p-12 text-center shadow-xs space-y-4 max-w-2xl mx-auto">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border border-emerald-300 dark:border-emerald-800">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
                Review Session Complete!
              </h3>
              <p className="text-sm font-sans text-stone-600 dark:text-stone-300 max-w-md mx-auto">
                You successfully reviewed {reviewedInSessionCount} vocabulary{' '}
                {reviewedInSessionCount === 1 ? 'card' : 'cards'}. Your intervals have been updated.
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleRestartReview(false)}
                  className="px-4 py-2.5 bg-white dark:bg-[#24201C] hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg text-xs font-sans font-semibold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Check Due Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRestartReview(true)}
                  className="px-4 py-2.5 bg-[#1C1917] hover:bg-stone-800 text-[#D4AF37] border border-[#B88939]/40 rounded-lg text-xs font-sans font-semibold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Layers className="w-4 h-4" />
                  <span>Review All Words Anyway</span>
                </button>
                {onSwitchToDialogue && (
                  <button
                    type="button"
                    onClick={onSwitchToDialogue}
                    className="px-4 py-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-200 rounded-lg text-xs font-sans font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Back to Conversation</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : reviewDeck.length === 0 ? (
            /* Empty State: No Words Saved in this category */
            <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-xl p-8 sm:p-12 text-center shadow-xs space-y-4 max-w-2xl mx-auto">
              <div className="w-12 h-12 mx-auto rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-bold text-stone-900 dark:text-stone-100">
                No Vocabulary Cards Found
              </h3>
              <p className="text-xs sm:text-sm font-sans text-stone-600 dark:text-stone-400 max-w-md mx-auto">
                Save words directly from your AI language conversations or click "Add Word" above to start building your personal deck.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 bg-[#1C1917] text-[#D4AF37] rounded-lg text-xs font-sans font-semibold border border-[#B88939]/30 hover:bg-stone-800 cursor-pointer shadow-xs"
                >
                  Add Your First Word
                </button>
                {onSwitchToDialogue && (
                  <button
                    type="button"
                    onClick={onSwitchToDialogue}
                    className="px-4 py-2 bg-white dark:bg-[#24201C] text-stone-800 dark:text-stone-200 border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg text-xs font-sans font-semibold hover:bg-stone-50 cursor-pointer shadow-xs"
                  >
                    Practice Conversation
                  </button>
                )}
              </div>
            </div>
          ) : !currentCard ? (
            /* Caught Up State */
            <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-xl p-8 sm:p-12 text-center shadow-xs space-y-4 max-w-2xl mx-auto">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/40">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-bold text-stone-900 dark:text-stone-100">
                All Caught Up!
              </h3>
              <p className="text-xs sm:text-sm font-sans text-stone-600 dark:text-stone-400 max-w-md mx-auto">
                No cards are currently due for spaced review in this selection. You can review all saved words anytime.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleRestartReview(true)}
                  className="px-4 py-2 bg-[#1C1917] text-[#D4AF37] rounded-lg text-xs font-sans font-semibold border border-[#B88939]/30 hover:bg-stone-800 cursor-pointer shadow-xs"
                >
                  Review All ({languageFilteredVocab.length}) Words
                </button>
              </div>
            </div>
          ) : (
            /* Interactive Flashcard */
            <div className="max-w-2xl mx-auto space-y-4">
              {/* Progress & Deck Info Bar */}
              <div className="flex items-center justify-between text-xs font-sans text-stone-500 dark:text-stone-400 px-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-stone-800 dark:text-stone-200">
                    Card {currentCardIndex + 1} of {reviewDeck.length}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-100 dark:bg-[#24201C] border border-[#D8CFBF] dark:border-[#3D352B]">
                    {currentCard.language}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="capitalize text-[11px] font-mono">
                    Status: {currentCard.reviewStatus}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1C1917] dark:bg-[#D4AF37] transition-all duration-300"
                  style={{
                    width: `${((currentCardIndex + 1) / reviewDeck.length) * 100}%`,
                  }}
                />
              </div>

              {/* The Flip Card Container */}
              <div
                id="interactive-flashcard"
                role="button"
                tabIndex={0}
                aria-label="Vocabulary Flashcard. Click or tap to reveal translation and details."
                onClick={() => setIsCardFlipped((prev) => !prev)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsCardFlipped((prev) => !prev);
                  }
                }}
                className={`w-full min-h-[300px] sm:min-h-[340px] rounded-2xl p-6 sm:p-8 flex flex-col justify-between cursor-pointer select-none transition-all duration-300 border shadow-md relative ${
                  isCardFlipped
                    ? 'bg-white dark:bg-[#221E1A] border-[#B88939] dark:border-[#B88939]/70 ring-1 ring-[#B88939]/30'
                    : 'bg-[#FDFBF7] dark:bg-[#1C1917] border-[#D8CFBF] dark:border-[#3D352B] hover:border-stone-400 dark:hover:border-stone-600'
                }`}
              >
                {/* Card Top: Audio & Hint */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {languageMap.get(currentCard.languageCode)?.flag || '🌐'}
                    </span>
                    <span className="text-xs font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400">
                      {currentCard.language}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSpeakWord(currentCard.word, currentCard.languageCode);
                    }}
                    className="p-2 rounded-lg bg-stone-100 dark:bg-[#2A241F] text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-[#D4AF37] border border-stone-200 dark:border-[#3D352B] transition-colors cursor-pointer"
                    title="Listen to native audio pronunciation"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Card Center: Word & Revealed Details */}
                <div className="py-6 sm:py-8 text-center space-y-4">
                  {/* Front: Word/Phrase */}
                  <div>
                    <h3 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight leading-tight">
                      {currentCard.word}
                    </h3>
                  </div>

                  {/* Back / Revealed section: Translation, Pronunciation, Example */}
                  {isCardFlipped ? (
                    <div className="pt-4 border-t border-stone-200 dark:border-[#3D352B] space-y-3 animate-fade-in">
                      {/* Translation */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                          Translation
                        </span>
                        <div className="text-lg sm:text-xl font-sans font-bold text-emerald-800 dark:text-emerald-300">
                          {currentCard.translation}
                        </div>
                      </div>

                      {/* Pronunciation guide */}
                      {currentCard.pronunciation && (
                        <div className="text-xs font-mono text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-[#181513] py-1.5 px-3 rounded-md inline-block border border-stone-200 dark:border-[#3D352B]">
                          🗣️ {currentCard.pronunciation}
                        </div>
                      )}

                      {/* Example sentence */}
                      {currentCard.exampleSentence && (
                        <div className="pt-2 max-w-lg mx-auto text-xs sm:text-sm font-sans italic text-stone-700 dark:text-stone-300 bg-[#FDFBF7] dark:bg-[#181513] p-3 rounded-lg border border-[#EAE3D5] dark:border-[#3D352B]">
                          "{currentCard.exampleSentence}"
                        </div>
                      )}

                      {/* Additional context / notes */}
                      {currentCard.notes && !currentCard.exampleSentence?.includes(currentCard.notes) && (
                        <div className="text-[11px] font-sans text-stone-500 dark:text-stone-400">
                          Note: {currentCard.notes}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs font-sans text-stone-400 dark:text-stone-500 flex items-center justify-center gap-1.5 pt-4">
                      <span>Click or tap card to reveal translation & example</span>
                    </div>
                  )}
                </div>

                {/* Card Bottom: Review count metadata */}
                <div className="flex items-center justify-between text-[11px] font-mono text-stone-400 border-t border-stone-100 dark:border-[#2C2620] pt-2">
                  <span>Reviewed: {currentCard.reviewCount}x</span>
                  <span>Streak: {currentCard.consecutiveCorrect}</span>
                </div>
              </div>

              {/* 5. Rating Controls: Again, Hard, Good, Easy */}
              <div className="space-y-2">
                <div className="text-center text-xs font-sans font-semibold text-stone-500 dark:text-stone-400">
                  {isCardFlipped ? 'Rate your recall accuracy:' : 'Reveal the card above to submit your rating'}
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {/* Again (Failed recall) */}
                  <button
                    type="button"
                    id="flashcard-btn-again"
                    disabled={!isCardFlipped}
                    onClick={() => handleRateCard('again')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      isCardFlipped
                        ? 'bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800/60 shadow-xs active:scale-95'
                        : 'bg-stone-100 dark:bg-stone-800/50 text-stone-400 dark:text-stone-600 border-stone-200 dark:border-stone-800 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <span className="font-bold text-xs sm:text-sm">Again</span>
                    <span className="text-[10px] font-mono opacity-80">&lt; 5m</span>
                  </button>

                  {/* Hard (Struggled recall) */}
                  <button
                    type="button"
                    id="flashcard-btn-hard"
                    disabled={!isCardFlipped}
                    onClick={() => handleRateCard('hard')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      isCardFlipped
                        ? 'bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800/60 shadow-xs active:scale-95'
                        : 'bg-stone-100 dark:bg-stone-800/50 text-stone-400 dark:text-stone-600 border-stone-200 dark:border-stone-800 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <span className="font-bold text-xs sm:text-sm">Hard</span>
                    <span className="text-[10px] font-mono opacity-80">12h</span>
                  </button>

                  {/* Good (Correct recall) */}
                  <button
                    type="button"
                    id="flashcard-btn-good"
                    disabled={!isCardFlipped}
                    onClick={() => handleRateCard('good')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      isCardFlipped
                        ? 'bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-800 dark:text-sky-200 border-sky-300 dark:border-sky-800/60 shadow-xs active:scale-95'
                        : 'bg-stone-100 dark:bg-stone-800/50 text-stone-400 dark:text-stone-600 border-stone-200 dark:border-stone-800 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <span className="font-bold text-xs sm:text-sm">Good</span>
                    <span className="text-[10px] font-mono opacity-80">1–3d</span>
                  </button>

                  {/* Easy (Instant recall) */}
                  <button
                    type="button"
                    id="flashcard-btn-easy"
                    disabled={!isCardFlipped}
                    onClick={() => handleRateCard('easy')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      isCardFlipped
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800/60 shadow-xs active:scale-95'
                        : 'bg-stone-100 dark:bg-stone-800/50 text-stone-400 dark:text-stone-600 border-stone-200 dark:border-stone-800 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <span className="font-bold text-xs sm:text-sm">Easy</span>
                    <span className="text-[10px] font-mono opacity-80">4–10d</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 5. Active Area: BROWSE ALL WORDS GRID */}
      {activeSubTab === 'browse' && (
        <section id="flashcard-browse-area" className="space-y-4">
          {/* Search & Status Filters */}
          <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search word, meaning, example..."
                className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-[#24201C] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg text-xs font-sans text-stone-800 dark:text-stone-200 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-600 shadow-2xs"
              />
            </div>

            {/* Status Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
              {['all', 'due', 'learning', 'mastered', 'new'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold uppercase tracking-wider transition-colors cursor-pointer border ${
                    statusFilter === st
                      ? 'bg-[#1C1917] text-[#D4AF37] border-[#1C1917]'
                      : 'bg-white dark:bg-[#24201C] text-stone-600 dark:text-stone-300 border-[#D8CFBF] dark:border-[#3D352B] hover:border-stone-400'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          {browseItems.length === 0 ? (
            <div className="p-8 text-center bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg text-stone-500 text-xs">
              No vocabulary words match your search or filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {browseItems.map((item) => {
                const langOpt = languageMap.get(item.languageCode);
                const isDue = isCardDue(item);

                return (
                  <div
                    key={item.id}
                    className="p-4 bg-white dark:bg-[#24201C] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg shadow-xs hover:border-stone-400 dark:hover:border-stone-500 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      {/* Top Bar: Flag, Status, Actions */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span>{langOpt?.flag || '🌐'}</span>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400">
                            {item.language}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <span
                            className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded border ${
                              item.reviewStatus === 'mastered'
                                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                : item.reviewStatus === 'learning'
                                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700'
                            }`}
                          >
                            {item.reviewStatus}
                          </span>
                          {isDue && (
                            <span className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                              Due
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteWord(item.id)}
                            className="p-1 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                            title="Remove word"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Word & Audio */}
                      <div className="flex items-start justify-between gap-2 mt-2">
                        <h4 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-stone-100">
                          {item.word}
                        </h4>
                        <button
                          type="button"
                          onClick={() => handleSpeakWord(item.word, item.languageCode)}
                          className="p-1 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-[#D4AF37] cursor-pointer"
                          title="Listen pronunciation"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Translation */}
                      <div className="text-xs font-sans font-semibold text-emerald-800 dark:text-emerald-300 mt-0.5">
                        {item.translation}
                      </div>

                      {/* Pronunciation */}
                      {item.pronunciation && (
                        <div className="text-[11px] font-mono text-stone-500 dark:text-stone-400 mt-1">
                          🗣️ {item.pronunciation}
                        </div>
                      )}

                      {/* Example */}
                      {item.exampleSentence && (
                        <div className="text-[11px] font-sans italic text-stone-600 dark:text-stone-400 mt-2 bg-stone-50 dark:bg-[#1C1917] p-2 rounded border border-stone-200 dark:border-[#3D352B]">
                          "{item.exampleSentence}"
                        </div>
                      )}
                    </div>

                    {/* Footer metadata */}
                    <div className="text-[10px] font-mono text-stone-400 border-t border-stone-100 dark:border-stone-800/60 pt-2 flex items-center justify-between">
                      <span>Reviewed: {item.reviewCount}x</span>
                      <span>
                        Added: {new Date(item.dateAdded).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* 6. Modal: Add New Vocabulary Word Manually */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FDFBF7] dark:bg-[#1C1917] border border-[#D8CFBF] dark:border-[#3D352B] rounded-xl max-w-md w-full p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE3D5] dark:border-[#2E2820] pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-stone-700 dark:text-stone-300" />
                <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-stone-100">
                  Add Vocabulary Item
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWord} className="space-y-3">
              {/* Language Choice */}
              <div>
                <label className="block text-[11px] font-sans font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                  Language
                </label>
                <select
                  value={newLangCode}
                  onChange={(e) => setNewLangCode(e.target.value as any)}
                  className="w-full text-xs font-sans px-3 py-2 bg-white dark:bg-[#24201C] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none"
                >
                  {availableLanguages.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.flag} {l.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Word/Phrase */}
              <div>
                <label className="block text-[11px] font-sans font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                  Word / Phrase *
                </label>
                <input
                  type="text"
                  required
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  placeholder="e.g. Die Gemütlichkeit or Aisance"
                  className="w-full text-xs font-sans px-3 py-2 bg-white dark:bg-[#24201C] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-600 shadow-2xs"
                />
              </div>

              {/* Translation */}
              <div>
                <label className="block text-[11px] font-sans font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                  English Translation *
                </label>
                <input
                  type="text"
                  required
                  value={newTranslation}
                  onChange={(e) => setNewTranslation(e.target.value)}
                  placeholder="e.g. Cozy comfort / conviviality"
                  className="w-full text-xs font-sans px-3 py-2 bg-white dark:bg-[#24201C] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-600 shadow-2xs"
                />
              </div>

              {/* Pronunciation */}
              <div>
                <label className="block text-[11px] font-sans font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                  Pronunciation / Phonetics (Optional)
                </label>
                <input
                  type="text"
                  value={newPronunciation}
                  onChange={(e) => setNewPronunciation(e.target.value)}
                  placeholder="e.g. geh-MYOOT-likh-kite"
                  className="w-full text-xs font-sans px-3 py-2 bg-white dark:bg-[#24201C] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-600 shadow-2xs"
                />
              </div>

              {/* Example Sentence */}
              <div>
                <label className="block text-[11px] font-sans font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1">
                  Example Sentence (Optional)
                </label>
                <textarea
                  rows={2}
                  value={newExample}
                  onChange={(e) => setNewExample(e.target.value)}
                  placeholder="e.g. Im Winter schätze ich die Gemütlichkeit am Kamin."
                  className="w-full text-xs font-sans px-3 py-2 bg-white dark:bg-[#24201C] border border-[#D8CFBF] dark:border-[#3D352B] rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-600 shadow-2xs"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 text-xs font-sans font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1C1917] hover:bg-stone-800 text-[#D4AF37] border border-[#B88939]/40 rounded-lg text-xs font-sans font-semibold transition-all shadow-xs cursor-pointer"
                >
                  Save to Deck
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
