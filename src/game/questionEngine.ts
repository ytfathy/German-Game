/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Question } from '../types/game';

export interface ShuffledQuestion {
  originalQuestion: Question;
  displayOptions: string[];
  correctDisplayIndex: number;
  correctAnswerText: string;
}

/**
 * Fisher-Yates array shuffle (deterministic or random)
 */
export function shuffleArray<T>(array: T[], rng = Math.random): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Prepare a question for display by shuffling the answer options while
 * strictly preserving which one is correct!
 */
export function prepareQuestionForDisplay(question: Question, rng = Math.random): ShuffledQuestion {
  if (question.type === 'multiple_choice' || question.type === 'true_false') {
    const originalOptions = question.options;
    const correctIdx = typeof question.correctAnswer === 'number' ? question.correctAnswer : 0;
    const correctAnswerText = originalOptions[correctIdx] ?? originalOptions[0];

    // For true/false, we usually keep standard Richtig/Falsch order, or shuffle if needed
    if (question.type === 'true_false') {
      return {
        originalQuestion: question,
        displayOptions: originalOptions,
        correctDisplayIndex: correctIdx,
        correctAnswerText,
      };
    }

    // Multiple choice: shuffle options
    // Create indexed list
    const indexed = originalOptions.map((opt, i) => ({ opt, isCorrect: i === correctIdx }));
    const shuffled = shuffleArray(indexed, rng);
    const newCorrectIdx = shuffled.findIndex((item) => item.isCorrect);

    return {
      originalQuestion: question,
      displayOptions: shuffled.map((item) => item.opt),
      correctDisplayIndex: newCorrectIdx,
      correctAnswerText,
    };
  }

  // order_sentence or fill_blank
  return {
    originalQuestion: question,
    displayOptions: shuffleArray(question.options, rng),
    correctDisplayIndex: 0,
    correctAnswerText: String(question.correctAnswer),
  };
}

/**
 * Pick N random questions without immediate repeating
 */
export function selectQuestionsForRace(
  questionBank: Question[],
  count: number,
  rng = Math.random
): ShuffledQuestion[] {
  if (!questionBank || questionBank.length === 0) return [];
  const shuffledBank = shuffleArray(questionBank, rng);
  const selected = shuffledBank.slice(0, Math.min(count, shuffledBank.length));
  return selected.map((q) => prepareQuestionForDisplay(q, rng));
}

/**
 * Clean German string for fuzzy/normalized checking (accents, umlauts, casing)
 */
export function normalizeGermanText(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Validates a user answer against a prepared question
 */
export function validateAnswer(
  prepared: ShuffledQuestion,
  userAnswer: string | number
): {
  isCorrect: boolean;
  correctAnswerText: string;
  userAnswerText: string;
  feedbackMessage: string;
} {
  const { originalQuestion, displayOptions, correctDisplayIndex, correctAnswerText } = prepared;

  if (originalQuestion.type === 'multiple_choice' || originalQuestion.type === 'true_false') {
    const selectedIndex = typeof userAnswer === 'number' ? userAnswer : parseInt(userAnswer, 10);
    const isCorrect = selectedIndex === correctDisplayIndex;
    const userAnswerText = displayOptions[selectedIndex] ?? 'No answer';

    return {
      isCorrect,
      correctAnswerText,
      userAnswerText,
      feedbackMessage: isCorrect
        ? 'Richtig! Ausgezeichnet! (Correct! Excellent!)'
        : `Leider falsch. Die richtige Antwort ist: "${correctAnswerText}".`,
    };
  }

  if (originalQuestion.type === 'order_sentence') {
    const userSentence = typeof userAnswer === 'string' ? userAnswer.trim() : '';
    const normUser = normalizeGermanText(userSentence);
    const normCorrect = normalizeGermanText(correctAnswerText);
    const isCorrect = normUser === normCorrect;

    return {
      isCorrect,
      correctAnswerText,
      userAnswerText: userSentence,
      feedbackMessage: isCorrect
        ? 'Richtig! Perfekter Satzbau! (Correct sentence structure!)'
        : `Leider falsch. Die richtige Reihenfolge ist: "${correctAnswerText}".`,
    };
  }

  // fill_blank
  const normUser = normalizeGermanText(String(userAnswer));
  const normCorrect = normalizeGermanText(correctAnswerText);
  const isCorrect = normUser === normCorrect;

  return {
    isCorrect,
    correctAnswerText,
    userAnswerText: String(userAnswer),
    feedbackMessage: isCorrect
      ? 'Richtig! Genau das richtige Wort! (Correct!)'
      : `Leider falsch. Das gesuchte Wort ist: "${correctAnswerText}".`,
  };
}
