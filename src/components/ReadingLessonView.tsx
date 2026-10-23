/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Volume2,
  VolumeX,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import { ReadingLesson, Question } from '../types/game';
import { READING_LESSONS } from '../data/readingLessons';
import { audioService } from '../services/audioService';

interface ReadingLessonViewProps {
  onBackToMenu: () => void;
}

export const ReadingLessonView: React.FC<ReadingLessonViewProps> = ({ onBackToMenu }) => {
  const [selectedLesson, setSelectedLesson] = useState<ReadingLesson>(READING_LESSONS[0]);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number | null>(null);
  const [isPlayingFullAudio, setIsPlayingFullAudio] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(0.95);
  const [activeTab, setActiveTab] = useState<'reading' | 'vocab' | 'quiz'>('reading');

  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Unmount cleanup: cancel any ongoing speech immediately
  useEffect(() => {
    return () => {
      audioService.stopSpeaking();
    };
  }, []);

  const handleBack = () => {
    audioService.stopSpeaking();
    setIsPlayingFullAudio(false);
    setActiveSentenceIndex(null);
    onBackToMenu();
  };

  const handlePlayFullPassage = () => {
    if (isPlayingFullAudio) {
      audioService.stopSpeaking();
      setIsPlayingFullAudio(false);
      setActiveSentenceIndex(null);
      return;
    }

    setIsPlayingFullAudio(true);
    let sIdx = 0;

    const playNext = () => {
      if (sIdx >= selectedLesson.sentences.length) {
        setIsPlayingFullAudio(false);
        setActiveSentenceIndex(null);
        return;
      }
      setActiveSentenceIndex(sIdx);
      const sentence = selectedLesson.sentences[sIdx];
      audioService.speakGerman(sentence, playbackSpeed, () => {
        sIdx++;
        playNext();
      });
    };

    playNext();
  };

  const handlePlaySentence = (idx: number) => {
    audioService.stopSpeaking();
    setIsPlayingFullAudio(false);
    setActiveSentenceIndex(idx);
    audioService.speakGerman(selectedLesson.sentences[idx], playbackSpeed, () => {
      setActiveSentenceIndex(null);
    });
  };

  const currentQuestion: Question | undefined = selectedLesson.questions[currentQuizIdx];

  const handleQuizSubmit = () => {
    if (selectedOption === null || !currentQuestion || quizSubmitted) return;
    setQuizSubmitted(true);
    const isCorrect = selectedOption === currentQuestion.correctAnswer;
    if (isCorrect) {
      setQuizScore((prev) => prev + 1);
      audioService.playCorrectAnswer();
    } else {
      audioService.playIncorrectAnswer();
    }
  };

  const handleNextQuizQuestion = () => {
    if (currentQuizIdx < selectedLesson.questions.length - 1) {
      setCurrentQuizIdx((prev) => prev + 1);
      setSelectedOption(null);
      setQuizSubmitted(false);
    } else {
      setQuizFinished(true);
    }
  };

  const handleResetQuiz = () => {
    setCurrentQuizIdx(0);
    setSelectedOption(null);
    setQuizSubmitted(false);
    setQuizScore(0);
    setQuizFinished(false);
  };

  return (
    <div
      className="relative w-full h-full min-h-screen bg-slate-950 flex flex-col p-4 sm:p-8 select-none text-white overflow-y-auto"
      data-testid="reading-lessons-screen"
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

        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          <h1 className="text-base sm:text-lg font-bold text-white">Deutsche Lesestücke (Reading Lessons)</h1>
        </div>
      </div>

      {/* Lesson Selector Pills */}
      <div className="flex flex-wrap gap-2.5 my-5">
        {READING_LESSONS.map((lesson) => (
          <button
            key={lesson.id}
            type="button"
            onClick={() => {
              setSelectedLesson(lesson);
              handleResetQuiz();
              setActiveSentenceIndex(null);
              setIsPlayingFullAudio(false);
              audioService.stopSpeaking();
            }}
            className={`px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              selectedLesson.id === lesson.id
                ? 'bg-emerald-950 border-emerald-400 text-emerald-200 shadow-md ring-2 ring-emerald-400/30'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            {lesson.germanTitle}
          </button>
        ))}
      </div>

      {/* Main Lesson Body Card */}
      <div className="w-full max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Lesson Subheader & Mode Tabs */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase font-extrabold text-emerald-400 tracking-wider">
              {selectedLesson.topic}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
              {selectedLesson.title}
            </h2>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('reading')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'reading' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Lesetext
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('vocab')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'vocab' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Wortschatz ({selectedLesson.vocabulary.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('quiz')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'quiz' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Verständnis-Quiz
            </button>
          </div>
        </div>

        {/* Tab 1: Reading Text with Sentence Highlighting & Audio */}
        {activeTab === 'reading' && (
          <div className="p-6 sm:p-8 flex flex-col gap-6">
            {/* Audio Toolbar */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePlayFullPassage}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md cursor-pointer transition-all"
                >
                  {isPlayingFullAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>{isPlayingFullAudio ? 'Audio Pausieren' : 'Ganzen Text anhören'}</span>
                </button>

                <span className="text-xs text-slate-400 hidden sm:inline">
                  Tippe auf einen Satz, um ihn einzeln anzuhören.
                </span>
              </div>

              {/* Speed selection */}
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Tempo:</span>
                {[0.8, 0.95, 1.2].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                      playbackSpeed === spd ? 'bg-slate-800 text-emerald-300 border border-emerald-500/40' : 'text-slate-500'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* German Story Sentences */}
            <div className="space-y-3 leading-relaxed text-base sm:text-lg">
              {selectedLesson.sentences.map((sentence, idx) => {
                const isActive = activeSentenceIndex === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => handlePlaySentence(idx)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isActive
                        ? 'bg-emerald-950/80 border-emerald-400 text-white shadow-lg ring-2 ring-emerald-400/40'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-950 text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span>{sentence}</span>
                    <button
                      type="button"
                      className="p-1 rounded text-slate-400 hover:text-emerald-300 shrink-0"
                      aria-label="Satz vorlesen"
                    >
                      <Volume2 className={`w-4 h-4 ${isActive ? 'text-emerald-400 animate-pulse' : ''}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Vocabulary Glossary Drawer */}
        {activeTab === 'vocab' && (
          <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedLesson.vocabulary.map((vocab, vIdx) => (
              <div
                key={vIdx}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="text-base font-bold text-white">{vocab.german}</div>
                  <div className="text-xs text-emerald-400 font-semibold">{vocab.english}</div>
                  {vocab.example && (
                    <div className="text-xs text-slate-400 mt-1 italic">&quot;{vocab.example}&quot;</div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => audioService.speakGerman(vocab.german)}
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 cursor-pointer"
                  aria-label="Wort anhören"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Comprehension Quiz */}
        {activeTab === 'quiz' && (
          <div className="p-6 sm:p-8 flex flex-col gap-6">
            {!quizFinished && currentQuestion ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="uppercase font-bold tracking-wider text-emerald-400">
                    Frage {currentQuizIdx + 1} von {selectedLesson.questions.length}
                  </span>
                  <span>Punkte: <strong className="text-white">{quizScore}</strong></span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-white">
                  {currentQuestion.prompt}
                </h3>
                {currentQuestion.promptEnglish && (
                  <p className="text-xs text-slate-400 italic">({currentQuestion.promptEnglish})</p>
                )}

                {/* Options */}
                <div className="grid grid-cols-1 gap-2.5 mt-2">
                  {currentQuestion.options.map((opt, optIdx) => {
                    const isSelected = selectedOption === optIdx;
                    const isCorrect = quizSubmitted && optIdx === currentQuestion.correctAnswer;
                    const isWrong = quizSubmitted && isSelected && optIdx !== currentQuestion.correctAnswer;

                    let style = 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700';
                    if (isSelected && !quizSubmitted) style = 'bg-emerald-950 border-emerald-400 text-emerald-100 ring-2 ring-emerald-400/40';
                    if (isCorrect) style = 'bg-emerald-950 border-emerald-500 text-emerald-200 ring-2 ring-emerald-400/50';
                    if (isWrong) style = 'bg-red-950 border-red-500 text-red-200';

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        disabled={quizSubmitted}
                        onClick={() => setSelectedOption(optIdx)}
                        className={`p-4 rounded-xl border text-left font-medium text-sm flex items-center justify-between transition-all cursor-pointer ${style}`}
                      >
                        <span>{opt}</span>
                        {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        {isWrong && <XCircle className="w-4 h-4 text-red-400" />}
                      </button>
                    );
                  })}
                </div>

                {/* Feedback */}
                {quizSubmitted && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-300 flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <span>{currentQuestion.explanation}</span>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex justify-end gap-3 mt-2">
                  {!quizSubmitted ? (
                    <button
                      type="button"
                      disabled={selectedOption === null}
                      onClick={handleQuizSubmit}
                      className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-sm cursor-pointer transition-all"
                    >
                      Antwort bestätigen
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNextQuizQuestion}
                      className="py-2.5 px-6 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <span>{currentQuizIdx < selectedLesson.questions.length - 1 ? 'Nächste Frage' : 'Quiz Beenden'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-white">Quiz Abgeschlossen!</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Du hast <strong className="text-emerald-400">{quizScore}</strong> von {selectedLesson.questions.length} Fragen richtig beantwortet.
                </p>

                <button
                  type="button"
                  onClick={handleResetQuiz}
                  className="mt-6 py-2.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center gap-2 cursor-pointer transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Quiz wiederholen</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
