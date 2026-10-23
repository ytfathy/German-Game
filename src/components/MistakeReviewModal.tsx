/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, CheckCircle2, XCircle, HelpCircle, BookOpen } from 'lucide-react';
import { MistakeRecord } from '../types/game';

interface MistakeReviewModalProps {
  mistakes: MistakeRecord[];
  onClose: () => void;
}

export const MistakeReviewModal: React.FC<MistakeReviewModalProps> = ({ mistakes, onClose }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 pointer-events-auto select-none"
      data-testid="mistake-review-modal"
    >
      <div className="w-full max-w-2xl max-h-[85vh] bg-slate-900 border-2 border-amber-500/70 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">
              Fehlerüberprüfung (Mistakes Review)
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mistake Items List */}
        <div className="p-6 overflow-y-auto flex flex-col gap-4">
          {mistakes.map((record, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-3"
            >
              <div className="text-xs uppercase font-extrabold text-amber-400 tracking-wider">
                Frage #{idx + 1} ({record.question.category})
              </div>

              <div className="text-base font-bold text-white">
                {record.question.prompt}
              </div>

              {record.question.promptEnglish && (
                <div className="text-xs text-slate-400 italic">
                  ({record.question.promptEnglish})
                </div>
              )}

              {/* User vs Correct */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                <div className="p-2.5 rounded-xl bg-red-950/30 border border-red-800/40 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-red-300 mb-0.5">
                    <XCircle className="w-3.5 h-3.5 text-red-400" />
                    <span>Deine Antwort:</span>
                  </div>
                  <span className="text-slate-300 font-medium">{record.userAnswer}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-300 mb-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Richtige Antwort:</span>
                  </div>
                  <span className="text-emerald-200 font-medium">{record.correctAnswer}</span>
                </div>
              </div>

              {/* Grammatical Explanation */}
              {record.explanation && (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-sky-300">Erklärung: </strong>
                    <span>{record.explanation}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm transition-colors cursor-pointer"
          >
            Fertig (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
