import { SavedVocabularyItem, ReviewRating, VocabularyStats, TargetLanguageCode } from '../types';

export const VOCABULARY_STORAGE_KEY = 'mw_v2_vocabulary';

// Seed starter vocabulary items so the flashcard interface is immediately useful and demonstrable
const INITIAL_STARTER_VOCABULARY: SavedVocabularyItem[] = [
  {
    id: 'vocab-init-1',
    word: 'Fluidez',
    translation: 'Fluency / ease of expression',
    pronunciation: 'floo-ee-DETH',
    exampleSentence: 'La práctica diaria es fundamental para alcanzar una fluidez auténtica.',
    language: 'Spanish',
    languageCode: 'es',
    dateAdded: Date.now() - 86400000 * 2,
    reviewStatus: 'new',
    nextReviewDate: Date.now() - 3600000,
    reviewCount: 0,
    consecutiveCorrect: 0,
    notes: 'Key objective in language mastery',
  },
  {
    id: 'vocab-init-2',
    word: 'Perfeccionar',
    translation: 'To perfect / polish',
    pronunciation: 'pair-fek-thyo-NAHR',
    exampleSentence: 'Quiero perfeccionar mi acento y pronunciación cada mañana.',
    language: 'Spanish',
    languageCode: 'es',
    dateAdded: Date.now() - 86400000 * 1,
    reviewStatus: 'learning',
    lastReviewed: Date.now() - 86400000 * 1,
    nextReviewDate: Date.now() - 1800000,
    reviewCount: 1,
    consecutiveCorrect: 1,
    notes: 'Expresses refined linguistic craft',
  },
  {
    id: 'vocab-init-3',
    word: 'Ausdrucksfähigkeit',
    translation: 'Expressive ability / articulacy',
    pronunciation: 'OWS-drooks-fay-ikh-kite',
    exampleSentence: 'Regelmäßiges Lesen erweitert die persönliche Ausdrucksfähigkeit ungemein.',
    language: 'German',
    languageCode: 'de',
    dateAdded: Date.now() - 86400000 * 3,
    reviewStatus: 'mastered',
    lastReviewed: Date.now() - 86400000 * 2,
    nextReviewDate: Date.now() + 86400000 * 5,
    reviewCount: 4,
    consecutiveCorrect: 3,
    notes: 'Compound noun: Ausdruck + Fähigkeit',
  },
  {
    id: 'vocab-init-4',
    word: 'Aisance',
    translation: 'Ease / fluidity / poise',
    pronunciation: 'eh-ZAHNS',
    exampleSentence: "Elle s'exprime avec une aisance remarquable lors des réunions.",
    language: 'French',
    languageCode: 'fr',
    dateAdded: Date.now() - 86400000 * 2,
    reviewStatus: 'new',
    nextReviewDate: Date.now() - 10000,
    reviewCount: 0,
    consecutiveCorrect: 0,
    notes: 'Sign of authentic mastery in French',
  },
];

/**
 * Load all saved vocabulary items from localStorage.
 */
export function loadSavedVocabulary(): SavedVocabularyItem[] {
  try {
    const raw = localStorage.getItem(VOCABULARY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load vocabulary from storage:', err);
  }
  // If first time, initialize with starter items
  saveVocabulary(INITIAL_STARTER_VOCABULARY);
  return INITIAL_STARTER_VOCABULARY;
}

/**
 * Persist vocabulary items to localStorage.
 */
export function saveVocabulary(items: SavedVocabularyItem[]): void {
  try {
    localStorage.setItem(VOCABULARY_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to persist vocabulary to storage:', err);
  }
}

/**
 * Check if a word is already saved in the user's vocabulary for a given language.
 */
export function isWordSaved(
  word: string,
  languageCode: string,
  items: SavedVocabularyItem[]
): boolean {
  const normalizedWord = word.trim().toLowerCase();
  return items.some(
    (item) =>
      item.languageCode.toLowerCase() === languageCode.toLowerCase() &&
      item.word.trim().toLowerCase() === normalizedWord
  );
}

/**
 * Find existing saved item by word & language.
 */
export function findSavedItem(
  word: string,
  languageCode: string,
  items: SavedVocabularyItem[]
): SavedVocabularyItem | undefined {
  const normalizedWord = word.trim().toLowerCase();
  return items.find(
    (item) =>
      item.languageCode.toLowerCase() === languageCode.toLowerCase() &&
      item.word.trim().toLowerCase() === normalizedWord
  );
}

/**
 * Add or update a vocabulary item.
 */
export function saveVocabularyItem(
  item: {
    word: string;
    translation: string;
    pronunciation?: string;
    exampleSentence?: string;
    language: string;
    languageCode: TargetLanguageCode | string;
    notes?: string;
  },
  currentItems: SavedVocabularyItem[]
): { updatedItems: SavedVocabularyItem[]; item: SavedVocabularyItem; isNew: boolean } {
  const existing = findSavedItem(item.word, item.languageCode, currentItems);
  const now = Date.now();

  if (existing) {
    // Update existing item fields while preserving review history
    const updated: SavedVocabularyItem = {
      ...existing,
      translation: item.translation || existing.translation,
      pronunciation: item.pronunciation || existing.pronunciation,
      exampleSentence: item.exampleSentence || existing.exampleSentence,
      notes: item.notes || existing.notes,
    };
    const updatedList = currentItems.map((i) => (i.id === existing.id ? updated : i));
    saveVocabulary(updatedList);
    return { updatedItems: updatedList, item: updated, isNew: false };
  }

  // Create new item
  const newItem: SavedVocabularyItem = {
    id: `vocab-${now}-${Math.random().toString(36).slice(2, 7)}`,
    word: item.word.trim(),
    translation: item.translation.trim(),
    pronunciation: item.pronunciation?.trim(),
    exampleSentence: item.exampleSentence?.trim(),
    language: item.language,
    languageCode: item.languageCode,
    dateAdded: now,
    reviewStatus: 'new',
    nextReviewDate: now, // immediately due for initial review
    reviewCount: 0,
    consecutiveCorrect: 0,
    notes: item.notes?.trim(),
  };

  const updatedList = [newItem, ...currentItems];
  saveVocabulary(updatedList);
  return { updatedItems: updatedList, item: newItem, isNew: true };
}

/**
 * Remove a vocabulary item by ID.
 */
export function removeVocabularyItem(
  id: string,
  currentItems: SavedVocabularyItem[]
): SavedVocabularyItem[] {
  const updatedList = currentItems.filter((i) => i.id !== id);
  saveVocabulary(updatedList);
  return updatedList;
}

/**
 * Check if a card is currently due for review.
 */
export function isCardDue(item: SavedVocabularyItem, now = Date.now()): boolean {
  if (item.reviewStatus === 'new') return true;
  return item.nextReviewDate <= now;
}

/**
 * Process a user rating for a flashcard and update interval & status.
 * Rating options: 'again' | 'hard' | 'good' | 'easy'
 */
export function rateFlashcard(
  item: SavedVocabularyItem,
  rating: ReviewRating
): SavedVocabularyItem {
  const now = Date.now();
  const ONE_MINUTE = 60 * 1000;
  const ONE_HOUR = 60 * ONE_MINUTE;
  const ONE_DAY = 24 * ONE_HOUR;

  let nextIntervalMs: number;
  let newConsecutive = item.consecutiveCorrect;
  let newStatus = item.reviewStatus;

  switch (rating) {
    case 'again': {
      // Failed card: reset consecutive correct, repeat in 5 minutes
      newConsecutive = 0;
      nextIntervalMs = 5 * ONE_MINUTE;
      newStatus = 'learning';
      break;
    }
    case 'hard': {
      // Hard recall: keep consecutive, schedule in 12 hours
      newConsecutive = Math.max(0, item.consecutiveCorrect);
      nextIntervalMs = 12 * ONE_HOUR;
      newStatus = 'learning';
      break;
    }
    case 'good': {
      // Successful recall: advance consecutive streak
      newConsecutive = item.consecutiveCorrect + 1;
      if (newConsecutive === 1) {
        nextIntervalMs = 1 * ONE_DAY;
      } else if (newConsecutive === 2) {
        nextIntervalMs = 3 * ONE_DAY;
      } else {
        nextIntervalMs = 7 * ONE_DAY;
      }
      newStatus = newConsecutive >= 3 ? 'mastered' : 'review';
      break;
    }
    case 'easy': {
      // Very easy: double boost streak
      newConsecutive = item.consecutiveCorrect + 2;
      if (newConsecutive <= 2) {
        nextIntervalMs = 3 * ONE_DAY;
      } else {
        nextIntervalMs = 10 * ONE_DAY;
      }
      newStatus = newConsecutive >= 2 ? 'mastered' : 'review';
      break;
    }
  }

  return {
    ...item,
    lastReviewed: now,
    nextReviewDate: now + nextIntervalMs,
    reviewCount: item.reviewCount + 1,
    consecutiveCorrect: newConsecutive,
    reviewStatus: newStatus,
  };
}

/**
 * Calculate vocabulary statistics for an array of items.
 */
export function calculateVocabularyStats(
  items: SavedVocabularyItem[],
  now = Date.now()
): VocabularyStats {
  const total = items.length;
  let reviewed = 0;
  let mastered = 0;
  let due = 0;

  for (const item of items) {
    if (item.reviewCount > 0) {
      reviewed++;
    }
    if (item.reviewStatus === 'mastered') {
      mastered++;
    }
    if (isCardDue(item, now)) {
      due++;
    }
  }

  return { total, reviewed, mastered, due };
}
