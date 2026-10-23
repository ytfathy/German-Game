/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Play, Lock, Star, Trophy, CheckCircle2, Flag, Sparkles } from 'lucide-react';
import { LevelConfig, UserProgress } from '../types/game';
import { LEVELS, QUIZ_LEVEL } from '../data/levels';
import { isLevelUnlocked } from '../game/scoring';
import { audioService } from '../services/audioService';

interface LevelSelectModalProps {
  userProgress: UserProgress;
  onSelectLevel: (level: LevelConfig) => void;
  onOpenQuiz?: () => void;
  onClose: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  userProgress,
  onSelectLevel,
  onOpenQuiz,
  onClose,
}) => {
  const handleStartLevel = (level: LevelConfig) => {
    const unlocked = isLevelUnlocked(level.number, userProgress.completedLevels, userProgress.totalStars);
    if (!unlocked) return;
    audioService.playTurboBoost();
    onSelectLevel(level);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 pointer-events-auto select-none"
      data-testid="level-select-modal"
    >
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border-2 border-sky-500/70 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Flag className="w-6 h-6 text-sky-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Rennstrecken & Stufen (7 Levels + Großes Quiz)</h2>
              <p className="text-xs text-slate-400">Progression durch den Deutsch-Lehrplan & Vollständige Wiederholung</p>
            </div>
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

        {/* Levels List */}
        <div className="p-6 overflow-y-auto flex flex-col gap-3">
          {/* Featured Restored Comprehensive Quiz Level */}
          <div className="p-5 rounded-2xl border-2 border-amber-500/80 bg-gradient-to-r from-amber-950/40 via-slate-900 to-sky-950/40 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 font-black text-lg flex items-center justify-center shrink-0 shadow-md">
                <Sparkles className="w-6 h-6 fill-current" />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {QUIZ_LEVEL.germanTitle}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
                    Wiederholungs-Level (Alle 186 Fragen)
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Alle 186 authentisch extrahierten Fragen aus allen 7 Kursressourcen in einem umfassenden Quiz ohne Themen-Trennung.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-950 text-amber-300 border border-amber-500/30">
                    186 Original-Fragen
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-950 text-sky-300 border border-slate-800">
                    Alle Fragetypen
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-950 text-emerald-300 border border-slate-800">
                    Sofort freigeschaltet
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
              {onOpenQuiz && (
                <button
                  type="button"
                  onClick={onOpenQuiz}
                  className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                >
                  <Sparkles className="w-4 h-4 fill-current" />
                  <span>Großes Quiz</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => handleStartLevel(QUIZ_LEVEL)}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all border border-slate-700"
                title="Level 99 im 3D-Rennmodus fahren"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>3D-Rennen</span>
              </button>
            </div>
          </div>
          {LEVELS.filter((lvl) => lvl.number !== 99).map((lvl) => {
            const unlocked = isLevelUnlocked(lvl.number, userProgress.completedLevels, userProgress.totalStars);
            const levelStats = userProgress.completedLevels[lvl.number];
            const stars = levelStats?.stars || 0;
            const bestScore = levelStats?.bestScore || 0;
            const completed = levelStats?.completed || false;

            return (
              <div
                key={lvl.id}
                onClick={() => unlocked && handleStartLevel(lvl)}
                className={`p-4 sm:p-5 rounded-2xl border-2 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  unlocked
                    ? 'bg-slate-950/90 border-slate-800 hover:border-sky-500 hover:bg-slate-900 cursor-pointer'
                    : 'bg-slate-950/40 border-slate-800/60 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shrink-0 ${
                      unlocked
                        ? 'bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {unlocked ? lvl.number : <Lock className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-white">
                        {lvl.germanTitle}
                      </h3>
                      {completed && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </div>

                    <p className="text-xs text-slate-400 mt-0.5">{lvl.description}</p>

                    {/* Topics Tags */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {lvl.targetTopics.map((topic, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-900 text-sky-300 border border-slate-800"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stars & Launch CTA */}
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
                  <div className="flex flex-col items-start sm:items-end">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3].map((starIdx) => (
                        <Star
                          key={starIdx}
                          className={`w-4 h-4 ${
                            starIdx <= stars ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    {bestScore > 0 && (
                      <span className="text-[11px] text-slate-400 mt-1 tabular-nums">
                        Best: <strong className="text-sky-300">{bestScore.toLocaleString()}</strong>
                      </span>
                    )}
                  </div>

                  {unlocked ? (
                    <button
                      type="button"
                      onClick={() => handleStartLevel(lvl)}
                      className="py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Starten</span>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>{lvl.requiredStars}</span>
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>benötigt</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-colors cursor-pointer"
          >
            Zurück
          </button>
        </div>
      </div>
    </div>
  );
};
