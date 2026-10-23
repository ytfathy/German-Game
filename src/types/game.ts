/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type QuestionType = 'multiple_choice' | 'true_false' | 'fill_blank' | 'order_sentence';

export interface Question {
  id: string;
  levelId: number;
  type: QuestionType;
  prompt: string;
  promptEnglish?: string;
  options: string[];
  correctAnswer: string | number; // index (number) for multiple_choice/true_false, string for fill_blank, or ordered array string
  explanation: string;
  hint?: string;
  category: 'vocabulary' | 'grammar' | 'listening' | 'reading' | 'culture';
  audioText?: string; // German text to read aloud for listening questions
  sourceRef?: string; // Internal resource citation for verification (e.g. DOC-20261023-WA0020 p.9)
}

export interface SpeakingCheckpoint {
  id: string;
  levelId: number;
  sentence: string;
  englishTranslation: string;
  phoneticHint?: string;
  difficulty: 'A1' | 'A2' | 'B1';
  tips?: string;
  sourceRef?: string;
}

export interface ReadingLesson {
  id: string;
  levelId: number;
  title: string;
  germanTitle: string;
  topic: string;
  passage: string;
  sentences: string[];
  vocabulary: { german: string; english: string; example?: string }[];
  questions: Question[];
  sourceRef?: string;
}

export interface LevelConfig {
  id: number;
  number: number;
  title: string;
  germanTitle: string;
  theme: string;
  description: string;
  targetTopics: string[];
  trackLength: number; // in meters (e.g., 1200)
  checkpointsCount: number; // how many question checkpoints
  sceneryTheme: 'black_forest' | 'alps' | 'autobahn' | 'nurburgring' | 'berlin_city';
  skyColor: number;
  fogColor: number;
  unlockedByDefault: boolean;
  requiredStars: number;
  isQuizLevel?: boolean;
}

export interface CarModel {
  id: string;
  name: string;
  germanName: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  topSpeed: number; // in km/h (e.g. 180 to 240)
  acceleration: number; // 0-1 scale
  handling: number; // 0-1 scale
  unlockedByDefault: boolean;
  requiredStars: number;
}

export interface MistakeRecord {
  question: Question;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
}

export interface StudentScoreRecord {
  id: string;
  timestamp: number;
  levelNumber: number;
  score: number;
  stars: number;
  accuracy: number;
  timeSpentSeconds: number;
  mistakesCount: number;
}

export interface UserProgress {
  selectedCarId: string;
  completedLevels: Record<number, { completed: boolean; bestScore: number; stars: number; bestAccuracy: number }>;
  totalStars: number;
  totalScore: number;
  totalRaces: number;
  learnedWordsCount: number;
  pronunciationPracticesCount: number;
  scoreHistory: StudentScoreRecord[];
  teacherConfig: {
    questionsPerRace: number;
    speakingCheckpointsEnabled: boolean;
    voicePlaybackSpeed: number;
    customQuestions: Question[];
    customSpeaking: SpeakingCheckpoint[];
  };
}

export type AppScreen =
  | 'title'
  | 'garage'
  | 'level_select'
  | 'racing'
  | 'reading_lessons'
  | 'teacher_dashboard'
  | 'quiz';

export type RacingSubState =
  | 'countdown'
  | 'driving'
  | 'approaching_checkpoint'
  | 'checkpoint_question'
  | 'checkpoint_feedback'
  | 'speaking_checkpoint'
  | 'paused'
  | 'finished';
