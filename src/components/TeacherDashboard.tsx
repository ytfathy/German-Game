/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ArrowLeft,
  Settings,
  Plus,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BookOpen,
  Mic,
  Users,
  Trophy,
} from 'lucide-react';
import { UserProgress, Question, SpeakingCheckpoint } from '../types/game';
import { StorageService } from '../services/storageService';
import { LEVELS, LEVEL_QUESTIONS } from '../data/levels';

interface TeacherDashboardProps {
  userProgress: UserProgress;
  onUpdateProgress: (updated: UserProgress) => void;
  onBackToMenu: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  userProgress,
  onUpdateProgress,
  onBackToMenu,
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'questions' | 'speaking' | 'scores' | 'export'>('config');

  // Form states for adding custom question
  const [newLevelId, setNewLevelId] = useState<number>(1);
  const [newPrompt, setNewPrompt] = useState('');
  const [newPromptEn, setNewPromptEn] = useState('');
  const [newCategory, setNewCategory] = useState<'grammar' | 'vocabulary' | 'listening'>('grammar');
  const [newOptions, setNewOptions] = useState<string[]>(['', '', '']);
  const [newCorrectIndex, setNewCorrectIndex] = useState<number>(0);
  const [newExplanation, setNewExplanation] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Form state for adding speaking sentence
  const [newSpkLevel, setNewSpkLevel] = useState<number>(1);
  const [newSpkSentence, setNewSpkSentence] = useState('');
  const [newSpkTranslation, setNewSpkTranslation] = useState('');
  const [newSpkTips, setNewSpkTips] = useState('');

  // Questions per race config
  const [questionsPerRace, setQuestionsPerRace] = useState(userProgress.teacherConfig.questionsPerRace || 4);
  const [speakingEnabled, setSpeakingEnabled] = useState(userProgress.teacherConfig.speakingCheckpointsEnabled ?? true);

  const handleSaveConfig = () => {
    StorageService.updateTeacherConfig({
      questionsPerRace,
      speakingCheckpointsEnabled: speakingEnabled,
    });
    const updated = StorageService.loadProgress();
    onUpdateProgress(updated);
    setStatusMessage('Einstellungen erfolgreich gespeichert! (Settings saved successfully)');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrompt.trim() || newOptions.some((o) => !o.trim())) {
      alert('Bitte fülle alle Fragenfelder und Antwortoptionen aus.');
      return;
    }

    const question: Question = {
      id: 'custom-q-' + Date.now(),
      levelId: newLevelId,
      type: 'multiple_choice',
      prompt: newPrompt.trim(),
      promptEnglish: newPromptEn.trim() || undefined,
      options: newOptions.map((o) => o.trim()),
      correctAnswer: newCorrectIndex,
      explanation: newExplanation.trim() || 'Richtig beantwortet.',
      category: newCategory,
    };

    StorageService.addCustomQuestion(question);
    const updated = StorageService.loadProgress();
    onUpdateProgress(updated);

    // Reset form
    setNewPrompt('');
    setNewPromptEn('');
    setNewOptions(['', '', '']);
    setNewExplanation('');
    setStatusMessage('Neue Frage erfolgreich zur Fragendatenbank hinzugefügt!');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleAddSpeaking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpkSentence.trim() || !newSpkTranslation.trim()) {
      alert('Bitte fülle Satz und Übersetzung aus.');
      return;
    }

    const checkpoint: SpeakingCheckpoint = {
      id: 'custom-spk-' + Date.now(),
      levelId: newSpkLevel,
      sentence: newSpkSentence.trim(),
      englishTranslation: newSpkTranslation.trim(),
      difficulty: newSpkLevel <= 2 ? 'A1' : newSpkLevel <= 5 ? 'A2' : 'B1',
      tips: newSpkTips.trim() || undefined,
    };

    StorageService.addCustomSpeaking(checkpoint);
    const updated = StorageService.loadProgress();
    onUpdateProgress(updated);

    setNewSpkSentence('');
    setNewSpkTranslation('');
    setNewSpkTips('');
    setStatusMessage('Neuer Sprechsatz erfolgreich hinzugefügt!');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleExportJson = () => {
    const jsonStr = StorageService.exportDataAsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deutsch-racer-curriculum-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = StorageService.importDataFromJson(content);
      if (success) {
        const updated = StorageService.loadProgress();
        onUpdateProgress(updated);
        setStatusMessage('Fragenbank und Fortschritt erfolgreich importiert!');
      } else {
        alert('Fehler beim Importieren der Datei. Ungültiges JSON-Format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      className="relative w-full h-full min-h-screen bg-slate-950 flex flex-col p-4 sm:p-8 select-none text-white overflow-y-auto"
      data-testid="teacher-dashboard"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <button
          type="button"
          onClick={onBackToMenu}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs sm:text-sm font-semibold text-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zurück zum Hauptmenü</span>
        </button>

        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-purple-400" />
          <h1 className="text-base sm:text-lg font-bold text-white">Lehrer-Dashboard &amp; Inhaltsverwaltung</h1>
        </div>
      </div>

      {/* Prototype Notice */}
      <div className="my-4 p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-purple-400 shrink-0" />
          <span>
            <strong>Lokaler Prototyp:</strong> Daten werden sicher im lokalen Browser-Speicher (LocalStorage) gespeichert. Fragenbanken können per JSON exportiert und mit Schülern geteilt werden.
          </span>
        </div>
      </div>

      {statusMessage && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-xs text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: 'config', label: 'Renneinstellungen', icon: Settings },
          { id: 'questions', label: 'Fragenbank verwalten', icon: BookOpen },
          { id: 'speaking', label: 'Sprechsätze (Aussprache)', icon: Mic },
          { id: 'scores', label: 'Schüler-Ergebnisse', icon: Users },
          { id: 'export', label: 'JSON Export / Import', icon: Download },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl border text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-purple-950 border-purple-400 text-purple-200 shadow-md ring-2 ring-purple-400/30'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Config */}
      {activeTab === 'config' && (
        <div className="max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col gap-6">
          <h2 className="text-xl font-bold text-white">Rennen &amp; Lehrplan Konfiguration</h2>

          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase font-bold text-slate-400">
              Anzahl der Fragen pro Rennen:
            </label>
            <div className="flex items-center gap-3">
              {[3, 4, 6, 8].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setQuestionsPerRace(num)}
                  className={`px-4 py-2.5 rounded-xl border font-bold text-sm transition-all cursor-pointer ${
                    questionsPerRace === num
                      ? 'bg-purple-600 text-white border-purple-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {num} Fragen
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              Bestimmt, wie viele Frage-Checkpoints während eines Rennens angefahren werden.
            </p>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
            <div>
              <div className="font-bold text-sm text-white">Sprech-Checkpoints nach je 3 Fragen</div>
              <div className="text-xs text-slate-400">
                Pausiert das Rennen für Mikrofon-Ausspracheübungen
              </div>
            </div>

            <input
              type="checkbox"
              checked={speakingEnabled}
              onChange={(e) => setSpeakingEnabled(e.target.checked)}
              className="w-5 h-5 accent-purple-500 cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={handleSaveConfig}
            className="py-3 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-colors cursor-pointer w-fit"
          >
            Einstellungen Speichern
          </button>
        </div>
      )}

      {/* Tab 2: Custom Questions */}
      {activeTab === 'questions' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form to Add Question */}
          <form
            onSubmit={handleAddQuestion}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col gap-4"
          >
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-purple-400" />
              <span>Neue Frage hinzufügen</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs uppercase font-bold text-slate-400 block mb-1">
                  Stufe (Level)
                </label>
                <select
                  value={newLevelId}
                  onChange={(e) => setNewLevelId(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                >
                  {LEVELS.map((lvl) => (
                    <option key={lvl.id} value={lvl.id}>
                      {lvl.germanTitle}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs uppercase font-bold text-slate-400 block mb-1">
                  Kategorie
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                >
                  <option value="grammar">Grammatik</option>
                  <option value="vocabulary">Wortschatz</option>
                  <option value="listening">Hörverstehen</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs uppercase font-bold text-slate-400 block mb-1">
                Deutsche Frage / Aufgabentext
              </label>
              <input
                type="text"
                required
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                placeholder="z.B. Du ___ schön."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
              />
            </div>

            <div>
              <label className="text-xs uppercase font-bold text-slate-400 block mb-1">
                Englische Übersetzung (optional)
              </label>
              <input
                type="text"
                value={newPromptEn}
                onChange={(e) => setNewPromptEn(e.target.value)}
                placeholder="z.B. You are beautiful."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
              />
            </div>

            {/* Answer Options */}
            <div className="space-y-2">
              <label className="text-xs uppercase font-bold text-slate-400 block">
                Antwortoptionen (Markiere die richtige Antwort):
              </label>
              {newOptions.map((opt, oIdx) => (
                <div key={oIdx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct_choice"
                    checked={newCorrectIndex === oIdx}
                    onChange={() => setNewCorrectIndex(oIdx)}
                    className="accent-purple-500 w-4 h-4 cursor-pointer"
                  />
                  <input
                    type="text"
                    required
                    value={opt}
                    onChange={(e) => {
                      const next = [...newOptions];
                      next[oIdx] = e.target.value;
                      setNewOptions(next);
                    }}
                    placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                    className="flex-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="text-xs uppercase font-bold text-slate-400 block mb-1">
                Erklärung für Schüler
              </label>
              <input
                type="text"
                value={newExplanation}
                onChange={(e) => setNewExplanation(e.target.value)}
                placeholder="z.B. 2. Person Singular von 'sein' ist 'bist'."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
              />
            </div>

            <button
              type="submit"
              className="mt-2 py-3 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-colors cursor-pointer"
            >
              Frage speichern
            </button>
          </form>

          {/* List of Custom Questions */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold text-white">
              Benutzerdefinierte Fragen ({userProgress.teacherConfig.customQuestions.length})
            </h3>

            {userProgress.teacherConfig.customQuestions.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Noch keine eigenen Fragen erstellt. Nutze das Formular links, um Fragen hinzuzufügen.
              </p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {userProgress.teacherConfig.customQuestions.map((q, idx) => (
                  <div key={q.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                    <div className="font-bold text-white text-sm">{q.prompt}</div>
                    <div className="text-slate-400 mt-1">
                      Richtige Antwort: <strong className="text-emerald-400">{q.options[Number(q.correctAnswer)]}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Speaking Sentences */}
      {activeTab === 'speaking' && (
        <div className="max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col gap-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Mic className="w-5 h-5 text-purple-400" />
            <span>Neuen Aussprache-Satz anlegen</span>
          </h3>

          <form onSubmit={handleAddSpeaking} className="space-y-4">
            <div>
              <label className="text-xs uppercase font-bold text-slate-400 block mb-1">
                Deutscher Satz (wird vom Modell vorgelesen)
              </label>
              <input
                type="text"
                required
                value={newSpkSentence}
                onChange={(e) => setNewSpkSentence(e.target.value)}
                placeholder="z.B. Ich kann sehr gut Basketball spielen."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
              />
            </div>

            <div>
              <label className="text-xs uppercase font-bold text-slate-400 block mb-1">
                Englische Übersetzung
              </label>
              <input
                type="text"
                required
                value={newSpkTranslation}
                onChange={(e) => setNewSpkTranslation(e.target.value)}
                placeholder="I can play basketball very well."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
              />
            </div>

            <div>
              <label className="text-xs uppercase font-bold text-slate-400 block mb-1">
                Aussprachetipp (optional)
              </label>
              <input
                type="text"
                value={newSpkTips}
                onChange={(e) => setNewSpkTips(e.target.value)}
                placeholder="z.B. Achte auf das weiche 'sp' in spielen."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
              />
            </div>

            <button
              type="submit"
              className="py-3 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-colors cursor-pointer"
            >
              Sprechsatz speichern
            </button>
          </form>
        </div>
      )}

      {/* Tab 4: Student Scores History */}
      {activeTab === 'scores' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col gap-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Ergebnis-Protokoll der Schüler</span>
          </h3>

          {userProgress.scoreHistory.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              Noch keine Rennen absolviert. Sobald ein Schüler ein Rennen beendet, erscheinen die Daten hier.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                    <th className="py-2.5 px-3">Datum / Uhrzeit</th>
                    <th className="py-2.5 px-3">Stufe</th>
                    <th className="py-2.5 px-3">Punkte</th>
                    <th className="py-2.5 px-3">Sterne</th>
                    <th className="py-2.5 px-3">Genauigkeit</th>
                    <th className="py-2.5 px-3">Fehler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {userProgress.scoreHistory.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-950/40">
                      <td className="py-2.5 px-3 text-slate-400 font-mono">
                        {new Date(rec.timestamp).toLocaleDateString()} {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white">Stufe {rec.levelNumber}</td>
                      <td className="py-2.5 px-3 font-bold text-sky-400 tabular-nums">{rec.score}</td>
                      <td className="py-2.5 px-3 font-bold text-amber-400">{rec.stars} ★</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-400">{Math.round(rec.accuracy * 100)}%</td>
                      <td className="py-2.5 px-3 text-slate-300">{rec.mistakesCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: JSON Export / Import */}
      {activeTab === 'export' && (
        <div className="max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col gap-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-sky-400" />
            <span>Curriculum Export &amp; Import</span>
          </h3>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
            <h4 className="font-bold text-sm text-white">Fragenbank &amp; Konfiguration herunterladen</h4>
            <p className="text-xs text-slate-400">
              Exportiere alle benutzerdefinierten Fragen, Sprech-Checkpoints und Einstellungen als JSON-Datei.
            </p>
            <button
              type="button"
              onClick={handleExportJson}
              className="mt-2 py-2.5 px-5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-2 w-fit cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Als JSON herunterladen</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
            <h4 className="font-bold text-sm text-white">Fragenbank aus JSON importieren</h4>
            <p className="text-xs text-slate-400">
              Lade eine zuvor exportierte Lehrplan-Datei hoch, um Fragen und Einstellungen wiederherzustellen.
            </p>
            <label className="mt-2 py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 w-fit cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>JSON-Datei auswählen</span>
              <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
