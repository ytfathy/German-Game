/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onReturnMenu: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onReturnMenu,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 pointer-events-auto select-none"
      data-testid="pause-modal"
    >
      <div className="w-full max-w-sm bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-2xl p-6 flex flex-col items-center text-center gap-4">
        <h2 className="text-2xl font-black text-white uppercase tracking-wider">
          Rennen Pausiert
        </h2>
        <p className="text-xs text-slate-400">Drücke Escape oder wähle eine Option:</p>

        <div className="w-full flex flex-col gap-2.5 mt-2">
          <button
            type="button"
            data-start="true"
            onClick={onResume}
            className="w-full py-3.5 px-6 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-base shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Weiterfahren (Resume)</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="w-full py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Rennen Neustarten (Restart)</span>
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            className="w-full py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span>{isMuted ? 'Ton an (Unmute)' : 'Ton aus (Mute)'}</span>
          </button>

          <button
            type="button"
            onClick={onReturnMenu}
            className="w-full py-3 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors mt-1"
          >
            <Home className="w-4 h-4" />
            <span>Zurück zum Menü</span>
          </button>
        </div>
      </div>
    </div>
  );
};
