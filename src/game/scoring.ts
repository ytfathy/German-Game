/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ScoreCalculationInput {
  basePoints?: number;
  currentStreak: number;
  timeRemainingSeconds?: number;
  isCorrect: boolean;
}

export function calculateAnswerPoints(input: ScoreCalculationInput): {
  pointsEarned: number;
  newStreak: number;
  streakBonus: number;
  fuelBoost: number;
} {
  if (!input.isCorrect) {
    return {
      pointsEarned: 0,
      newStreak: 0,
      streakBonus: 0,
      fuelBoost: 0,
    };
  }

  const base = input.basePoints ?? 100;
  const newStreak = input.currentStreak + 1;
  // Streak bonus: +25% per streak tier (max 2.0x at 4+ streak)
  const multiplier = Math.min(1 + (newStreak - 1) * 0.25, 2.0);
  const streakBonus = Math.round(base * (multiplier - 1));
  const pointsEarned = Math.round(base + streakBonus);
  const fuelBoost = Math.min(25 + newStreak * 5, 45); // fuel / nitro boost percentage

  return {
    pointsEarned,
    newStreak,
    streakBonus,
    fuelBoost,
  };
}

export function calculateLevelStars(accuracy: number, totalQuestions: number): number {
  if (totalQuestions <= 0) return 0;
  if (accuracy >= 0.85) return 3;
  if (accuracy >= 0.65) return 2;
  if (accuracy >= 0.40) return 1;
  return 0;
}

export function isLevelUnlocked(levelNumber: number, completedLevels: Record<number, { completed: boolean }>, totalStars: number): boolean {
  if (levelNumber === 1 || levelNumber === 99) return true;
  // Level requires previous level completion or star threshold
  const prevLevel = completedLevels[levelNumber - 1];
  if (prevLevel && prevLevel.completed) return true;
  // Alternative unlock: reach star threshold (e.g. level 2 at 2 stars, level 3 at 5 stars, etc.)
  const starRequirements: Record<number, number> = {
    2: 2,
    3: 5,
    4: 8,
    5: 11,
    6: 14,
    7: 17,
  };
  return totalStars >= (starRequirements[levelNumber] ?? 99);
}

export function isCarUnlocked(carRequiredStars: number, totalStars: number): boolean {
  return totalStars >= carRequiredStars;
}
