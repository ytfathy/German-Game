/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  prepareQuestionForDisplay,
  validateAnswer,
  normalizeGermanText,
} from './questionEngine';
import { assessPronunciation } from './pronunciation';
import { Question } from '../types/game';

const sampleQuestion: Question = {
  id: 'test-1',
  levelId: 1,
  type: 'multiple_choice',
  prompt: 'Karim kommt aus Luxor. ___ wohnt in Kairo.',
  options: ['Er', 'Sie', 'Es'],
  correctAnswer: 0, // 'Er'
  explanation: 'Karim is male.',
  category: 'grammar',
};

test('prepareQuestionForDisplay preserves the correct answer text when shuffled', () => {
  // Use mock rng to test shuffling
  let count = 0;
  const mockRng = () => (count++ % 2 === 0 ? 0.99 : 0.01);

  const prepared = prepareQuestionForDisplay(sampleQuestion, mockRng);
  assert.equal(prepared.correctAnswerText, 'Er');
  assert.equal(prepared.displayOptions[prepared.correctDisplayIndex], 'Er');

  // Validate correct selection
  const resultCorrect = validateAnswer(prepared, prepared.correctDisplayIndex);
  assert.equal(resultCorrect.isCorrect, true);
  assert.ok(resultCorrect.feedbackMessage.includes('Richtig'));

  // Validate wrong selection
  const wrongIndex = (prepared.correctDisplayIndex + 1) % prepared.displayOptions.length;
  const resultWrong = validateAnswer(prepared, wrongIndex);
  assert.equal(resultWrong.isCorrect, false);
  assert.ok(resultWrong.feedbackMessage.includes('Leider falsch'));
});

test('normalizeGermanText strips punctuation and handles whitespace and case', () => {
  assert.equal(
    normalizeGermanText('Guten Tag! Wie geht es dir?'),
    'guten tag wie geht es dir'
  );
  assert.equal(
    normalizeGermanText('  Ich spiele... gern    Fußball! '),
    'ich spiele gern fußball'
  );
});

test('assessPronunciation gives high score for accurate speech and identifies words', () => {
  const result = assessPronunciation(
    'Guten Morgen! Wie geht es dir?',
    'Guten Morgen wie geht es dir'
  );
  assert.ok(result.overallScore >= 90);
  assert.ok(result.wordAnalyses.every((w) => w.matched));
  assert.equal(result.isApproximateBrowserSpeech, true);

  const partial = assessPronunciation(
    'Ich kann sehr gut schwimmen',
    'Ich kann nicht kochen'
  );
  assert.ok(partial.overallScore < 70);
});
