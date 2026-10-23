/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, RotateCcw, Check, Sparkles, ArrowRight, Play, AlertCircle } from 'lucide-react';
import { SpeakingCheckpoint } from '../types/game';
import { audioService } from '../services/audioService';
import { speechAssessmentService, SpeechRecognitionResultPayload } from '../services/speechRecognitionService';
import { assessPronunciation, PronunciationResult } from '../game/pronunciation';

interface SpeakingModalProps {
  checkpoint: SpeakingCheckpoint;
  onComplete: (score: number) => void;
  onSkip?: () => void;
}

export const SpeakingModal: React.FC<SpeakingModalProps> = ({
  checkpoint,
  onComplete,
  onSkip,
}) => {
  const [isPlayingModel, setIsPlayingModel] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [assessmentResult, setAssessmentResult] = useState<PronunciationResult | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isPlayingUserAudio, setIsPlayingUserAudio] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Unmount cleanup: cancel any ongoing speech, recognition or audio playback immediately
  useEffect(() => {
    return () => {
      audioService.stopSpeaking();
      speechAssessmentService.stopListening();
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Automatically play model sentence once on opening
    handlePlayModel();
  }, [checkpoint.id]);

  const handlePlayModel = () => {
    setIsPlayingModel(true);
    audioService.speakGerman(checkpoint.sentence, 0.9, () => {
      setIsPlayingModel(false);
    });
  };

  const handleStartRecording = async () => {
    setErrorMessage(null);
    setInterimTranscript('');
    setIsRecording(true);

    await speechAssessmentService.startListening(
      (interim) => {
        setInterimTranscript(interim);
      },
      (result: SpeechRecognitionResultPayload) => {
        setIsRecording(false);
        if (result.audioBlobUrl) {
          setRecordedAudioUrl(result.audioBlobUrl);
        }

        // Assess pronunciation against target
        const assessed = assessPronunciation(checkpoint.sentence, result.transcript);
        setAssessmentResult(assessed);

        if (assessed.overallScore >= 60) {
          audioService.playCorrectAnswer();
        } else {
          audioService.playIncorrectAnswer();
        }
      },
      (err) => {
        setIsRecording(false);
        setErrorMessage(err);
      }
    );
  };

  const handleStopRecording = () => {
    speechAssessmentService.stopListening();
  };

  const handlePlayUserRecording = () => {
    if (!recordedAudioUrl) return;
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    const audio = new Audio(recordedAudioUrl);
    audioPlayerRef.current = audio;
    setIsPlayingUserAudio(true);
    audio.onended = () => setIsPlayingUserAudio(false);
    audio.onerror = () => setIsPlayingUserAudio(false);
    audio.play().catch(() => setIsPlayingUserAudio(false));
  };

  const handleContinue = () => {
    audioService.playTurboBoost();
    onComplete(assessmentResult?.overallScore ?? 80);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 pointer-events-auto select-none"
      data-testid="speaking-modal"
    >
      <div className="w-full max-w-xl bg-slate-900 border-2 border-emerald-500/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-emerald-950 to-slate-900 px-6 py-3.5 border-b border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 rounded-full bg-emerald-400" />
            <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-400">
              Sprach-Checkpoint (Speaking Practice)
            </span>
          </div>

          <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-xs font-semibold text-emerald-300 border border-slate-700">
            Niveau {checkpoint.difficulty}
          </span>
        </div>

        {/* Content Body */}
        <div className="p-6 flex flex-col gap-5">
          {/* Instructions */}
          <div className="text-xs sm:text-sm text-slate-300">
            Höre dir den deutschen Beispielsatz an und sprich ihn deutlich ins Mikrofon nach:
          </div>

          {/* Model Sentence Box */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-emerald-500/40 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white leading-snug">
                  {checkpoint.sentence}
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  &quot;{checkpoint.englishTranslation}&quot;
                </p>
                {checkpoint.phoneticHint && (
                  <p className="text-xs text-emerald-400/90 mt-1 font-mono">
                    Aussprache: {checkpoint.phoneticHint}
                  </p>
                )}
              </div>

              {/* Play Model Button */}
              <button
                type="button"
                onClick={handlePlayModel}
                disabled={isPlayingModel}
                className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
                aria-label="Modellsatz vorlesen"
              >
                <Volume2 className={`w-6 h-6 ${isPlayingModel ? 'animate-pulse text-emerald-200' : ''}`} />
              </button>
            </div>

            {checkpoint.tips && (
              <div className="text-xs text-slate-400 border-t border-slate-800/80 pt-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Tipp: {checkpoint.tips}</span>
              </div>
            )}
          </div>

          {/* Microphone Action Controls */}
          <div className="flex flex-col items-center justify-center py-2">
            {!isRecording ? (
              <button
                type="button"
                onClick={handleStartRecording}
                className="px-6 py-4 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold text-base shadow-lg shadow-emerald-500/30 flex items-center gap-3 active:scale-95 transition-all cursor-pointer"
              >
                <Mic className="w-6 h-6" />
                <span>Jetzt Nachsprechen (Start Speaking)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStopRecording}
                className="px-6 py-4 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-base shadow-lg shadow-red-500/30 flex items-center gap-3 active:scale-95 transition-all cursor-pointer animate-pulse"
              >
                <MicOff className="w-6 h-6" />
                <span>Aufnahme Beenden (Stop Recording)</span>
              </button>
            )}

            {isRecording && (
              <p className="text-xs text-emerald-400 mt-2 font-medium">
                Ich höre zu... Sprich jetzt den Satz laut aus!
              </p>
            )}

            {interimTranscript && (
              <div className="mt-3 px-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono">
                Erkannt: &quot;{interimTranscript}&quot;
              </div>
            )}

            {errorMessage && (
              <div className="mt-3 p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-xs text-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Assessment Feedback Card */}
          {assessmentResult && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-white">{assessmentResult.feedbackHeadline}</div>
                  <div className="text-xs text-slate-400">{assessmentResult.feedbackDetail}</div>
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-2xl font-black text-emerald-400 tabular-nums">
                    {assessmentResult.overallScore}%
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    Genauigkeit
                  </span>
                </div>
              </div>

              {/* Word-by-word highlight badge cluster */}
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/80">
                {assessmentResult.wordAnalyses.map((wa, wIdx) => (
                  <span
                    key={wIdx}
                    className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      wa.matched
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/50'
                        : 'bg-amber-950/80 text-amber-300 border border-amber-600/50'
                    }`}
                  >
                    {wa.word}
                  </span>
                ))}
              </div>

              {/* Replay student audio button if available */}
              {recordedAudioUrl && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={handlePlayUserRecording}
                    disabled={isPlayingUserAudio}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 text-sky-400 fill-current" />
                    <span>{isPlayingUserAudio ? 'Wiedergabe...' : 'Eigene Aufnahme abspielen'}</span>
                  </button>
                </div>
              )}

              {/* Honest labeling disclosure */}
              <div className="text-[10px] text-slate-500 italic">
                * Bewertung erfolgt über Browser-Spracherkennung (Erkennungsabgleich).
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-between">
          {onSkip ? (
            <button
              type="button"
              onClick={onSkip}
              className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
            >
              Überspringen (Skip)
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-3">
            {assessmentResult && (
              <button
                type="button"
                onClick={handleStartRecording}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Nochmal versuchen</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleContinue}
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold text-sm sm:text-base shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>Weiterfahren (Continue)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
