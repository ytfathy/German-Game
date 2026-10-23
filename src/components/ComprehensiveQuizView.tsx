/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Trophy,
  Flame,
  HelpCircle,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { Question, MistakeRecord } from '../types/game';
import { ALL_EXTRACTED_QUESTIONS } from '../data/extractedQuestions';
import { prepareQuestionForDisplay, ShuffledQuestion, validateAnswer } from '../game/questionEngine';
import { calculateAnswerPoints } from '../game/scoring';
import { audioService } from '../services/audioService';
import { MistakeReviewModal } from './MistakeReviewModal';

interface ComprehensiveQuizViewProps {
  onBackToMenu: () => void;
}

export const ComprehensiveQuizView: React.FC<ComprehensiveQuizViewProps> = ({ onBackToMenu }) => {
  const [questions, setQuestions] = useState<ShuffledQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakes, setMistakes] = useState<MistakeRecord[]>([]);

  // Current question interaction state
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [fillInputText, setFillInputText] = useState('');
  const [orderedWords, setOrderedWords] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    correctAnswerText: string;
    userAnswerText: string;
    feedbackMessage: string;
  } | null>(null);

  const [isFinished, setIsFinished] = useState(false);
  const [showMistakesReview, setShowMistakesReview] = useState(false);

  // Audio timer ref to abort queued speech on exit
  const speechTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Stop speech and clear timers when leaving the quiz
  useEffect(() => {
    return () => {
      if (speechTimerRef.current) {
        clearTimeout(speechTimerRef.current);
        speechTimerRef.current = null;
      }
      audioService.stopSpeaking();
    };
  }, []);

  const handleBack = () => {
    if (speechTimerRef.current) {
      clearTimeout(speechTimerRef.current);
      speechTimerRef.current = null;
    }
    audioService.stopSpeaking();
    onBackToMenu();
  };

  // Initialize ALL extracted questions without topic-based division
  useEffect(() => {
    // Shuffle the full collection of all extracted questions
    const prepared = ALL_EXTRACTED_QUESTIONS.map((q) => prepareQuestionForDisplay(q));
    setQuestions(prepared);
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setCorrectCount(0);
    setMistakes([]);
    setIsFinished(false);
  }, []);

  const currentQ: ShuffledQuestion | undefined = questions[currentIndex];

  useEffect(() => {
    setSelectedOptionIndex(null);
    setFillInputText('');
    setSubmitted(false);
    setFeedback(null);

    // Cancel any previous speech immediately
    audioService.stopSpeaking();
    if (speechTimerRef.current) {
      clearTimeout(speechTimerRef.current);
      speechTimerRef.current = null;
    }

    if (currentQ && currentQ.originalQuestion.type === 'order_sentence') {
      setOrderedWords([...currentQ.displayOptions]);
    }

    if (currentQ && currentQ.originalQuestion.audioText) {
      speechTimerRef.current = setTimeout(() => {
        audioService.speakGerman(currentQ.originalQuestion.audioText!);
      }, 300);
    }
  }, [currentIndex, currentQ]);

  const handlePlayAudio = () => {
    if (!currentQ) return;
    const textToSpeak = currentQ.originalQuestion.audioText || currentQ.originalQuestion.prompt;
    audioService.speakGerman(textToSpeak);
  };

  const handleWordClick = (index: number) => {
    if (submitted) return;
    const next = [...orderedWords];
    if (index < next.length - 1) {
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
    } else if (index > 0) {
      [next[index], next[index - 1]] = [next[index - 1], next[index]];
    }
    setOrderedWords(next);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (submitted || !currentQ) return;

    let userAnswer: string | number = '';
    if (currentQ.originalQuestion.type === 'multiple_choice' || currentQ.originalQuestion.type === 'true_false') {
      if (selectedOptionIndex === null) return;
      userAnswer = selectedOptionIndex;
    } else if (currentQ.originalQuestion.type === 'order_sentence') {
      userAnswer = orderedWords.join(' ');
    } else {
      if (!fillInputText.trim()) return;
      userAnswer = fillInputText.trim();
    }

    const result = validateAnswer(currentQ, userAnswer);
    setFeedback(result);
    setSubmitted(true);

    if (result.isCorrect) {
      const { pointsEarned, newStreak } = calculateAnswerPoints({
        currentStreak: streak,
        isCorrect: true,
      });
      setScore((prev) => prev + pointsEarned);
      setStreak(newStreak);
      setCorrectCount((prev) => prev + 1);
      audioService.playCorrectAnswer();
    } else {
      setStreak(0);
      audioService.playIncorrectAnswer();
      setMistakes((prev) => [
        ...prev,
        {
          question: currentQ.originalQuestion,
          userAnswer: result.userAnswerText,
          correctAnswer: result.correctAnswerText,
          explanation: currentQ.originalQuestion.explanation,
        },
      ]);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
      audioService.playLevelVictory();
    }
  };

  const handleRestart = () => {
    const prepared = ALL_EXTRACTED_QUESTIONS.map((q) => prepareQuestionForDisplay(q));
    setQuestions(prepared);
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setCorrectCount(0);
    setMistakes([]);
    setIsFinished(false);
  };

  const canSubmit =
    !submitted &&
    currentQ &&
    ((currentQ.originalQuestion.type === 'multiple_choice' && selectedOptionIndex !== null) ||
      (currentQ.originalQuestion.type === 'true_false' && selectedOptionIndex !== null) ||
      (currentQ.originalQuestion.type === 'order_sentence' && orderedWords.length > 0) ||
      (currentQ.originalQuestion.type === 'fill_blank' && fillInputText.trim().length > 0));

  const progressPercent = questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;

  return (
    <div
      className="relative w-full h-full min-h-screen bg-slate-950 flex flex-col p-4 sm:p-8 select-none text-white overflow-y-auto"
      data-testid="comprehensive-quiz-screen"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs sm:text-sm font-semibold text-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zurück zum Hauptmenü</span>
        </button>

        <div className="flex items-center gap-3">
          {streak > 1 && (
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-red-600 px-3 py-1 rounded-lg border border-amber-400/50 shadow-md animate-bounce">
              <Flame className="w-4 h-4 text-amber-200 fill-amber-200" />
              <span className="text-white font-bold text-xs uppercase">{streak}x Streak!</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-sky-400 text-xs sm:text-sm font-bold">
            <Trophy className="w-4 h-4 text-sky-400" />
            <span className="tabular-nums">{score.toLocaleString()} Punkte</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-3xl mx-auto my-4">
        <div className="flex justify-between text-xs text-slate-400 font-bold mb-1.5">
          <span>
            Frage <strong className="text-white">{currentIndex + 1}</strong> von {questions.length} (Alle Ressourcen)
          </span>
          <span className="text-purple-400 tabular-nums">{progressPercent}%</span>
        </div>
        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-sky-500 to-emerald-400 transition-all duration-150"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Quiz Question Card */}
      {!isFinished && currentQ ? (
        <div className="w-full max-w-3xl mx-auto bg-slate-900 border-2 border-purple-500/70 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto">
          {/* Card Top Banner */}
          <div className="bg-gradient-to-r from-purple-950 to-slate-900 px-6 py-4 border-b border-purple-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-400" />
              <span className="text-xs uppercase font-extrabold tracking-widest text-purple-300">
                Großes Quiz · Frage {currentIndex + 1} / {questions.length}
              </span>
            </div>

            <button
              type="button"
              onClick={handlePlayAudio}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-900/60 hover:bg-purple-800 border border-purple-400/40 text-xs font-semibold text-purple-200 transition-colors cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5 text-purple-300" />
              <span>Anhören</span>
            </button>
          </div>

          {/* Question Prompt */}
          <div className="p-6 sm:p-8 flex flex-col gap-6">
            <div>
              <div className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">
                {currentQ.originalQuestion.category.toUpperCase()}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                {currentQ.originalQuestion.prompt}
              </h2>
              {currentQ.originalQuestion.promptEnglish && (
                <p className="text-xs sm:text-sm text-slate-400 mt-1.5 italic">
                  ({currentQ.originalQuestion.promptEnglish})
                </p>
              )}
            </div>

            {/* Answer Options */}
            {(currentQ.originalQuestion.type === 'multiple_choice' ||
              currentQ.originalQuestion.type === 'true_false') && (
              <div className="grid grid-cols-1 gap-2.5">
                {currentQ.displayOptions.map((option, idx) => {
                  const isSelected = selectedOptionIndex === idx;
                  const isCorrectChoice = submitted && idx === currentQ.correctDisplayIndex;
                  const isWrongChoice = submitted && isSelected && !feedback?.isCorrect;

                  let btnStyle =
                    'bg-slate-950/80 border-slate-800 text-slate-100 hover:border-purple-400 hover:bg-slate-850';
                  if (isSelected && !submitted) {
                    btnStyle = 'bg-purple-950 border-purple-400 text-purple-100 ring-2 ring-purple-400/40';
                  } else if (isCorrectChoice) {
                    btnStyle = 'bg-emerald-950 border-emerald-400 text-emerald-100 ring-2 ring-emerald-400/50';
                  } else if (isWrongChoice) {
                    btnStyle = 'bg-red-950/80 border-red-500 text-red-200';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={submitted}
                      onClick={() => setSelectedOptionIndex(idx)}
                      className={`w-full p-4 rounded-xl border text-left font-medium text-sm sm:text-base flex items-center justify-between transition-all cursor-pointer ${btnStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{option}</span>
                      </div>

                      {isCorrectChoice && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                      {isWrongChoice && <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Order Sentence */}
            {currentQ.originalQuestion.type === 'order_sentence' && (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-slate-300">
                  Klicke auf ein Wort, um seine Position zu tauschen:
                </p>
                <div className="flex flex-wrap gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800 min-h-14 items-center">
                  {orderedWords.map((word, wIdx) => (
                    <button
                      key={wIdx}
                      type="button"
                      disabled={submitted}
                      onClick={() => handleWordClick(wIdx)}
                      className="px-3.5 py-2 rounded-lg bg-purple-900/80 border border-purple-400/50 hover:bg-purple-800 text-white font-semibold text-sm active:scale-95 transition-all cursor-pointer"
                    >
                      {word}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Fill Blank */}
            {currentQ.originalQuestion.type === 'fill_blank' && (
              <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                <input
                  type="text"
                  disabled={submitted}
                  value={fillInputText}
                  onChange={(e) => setFillInputText(e.target.value)}
                  placeholder="Schreibe deine Antwort hier..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 focus:border-purple-400 focus:outline-none text-white font-medium"
                />
              </form>
            )}

            {/* Feedback & Explanation Card */}
            {submitted && feedback && (
              <div
                className={`p-4 rounded-xl border flex flex-col gap-2 ${
                  feedback.isCorrect
                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-100'
                    : 'bg-red-950/40 border-red-500/60 text-red-100'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-base">
                  {feedback.isCorrect ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="text-emerald-300">{feedback.feedbackMessage}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-400" />
                      <span className="text-red-300">{feedback.feedbackMessage}</span>
                    </>
                  )}
                </div>

                {currentQ.originalQuestion.explanation && (
                  <div className="text-xs sm:text-sm text-slate-300 mt-1 pl-7 flex items-start gap-1.5">
                    <HelpCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>{currentQ.originalQuestion.explanation}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-end gap-3">
            {!submitted ? (
              <button
                type="button"
                disabled={!canSubmit}
                onClick={() => handleSubmit()}
                className="py-3 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold text-sm sm:text-base shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <span>Antwort Bestätigen</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="py-3 px-8 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-base shadow-lg shadow-purple-500/25 flex items-center gap-2.5 transition-all cursor-pointer active:scale-98"
              >
                <span>{currentIndex < questions.length - 1 ? 'Nächste Frage' : 'Ergebnis anzeigen'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Final Performance Summary */
        <div className="w-full max-w-xl mx-auto bg-slate-900 border-2 border-purple-500/70 rounded-3xl shadow-2xl p-8 flex flex-col items-center text-center my-auto">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30 mb-4">
            <Trophy className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-3xl font-black text-white">Großes Quiz Abgeschlossen!</h2>
          <p className="text-sm text-slate-300 mt-1">
            Du hast alle <strong className="text-white">{questions.length}</strong> Fragen aus allen Lehrplan-Materialien bearbeitet!
          </p>

          <div className="w-full grid grid-cols-3 gap-3 my-6">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Punkte</span>
              <span className="text-xl sm:text-2xl font-black text-purple-400 tabular-nums">
                {score.toLocaleString()}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Richtig</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 tabular-nums">
                {correctCount}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Genauigkeit</span>
              <span className="text-xl sm:text-2xl font-black text-sky-400 tabular-nums">
                {questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0}%
              </span>
            </div>
          </div>

          {mistakes.length > 0 && (
            <button
              type="button"
              onClick={() => setShowMistakesReview(true)}
              className="w-full py-3 px-4 rounded-xl bg-amber-950/50 hover:bg-amber-950/70 border border-amber-600/50 text-amber-300 font-bold text-sm flex items-center justify-center gap-2 mb-4 transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>{mistakes.length} Fehler mit Erklärungen überprüfen</span>
            </button>
          )}

          <div className="flex items-center gap-3 w-full">
            <button
              type="button"
              onClick={handleRestart}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Quiz wiederholen</span>
            </button>

            <button
              type="button"
              onClick={handleBack}
              className="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-colors cursor-pointer"
            >
              Hauptmenü
            </button>
          </div>
        </div>
      )}

      {/* Mistake Review Modal */}
      {showMistakesReview && (
        <MistakeReviewModal mistakes={mistakes} onClose={() => setShowMistakesReview(false)} />
      )}
    </div>
  );
};
