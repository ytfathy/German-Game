/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AppScreen,
  RacingSubState,
  LevelConfig,
  CarModel,
  UserProgress,
  MistakeRecord,
  SpeakingCheckpoint,
} from './types/game';
import { LEVELS, CARS, LEVEL_QUESTIONS, SPEAKING_CHECKPOINTS } from './data/levels';
import { selectQuestionsForRace, ShuffledQuestion } from './game/questionEngine';
import {
  calculateAnswerPoints,
  calculateLevelStars,
  isLevelUnlocked,
} from './game/scoring';
import { StorageService } from './services/storageService';
import { audioService } from './services/audioService';

import { TitleScreen } from './components/TitleScreen';
import { RacingEngine } from './game/three/RacingEngine';
import { RacingHUD } from './components/RacingHUD';
import { CheckpointModal } from './components/CheckpointModal';
import { SpeakingModal } from './components/SpeakingModal';
import { LevelCompleteModal } from './components/LevelCompleteModal';
import { PauseModal } from './components/PauseModal';
import { GarageModal } from './components/GarageModal';
import { LevelSelectModal } from './components/LevelSelectModal';
import { ReadingLessonView } from './components/ReadingLessonView';
import { TeacherDashboard } from './components/TeacherDashboard';
import { MistakeReviewModal } from './components/MistakeReviewModal';
import { ComprehensiveQuizView } from './components/ComprehensiveQuizView';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('title');
  const [userProgress, setUserProgress] = useState<UserProgress>(() => StorageService.loadProgress());
  const [isMuted, setIsMuted] = useState(false);

  // Active Race state
  const [currentLevel, setCurrentLevel] = useState<LevelConfig>(LEVELS[0]);
  const [racingSubState, setRacingSubState] = useState<RacingSubState>('driving');
  const [raceQuestions, setRaceQuestions] = useState<ShuffledQuestion[]>([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [questionsCompletedCount, setQuestionsCompletedCount] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [mistakes, setMistakes] = useState<MistakeRecord[]>([]);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [resumeTrigger, setResumeTrigger] = useState(0);

  // Telemetry state
  const [speedKmh, setSpeedKmh] = useState(0);
  const [gear, setGear] = useState(1);
  const [distanceMeters, setDistanceMeters] = useState(0);
  const [totalMeters, setTotalMeters] = useState(1000);

  // Modals & Secondary overlays
  const [activeSpeakingCheckpoint, setActiveSpeakingCheckpoint] = useState<SpeakingCheckpoint | null>(null);
  const [reviewingMistakes, setReviewingMistakes] = useState(false);
  const [raceDurationSeconds, setRaceDurationSeconds] = useState(0);

  // Mobile / Touch controls
  const [touchInput, setTouchInput] = useState({
    gas: false,
    brake: false,
    steerLeft: false,
    steerRight: false,
    handbrake: false,
  });

  const selectedCar = useMemo(() => {
    return CARS.find((c) => c.id === userProgress.selectedCarId) || CARS[0];
  }, [userProgress.selectedCarId]);

  // Sync dataset.state with current game flow & cancel ongoing speech on navigation
  useEffect(() => {
    // Immediately cut off any running speech synthesis when navigating screens or states
    audioService.stopSpeaking();

    if (screen === 'title') {
      document.body.dataset.state = 'title';
    } else if (screen === 'racing') {
      if (racingSubState === 'paused') {
        document.body.dataset.state = 'paused';
      } else if (racingSubState === 'finished') {
        document.body.dataset.state = 'gameover';
      } else {
        document.body.dataset.state = 'playing';
      }
    } else {
      document.body.dataset.state = 'title';
    }
  }, [screen, racingSubState]);

  // Check ?autostart=1 support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        handleStartCareer();
      }
    }
  }, []);

  // Keyboard shortcut listener for Esc / P (Pause)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (screen !== 'racing') return;
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (racingSubState === 'driving' || racingSubState === 'approaching_checkpoint') {
          setRacingSubState('paused');
        } else if (racingSubState === 'paused') {
          setRacingSubState('driving');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, racingSubState]);

  const handleToggleMute = useCallback(() => {
    const next = audioService.toggleMute();
    setIsMuted(next);
  }, []);

  // Launch a race
  const startRaceWithLevel = useCallback((level: LevelConfig) => {
    setCurrentLevel(level);

    // Merge standard question bank with any custom teacher questions for this level
    const standardQuestions = LEVEL_QUESTIONS[level.number] || LEVEL_QUESTIONS[1];
    const customQuestions = (userProgress.teacherConfig?.customQuestions || []).filter(
      (q) => q.levelId === level.id
    );
    const combinedBank = [...standardQuestions, ...customQuestions];

    const qCount = userProgress.teacherConfig?.questionsPerRace || level.checkpointsCount;
    const preparedQuestions = selectQuestionsForRace(combinedBank, qCount);

    setRaceQuestions(preparedQuestions);
    setActiveQuestionIndex(0);
    setQuestionsCompletedCount(0);
    setScore(0);
    setStreak(0);
    setMistakes([]);
    setCorrectAnswersCount(0);
    setDistanceMeters(0);
    setTotalMeters(level.trackLength);
    setSpeedKmh(0);
    setGear(1);
    setActiveSpeakingCheckpoint(null);
    setReviewingMistakes(false);
    setRacingSubState('driving');
    setScreen('racing');
  }, [userProgress.teacherConfig]);

  const handleStartCareer = useCallback(() => {
    // Pick first incomplete level or level 1
    const targetLvl = LEVELS.find(
      (l) => !userProgress.completedLevels[l.number]?.completed && isLevelUnlocked(l.number, userProgress.completedLevels, userProgress.totalStars)
    ) || LEVELS[0];

    startRaceWithLevel(targetLvl);
  }, [userProgress, startRaceWithLevel]);

  // Checkpoint reached by car
  const handleReachCheckpoint = useCallback((checkpointIdx: number) => {
    audioService.playCheckpointApproaching();
    setActiveQuestionIndex(checkpointIdx % Math.max(1, raceQuestions.length));
    setRacingSubState('checkpoint_question');
  }, [raceQuestions.length]);

  // Answer submitted by student
  const handleAnswerSubmitted = useCallback(
    (isCorrect: boolean, userAnswerText: string, correctAnswerText: string, explanation: string) => {
      const currentQ = raceQuestions[activeQuestionIndex];

      if (isCorrect) {
        const { pointsEarned, newStreak } = calculateAnswerPoints({
          currentStreak: streak,
          isCorrect: true,
        });
        setScore((prev) => prev + pointsEarned);
        setStreak(newStreak);
        setCorrectAnswersCount((prev) => prev + 1);
      } else {
        setStreak(0);
        if (currentQ) {
          setMistakes((prev) => [
            ...prev,
            {
              question: currentQ.originalQuestion,
              userAnswer: userAnswerText,
              correctAnswer: correctAnswerText,
              explanation,
            },
          ]);
        }
      }

      setQuestionsCompletedCount((prev) => prev + 1);
    },
    [activeQuestionIndex, raceQuestions, streak]
  );

  // Student confirmed and clicks "Continue Racing"
  const handleContinueRacing = useCallback(() => {
    const nextCompletedCount = questionsCompletedCount + 1;
    const speakingEnabled = userProgress.teacherConfig?.speakingCheckpointsEnabled ?? true;

    // "After every three completed questions, insert a mandatory German speaking checkpoint."
    if (speakingEnabled && nextCompletedCount > 0 && nextCompletedCount % 3 === 0) {
      // Find speaking checkpoint matching current level or default
      const customSpeaking = (userProgress.teacherConfig?.customSpeaking || []).filter(
        (s) => s.levelId === currentLevel.id
      );
      const standardSpeaking = SPEAKING_CHECKPOINTS.find((s) => s.levelId === currentLevel.number) || SPEAKING_CHECKPOINTS[0];
      const selectedSpeaking = customSpeaking.length > 0 ? customSpeaking[0] : standardSpeaking;

      setActiveSpeakingCheckpoint(selectedSpeaking);
      setRacingSubState('speaking_checkpoint');
      return;
    }

    setRacingSubState('driving');
    setResumeTrigger((prev) => prev + 1);
  }, [questionsCompletedCount, userProgress.teacherConfig, currentLevel]);

  // Speaking checkpoint completed
  const handleSpeakingCompleted = useCallback((speakingScore: number) => {
    if (speakingScore >= 50) {
      setScore((prev) => prev + Math.round(speakingScore * 1.5));
    }
    setActiveSpeakingCheckpoint(null);
    setRacingSubState('driving');
    setResumeTrigger((prev) => prev + 1);
  }, []);

  // Telemetry updates from 3D physics loop
  const handleUpdateTelemetry = useCallback(
    (spd: number, dist: number, total: number, curGear: number) => {
      setSpeedKmh(spd);
      setDistanceMeters(dist);
      setTotalMeters(total);
      setGear(curGear);
    },
    []
  );

  // Race finished
  const handleFinishRace = useCallback((raceTimeSeconds: number) => {
    setRaceDurationSeconds(raceTimeSeconds);
    const totalQ = raceQuestions.length;
    const accuracy = totalQ > 0 ? correctAnswersCount / totalQ : 1;
    const stars = calculateLevelStars(accuracy, totalQ);

    const updated = StorageService.recordRaceCompletion(
      currentLevel.number,
      score,
      stars,
      accuracy,
      Math.round(raceTimeSeconds),
      mistakes.length
    );
    setUserProgress(updated);
    setRacingSubState('finished');
  }, [raceQuestions.length, correctAnswersCount, currentLevel.number, score, mistakes.length]);

  const activeQuestion = raceQuestions[activeQuestionIndex];

  return (
    <div className="relative w-screen h-screen bg-slate-950 overflow-hidden font-sans select-none">
      {/* SCREEN 1: Title Screen */}
      {screen === 'title' && (
        <TitleScreen
          onStartCareer={handleStartCareer}
          onNavigate={(targetScreen) => setScreen(targetScreen)}
          userProgress={userProgress}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* SCREEN 2: 3D Racing World & In-Game Experience */}
      {screen === 'racing' && (
        <div className="relative w-full h-full">
          {/* 3D WebGL Canvas Viewport */}
          <RacingEngine
            levelConfig={currentLevel}
            carConfig={selectedCar}
            racingState={racingSubState}
            onReachCheckpoint={handleReachCheckpoint}
            onFinishRace={handleFinishRace}
            onUpdateTelemetry={handleUpdateTelemetry}
            resumeTrigger={resumeTrigger}
            isPaused={racingSubState === 'paused'}
            activeInput={touchInput}
          />

          {/* In-Game HUD (Low-occlusion perimeter) */}
          <RacingHUD
            levelConfig={currentLevel}
            carConfig={selectedCar}
            speedKmh={speedKmh}
            gear={gear}
            distanceMeters={distanceMeters}
            totalMeters={totalMeters}
            score={score}
            streak={streak}
            starsEarned={calculateLevelStars(
              raceQuestions.length > 0 ? correctAnswersCount / raceQuestions.length : 1,
              raceQuestions.length
            )}
            checkpointsCompleted={questionsCompletedCount}
            totalCheckpoints={raceQuestions.length}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onPause={() => setRacingSubState('paused')}
            onTouchGas={(v) => setTouchInput((prev) => ({ ...prev, gas: v }))}
            onTouchBrake={(v) => setTouchInput((prev) => ({ ...prev, brake: v }))}
            onTouchSteerLeft={(v) => setTouchInput((prev) => ({ ...prev, steerLeft: v }))}
            onTouchSteerRight={(v) => setTouchInput((prev) => ({ ...prev, steerRight: v }))}
            onTouchHandbrake={(v) => setTouchInput((prev) => ({ ...prev, handbrake: v }))}
          />

          {/* Question Checkpoint Modal (Submit-first sequence) */}
          {racingSubState === 'checkpoint_question' && activeQuestion && (
            <CheckpointModal
              checkpointNumber={activeQuestionIndex + 1}
              totalCheckpoints={raceQuestions.length}
              question={activeQuestion}
              onAnswerSubmitted={handleAnswerSubmitted}
              onContinueRacing={handleContinueRacing}
            />
          )}

          {/* Speaking Checkpoint Modal (Mandatory every 3 questions) */}
          {racingSubState === 'speaking_checkpoint' && activeSpeakingCheckpoint && (
            <SpeakingModal
              checkpoint={activeSpeakingCheckpoint}
              onComplete={handleSpeakingCompleted}
              onSkip={() => handleSpeakingCompleted(50)}
            />
          )}

          {/* Pause Modal */}
          {racingSubState === 'paused' && (
            <PauseModal
              onResume={() => setRacingSubState('driving')}
              onRestart={() => startRaceWithLevel(currentLevel)}
              onReturnMenu={() => setScreen('title')}
              isMuted={isMuted}
              onToggleMute={handleToggleMute}
            />
          )}

          {/* Level Complete / Victory Modal */}
          {racingSubState === 'finished' && (
            <LevelCompleteModal
              levelNumber={currentLevel.number}
              levelTitle={currentLevel.germanTitle}
              score={score}
              stars={calculateLevelStars(
                raceQuestions.length > 0 ? correctAnswersCount / raceQuestions.length : 1,
                raceQuestions.length
              )}
              accuracy={raceQuestions.length > 0 ? correctAnswersCount / raceQuestions.length : 1}
              timeSpentSeconds={raceDurationSeconds}
              mistakes={mistakes}
              hasNextLevel={currentLevel.number < 7}
              onNextLevel={() => {
                const nextLvl = LEVELS.find((l) => l.number === currentLevel.number + 1);
                if (nextLvl) startRaceWithLevel(nextLvl);
              }}
              onRetry={() => startRaceWithLevel(currentLevel)}
              onReturnMenu={() => setScreen('title')}
              onReviewMistakes={() => setReviewingMistakes(true)}
            />
          )}

          {/* Mistake Review Modal */}
          {reviewingMistakes && (
            <MistakeReviewModal
              mistakes={mistakes}
              onClose={() => setReviewingMistakes(false)}
            />
          )}
        </div>
      )}

      {/* SCREEN 3: Garage Modal */}
      {screen === 'garage' && (
        <GarageModal
          selectedCarId={userProgress.selectedCarId}
          totalStars={userProgress.totalStars}
          onSelectCar={(carId) => {
            StorageService.updateSelectedCar(carId);
            setUserProgress((prev) => ({ ...prev, selectedCarId: carId }));
          }}
          onClose={() => setScreen('title')}
        />
      )}

      {/* SCREEN 4: Level Select Modal */}
      {screen === 'level_select' && (
        <LevelSelectModal
          userProgress={userProgress}
          onSelectLevel={(lvl) => startRaceWithLevel(lvl)}
          onOpenQuiz={() => setScreen('quiz')}
          onClose={() => setScreen('title')}
        />
      )}

      {/* SCREEN 5: Comprehensive Quiz Revision (All 176 Questions) */}
      {screen === 'quiz' && (
        <ComprehensiveQuizView onBackToMenu={() => setScreen('title')} />
      )}

      {/* SCREEN 6: Reading Lessons Mode */}
      {screen === 'reading_lessons' && (
        <ReadingLessonView onBackToMenu={() => setScreen('title')} />
      )}

      {/* SCREEN 7: Teacher Dashboard */}
      {screen === 'teacher_dashboard' && (
        <TeacherDashboard
          userProgress={userProgress}
          onUpdateProgress={(updated) => setUserProgress(updated)}
          onBackToMenu={() => setScreen('title')}
        />
      )}
    </div>
  );
}
