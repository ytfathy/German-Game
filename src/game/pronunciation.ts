/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { normalizeGermanText } from './questionEngine';

export interface WordAnalysis {
  word: string;
  matched: boolean;
  score: number; // 0 to 1
  userSpoken?: string;
}

export interface PronunciationResult {
  targetSentence: string;
  userTranscript: string;
  overallScore: number; // 0 - 100
  accuracy: number; // 0 - 100
  fluencyScore: number; // 0 - 100
  completenessScore: number; // 0 - 100
  wordAnalyses: WordAnalysis[];
  feedbackHeadline: string;
  feedbackDetail: string;
  isApproximateBrowserSpeech: boolean;
}

/**
 * Standard Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const d: number[][] = [];
  for (let i = 0; i <= m; i++) {
    d[i] = [i];
  }
  for (let j = 0; j <= n; j++) {
    d[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return d[m][n];
}

/**
 * Calculate similarity between 0 and 1
 */
export function stringSimilarity(a: string, b: string): number {
  const normA = normalizeGermanText(a);
  const normB = normalizeGermanText(b);
  if (normA === normB) return 1.0;
  const maxLen = Math.max(normA.length, normB.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(normA, normB);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Evaluates German spoken input honestly and accurately
 */
export function assessPronunciation(
  targetSentence: string,
  userTranscript: string
): PronunciationResult {
  const targetWords = targetSentence
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»]/g, ''))
    .filter(Boolean);

  const spokenWords = userTranscript
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»]/g, ''))
    .filter(Boolean);

  if (targetWords.length === 0) {
    return {
      targetSentence,
      userTranscript,
      overallScore: 0,
      accuracy: 0,
      fluencyScore: 0,
      completenessScore: 0,
      wordAnalyses: [],
      feedbackHeadline: 'Keine Wörter eingegeben',
      feedbackDetail: 'Bitte versuchen Sie es noch einmal.',
      isApproximateBrowserSpeech: true,
    };
  }

  const wordAnalyses: WordAnalysis[] = [];
  let matchedWordCount = 0;
  let totalWordScore = 0;

  for (let i = 0; i < targetWords.length; i++) {
    const tw = targetWords[i];
    const normTw = normalizeGermanText(tw);

    // Find best match in spokenWords around current index
    let bestSim = 0;
    let bestSpokenWord = '';

    for (let j = 0; j < spokenWords.length; j++) {
      const sw = spokenWords[j];
      const normSw = normalizeGermanText(sw);
      const sim = stringSimilarity(normTw, normSw);
      if (sim > bestSim) {
        bestSim = sim;
        bestSpokenWord = sw;
      }
    }

    const isMatch = bestSim >= 0.75;
    if (isMatch) matchedWordCount++;
    totalWordScore += bestSim;

    wordAnalyses.push({
      word: tw,
      matched: isMatch,
      score: bestSim,
      userSpoken: bestSpokenWord || undefined,
    });
  }

  const completeness = (matchedWordCount / targetWords.length) * 100;
  const wordAccuracy = (totalWordScore / targetWords.length) * 100;
  const wholeStringSim = stringSimilarity(targetSentence, userTranscript) * 100;
  const overall = Math.round(completeness * 0.4 + wordAccuracy * 0.4 + wholeStringSim * 0.2);

  let headline = 'Gut gemacht! (Well done!)';
  let detail = 'Deine Aussprache war gut verständlich.';

  if (overall >= 85) {
    headline = 'Ausgezeichnet! (Excellent German Pronunciation!)';
    detail = 'Hervorragende Aussprache und Rhythmus!';
  } else if (overall >= 65) {
    headline = 'Sehr gut! (Very Good!)';
    detail = 'Die meisten Wörter waren klar und verständlich.';
  } else if (overall >= 40) {
    headline = 'Guter Versuch! (Good Effort!)';
    detail = 'Einige Wörter brauchen noch etwas Übung. Höre dir das Modell noch einmal an.';
  } else {
    headline = 'Nochmal versuchen! (Try Again!)';
    detail = 'Spreche laut und deutlich in dein Mikrofon.';
  }

  return {
    targetSentence,
    userTranscript,
    overallScore: Math.min(100, Math.max(0, overall)),
    accuracy: Math.round(wordAccuracy),
    fluencyScore: Math.round(wholeStringSim),
    completenessScore: Math.round(completeness),
    wordAnalyses,
    feedbackHeadline: headline,
    feedbackDetail: detail,
    isApproximateBrowserSpeech: true,
  };
}
