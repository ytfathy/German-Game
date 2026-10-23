/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Volume2, VolumeX, Pause, Sparkles, Trophy, Flame } from 'lucide-react';
import { LevelConfig, CarModel } from '../types/game';

interface RacingHUDProps {
  levelConfig: LevelConfig;
  carConfig: CarModel;
  speedKmh: number;
  gear: number;
  distanceMeters: number;
  totalMeters: number;
  score: number;
  streak: number;
  starsEarned: number;
  checkpointsCompleted: number;
  totalCheckpoints: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onTouchGas: (pressed: boolean) => void;
  onTouchBrake: (pressed: boolean) => void;
  onTouchSteerLeft: (pressed: boolean) => void;
  onTouchSteerRight: (pressed: boolean) => void;
  onTouchHandbrake: (pressed: boolean) => void;
}

export const RacingHUD: React.FC<RacingHUDProps> = ({
  levelConfig,
  speedKmh,
  gear,
  distanceMeters,
  totalMeters,
  score,
  streak,
  starsEarned,
  checkpointsCompleted,
  totalCheckpoints,
  isMuted,
  onToggleMute,
  onPause,
  onTouchGas,
  onTouchBrake,
  onTouchSteerLeft,
  onTouchSteerRight,
  onTouchHandbrake,
}) => {
  const progressRatio = totalMeters > 0 ? Math.min(1, Math.max(0, distanceMeters / totalMeters)) : 0;
  const progressPercent = Math.round(progressRatio * 100);

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-4 sm:p-6 select-none font-sans">
      {/* Top Cluster: Level Info, Checkpoint Progress & Score */}
      <div className="flex items-start justify-between w-full">
        {/* Top-Left: Level Title & Checkpoint Counter */}
        <div className="pointer-events-auto flex flex-col gap-1.5">
          <div className="bg-slate-900/90 border border-slate-700/80 px-3.5 py-1.5 rounded-lg shadow-md">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-sky-400">
              {levelConfig.germanTitle}
            </div>
            <div className="text-xs text-slate-300 font-medium">
              Checkpoint <span className="text-white font-bold tabular-nums">{checkpointsCompleted}</span> / {totalCheckpoints}
            </div>
          </div>

          {/* Track Progress Bar */}
          <div className="w-48 sm:w-64 bg-slate-900/90 border border-slate-700/80 p-2 rounded-lg shadow-md">
            <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 mb-1">
              <span>Streckenfortschritt</span>
              <span className="text-sky-300 tabular-nums">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-150"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Top-Center / Top-Right: Score, Streak & Stars */}
        <div className="pointer-events-auto flex items-center gap-2 sm:gap-3">
          {streak > 1 && (
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-600/90 to-red-600/90 px-3 py-1.5 rounded-lg border border-amber-400/50 shadow-md animate-bounce">
              <Flame className="w-4 h-4 text-amber-200 fill-amber-200" />
              <span className="text-white font-bold text-xs uppercase tracking-wider">
                {streak}x Streak!
              </span>
            </div>
          )}

          <div className="bg-slate-900/90 border border-slate-700/80 px-3.5 py-1.5 rounded-lg shadow-md flex items-center gap-2 text-white">
            <Trophy className="w-4 h-4 text-sky-400" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Punkte</span>
              <span className="text-base font-bold tabular-nums text-sky-300">{score.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-lg shadow-md flex items-center gap-1 text-amber-400">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-sm tabular-nums">{starsEarned}</span>
          </div>

          {/* Quick Utility Buttons: Mute & Pause */}
          <button
            type="button"
            onClick={onToggleMute}
            className="p-2.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 transition-colors shadow-md"
            aria-label={isMuted ? 'Ton an' : 'Ton aus'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={onPause}
            className="p-2.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 transition-colors shadow-md"
            aria-label="Pause"
          >
            <Pause className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Bottom Cluster: Speedometer & Mobile Controls */}
      <div className="flex items-end justify-between w-full">
        {/* Bottom-Left: Virtual Mobile Steering Controls */}
        <div className="pointer-events-auto flex gap-3 sm:hidden">
          <button
            type="button"
            onTouchStart={() => onTouchSteerLeft(true)}
            onTouchEnd={() => onTouchSteerLeft(false)}
            onMouseDown={() => onTouchSteerLeft(true)}
            onMouseUp={() => onTouchSteerLeft(false)}
            className="w-16 h-16 rounded-2xl bg-slate-900/90 border-2 border-slate-700 active:border-sky-400 active:bg-sky-950/80 text-white font-bold text-xl flex items-center justify-center shadow-lg active:scale-95"
            aria-label="Steer Left"
          >
            ◀
          </button>

          <button
            type="button"
            onTouchStart={() => onTouchSteerRight(true)}
            onTouchEnd={() => onTouchSteerRight(false)}
            onMouseDown={() => onTouchSteerRight(true)}
            onMouseUp={() => onTouchSteerRight(false)}
            className="w-16 h-16 rounded-2xl bg-slate-900/90 border-2 border-slate-700 active:border-sky-400 active:bg-sky-950/80 text-white font-bold text-xl flex items-center justify-center shadow-lg active:scale-95"
            aria-label="Steer Right"
          >
            ▶
          </button>
        </div>

        {/* Bottom-Center: Racing Speedometer & Gear Readout */}
        <div className="pointer-events-auto mx-auto sm:mx-0 bg-slate-900/90 border border-slate-700/80 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-5">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gang</span>
            <span className="text-2xl font-black text-amber-400 tabular-nums">{gear}</span>
          </div>

          <div className="h-8 w-px bg-slate-700" />

          <div className="flex flex-col items-baseline">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl sm:text-4xl font-black text-white tabular-nums tracking-tight">
                {speedKmh}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">km/h</span>
            </div>
            {/* Speed bar meter */}
            <div className="w-28 sm:w-36 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-gradient-to-r from-sky-400 via-amber-400 to-red-500 transition-all duration-75"
                style={{ width: `${Math.min(100, (speedKmh / 240) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Bottom-Right: Virtual Gas & Brake Pedals (Mobile) */}
        <div className="pointer-events-auto flex gap-3 sm:hidden">
          <button
            type="button"
            onTouchStart={() => onTouchBrake(true)}
            onTouchEnd={() => onTouchBrake(false)}
            onMouseDown={() => onTouchBrake(true)}
            onMouseUp={() => onTouchBrake(false)}
            className="w-16 h-16 rounded-2xl bg-red-950/90 border-2 border-red-700 active:border-red-400 active:bg-red-800 text-white font-bold text-xs uppercase flex items-center justify-center shadow-lg active:scale-95"
            aria-label="Bremse"
          >
            Bremse
          </button>

          <button
            type="button"
            onTouchStart={() => onTouchGas(true)}
            onTouchEnd={() => onTouchGas(false)}
            onMouseDown={() => onTouchGas(true)}
            onMouseUp={() => onTouchGas(false)}
            className="w-16 h-20 rounded-2xl bg-emerald-950/90 border-2 border-emerald-600 active:border-emerald-400 active:bg-emerald-700 text-white font-bold text-xs uppercase flex items-center justify-center shadow-lg active:scale-95"
            aria-label="Gas"
          >
            Gas
          </button>
        </div>
      </div>
    </div>
  );
};
