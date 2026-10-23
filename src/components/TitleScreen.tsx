/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Play, Car, BookOpen, Settings, Trophy, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { AppScreen, UserProgress, CarModel } from '../types/game';
import { CARS } from '../data/levels';
import { audioService } from '../services/audioService';

interface TitleScreenProps {
  onStartCareer: () => void;
  onNavigate: (screen: AppScreen) => void;
  userProgress: UserProgress;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartCareer,
  onNavigate,
  userProgress,
  isMuted,
  onToggleMute,
}) => {
  const currentCar = CARS.find((c) => c.id === userProgress.selectedCarId) || CARS[0];

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onStartCareer();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onStartCareer]);

  return (
    <div
      className="relative w-full h-full min-h-screen bg-slate-950 flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden"
      data-testid="title-screen"
    >
      {/* Background Gradient & Speed Lines */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-sky-950/40 to-slate-950 pointer-events-none" />
      <div
        className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"
      />

      {/* Top Bar with Star / Score Cluster & Mute Toggle */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-amber-400 font-semibold text-sm shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="tabular-nums">{userProgress.totalStars}</span>
            <span className="text-slate-400 font-normal text-xs uppercase tracking-wider ml-1">Sterne</span>
          </div>

          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-sky-400 font-semibold text-sm shadow-sm">
            <Trophy className="w-4 h-4 text-sky-400" />
            <span className="tabular-nums">{userProgress.totalScore.toLocaleString()}</span>
            <span className="text-slate-400 font-normal text-xs uppercase tracking-wider ml-1">Punkte</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleMute}
          className="p-2.5 rounded-full bg-slate-900/80 border border-slate-700 hover:border-slate-500 text-slate-200 transition-colors"
          aria-label={isMuted ? 'Ton einschalten (Unmute)' : 'Stummschalten (Mute)'}
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
        </button>
      </div>

      {/* Hero Title & Custom SVG Emblem Lockup */}
      <div className="relative z-10 max-w-3xl mx-auto my-auto text-center flex flex-col items-center">
        {/* Custom SVG Racing Crest Lockup */}
        <div className="mb-4">
          <svg className="w-24 h-16 sm:w-32 sm:h-20 mx-auto drop-shadow-lg" viewBox="0 0 160 80" fill="none">
            {/* German Flag Tri-band Underline Wing */}
            <path d="M10 58 L150 58" stroke="#18181b" strokeWidth="5" strokeLinecap="round" />
            <path d="M20 64 L140 64" stroke="#dc2626" strokeWidth="5" strokeLinecap="round" />
            <path d="M30 70 L130 70" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" />
            {/* Aerodynamic Speed Silhouette */}
            <path
              d="M25 44 C 45 22, 95 18, 135 34 C 110 38, 70 42, 25 44 Z"
              fill="url(#crestGrad)"
            />
            {/* Checkered Flag Pattern Pin */}
            <rect x="72" y="10" width="8" height="8" fill="#ffffff" />
            <rect x="80" y="10" width="8" height="8" fill="#18181b" />
            <rect x="72" y="18" width="8" height="8" fill="#18181b" />
            <rect x="80" y="18" width="8" height="8" fill="#ffffff" />
            <defs>
              <linearGradient id="crestGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black italic tracking-tight text-white uppercase drop-shadow-md">
          DEUTSCH <span className="text-sky-400">RACER</span>
        </h1>
        <p className="mt-2 text-sm sm:text-lg font-medium text-slate-300 tracking-wider uppercase">
          The German Challenge · High-Speed Language Racing
        </p>

        {/* Selected Car Badge */}
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-700 text-xs sm:text-sm text-slate-300">
          <Car className="w-4 h-4 text-sky-400" />
          <span>Fahrzeug: <strong className="text-white">{currentCar.germanName}</strong></span>
          <span className="text-slate-500">·</span>
          <span>{currentCar.topSpeed} km/h</span>
        </div>

        {/* Main Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full max-w-lg">
          <button
            type="button"
            data-start="true"
            onClick={onStartCareer}
            className="w-full sm:flex-1 py-4 px-6 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-base sm:text-lg shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Rennen Starten</span>
          </button>

          <button
            type="button"
            data-quiz="true"
            onClick={() => onNavigate('quiz')}
            className="w-full sm:flex-1 py-4 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-base sm:text-lg shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Sparkles className="w-5 h-5 text-slate-950 fill-current" />
            <span>Großes Quiz (186)</span>
          </button>
        </div>

        {/* Secondary Navigation Options */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full max-w-xl">
          <button
            type="button"
            onClick={() => onNavigate('level_select')}
            className="p-3 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs sm:text-sm font-semibold flex flex-col items-center gap-1.5 transition-colors"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>7 Stufen & Quiz</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('garage')}
            className="p-3 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs sm:text-sm font-semibold flex flex-col items-center gap-1.5 transition-colors"
          >
            <Car className="w-4 h-4 text-sky-400" />
            <span>Garage (Autos)</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('reading_lessons')}
            className="p-3 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs sm:text-sm font-semibold flex flex-col items-center gap-1.5 transition-colors"
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>Lesen (Stories)</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('teacher_dashboard')}
            className="p-3 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs sm:text-sm font-semibold flex flex-col items-center gap-1.5 transition-colors"
          >
            <Settings className="w-4 h-4 text-purple-400" />
            <span>Lehrer-Panel</span>
          </button>
        </div>
      </div>

      {/* Flat Control Hints Line */}
      <div className="relative z-10 text-center text-xs text-slate-400 tracking-wide">
        <span>WASD / Pfeiltasten: Steuern & Beschleunigen</span>
        <span className="mx-2 text-slate-600">·</span>
        <span>Leertaste: Handbremse</span>
        <span className="mx-2 text-slate-600">·</span>
        <span>Esc / P: Pause</span>
        <span className="mx-2 text-slate-600">·</span>
        <span>Enter / Space: Start</span>
      </div>
    </div>
  );
};
