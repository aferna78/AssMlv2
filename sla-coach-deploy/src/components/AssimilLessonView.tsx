import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  BookOpen,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Sparkles,
  Zap,
  Mic,
  Eye,
  EyeOff,
  Flame,
  Award,
  Layers,
  Info,
  Check,
  X,
  MessageSquare,
  Search,
  Filter,
  Cloud,
  CloudOff,
  RefreshCw,
  CheckSquare,
  FileText,
  List,
  Grid,
  Target,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import {
  AssimilLesson,
  AssimilProgress,
  CEFRLevel,
} from '../types';
import {
  ASSIMIL_METHOD_EXPLANATION,
  getAssimilLesson,
  TOTAL_ASSIMIL_LESSONS,
} from '../data/assimilLessons';
import { speakText, stopSpeaking } from '../utils/speech';
import { ExercisePhoneticTester } from './ExercisePhoneticTester';
import { AssimilVerbsView } from './AssimilVerbsView';

interface AssimilLessonViewProps {
  currentLessonNum: number;
  onSelectLesson: (num: number) => void;
  onStartCoachChat: (prompt: string, topic: string) => void;
  voiceAccent?: 'en-US' | 'en-GB';
  syncedProgress?: AssimilProgress;
  onUpdateProgress?: (newProgress: AssimilProgress) => void;
  onManualSync?: () => void;
  syncStatus?: 'idle' | 'syncing' | 'synced' | 'error';
  userDisplayName?: string;
  userEmail?: string;
  onOpenProfile?: () => void;
}

const STORAGE_KEY_ASSIMIL = 'assimil_student_progress_v1';

const INITIAL_PROGRESS: AssimilProgress = {
  currentLessonNumber: 8,
  completedLessons: [1, 2, 3, 4, 5, 6, 7],
  listenedLessons: [1, 2, 3, 4, 5, 6, 7, 8],
  masteredActiveLessons: [],
  audioSpeed: 0.9,
};

export const AssimilLessonView: React.FC<AssimilLessonViewProps> = ({
  currentLessonNum,
  onSelectLesson,
  onStartCoachChat,
  voiceAccent = 'en-GB',
  syncedProgress,
  onUpdateProgress,
  onManualSync,
  syncStatus = 'synced',
  userDisplayName = 'Antonio',
  userEmail = 'AntonioFCM@gmail.com',
  onOpenProfile,
}) => {
  const [progress, setProgress] = useState<AssimilProgress>(() => {
    if (syncedProgress) return syncedProgress;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ASSIMIL);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.currentLessonNumber === 'number') {
          return parsed;
        }
      }
    } catch {}
    return {
      currentLessonNumber: currentLessonNum || 8,
      completedLessons: [1, 2, 3, 4, 5, 6, 7],
      listenedLessons: [1, 2, 3, 4, 5, 6, 7, 8],
      masteredActiveLessons: [],
      audioSpeed: 0.9,
    };
  });

  // Keep local state in sync when parent passes newly synced progress (Cloud Sync)
  useEffect(() => {
    if (syncedProgress) {
      setProgress(syncedProgress);
    }
  }, [syncedProgress]);

  const [activeTab, setActiveTab] = useState<'dialogue' | 'notes' | 'exercises' | 'verbs' | 'catalog'>('dialogue');
  const [studyMode, setStudyMode] = useState<'bilingual' | 'active_recall'>('bilingual');
  const [viewLayout, setViewLayout] = useState<'book_split' | 'cards' | 'step_by_step'>('book_split');
  const [dialogueCurrentIndex, setDialogueCurrentIndex] = useState<number>(0);
  const [showPhoneticsModal, setShowPhoneticsModal] = useState(false);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [currentlyPlayingLineId, setCurrentlyPlayingLineId] = useState<string | null>(null);
  const [revealedLines, setRevealedLines] = useState<Record<string, boolean>>({});
  const [exercise2Answers, setExercise2Answers] = useState<Record<string, string>>({});
  const [exercise2Checked, setExercise2Checked] = useState<Record<string, boolean>>({});
  const [exercise2ShowSolution, setExercise2ShowSolution] = useState<Record<string, boolean>>({});
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogWeekFilter, setCatalogWeekFilter] = useState<number | 'all'>('all');
  const [catalogPage, setCatalogPage] = useState<number>(1);
  const [showAllLessonsAtOnce, setShowAllLessonsAtOnce] = useState<boolean>(false);
  const [audioSpeed, setAudioSpeed] = useState<number>(0.9);
  const [bookSplitOrder, setBookSplitOrder] = useState<'en_es' | 'es_en'>('en_es');

  // Exercise Sub-menus & Step-by-step navigation states for agile performance
  const [exerciseSubTab, setExerciseSubTab] = useState<'ex1' | 'ex2' | 'phonetics' | 'summary'>('ex1');
  const [ex1ViewMode, setEx1ViewMode] = useState<'step_by_step' | 'all'>('step_by_step');
  const [ex2ViewMode, setEx2ViewMode] = useState<'step_by_step' | 'all'>('step_by_step');
  const [ex1CurrentIndex, setEx1CurrentIndex] = useState<number>(0);
  const [ex2CurrentIndex, setEx2CurrentIndex] = useState<number>(0);
  const [phoneticsCurrentIndex, setPhoneticsCurrentIndex] = useState<number>(0);

  const lesson = useMemo(() => getAssimilLesson(currentLessonNum), [currentLessonNum]);
  const isCompleted = progress.completedLessons.includes(lesson.number);
  const isListened = progress.listenedLessons.includes(lesson.number);

  // Sync progress
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ASSIMIL, JSON.stringify(progress));
    } catch (e) {
      console.warn('Failed to save Assimil progress', e);
    }
  }, [progress]);

  // Clean state when changing lesson
  useEffect(() => {
    stopSpeaking();
    setIsPlayingAll(false);
    setCurrentlyPlayingLineId(null);
    setRevealedLines({});
    setExercise2Answers({});
    setExercise2Checked({});
    setExercise2ShowSolution({});
    setDialogueCurrentIndex(0);
    setEx1CurrentIndex(0);
    setEx2CurrentIndex(0);
    setPhoneticsCurrentIndex(0);
  }, [currentLessonNum]);

  // Handle play audio for single line
  const handlePlayLine = async (lineId: string, englishText: string) => {
    stopSpeaking();
    setCurrentlyPlayingLineId(lineId);
    await speakText(englishText, {
      lang: voiceAccent,
      rate: audioSpeed,
    });
    setCurrentlyPlayingLineId(null);
  };

  // Handle continuous play for the whole dialogue
  const handlePlayEntireDialogue = async () => {
    if (isPlayingAll) {
      stopSpeaking();
      setIsPlayingAll(false);
      setCurrentlyPlayingLineId(null);
      return;
    }

    setIsPlayingAll(true);

    for (const line of lesson.dialogue) {
      setCurrentlyPlayingLineId(line.id);
      await speakText(line.english, {
        lang: voiceAccent,
        rate: audioSpeed,
      });
      // Short pause between speakers
      await new Promise((r) => setTimeout(r, 650));
    }

    setIsPlayingAll(false);
    setCurrentlyPlayingLineId(null);

    // Mark as listened
    if (!progress.listenedLessons.includes(lesson.number)) {
      const updated: AssimilProgress = {
        ...progress,
        listenedLessons: [...progress.listenedLessons, lesson.number],
      };
      setProgress(updated);
      try {
        localStorage.setItem(STORAGE_KEY_ASSIMIL, JSON.stringify(updated));
      } catch {}
      if (onUpdateProgress) {
        onUpdateProgress(updated);
      }
    }
  };

  // Toggle mark lesson as completed
  const handleToggleComplete = () => {
    const isAlready = progress.completedLessons.includes(lesson.number);
    const updated: AssimilProgress = {
      ...progress,
      completedLessons: isAlready
        ? progress.completedLessons.filter((num) => num !== lesson.number)
        : [...progress.completedLessons, lesson.number].sort((a, b) => a - b),
    };
    setProgress(updated);
    try {
      localStorage.setItem(STORAGE_KEY_ASSIMIL, JSON.stringify(updated));
    } catch {}
    if (onUpdateProgress) {
      onUpdateProgress(updated);
    }
  };

  // Exercise 2 validation
  const handleCheckExercise2 = (itemId: string, correctWord: string) => {
    const userVal = (exercise2Answers[itemId] || '').trim().toLowerCase();
    const targetVal = correctWord.trim().toLowerCase();
    const isCorrect = userVal === targetVal;

    setExercise2Checked((prev) => ({ ...prev, [itemId]: isCorrect }));
  };

  const handleRevealExercise2 = (itemId: string) => {
    setExercise2ShowSolution((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  // Send lesson context to Master Coach chat
  const handleCoachSession = () => {
    const prompt = `¡Hola Coach! Estoy trabajando en la **Lección ${lesson.number} del Método Assimil**: "${lesson.titleEnglish}" (${lesson.titleSpanish}).\n\nQuiero que hagamos una práctica interactiva: ponme a prueba con preguntas sobre el diálogo y ayúdame a corregir cualquier error para interiorizar las estructuras.`;
    onStartCoachChat(prompt, `Assimil Lección ${lesson.number}: ${lesson.titleEnglish}`);
  };

  // Calculate stats
  const totalCompleted = progress.completedLessons.length;
  const completionPercentage = Math.round((totalCompleted / TOTAL_ASSIMIL_LESSONS) * 100);
  const highestCompleted = progress.completedLessons.length > 0 ? Math.max(...progress.completedLessons) : 0;
  const activeCourseMilestone = Math.max(highestCompleted + 1, progress.currentLessonNumber || 1, 8);
  const isReviewingPrevious = lesson.number < activeCourseMilestone;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner: Assimil Identity & Navigation */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/20 shadow-xl p-5 sm:p-6">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                🇬🇧 Método Assimil
              </span>
              <span className="text-xs text-slate-400 font-medium">
                El nuevo inglés sin esfuerzo &bull; 146 lecciones
              </span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  lesson.phase === 'passive'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
              >
                {lesson.phase === 'passive' ? 'Onda Pasiva (1-50)' : 'Onda Activa (51-146)'}
              </span>
              {lesson.isReviewLesson && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Revisión de la 7ª
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>{lesson.titleSpanish}</span>
            </h1>
            <p className="text-sm font-medium text-indigo-300/90 italic">
              {lesson.titleEnglish} &bull; Semana {lesson.weekNumber} &bull; Nivel CEFR {lesson.levelCEFR}
            </p>
          </div>

          {/* Quick Actions & Method Guide button */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowPhoneticsModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all cursor-pointer"
              title="Ver guía fonética de la página 3 del libro"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Guía Fonética del Libro</span>
            </button>

            <button
              onClick={() => setShowMethodModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
              title="Cómo funciona el método Assimil"
            >
              <Info className="w-3.5 h-3.5 text-indigo-400" />
              <span>¿Cómo funciona el método?</span>
            </button>

            <button
              onClick={handleToggleComplete}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isCompleted
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isCompleted ? 'Lección Completada' : 'Marcar como Completada'}</span>
            </button>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-1 flex-wrap">
            <span className="text-slate-400 whitespace-nowrap">
              Progreso global: <strong className="text-white">{totalCompleted} / {TOTAL_ASSIMIL_LESSONS}</strong> lecciones ({completionPercentage}%)
            </span>
            <div className="w-full max-w-xs bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(completionPercentage, 1)}%` }}
              />
            </div>

            {/* Cloud Sync Status Badge */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Profile Chip */}
              {onOpenProfile && (
                <button
                  onClick={onOpenProfile}
                  className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition-colors cursor-pointer"
                  title="Ver perfil asignado o cambiar de usuario"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Perfil: <strong className="text-white">{userDisplayName}</strong></span>
                  <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">({userEmail})</span>
                </button>
              )}

              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                  syncStatus === 'syncing'
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                    : syncStatus === 'error'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}
                title="Sincronizado entre tu ordenador y tu móvil"
              >
                {syncStatus === 'syncing' ? (
                  <RefreshCw className="w-3 h-3 text-indigo-400 animate-spin" />
                ) : syncStatus === 'error' ? (
                  <CloudOff className="w-3 h-3 text-rose-400" />
                ) : (
                  <Cloud className="w-3 h-3 text-emerald-400" />
                )}
                <span>
                  {syncStatus === 'syncing'
                    ? 'Sincronizando...'
                    : syncStatus === 'error'
                    ? 'Sin conexión'
                    : 'Móvil & PC sincronizados'}
                </span>
              </div>

              {onManualSync && (
                <button
                  onClick={onManualSync}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Actualizar y sincronizar ahora con la nube"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
          </div>

          {/* Previous / Next Lesson controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectLesson(Math.max(1, currentLessonNum - 1))}
              disabled={currentLessonNum <= 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>

            <span className="px-2 font-mono font-semibold text-slate-300">
              #{currentLessonNum}
            </span>

            <button
              onClick={() => onSelectLesson(Math.min(TOTAL_ASSIMIL_LESSONS, currentLessonNum + 1))}
              disabled={currentLessonNum >= TOTAL_ASSIMIL_LESSONS}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-medium shadow-sm transition-colors cursor-pointer"
            >
              <span>Siguiente</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* If user is reviewing an earlier lesson, show helpful banner with 1-click return to active lesson */}
        {isReviewingPrevious && (
          <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between gap-3 flex-wrap animate-in fade-in">
            <div className="flex items-center gap-2.5 text-xs text-amber-200">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Estás repasando la <strong>Lección #{lesson.number}</strong>. Tu lección en curso del método es la <strong>Lección #{activeCourseMilestone}</strong> ({totalCompleted} lecciones completadas).
              </span>
            </div>
            <button
              onClick={() => onSelectLesson(activeCourseMilestone)}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
            >
              <span>Continuar en Lección #{activeCourseMilestone}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Tabs navigation: Diálogo, Notas, Ejercicios, Catálogo completo */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3 flex-wrap">
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('dialogue')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'dialogue'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>1. Diálogo Bilingüe</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'notes'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>2. Notas de la Lección ({lesson.notes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('exercises')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'exercises'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>3. Ejercicios Diarios ({lesson.exercise1.length + lesson.exercise2.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('verbs')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'verbs'
                ? 'bg-gradient-to-r from-rose-600 to-indigo-600 text-white shadow font-black'
                : 'text-rose-300/90 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>4. Verbos Irregulares (134)</span>
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Todas las Lecciones (1-146)</span>
          </button>
        </div>

        {/* Coach button */}
        <button
          onClick={handleCoachSession}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Practicar con Coach AI</span>
        </button>
      </div>

      {/* TAB 1: DIALOGUE VIEW */}
      {activeTab === 'dialogue' && (
        <div className="space-y-6">
          {/* Controls Bar for Audio & Mode */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePlayEntireDialogue}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                  isPlayingAll
                    ? 'bg-rose-600 text-white hover:bg-rose-500'
                    : 'bg-indigo-600 text-white hover:bg-indigo-500'
                }`}
              >
                {isPlayingAll ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                <span>{isPlayingAll ? 'Pausar audio' : 'Escuchar diálogo completo'}</span>
              </button>

              {/* Speed selector */}
              <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-xs">
                <span className="text-slate-400 text-[11px]">Velocidad:</span>
                {[0.8, 0.9, 1.0].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setAudioSpeed(spd)}
                    className={`px-1.5 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                      audioSpeed === spd
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Study Mode & Layout Switch */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Layout Switch: Book Split vs Cards */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => setViewLayout('book_split')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    viewLayout === 'book_split'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Disposición bilingüe en 2 columnas idéntica a tu libro Assimil"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Vista Libro (2 Columnas)</span>
                </button>
                <button
                  onClick={() => setViewLayout('cards')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    viewLayout === 'cards'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Vista en tarjetas interactivas"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Tarjetas</span>
                </button>
                <button
                  onClick={() => setViewLayout('step_by_step')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    viewLayout === 'step_by_step'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Modo ágil: Estudia el diálogo frase a frase a máxima velocidad sin ralentización"
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Paso a Paso (Ágil)</span>
                </button>
              </div>

              {/* Study Mode: Bilingual vs Active Recall */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => setStudyMode('bilingual')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    studyMode === 'bilingual'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Muestra inglés, pronunciación figurada y traducción"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Bilingüe</span>
                </button>

                <button
                  onClick={() => setStudyMode('active_recall')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    studyMode === 'active_recall'
                      ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Oculta el inglés para activar la memoria y traducir desde el español"
                >
                  <Zap className="w-3.5 h-3.5 text-rose-400" />
                  <span>Onda Activa</span>
                </button>
              </div>
            </div>
          </div>

          {/* Lesson Introduction / Grammatical Note from Book */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block font-mono">
              Nota preliminar de la lección (Assimil):
            </span>
            <p className="italic text-slate-300">
              {lesson.introduction}
            </p>
            {lesson.culturalTidbit && (
              <p className="text-slate-400 text-xs pt-1 flex items-start gap-1.5 not-italic">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-300">Nota cultural: </strong>
                  {lesson.culturalTidbit}
                </span>
              </p>
            )}
          </div>

          {/* VIEW 1: BOOK SPLIT (2 COLUMNS AS PRINTED IN USER'S ASSIMIL BOOK) */}
          {viewLayout === 'book_split' ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
              {/* Table Column Headers */}
              <div className="grid grid-cols-1 md:grid-cols-2 bg-slate-950/90 border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
                {bookSplitOrder === 'en_es' ? (
                  <>
                    <div className="px-4 py-3 flex items-center justify-between border-b md:border-b-0 md:border-r border-slate-800">
                      <span className="text-indigo-400 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4" /> Texto en Inglés & Fonética
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-mono font-bold bg-slate-800 px-1.5 py-0.5 rounded">
                          Página Izquierda (Libro)
                        </span>
                        <button
                          onClick={() => setBookSplitOrder('es_en')}
                          className="text-[10px] text-indigo-300 hover:text-indigo-200 underline cursor-pointer"
                          title="Cambiar orden de columnas"
                        >
                          Invertir
                        </button>
                      </div>
                    </div>
                    <div className="px-4 py-3 flex items-center justify-between">
                      <span className="text-emerald-400 flex items-center gap-1.5">
                        <Award className="w-4 h-4" /> Traducción al Español
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono font-bold bg-slate-800 px-1.5 py-0.5 rounded">
                        Página Derecha (Libro)
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="px-4 py-3 flex items-center justify-between border-b md:border-b-0 md:border-r border-slate-800">
                      <span className="text-emerald-400 flex items-center gap-1.5">
                        <Award className="w-4 h-4" /> Traducción al Español
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-mono font-bold bg-slate-800 px-1.5 py-0.5 rounded">
                          Español Primero
                        </span>
                        <button
                          onClick={() => setBookSplitOrder('en_es')}
                          className="text-[10px] text-emerald-300 hover:text-emerald-200 underline cursor-pointer"
                          title="Volver al orden original del libro (Inglés izquierda)"
                        >
                          Original libro
                        </button>
                      </div>
                    </div>
                    <div className="px-4 py-3 flex items-center justify-between">
                      <span className="text-indigo-400 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4" /> Texto en Inglés & Fonética
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono font-bold bg-slate-800 px-1.5 py-0.5 rounded">
                        Inglés Derecha
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Rows matching book line by line */}
              <div className="divide-y divide-slate-800/80">
                {lesson.dialogue.map((line, idx) => {
                  const isPlaying = currentlyPlayingLineId === line.id;
                  const isRevealed = revealedLines[line.id];
                  const showEnglish = studyMode === 'bilingual' || isRevealed;

                  const englishBlock = (
                    <div className={`p-4 flex items-start justify-between gap-3 ${bookSplitOrder === 'en_es' ? 'md:border-r border-slate-800' : ''}`}>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-start gap-2">
                          <span className="font-mono font-bold text-indigo-400 text-sm shrink-0 select-none">
                            {line.speaker || idx + 1} —
                          </span>
                          {showEnglish ? (
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                              <span className="text-sm sm:text-base font-bold text-white tracking-wide">
                                {line.english}
                              </span>
                              {line.noteRef && (
                                <button
                                  onClick={() => setActiveTab('notes')}
                                  className="px-1 py-0.2 rounded text-[11px] font-bold bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40 transition-colors"
                                  title={`Ver nota (${line.noteRef})`}
                                >
                                  ({line.noteRef})
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs italic text-slate-500">
                              [Oculto en Onda Activa — pulsa el ojo para comprobar]
                            </span>
                          )}
                        </div>

                        {showEnglish && (
                          <div className="pl-6 text-xs text-amber-300/95 font-mono tracking-wide">
                            {line.phonetic}
                          </div>
                        )}
                      </div>

                      {/* Audio & Reveal controls */}
                      <div className="flex items-center gap-1 shrink-0 pt-0.5">
                        {studyMode === 'active_recall' && (
                          <button
                            onClick={() =>
                              setRevealedLines((prev) => ({
                                ...prev,
                                [line.id]: !prev[line.id],
                              }))
                            }
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 cursor-pointer"
                            title={isRevealed ? 'Ocultar' : 'Revelar'}
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-indigo-400" />}
                          </button>
                        )}
                        <button
                          onClick={() => handlePlayLine(line.id, line.english)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isPlaying
                              ? 'bg-indigo-600 text-white shadow'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                          title="Escuchar pronunciación británica"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );

                  const spanishBlock = (
                    <div className={`p-4 flex items-start justify-between gap-3 bg-slate-950/30 ${bookSplitOrder === 'es_en' ? 'md:border-r border-slate-800' : ''}`}>
                      <div className="flex items-start gap-2.5">
                        <span className="font-mono font-bold text-slate-400 text-sm shrink-0 select-none">
                          {line.speaker || idx + 1} —
                        </span>
                        <span className="text-xs sm:text-sm font-medium text-slate-100 leading-relaxed">
                          {line.spanish}
                        </span>
                      </div>
                    </div>
                  );

                  return (
                    <div
                      key={line.id}
                      className={`grid grid-cols-1 md:grid-cols-2 transition-colors ${
                        isPlaying ? 'bg-indigo-950/70 ring-1 ring-indigo-500/50' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {bookSplitOrder === 'en_es' ? (
                        <>
                          {englishBlock}
                          {spanishBlock}
                        </>
                      ) : (
                        <>
                          {spanishBlock}
                          {englishBlock}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* VIEW 2: CARDS VIEW */
            <div className="space-y-3">
              {lesson.dialogue.map((line, idx) => {
                const isPlaying = currentlyPlayingLineId === line.id;
                const isRevealed = revealedLines[line.id];
                const showEnglish = studyMode === 'bilingual' || isRevealed;

                return (
                  <div
                    key={line.id}
                    className={`relative p-4 rounded-xl border transition-all ${
                      isPlaying
                        ? 'bg-indigo-950/60 border-indigo-500 shadow-md ring-1 ring-indigo-500/50 scale-[1.01]'
                        : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex flex-col items-center">
                          <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px] font-mono text-slate-300">
                            {line.speaker || idx + 1}
                          </span>
                        </div>

                        <div className="space-y-1.5 flex-1">
                          {showEnglish ? (
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="text-base sm:text-lg font-bold text-white tracking-wide">
                                {line.english}
                              </span>
                              {line.noteRef && (
                                <button
                                  onClick={() => setActiveTab('notes')}
                                  className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/40 transition-colors"
                                  title={`Ver nota (${line.noteRef})`}
                                >
                                  ({line.noteRef})
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="py-1">
                              <span className="text-sm font-semibold text-slate-500 italic">
                                [Texto en inglés oculto en Onda Activa - Intenta traducirlo tú primero]
                              </span>
                            </div>
                          )}

                          {showEnglish && (
                            <div className="flex items-center gap-1.5 text-xs text-amber-300/90 font-mono tracking-wide">
                              <span className="text-[10px] uppercase font-bold text-amber-500/70 select-none">
                                Pron.
                              </span>
                              <span>{line.phonetic}</span>
                            </div>
                          )}

                          <div className="text-xs sm:text-sm font-medium text-slate-300">
                            {line.spanish}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {studyMode === 'active_recall' && (
                          <button
                            onClick={() =>
                              setRevealedLines((prev) => ({
                                ...prev,
                                [line.id]: !prev[line.id],
                              }))
                            }
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                            title={isRevealed ? 'Ocultar inglés' : 'Revelar inglés y comprobar'}
                          >
                            {isRevealed ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-indigo-400" />}
                          </button>
                        )}

                        <button
                          onClick={() => handlePlayLine(line.id, line.english)}
                          className={`p-2 rounded-lg border transition-all cursor-pointer ${
                            isPlaying
                              ? 'bg-indigo-600 text-white border-indigo-500 shadow'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                          }`}
                          title="Escuchar pronunciación británica"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW 3: STEP BY STEP (FASTEST FOR DIALOGUE RENDERING) */}
          {viewLayout === 'step_by_step' && (
            <div className="space-y-4">
              {/* Step Navigation Bar */}
              <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex-wrap">
                <button
                  type="button"
                  disabled={dialogueCurrentIndex === 0}
                  onClick={() => setDialogueCurrentIndex((prev) => Math.max(0, prev - 1))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>

                <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none max-w-md">
                  {lesson.dialogue.map((line, i) => (
                    <button
                      key={line.id}
                      type="button"
                      onClick={() => setDialogueCurrentIndex(i)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-bold font-mono transition-all shrink-0 cursor-pointer ${
                        dialogueCurrentIndex === i
                          ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 shadow-md scale-105'
                          : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={dialogueCurrentIndex === lesson.dialogue.length - 1}
                  onClick={() => setDialogueCurrentIndex((prev) => Math.min(lesson.dialogue.length - 1, prev + 1))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Active Dialogue Line Card */}
              {lesson.dialogue[dialogueCurrentIndex] && (() => {
                const line = lesson.dialogue[dialogueCurrentIndex];
                const isPlaying = currentlyPlayingLineId === line.id;
                const isRevealed = revealedLines[line.id];
                const showEnglish = studyMode === 'bilingual' || isRevealed;

                return (
                  <div className={`p-5 sm:p-6 rounded-2xl border transition-all space-y-4 shadow-xl ${
                    isPlaying ? 'bg-indigo-950/70 border-indigo-500 ring-1 ring-indigo-500/50' : 'bg-slate-900/90 border-slate-800'
                  }`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-mono font-bold">
                            Frase {dialogueCurrentIndex + 1} de {lesson.dialogue.length} {line.speaker && `(Interlocutor ${line.speaker})`}
                          </span>
                          {line.noteRef && (
                            <button
                              onClick={() => setActiveTab('notes')}
                              className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors cursor-pointer"
                              title={`Ver nota (${line.noteRef})`}
                            >
                              Nota ({line.noteRef})
                            </button>
                          )}
                        </div>

                        {showEnglish ? (
                          <div className="text-lg sm:text-xl font-bold text-white tracking-wide pt-1">
                            {line.english}
                          </div>
                        ) : (
                          <div className="py-2 text-sm font-semibold text-slate-500 italic">
                            [Texto en inglés oculto en Onda Activa - Intenta traducirlo tú primero]
                          </div>
                        )}

                        {showEnglish && line.phonetic && (
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-amber-300 font-mono bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                            <span className="text-[10px] font-bold text-amber-400 uppercase">Pronunciación Assimil:</span>
                            <span>{line.phonetic}</span>
                          </div>
                        )}

                        <div className="text-sm text-slate-300 font-medium pl-1">
                          Traducción: {line.spanish}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {studyMode === 'active_recall' && (
                          <button
                            onClick={() =>
                              setRevealedLines((prev) => ({
                                ...prev,
                                [line.id]: !prev[line.id],
                              }))
                            }
                            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                            title={isRevealed ? 'Ocultar inglés' : 'Revelar inglés y comprobar'}
                          >
                            {isRevealed ? <EyeOff className="w-5 h-5 text-slate-400" /> : <Eye className="w-5 h-5 text-indigo-400" />}
                          </button>
                        )}

                        <button
                          onClick={() => handlePlayLine(line.id, line.english)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${
                            isPlaying
                              ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                          }`}
                          title="Escuchar audio modelo británico"
                        >
                          <Volume2 className="w-5 h-5 text-indigo-400" />
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80">
                      <span>Frase {dialogueCurrentIndex + 1} de {lesson.dialogue.length}</span>

                      {dialogueCurrentIndex < lesson.dialogue.length - 1 ? (
                        <button
                          type="button"
                          onClick={() => setDialogueCurrentIndex((prev) => prev + 1)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium cursor-pointer"
                        >
                          <span>Pasar a la frase {dialogueCurrentIndex + 2}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActiveTab('exercises')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
                        >
                          <span>Ir a los Ejercicios Diarios</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Quick jump to Notes or Exercises */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => setActiveTab('notes')}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <span>Continuar a las Notas Explicativas</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('exercises')}
              className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
            >
              <span>Ir a los Ejercicios Diarios</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: NOTES VIEW */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-indigo-200">
            <strong className="text-white font-semibold">Notas explicativas del método Assimil: </strong>
            En Assimil, no hay pesadas reglas gramaticales abstractas. Cada nota responde a un giro
            concreto del diálogo para asimilar intuitivamente la sintaxis, fonética y costumbres
            británicas.
          </div>

          <div className="space-y-3">
            {lesson.notes.map((note) => (
              <div
                key={note.number}
                className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center text-xs font-bold font-mono">
                    {note.number}
                  </span>
                  <h3 className="text-sm font-bold text-white">
                    {note.title || `Nota ${note.number}`}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-8">
                  {note.content}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={() => setActiveTab('exercises')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-colors"
            >
              <span>Pasar a los Ejercicios Diarios</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: EXERCISES VIEW WITH SUB-MENUS */}
      {activeTab === 'exercises' && (
        <div className="space-y-6">
          {/* EXERCISE SUB-MENU NAVIGATION BAR */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-950/90 border border-slate-800 overflow-x-auto scrollbar-none shadow-md">
            <button
              type="button"
              onClick={() => setExerciseSubTab('ex1')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                exerciseSubTab === 'ex1'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Menú 1: Ejercicio 1 (Lectura & Fonética)</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-950 text-indigo-300 font-mono">
                {lesson.exercise1.length} frases
              </span>
            </button>

            <button
              type="button"
              onClick={() => setExerciseSubTab('ex2')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                exerciseSubTab === 'ex2'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Menú 2: Ejercicio 2 (Rellenar Huecos)</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-950 text-rose-300 font-mono">
                {Object.values(exercise2Checked).filter(Boolean).length}/{lesson.exercise2.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setExerciseSubTab('phonetics')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                exerciseSubTab === 'phonetics'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Menú 3: Desafío Fonético Directo</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-950 text-amber-300 font-mono">
                Audio & Voz
              </span>
            </button>

            <button
              type="button"
              onClick={() => setExerciseSubTab('summary')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                exerciseSubTab === 'summary'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Menú 4: Soluciones & Claves</span>
            </button>
          </div>

          {/* SUB-TAB 1: EXERCISE 1 (READING & PHONETICS) */}
          {exerciseSubTab === 'ex1' && (
            <div className="space-y-4">
              {/* Header with Title and Mode Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                    Menú 1 &bull; Ejercicio 1 Assimil
                  </span>
                  <h3 className="text-base font-bold text-white">
                    Lectura, Comprensión y Pronunciación en Voz Alta
                  </h3>
                  <p className="text-xs text-slate-400">
                    Lee la frase en voz alta, escucha el modelo nativo o prueba tu pronunciación con el micrófono.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 self-start sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setEx1ViewMode('step_by_step')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      ex1ViewMode === 'step_by_step'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Modo ágil paso a paso (más ligero y rápido)"
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span>Paso a Paso (Ágil)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEx1ViewMode('all')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      ex1ViewMode === 'all'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Ver todas las frases al mismo tiempo"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>Ver Todas ({lesson.exercise1.length})</span>
                  </button>
                </div>
              </div>

              {/* VIEW MODE A: STEP BY STEP (AGILE & FAST) */}
              {ex1ViewMode === 'step_by_step' && (
                <div className="space-y-4">
                  {/* Step Navigator Bar */}
                  <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex-wrap">
                    <button
                      type="button"
                      disabled={ex1CurrentIndex === 0}
                      onClick={() => setEx1CurrentIndex((prev) => Math.max(0, prev - 1))}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Anterior</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {lesson.exercise1.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setEx1CurrentIndex(i)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                            ex1CurrentIndex === i
                              ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 shadow-md scale-105'
                              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={ex1CurrentIndex === lesson.exercise1.length - 1}
                      onClick={() => setEx1CurrentIndex((prev) => Math.min(lesson.exercise1.length - 1, prev + 1))}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                      <span>Siguiente</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Active Sentence Card */}
                  {lesson.exercise1[ex1CurrentIndex] && (
                    <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-lg p-5 sm:p-6 space-y-4 animate-in fade-in">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-mono font-bold">
                              Frase {ex1CurrentIndex + 1} de {lesson.exercise1.length}
                            </span>
                          </div>

                          <div className="text-base sm:text-lg font-bold text-white tracking-wide pt-1">
                            {lesson.exercise1[ex1CurrentIndex].english}
                          </div>

                          {lesson.exercise1[ex1CurrentIndex].phonetic && (
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-amber-300 font-mono bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                              <span className="text-[10px] font-bold text-amber-400 uppercase">Pronunciación Assimil:</span>
                              <span>{lesson.exercise1[ex1CurrentIndex].phonetic}</span>
                            </div>
                          )}

                          <div className="text-xs sm:text-sm text-slate-300 font-medium pl-1">
                            Traducción: {lesson.exercise1[ex1CurrentIndex].spanish}
                          </div>
                        </div>

                        <button
                          onClick={() => handlePlayLine(lesson.exercise1[ex1CurrentIndex].id, lesson.exercise1[ex1CurrentIndex].english)}
                          className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 shrink-0 transition-colors shadow-sm cursor-pointer"
                          title="Escuchar audio modelo británico"
                        >
                          <Volume2 className="w-5 h-5 text-indigo-400" />
                        </button>
                      </div>

                      {/* Interactive Phonetic Test Component */}
                      <div className="pt-2 border-t border-slate-800/80">
                        <ExercisePhoneticTester
                          exerciseId={lesson.exercise1[ex1CurrentIndex].id}
                          targetSentence={lesson.exercise1[ex1CurrentIndex].english}
                          phoneticGuide={lesson.exercise1[ex1CurrentIndex].phonetic}
                          spanishTranslation={lesson.exercise1[ex1CurrentIndex].spanish}
                          voiceAccent={voiceAccent}
                          lessonNumber={lesson.number}
                        />
                      </div>

                      {/* Quick jump navigation button */}
                      <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                        <span>Frase {ex1CurrentIndex + 1} de {lesson.exercise1.length}</span>

                        {ex1CurrentIndex < lesson.exercise1.length - 1 ? (
                          <button
                            type="button"
                            onClick={() => setEx1CurrentIndex((prev) => prev + 1)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium cursor-pointer"
                          >
                            <span>Pasar a la frase {ex1CurrentIndex + 2}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setExerciseSubTab('ex2')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
                          >
                            <span>Continuar al Ejercicio 2 (Huecos)</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* VIEW MODE B: ALL SENTENCES LIST (100% PRESERVED) */}
              {ex1ViewMode === 'all' && (
                <div className="space-y-4">
                  {lesson.exercise1.map((item, idx) => (
                    <div
                      key={item.id}
                      className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden shadow-md space-y-3 p-4 sm:p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center text-xs font-mono font-bold shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-sm sm:text-base font-bold text-white tracking-wide">
                              {item.english}
                            </span>
                          </div>
                          {item.phonetic && (
                            <p className="text-xs text-amber-300/90 font-mono pl-8">
                              {item.phonetic}
                            </p>
                          )}
                          <p className="text-xs text-slate-300 pl-8">
                            {item.spanish}
                          </p>
                        </div>

                        <button
                          onClick={() => handlePlayLine(item.id, item.english)}
                          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 shrink-0 transition-colors cursor-pointer"
                          title="Escuchar audio modelo"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Interactive Phonetic Test Component */}
                      <ExercisePhoneticTester
                        exerciseId={item.id}
                        targetSentence={item.english}
                        phoneticGuide={item.phonetic}
                        spanishTranslation={item.spanish}
                        voiceAccent={voiceAccent}
                        lessonNumber={lesson.number}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUB-TAB 2: EXERCISE 2 (CLOZE / FILL IN BLANKS) */}
          {exerciseSubTab === 'ex2' && (
            <div className="space-y-4">
              {/* Header with Title and Mode Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                    Menú 2 &bull; Ejercicio 2 Assimil
                  </span>
                  <h3 className="text-base font-bold text-white">
                    Rellenar los Huecos & Prueba Fonética de Frase Completa
                  </h3>
                  <p className="text-xs text-slate-400">
                    Escribe la palabra que falta para consolidar la retención activa y di la frase completa en voz alta.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 self-start sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setEx2ViewMode('step_by_step')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      ex2ViewMode === 'step_by_step'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Modo ágil paso a paso (más ligero y rápido)"
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span>Paso a Paso (Ágil)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEx2ViewMode('all')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      ex2ViewMode === 'all'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Ver todos los huecos a la vez"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>Ver Todos ({lesson.exercise2.length})</span>
                  </button>
                </div>
              </div>

              {/* VIEW MODE A: STEP BY STEP (AGILE & FAST) */}
              {ex2ViewMode === 'step_by_step' && (
                <div className="space-y-4">
                  {/* Step Navigator Bar with Success Status */}
                  <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex-wrap">
                    <button
                      type="button"
                      disabled={ex2CurrentIndex === 0}
                      onClick={() => setEx2CurrentIndex((prev) => Math.max(0, prev - 1))}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Anterior</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {lesson.exercise2.map((item, i) => {
                        const isOk = exercise2Checked[item.id] === true;
                        const isBad = exercise2Checked[item.id] === false;

                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setEx2CurrentIndex(i)}
                            className={`w-8 h-8 rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center cursor-pointer ${
                              ex2CurrentIndex === i
                                ? 'bg-rose-600 text-white ring-2 ring-rose-400 shadow-md scale-105'
                                : isOk
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50'
                                : isBad
                                ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                            }`}
                          >
                            {isOk ? <Check className="w-3.5 h-3.5" /> : i + 1}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      disabled={ex2CurrentIndex === lesson.exercise2.length - 1}
                      onClick={() => setEx2CurrentIndex((prev) => Math.min(lesson.exercise2.length - 1, prev + 1))}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                      <span>Siguiente</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Active Sentence Cloze Card */}
                  {lesson.exercise2[ex2CurrentIndex] && (() => {
                    const item = lesson.exercise2[ex2CurrentIndex];
                    const userVal = exercise2Answers[item.id] || '';
                    const isChecked = exercise2Checked[item.id];
                    const showSolution = exercise2ShowSolution[item.id];
                    const fullSentence = item.promptWithBlank
                      .replace('...', item.missingWord)
                      .replace(/\s*\([^)]*\)\s*$/, '')
                      .trim();

                    return (
                      <div
                        className={`p-5 sm:p-6 rounded-2xl border transition-all space-y-4 shadow-lg animate-in fade-in ${
                          isChecked === true
                            ? 'bg-emerald-950/20 border-emerald-500/40'
                            : isChecked === false
                            ? 'bg-rose-950/20 border-rose-500/30'
                            : 'bg-slate-900/80 border-slate-800'
                        }`}
                      >
                        <div className="flex items-baseline gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono font-bold">
                            Hueco {ex2CurrentIndex + 1} de {lesson.exercise2.length}
                          </span>
                        </div>

                        <div className="text-base sm:text-lg font-bold text-slate-100 tracking-wide">
                          {item.promptWithBlank}
                        </div>

                        <p className="text-xs sm:text-sm text-slate-400 italic">
                          Traducción: {item.spanishTranslation}
                        </p>

                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                          <input
                            type="text"
                            value={userVal}
                            onChange={(e) => {
                              setExercise2Answers({ ...exercise2Answers, [item.id]: e.target.value });
                              if (isChecked !== undefined) {
                                setExercise2Checked({ ...exercise2Checked, [item.id]: undefined as any });
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleCheckExercise2(item.id, item.missingWord);
                              }
                            }}
                            placeholder="Escribe la palabra faltante..."
                            className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 w-64 font-mono shadow-inner"
                          />

                          <button
                            onClick={() => handleCheckExercise2(item.id, item.missingWord)}
                            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md"
                          >
                            Comprobar
                          </button>

                          <button
                            onClick={() => handleRevealExercise2(item.id)}
                            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                          >
                            {showSolution ? 'Ocultar solución' : 'Ver solución'}
                          </button>

                          {isChecked === true && (
                            <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold">
                              <Check className="w-4 h-4" /> ¡Correcto!
                            </span>
                          )}

                          {isChecked === false && (
                            <span className="flex items-center gap-1 text-xs text-rose-400 font-semibold">
                              <X className="w-4 h-4" /> Inténtalo de nuevo {item.hint && `(Pista: ${item.hint})`}
                            </span>
                          )}
                        </div>

                        {showSolution && (
                          <div className="text-xs text-amber-300 font-mono bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                            Solución exacta: <strong className="text-white">{item.missingWord}</strong> &bull; Frase completa: <span className="text-white">{fullSentence}</span>
                          </div>
                        )}

                        {/* Integrated Phonetics Test for the complete sentence */}
                        <div className="pt-3 border-t border-slate-800/80">
                          <ExercisePhoneticTester
                            exerciseId={`ex2-step-${item.id}`}
                            targetSentence={fullSentence}
                            spanishTranslation={item.spanishTranslation}
                            voiceAccent={voiceAccent}
                            lessonNumber={lesson.number}
                          />
                        </div>

                        {/* Quick jump navigation button */}
                        <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                          <span>Hueco {ex2CurrentIndex + 1} de {lesson.exercise2.length}</span>

                          {ex2CurrentIndex < lesson.exercise2.length - 1 ? (
                            <button
                              type="button"
                              onClick={() => setEx2CurrentIndex((prev) => prev + 1)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium cursor-pointer"
                            >
                              <span>Pasar al hueco {ex2CurrentIndex + 2}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-rose-400" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setExerciseSubTab('phonetics')}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold cursor-pointer"
                            >
                              <span>Ir al Desafío Fonético (Menú 3)</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* VIEW MODE B: ALL BLANKS LIST (100% PRESERVED) */}
              {ex2ViewMode === 'all' && (
                <div className="space-y-4">
                  {lesson.exercise2.map((item, idx) => {
                    const userVal = exercise2Answers[item.id] || '';
                    const isChecked = exercise2Checked[item.id];
                    const showSolution = exercise2ShowSolution[item.id];
                    const fullSentence = item.promptWithBlank
                      .replace('...', item.missingWord)
                      .replace(/\s*\([^)]*\)\s*$/, '')
                      .trim();

                    return (
                      <div
                        key={item.id}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3.5 shadow-md ${
                          isChecked === true
                            ? 'bg-emerald-950/20 border-emerald-500/40'
                            : isChecked === false
                            ? 'bg-rose-950/20 border-rose-500/30'
                            : 'bg-slate-900/70 border-slate-800'
                        }`}
                      >
                        <div className="flex items-baseline gap-2">
                          <span className="w-6 h-6 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center justify-center text-xs font-mono font-bold shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-sm sm:text-base font-bold text-slate-100">
                            {item.promptWithBlank}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 italic pl-8">
                          Traducción: {item.spanishTranslation}
                        </p>

                        <div className="flex items-center gap-2 pl-8 pt-1 flex-wrap">
                          <input
                            type="text"
                            value={userVal}
                            onChange={(e) => {
                              setExercise2Answers({ ...exercise2Answers, [item.id]: e.target.value });
                              if (isChecked !== undefined) {
                                setExercise2Checked({ ...exercise2Checked, [item.id]: undefined as any });
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleCheckExercise2(item.id, item.missingWord);
                              }
                            }}
                            placeholder="Escribe la palabra faltante..."
                            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-56 font-mono"
                          />

                          <button
                            onClick={() => handleCheckExercise2(item.id, item.missingWord)}
                            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer"
                          >
                            Comprobar
                          </button>

                          <button
                            onClick={() => handleRevealExercise2(item.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                          >
                            {showSolution ? 'Ocultar solución' : 'Ver solución'}
                          </button>

                          {isChecked === true && (
                            <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                              <Check className="w-4 h-4" /> ¡Correcto!
                            </span>
                          )}

                          {isChecked === false && (
                            <span className="flex items-center gap-1 text-xs text-rose-400 font-semibold">
                              <X className="w-4 h-4" /> Inténtalo de nuevo {item.hint && `(Pista: ${item.hint})`}
                            </span>
                          )}
                        </div>

                        {showSolution && (
                          <div className="mt-2 ml-8 text-xs text-amber-300 font-mono bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                            Solución exacta: <strong className="text-white">{item.missingWord}</strong> &bull; Frase completa: <span className="text-white">{fullSentence}</span>
                          </div>
                        )}

                        {/* Integrated Phonetics Test for the complete sentence */}
                        <div className="pt-2 border-t border-slate-800/80">
                          <ExercisePhoneticTester
                            exerciseId={`ex2-all-${item.id}`}
                            targetSentence={fullSentence}
                            spanishTranslation={item.spanishTranslation}
                            voiceAccent={voiceAccent}
                            lessonNumber={lesson.number}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SUB-TAB 3: PHONETICS ARENA (DEDICATED SPEAKING LAB) */}
          {exerciseSubTab === 'phonetics' && (
            <div className="space-y-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/30 shadow-lg space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Mic className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Menú 3: Desafío Fonético Directo de la Lección #{lesson.number}</span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Voz & Entonación
                      </span>
                    </h3>
                    <p className="text-xs text-amber-200/80">
                      Entrena tu acento británico diciendo cada una de las frases en voz alta. El motor analiza tu dicción y resalta en rojo cualquier palabra que necesite corrección.
                    </p>
                  </div>
                </div>
              </div>

              {/* Phrase Carousel Selector */}
              {(() => {
                const allPhrases = [
                  ...lesson.exercise1.map((item, idx) => ({
                    id: `ph-ex1-${idx}`,
                    tag: `Ex 1 &bull; Frase ${idx + 1}`,
                    english: item.english,
                    phonetic: item.phonetic,
                    spanish: item.spanish,
                  })),
                  ...lesson.exercise2.map((item, idx) => ({
                    id: `ph-ex2-${idx}`,
                    tag: `Ex 2 &bull; Frase ${idx + 1}`,
                    english: item.promptWithBlank.replace('...', item.missingWord).replace(/\s*\([^)]*\)\s*$/, '').trim(),
                    phonetic: item.hint ? `/${item.missingWord}/` : undefined,
                    spanish: item.spanishTranslation,
                  })),
                ];

                const activePhrase = allPhrases[phoneticsCurrentIndex] || allPhrases[0];

                return (
                  <div className="space-y-4">
                    {/* Phrase pills */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {allPhrases.map((p, idx) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPhoneticsCurrentIndex(idx)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                            phoneticsCurrentIndex === idx
                              ? 'bg-amber-600 text-white shadow-md ring-1 ring-amber-400'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                          }`}
                        >
                          Frase {idx + 1}
                        </button>
                      ))}
                    </div>

                    {/* Active Phrase Phonetic Card */}
                    {activePhrase && (
                      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 space-y-4 shadow-xl">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400" dangerouslySetInnerHTML={{ __html: activePhrase.tag }} />
                            <h4 className="text-base sm:text-lg font-bold text-white tracking-wide">
                              {activePhrase.english}
                            </h4>
                            {activePhrase.phonetic && (
                              <p className="text-xs text-amber-300 font-mono bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 inline-block">
                                Pron. Assimil: {activePhrase.phonetic}
                              </p>
                            )}
                            <p className="text-xs text-slate-400">
                              {activePhrase.spanish}
                            </p>
                          </div>

                          <button
                            onClick={() => handlePlayLine(activePhrase.id, activePhrase.english)}
                            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shrink-0 cursor-pointer"
                            title="Escuchar audio modelo británico"
                          >
                            <Volume2 className="w-5 h-5 text-amber-400" />
                          </button>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80">
                          <ExercisePhoneticTester
                            exerciseId={`arena-${activePhrase.id}`}
                            targetSentence={activePhrase.english}
                            phoneticGuide={activePhrase.phonetic}
                            spanishTranslation={activePhrase.spanish}
                            voiceAccent={voiceAccent}
                            lessonNumber={lesson.number}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* SUB-TAB 4: QUICK SOLUTIONS & LESSON KEY */}
          {exerciseSubTab === 'summary' && (
            <div className="space-y-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <FileText className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Menú 4: Soluciones Rápidas de la Lección #{lesson.number}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Consulta de un vistazo todas las respuestas y pronunciaciones de los ejercicios.
                    </p>
                  </div>
                </div>

                {/* Exercise 1 Solutions */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                    Respuestas y Fonética del Ejercicio 1:
                  </h4>
                  <div className="space-y-2">
                    {lesson.exercise1.map((item, idx) => (
                      <div key={item.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs space-y-1">
                        <div className="flex items-center gap-2 font-semibold text-white">
                          <span className="font-mono text-slate-400">{idx + 1}.</span>
                          <span>{item.english}</span>
                        </div>
                        {item.phonetic && (
                          <div className="text-amber-300 font-mono text-[11px] pl-4">
                            {item.phonetic}
                          </div>
                        )}
                        <div className="text-slate-400 pl-4">
                          {item.spanish}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Exercise 2 Solutions */}
                <div className="space-y-2 pt-4 border-t border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400">
                    Soluciones del Ejercicio 2 (Palabras Faltantes):
                  </h4>
                  <div className="space-y-2">
                    {lesson.exercise2.map((item, idx) => (
                      <div key={item.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs flex items-center justify-between gap-2 flex-wrap">
                        <div className="space-y-0.5">
                          <span className="font-bold text-white">
                            {idx + 1}. {item.promptWithBlank.replace('...', `[${item.missingWord}]`)}
                          </span>
                          <p className="text-[11px] text-slate-400 italic">
                            {item.spanishTranslation}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30 text-xs">
                          {item.missingWord}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick action jump */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveTab('dialogue')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md"
                  >
                    <span>Volver al Diálogo de la Lección</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: VERBOS IRREGULARES ASSIMIL (134) */}
      {activeTab === 'verbs' && (
        <AssimilVerbsView
          onStartCoachChat={onStartCoachChat}
          voiceAccent={voiceAccent}
        />
      )}

      {/* TAB 5: COMPLETE 146 LESSON CATALOG */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Buscar por tema o título de lección (ej: pub, aeropuerto, taxi, té)..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Filter by Phase */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Semana:</span>
              <select
                value={catalogWeekFilter}
                onChange={(e) =>
                  setCatalogWeekFilter(
                    e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10)
                  )
                }
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none"
              >
                <option value="all">Todas las 21 Semanas</option>
                {Array.from({ length: 21 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Semana {i + 1} (Lecciones {i * 7 + 1} - {Math.min(TOTAL_ASSIMIL_LESSONS, (i + 1) * 7)})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Toggle for All vs Paged (for optimal speed) */}
            {!catalogSearch.trim() && catalogWeekFilter === 'all' && (
              <button
                type="button"
                onClick={() => setShowAllLessonsAtOnce(!showAllLessonsAtOnce)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  showAllLessonsAtOnce
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {showAllLessonsAtOnce ? '✓ Modo Completo (146)' : 'Modo Rápido Paginado'}
              </button>
            )}
          </div>

          {/* Pagination bar when in paged mode */}
          {!catalogSearch.trim() && catalogWeekFilter === 'all' && !showAllLessonsAtOnce && (
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex-wrap text-xs">
              <span className="text-slate-400 font-medium">
                Página {catalogPage} de 7 (Lecciones {(catalogPage - 1) * 21 + 1} - {Math.min(TOTAL_ASSIMIL_LESSONS, catalogPage * 21)}):
              </span>

              <div className="flex items-center gap-1 flex-wrap">
                {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCatalogPage(p)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer ${
                      catalogPage === p
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Grid of lessons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: TOTAL_ASSIMIL_LESSONS }).map((_, i) => {
              const num = i + 1;

              // Pagination check when in fast paged mode
              if (!catalogSearch.trim() && catalogWeekFilter === 'all' && !showAllLessonsAtOnce) {
                const startNum = (catalogPage - 1) * 21 + 1;
                const endNum = catalogPage * 21;
                if (num < startNum || num > endNum) {
                  return null;
                }
              }

              const item = getAssimilLesson(num);
              const isSelected = num === currentLessonNum;
              const isDone = progress.completedLessons.includes(num);

              // Filter check
              if (
                catalogWeekFilter !== 'all' &&
                item.weekNumber !== catalogWeekFilter
              ) {
                return null;
              }

              if (catalogSearch.trim()) {
                const q = catalogSearch.toLowerCase();
                const matchTitle =
                  item.titleSpanish.toLowerCase().includes(q) ||
                  item.titleEnglish.toLowerCase().includes(q) ||
                  `leccion ${num}`.includes(q);
                if (!matchTitle) return null;
              }

              return (
                <button
                  key={num}
                  onClick={() => {
                    onSelectLesson(num);
                    setActiveTab('dialogue');
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-950/80 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                      : isDone
                      ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50'
                      : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-slate-300">
                      #{num}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        item.phase === 'passive'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {item.phase === 'passive' ? 'Pasiva' : 'Activa'}
                    </span>
                    {isDone && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-auto" />
                    )}
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                    {item.titleSpanish}
                  </h4>
                  <p className="text-[11px] text-slate-400 italic truncate mt-0.5">
                    {item.titleEnglish}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Method Explanation */}
      {showMethodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <BookOpen className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {ASSIMIL_METHOD_EXPLANATION.title}
                  </h3>
                  <p className="text-xs text-indigo-300">
                    {ASSIMIL_METHOD_EXPLANATION.subtitle}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMethodModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {ASSIMIL_METHOD_EXPLANATION.description}
            </p>

            <div className="space-y-3 pt-2">
              {ASSIMIL_METHOD_EXPLANATION.phases.map((ph, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1"
                >
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span>{ph.name}</span>
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed pl-7">
                    {ph.rule}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowMethodModal(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Entendido, ¡a practicar!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Guía Fonética de tu Libro (Página 3) */}
      {showPhoneticsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Guía de Pronunciación de tu Libro Assimil (Pág. 3)
                  </h3>
                  <p className="text-xs text-amber-300">
                    Instrucciones fonéticas textuales para la pronunciación figurada
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPhoneticsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="font-bold text-amber-400 font-mono text-base">
                  « sh »
                </div>
                <p>
                  El sonido de este grupo de letras es muy similar al de la <strong>«ch» castellana</strong> aunque en inglés es más suave. Si la conoce, reproduzca la <strong>pronunciación andaluza de la «ch»</strong>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="font-bold text-amber-400 font-mono text-base">
                  « z », « dz » (El diptongo «th»)
                </div>
                <p>
                  Con estas letras se hace referencia al sonido que expresa el diptongo inglés <strong>«th»</strong>.
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                  <li>
                    Cuando hayamos transcrito dicho sonido como <strong>«z»</strong> en la pronunciación figurada, pronúncielo como una <strong>«z» española</strong>.
                  </li>
                  <li>
                    Cuando indique <strong>«dz»</strong> deberá reproducir aproximadamente la «z» castellana, pero:
                    <div className="pl-4 pt-1 space-y-1 text-slate-400">
                      <div>— procurando que la lengua no sobresalga entre los dientes y apoyándola más bien en los dientes superiores.</div>
                      <div>— intentando hacer vibrar las cuerdas vocales.</div>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-indigo-200 italic space-y-1">
                <p className="font-semibold text-white not-italic">
                  Consejo del método Assimil:
                </p>
                <p>
                  «Quizá todo esto le parezca difícil; no se preocupe: con la práctica y la ayuda que le proporcionaremos, lo que ahora parece complejo se convertirá luego en un juego de niños.»
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowPhoneticsModal(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Cerrar guía
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
