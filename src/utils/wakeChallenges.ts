import { WakeAlarmDifficulty, WakeChallengeType } from '../types';

export interface MathChallengeData {
  question: string;
  answer: number;
}

export interface MemoryChallengeData {
  sequence: number[]; // e.g. [1, 3, 0, 2] corresponding to 4 tiles
  totalTiles: number;
}

export interface PhraseChallengeData {
  phrase: string;
  author?: string;
}

export interface VocabularyChallengeData {
  word: string;
  definition: string;
  options: string[]; // 4 choices, one of which is definition
  correctIndex: number;
}

// Curated inspiring phrases for typing challenge
const EASY_PHRASES: PhraseChallengeData[] = [
  { phrase: 'Wake up with purpose and daily focus.', author: 'Morning Discipline' },
  { phrase: 'Today is a brand new canvas to excel.', author: 'Intentional Living' },
  { phrase: 'Consistency transforms ordinary into excellence.', author: 'Mastery Habit' },
  { phrase: 'Energy flows wherever clear focus goes.', author: 'Strategic Mind' },
  { phrase: 'Begin the day with clarity and resolve.', author: 'Peak State' },
];

const MEDIUM_PHRASES: PhraseChallengeData[] = [
  { phrase: 'Small daily disciplines compound into massive lifelong results.', author: 'The Slight Edge' },
  { phrase: 'The secret of getting ahead is simply taking the first step.', author: 'Mark Twain' },
  { phrase: 'Action is the foundational key to all genuine accomplishment.', author: 'Pablo Picasso' },
  { phrase: 'Focus on being productive rather than merely being busy.', author: 'Tim Ferriss' },
  { phrase: 'Discipline is choosing between what you want now and what you want most.', author: 'Abraham Lincoln' },
];

const HARD_PHRASES: PhraseChallengeData[] = [
  { phrase: 'Excellence is never an accident; it is the culmination of deliberate high intention.', author: 'Aristotle' },
  { phrase: 'We don’t rise to the level of our expectations, we fall to the level of our daily training.', author: 'Archilochus' },
  { phrase: 'He who has a why to live can bear almost any how in the pursuit of his grand vision.', author: 'Friedrich Nietzsche' },
  { phrase: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill' },
];

// Curated vocabulary items for wake vocabulary challenge
interface VocabItem {
  word: string;
  definition: string;
  distractors: string[];
}

const EASY_VOCAB: VocabItem[] = [
  {
    word: 'Diligent',
    definition: 'Showing steady, earnest, and energetic effort',
    distractors: ['Acting in a hasty or careless way', 'Uninterested in results', 'Easily discouraged by obstacles'],
  },
  {
    word: 'Clarity',
    definition: 'The quality of being clear, easily understood, and free from confusion',
    distractors: ['A state of heavy exhaustion', 'Excessive complexity in thought', 'Hesitation when deciding'],
  },
  {
    word: 'Resilience',
    definition: 'The capacity to recover quickly from difficulties and adapt',
    distractors: ['A stubborn refusal to change plans', 'A fragile emotional disposition', 'Passive acceptance of defeat'],
  },
  {
    word: 'Pivotal',
    definition: 'Of crucial importance in relation to the development or success of something',
    distractors: ['Of little or no consequence', 'Occurring strictly on weekends', 'Completely accidental and trivial'],
  },
];

const MEDIUM_VOCAB: VocabItem[] = [
  {
    word: 'Tenacious',
    definition: 'Persistent, resolute, and refusing to let go of an objective',
    distractors: ['Easily distracted by novel stimuli', 'Overly dependent on external validation', 'Tentative and cautious to act'],
  },
  {
    word: 'Fortitude',
    definition: 'Courage in facing pain, adversity, or continuous struggle',
    distractors: ['Physical speed and rapid mobility', 'Arrogant boasting before a challenge', 'Indifference toward outcome'],
  },
  {
    word: 'Pragmatic',
    definition: 'Dealing with matters sensibly and realistically based on practical factors',
    distractors: ['Governed by theoretical fantasy', 'Excessively emotional in execution', 'Hesitant to commit to timelines'],
  },
  {
    word: 'Meticulous',
    definition: 'Showing great attention to detail and precision',
    distractors: ['Rushing without reviewing notes', 'Disorganized in daily workflow', 'Casual about deadlines'],
  },
];

const HARD_VOCAB: VocabItem[] = [
  {
    word: 'Sagacious',
    definition: 'Having or showing keen mental discernment, good judgment, and wisdom',
    distractors: ['Deceptively simple in appearance', 'Easily persuaded by popular consensus', 'Prone to reckless speculation'],
  },
  {
    word: 'Equanimity',
    definition: 'Mental calmness, composure, and evenness of temper, especially in difficult situations',
    distractors: ['Dramatic swings of intense emotion', 'Total lack of interest or passion', 'Blind optimism without preparation'],
  },
  {
    word: 'Perspicacity',
    definition: 'The ability to understand things quickly and make accurate judgments',
    distractors: ['A tendency to procrastinate under stress', 'Reluctance to acknowledge error', 'Superficial memorization of facts'],
  },
  {
    word: 'Alacrity',
    definition: 'Brisk, cheerful readiness and eagerness to engage in a task',
    distractors: ['Lethargic and reluctant compliance', 'Fearful avoidance of responsibility', 'Suspicious skepticism'],
  },
];

// 1. Math Generator
export function generateMathChallenge(difficulty: WakeAlarmDifficulty): MathChallengeData {
  if (difficulty === 'easy') {
    const op = Math.random() > 0.5 ? '+' : '-';
    if (op === '+') {
      const a = Math.floor(Math.random() * 35) + 12;
      const b = Math.floor(Math.random() * 35) + 11;
      return { question: `${a} + ${b}`, answer: a + b };
    } else {
      const a = Math.floor(Math.random() * 45) + 30;
      const b = Math.floor(Math.random() * 25) + 10;
      return { question: `${a} - ${b}`, answer: a - b };
    }
  } else if (difficulty === 'medium') {
    const type = Math.floor(Math.random() * 3);
    if (type === 0) {
      // Multiplication + addition
      const a = Math.floor(Math.random() * 8) + 6; // 6 - 13
      const b = Math.floor(Math.random() * 7) + 4; // 4 - 10
      const c = Math.floor(Math.random() * 25) + 10;
      return { question: `(${a} × ${b}) + ${c}`, answer: a * b + c };
    } else if (type === 1) {
      // 3 numbers addition / subtraction
      const a = Math.floor(Math.random() * 40) + 25;
      const b = Math.floor(Math.random() * 40) + 15;
      const c = Math.floor(Math.random() * 20) + 10;
      return { question: `${a} + ${b} - ${c}`, answer: a + b - c };
    } else {
      // Direct multiplication
      const a = Math.floor(Math.random() * 12) + 7;
      const b = Math.floor(Math.random() * 12) + 7;
      return { question: `${a} × ${b}`, answer: a * b };
    }
  } else {
    // Hard
    const type = Math.random() > 0.5 ? 0 : 1;
    if (type === 0) {
      const a = Math.floor(Math.random() * 14) + 12; // 12 - 25
      const b = Math.floor(Math.random() * 14) + 11; // 11 - 24
      return { question: `${a} × ${b}`, answer: a * b };
    } else {
      const a = Math.floor(Math.random() * 180) + 120;
      const b = Math.floor(Math.random() * 160) + 80;
      const c = Math.floor(Math.random() * 60) + 30;
      return { question: `${a} + ${b} - ${c}`, answer: a + b - c };
    }
  }
}

// 2. Memory Sequence Generator
export function generateMemoryChallenge(difficulty: WakeAlarmDifficulty): MemoryChallengeData {
  const steps = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 5 : 6;
  const totalTiles = 4;
  const sequence: number[] = [];

  for (let i = 0; i < steps; i++) {
    // avoid more than 2 repeats in a row
    let next = Math.floor(Math.random() * totalTiles);
    if (i >= 2 && sequence[i - 1] === next && sequence[i - 2] === next) {
      next = (next + 1) % totalTiles;
    }
    sequence.push(next);
  }

  return { sequence, totalTiles };
}

// 3. Phrase Challenge Generator
export function generatePhraseChallenge(difficulty: WakeAlarmDifficulty): PhraseChallengeData {
  const pool =
    difficulty === 'easy' ? EASY_PHRASES : difficulty === 'medium' ? MEDIUM_PHRASES : HARD_PHRASES;
  const item = pool[Math.floor(Math.random() * pool.length)];
  return item;
}

// 4. Vocabulary Challenge Generator
export function generateVocabularyChallenge(difficulty: WakeAlarmDifficulty): VocabularyChallengeData {
  const pool =
    difficulty === 'easy' ? EASY_VOCAB : difficulty === 'medium' ? MEDIUM_VOCAB : HARD_VOCAB;
  const item = pool[Math.floor(Math.random() * pool.length)];

  // Shuffle definition with distractors
  const allOptions = [item.definition, ...item.distractors];
  // Fisher-yates shuffle
  for (let i = allOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
  }

  const correctIndex = allOptions.indexOf(item.definition);

  return {
    word: item.word,
    definition: item.definition,
    options: allOptions,
    correctIndex,
  };
}
