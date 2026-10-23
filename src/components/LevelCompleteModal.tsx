/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Star, Clock, CheckCircle, RotateCcw, ArrowRight, BookOpen, AlertTriangle } from 'lucide-react';
import { MistakeRecord } from '../types/game';
import { audioService } from '../services/audioService';

interface LevelCompleteModalProps {
  levelNumber: number;
  levelTitle: string;
  score: number;
  stars: number;
  accuracy: number;
  timeSpentSeconds: number;
  mistakes: MistakeRecord[];
  hasNextLevel: boolean;
  onNextLevel: () => void;
  onRetry: () => void;
  onReturnMenu: () => void;
  onReviewMistakes: () => void;
}

export const LevelCompleteModal: React.FC<LevelCompleteModalProps> = ({
  levelNumber,
  levelTitle,
  score,
  stars,
  accuracy,
  timeSpentSeconds,
  mistakes,
  hasNextLevel,
  onNextLevel,
  onRetry,
  onReturnMenu,
  onReviewMistakes,
}) => {
  useEffect(() => {
    audioService.playLevelVictory();
    // Confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 pointer-events-auto select-none"
      data-testid="level-complete-modal"
    >
      <div className="w-full max-w-lg bg-slate-900 border-2 border-amber-500/70 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-center">
        {/* Banner with Trophy */}
        <div className="bg-gradient-to-b from-amber-500/20 to-slate-900 pt-8 pb-4 px-6 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 mb-3">
            <Trophy className="w-9 h-9 text-slate-950" />
          </div>

          <div className="text-xs uppercase font-extrabold tracking-widest text-amber-400">
            ZIEL ERREICHT! (FINISH LINE)
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
            {levelTitle} Abgeschlossen!
          </h2>

          {/* Star Rating Display */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2, 3].map((starIdx) => {
              const isEarned = starIdx <= stars;
              return (
                <div
                  key={starIdx}
                  className={`p-2 rounded-2xl transition-all duration-300 ${
                    isEarned
                      ? 'bg-amber-400/20 text-amber-400 scale-110 shadow-md'
                      : 'bg-slate-800 text-slate-600'
                  }`}
                >
                  <Star className={`w-8 h-8 ${isEarned ? 'fill-amber-400 text-amber-400' : ''}`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Metric Badges */}
        <div className="px-6 py-4 grid grid-cols-3 gap-2.5">
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Punkte</span>
            <span className="text-xl sm:text-2xl font-black text-sky-400 tabular-nums">
              {score.toLocaleString()}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Genauigkeit</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 tabular-nums">
              {Math.round(accuracy * 100)}%
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Rennzeit</span>
            <span className="text-xl sm:text-2xl font-black text-purple-400 tabular-nums">
              {formatTime(timeSpentSeconds)}
            </span>
          </div>
        </div>

        {/* Mistakes Review Callout (if any mistakes) */}
        {mistakes.length > 0 && (
          <div className="px-6 py-2">
            <button
              type="button"
              onClick={onReviewMistakes}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-950/40 hover:bg-amber-950/60 border border-amber-600/40 text-amber-300 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>{mistakes.length} Fehler überprüfen (Review Mistakes)</span>
            </button>
          </div>
        )}

        {/* Action Controls */}
        <div className="p-6 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={onReturnMenu}
            className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors cursor-pointer"
          >
            Hauptmenü
          </button>

          <button
            type="button"
            onClick={onRetry}
            className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Erneut fahren</span>
          </button>

          {hasNextLevel && (
            <button
              type="button"
              data-start="true"
              onClick={onNextLevel}
              className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-base shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
            >
              <span>Nächste Stufe</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
