/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProgress, StudentScoreRecord, Question, SpeakingCheckpoint } from '../types/game';

const STORAGE_KEY = 'deutsch_racer_user_progress_v1';

const DEFAULT_PROGRESS: UserProgress = {
  selectedCarId: 'silberpfeil_gt',
  completedLevels: {
    1: { completed: false, bestScore: 0, stars: 0, bestAccuracy: 0 },
  },
  totalStars: 0,
  totalScore: 0,
  totalRaces: 0,
  learnedWordsCount: 0,
  pronunciationPracticesCount: 0,
  scoreHistory: [],
  teacherConfig: {
    questionsPerRace: 4,
    speakingCheckpointsEnabled: true,
    voicePlaybackSpeed: 0.95,
    customQuestions: [],
    customSpeaking: [],
  },
};

export class StorageService {
  public static loadProgress(): UserProgress {
    if (typeof window === 'undefined') return DEFAULT_PROGRESS;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_PROGRESS;
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_PROGRESS,
        ...parsed,
        completedLevels: {
          ...DEFAULT_PROGRESS.completedLevels,
          ...(parsed.completedLevels || {}),
        },
        teacherConfig: {
          ...DEFAULT_PROGRESS.teacherConfig,
          ...(parsed.teacherConfig || {}),
        },
      };
    } catch {
      return DEFAULT_PROGRESS;
    }
  }

  public static saveProgress(progress: UserProgress): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.warn('Failed to save progress to localStorage', e);
    }
  }

  public static recordRaceCompletion(
    levelNumber: number,
    score: number,
    stars: number,
    accuracy: number,
    timeSpentSeconds: number,
    mistakesCount: number
  ): UserProgress {
    const current = this.loadProgress();

    const record: StudentScoreRecord = {
      id: 'race_' + Date.now(),
      timestamp: Date.now(),
      levelNumber,
      score,
      stars,
      accuracy,
      timeSpentSeconds,
      mistakesCount,
    };

    const prevLevel = current.completedLevels[levelNumber] || {
      completed: false,
      bestScore: 0,
      stars: 0,
      bestAccuracy: 0,
    };

    const newBestStars = Math.max(prevLevel.stars, stars);
    const newBestScore = Math.max(prevLevel.bestScore, score);
    const newBestAccuracy = Math.max(prevLevel.bestAccuracy, accuracy);

    // Calculate total stars across all levels
    const updatedLevels = {
      ...current.completedLevels,
      [levelNumber]: {
        completed: true,
        bestScore: newBestScore,
        stars: newBestStars,
        bestAccuracy: newBestAccuracy,
      },
    };

    let totalStars = 0;
    Object.values(updatedLevels).forEach((lvl) => {
      totalStars += lvl.stars;
    });

    const updated: UserProgress = {
      ...current,
      completedLevels: updatedLevels,
      totalStars,
      totalScore: current.totalScore + score,
      totalRaces: current.totalRaces + 1,
      scoreHistory: [record, ...current.scoreHistory].slice(0, 50),
    };

    this.saveProgress(updated);
    return updated;
  }

  public static updateSelectedCar(carId: string): void {
    const progress = this.loadProgress();
    progress.selectedCarId = carId;
    this.saveProgress(progress);
  }

  public static updateTeacherConfig(config: Partial<UserProgress['teacherConfig']>): void {
    const progress = this.loadProgress();
    progress.teacherConfig = {
      ...progress.teacherConfig,
      ...config,
    };
    this.saveProgress(progress);
  }

  public static addCustomQuestion(question: Question): void {
    const progress = this.loadProgress();
    progress.teacherConfig.customQuestions.push(question);
    this.saveProgress(progress);
  }

  public static addCustomSpeaking(checkpoint: SpeakingCheckpoint): void {
    const progress = this.loadProgress();
    progress.teacherConfig.customSpeaking.push(checkpoint);
    this.saveProgress(progress);
  }

  public static exportDataAsJson(): string {
    const progress = this.loadProgress();
    return JSON.stringify(progress, null, 2);
  }

  public static importDataFromJson(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (typeof parsed === 'object' && parsed !== null) {
        this.saveProgress({
          ...DEFAULT_PROGRESS,
          ...parsed,
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  public static resetProgress(): void {
    this.saveProgress(DEFAULT_PROGRESS);
  }
}
