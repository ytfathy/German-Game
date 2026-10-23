/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, CheckCircle2, XCircle, ArrowRight, Sparkles, HelpCircle } from 'lucide-react';
import { ShuffledQuestion, validateAnswer } from '../game/questionEngine';
import { audioService } from '../services/audioService';

interface CheckpointModalProps {
  checkpointNumber: number;
  totalCheckpoints: number;
  question: ShuffledQuestion;
  onAnswerSubmitted: (isCorrect: boolean, userAnswerText: string, correctAnswerText: string, explanation: string) => void;
  onContinueRacing: () => void;
}

export const CheckpointModal: React.FC<CheckpointModalProps> = ({
  checkpointNumber,
  totalCheckpoints,
  question,
  onAnswerSubmitted,
  onContinueRacing,
}) => {
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

  const speechTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Unmount cleanup: cancel any ongoing speech immediately
  useEffect(() => {
    return () => {
      if (speechTimerRef.current) {
        clearTimeout(speechTimerRef.current);
        speechTimerRef.current = null;
      }
      audioService.stopSpeaking();
    };
  }, []);

  // Initialize ordered words for sentence ordering questions
  useEffect(() => {
    setSelectedOptionIndex(null);
    setFillInputText('');
    setSubmitted(false);
    setFeedback(null);

    audioService.stopSpeaking();
    if (speechTimerRef.current) {
      clearTimeout(speechTimerRef.current);
      speechTimerRef.current = null;
    }

    if (question.originalQuestion.type === 'order_sentence') {
      setOrderedWords([...question.displayOptions]);
    }

    // If it's a listening question, automatically play audio after opening
    if (question.originalQuestion.audioText) {
      speechTimerRef.current = setTimeout(() => {
        audioService.speakGerman(question.originalQuestion.audioText!);
      }, 400);
    }
  }, [question]);

  const handlePlayAudio = () => {
    const textToSpeak = question.originalQuestion.audioText || question.originalQuestion.prompt;
    audioService.speakGerman(textToSpeak);
  };

  const handleWordClick = (index: number) => {
    if (submitted) return;
    // Swap with next word or rotate
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
    if (submitted) return;

    let userAnswer: string | number = '';
    if (question.originalQuestion.type === 'multiple_choice' || question.originalQuestion.type === 'true_false') {
      if (selectedOptionIndex === null) return;
      userAnswer = selectedOptionIndex;
    } else if (question.originalQuestion.type === 'order_sentence') {
      userAnswer = orderedWords.join(' ');
    } else {
      if (!fillInputText.trim()) return;
      userAnswer = fillInputText.trim();
    }

    const result = validateAnswer(question, userAnswer);
    setFeedback(result);
    setSubmitted(true);

    if (result.isCorrect) {
      audioService.playCorrectAnswer();
    } else {
      audioService.playIncorrectAnswer();
    }

    onAnswerSubmitted(
      result.isCorrect,
      result.userAnswerText,
      result.correctAnswerText,
      question.originalQuestion.explanation
    );
  };

  const handleContinue = () => {
    audioService.playTurboBoost();
    onContinueRacing();
  };

  const canSubmit =
    !submitted &&
    ((question.originalQuestion.type === 'multiple_choice' && selectedOptionIndex !== null) ||
      (question.originalQuestion.type === 'true_false' && selectedOptionIndex !== null) ||
      (question.originalQuestion.type === 'order_sentence' && orderedWords.length > 0) ||
      (question.originalQuestion.type === 'fill_blank' && fillInputText.trim().length > 0));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 pointer-events-auto select-none"
      data-testid="checkpoint-modal"
    >
      <div className="w-full max-w-xl bg-slate-900 border-2 border-sky-500/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-sky-950 to-slate-900 px-6 py-3.5 border-b border-sky-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 rounded-full bg-sky-400" />
            <span className="text-xs uppercase font-extrabold tracking-widest text-sky-400">
              Checkpoint {checkpointNumber} / {totalCheckpoints}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePlayAudio}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-900/60 hover:bg-sky-800 border border-sky-400/40 text-xs font-semibold text-sky-200 transition-colors cursor-pointer"
              title="Auf Deutsch anhören"
            >
              <Volume2 className="w-3.5 h-3.5 text-sky-300" />
              <span>Anhören</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 flex flex-col gap-5">
          {/* Question Text */}
          <div>
            <div className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">
              {question.originalQuestion.category.toUpperCase()} FRAGE
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
              {question.originalQuestion.prompt}
            </h2>
            {question.originalQuestion.promptEnglish && (
              <p className="text-xs sm:text-sm text-slate-400 mt-1 italic">
                ({question.originalQuestion.promptEnglish})
              </p>
            )}
          </div>

          {/* Answer Interaction Types */}
          {/* Type 1: Multiple Choice or True/False */}
          {(question.originalQuestion.type === 'multiple_choice' || question.originalQuestion.type === 'true_false') && (
            <div className="grid grid-cols-1 gap-2.5">
              {question.displayOptions.map((option, idx) => {
                const isSelected = selectedOptionIndex === idx;
                const isCorrectChoice = submitted && idx === question.correctDisplayIndex;
                const isWrongChoice = submitted && isSelected && !feedback?.isCorrect;

                let btnStyle = 'bg-slate-800/90 border-slate-700 text-slate-100 hover:border-sky-400 hover:bg-slate-750';
                if (isSelected && !submitted) {
                  btnStyle = 'bg-sky-950 border-sky-400 text-sky-100 ring-2 ring-sky-400/40';
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

          {/* Type 2: Order Sentence */}
          {question.originalQuestion.type === 'order_sentence' && (
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
                    className="px-3.5 py-2 rounded-lg bg-sky-900/80 border border-sky-400/50 hover:bg-sky-800 text-white font-semibold text-sm active:scale-95 transition-all cursor-pointer"
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Type 3: Fill Blank */}
          {question.originalQuestion.type === 'fill_blank' && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
              <input
                type="text"
                disabled={submitted}
                value={fillInputText}
                onChange={(e) => setFillInputText(e.target.value)}
                placeholder="Schreibe deine Antwort hier..."
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 focus:border-sky-400 focus:outline-none text-white font-medium"
              />
            </form>
          )}

          {/* Feedback Display (Displayed ONLY AFTER submission) */}
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

              {question.originalQuestion.explanation && (
                <div className="text-xs sm:text-sm text-slate-300 mt-1 pl-7 flex items-start gap-1.5">
                  <HelpCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <span>{question.originalQuestion.explanation}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Bar with Action Controls */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-end gap-3">
          {!submitted ? (
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => handleSubmit()}
              className="py-3 px-6 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold text-sm sm:text-base shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <span>Antwort Bestätigen</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleContinue}
              className="py-3.5 px-8 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold text-base shadow-lg shadow-emerald-500/25 flex items-center gap-2.5 transition-all cursor-pointer active:scale-98"
            >
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>Weiterfahren (Continue Racing)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
