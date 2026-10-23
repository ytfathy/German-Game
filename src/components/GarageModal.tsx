/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Car, Lock, Check, Sparkles, Gauge, Zap, Compass } from 'lucide-react';
import { CarModel } from '../types/game';
import { CARS } from '../data/levels';
import { isCarUnlocked } from '../game/scoring';
import { audioService } from '../services/audioService';

interface GarageModalProps {
  selectedCarId: string;
  totalStars: number;
  onSelectCar: (carId: string) => void;
  onClose: () => void;
}

export const GarageModal: React.FC<GarageModalProps> = ({
  selectedCarId,
  totalStars,
  onSelectCar,
  onClose,
}) => {
  const handleSelect = (car: CarModel) => {
    if (!isCarUnlocked(car.requiredStars, totalStars)) return;
    audioService.playTurboBoost();
    onSelectCar(car.id);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 pointer-events-auto select-none"
      data-testid="garage-modal"
    >
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border-2 border-sky-500/70 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Car className="w-6 h-6 text-sky-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Fahrzeug-Garage (Car Selection)</h2>
              <p className="text-xs text-slate-400">Wähle deinen Sportwagen für die Rennstrecke</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-amber-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{totalStars} Sterne gesammelt</span>
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
        </div>

        {/* Cars Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {CARS.map((car) => {
            const isSelected = car.id === selectedCarId;
            const unlocked = isCarUnlocked(car.requiredStars, totalStars);

            return (
              <div
                key={car.id}
                onClick={() => unlocked && handleSelect(car)}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-sky-950/60 border-sky-400 ring-2 ring-sky-400/40'
                    : unlocked
                    ? 'bg-slate-950/90 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    : 'bg-slate-950/40 border-slate-800/60 opacity-60 cursor-not-allowed'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-4 h-4 rounded-full border border-white/40 shadow-sm"
                          style={{ backgroundColor: car.primaryColor }}
                        />
                        <h3 className="text-lg font-bold text-white">{car.germanName}</h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{car.description}</p>
                    </div>

                    {isSelected ? (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-500 text-white font-bold text-xs">
                        <Check className="w-3.5 h-3.5" />
                        Aktiv
                      </span>
                    ) : !unlocked ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-xs">
                        <Lock className="w-3.5 h-3.5" />
                        <span>{car.requiredStars}</span>
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>benötigt</span>
                      </span>
                    ) : null}
                  </div>

                  {/* Specs Bars */}
                  <div className="mt-4 space-y-2">
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-0.5">
                        <span className="flex items-center gap-1">
                          <Gauge className="w-3 h-3 text-sky-400" />
                          <span>Höchstgeschwindigkeit:</span>
                        </span>
                        <strong className="text-white">{car.topSpeed} km/h</strong>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-400"
                          style={{ width: `${(car.topSpeed / 250) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-0.5">
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>Beschleunigung:</span>
                        </span>
                        <strong className="text-white">{Math.round(car.acceleration * 100)}%</strong>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400"
                          style={{ width: `${car.acceleration * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-0.5">
                        <span className="flex items-center gap-1">
                          <Compass className="w-3 h-3 text-emerald-400" />
                          <span>Handling & Kurvenlage:</span>
                        </span>
                        <strong className="text-white">{Math.round(car.handling * 100)}%</strong>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400"
                          style={{ width: `${car.handling * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                    Motorsport Edition
                  </span>

                  {unlocked && !isSelected && (
                    <button
                      type="button"
                      onClick={() => handleSelect(car)}
                      className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors"
                    >
                      Auswählen
                    </button>
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
