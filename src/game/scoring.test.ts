/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAnswerPoints,
  calculateLevelStars,
  isLevelUnlocked,
  isCarUnlocked,
} from './scoring';

test('calculateAnswerPoints gives base points and resets on wrong answer', () => {
  const correct = calculateAnswerPoints({
    currentStreak: 0,
    isCorrect: true,
  });
  assert.equal(correct.pointsEarned, 100);
  assert.equal(correct.newStreak, 1);
  assert.equal(correct.streakBonus, 0);

  const streak3 = calculateAnswerPoints({
    currentStreak: 2,
    isCorrect: true,
  });
  assert.equal(streak3.newStreak, 3);
  assert.ok(streak3.pointsEarned > 100);

  const incorrect = calculateAnswerPoints({
    currentStreak: 5,
    isCorrect: false,
  });
  assert.equal(incorrect.pointsEarned, 0);
  assert.equal(incorrect.newStreak, 0);
});

test('calculateLevelStars awards 3 stars for >= 85% accuracy', () => {
  assert.equal(calculateLevelStars(0.9, 5), 3);
  assert.equal(calculateLevelStars(0.75, 4), 2);
  assert.equal(calculateLevelStars(0.5, 4), 1);
  assert.equal(calculateLevelStars(0.2, 5), 0);
});

test('isLevelUnlocked checks completion and star requirements', () => {
  assert.equal(isLevelUnlocked(1, {}, 0), true);
  assert.equal(isLevelUnlocked(2, {}, 0), false);
  assert.equal(isLevelUnlocked(2, { 1: { completed: true } }, 0), true);
  assert.equal(isLevelUnlocked(2, {}, 2), true);
});

test('isCarUnlocked checks stars threshold', () => {
  assert.equal(isCarUnlocked(0, 0), true);
  assert.equal(isCarUnlocked(5, 4), false);
  assert.equal(isCarUnlocked(5, 5), true);
});
