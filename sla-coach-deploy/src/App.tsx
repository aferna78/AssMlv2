import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  RotateCcw,
  BookOpen,
  Volume2,
  Brain,
  Compass,
  CheckCircle2,
  BarChart3,
  Layers,
  Flame,
  Zap,
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { CoachMessageCard } from './components/CoachMessageCard';
import { CoachInputArea } from './components/CoachInputArea';
import { RoadmapView } from './components/RoadmapView';
import { SRSDeckView } from './components/SRSDeckView';
import { PlacementTestModal } from './components/PlacementTestModal';
import { LinguisticDiagnosticsModal } from './components/LinguisticDiagnosticsModal';
import { VoiceConversationModal } from './components/VoiceConversationModal';
import { AssimilLessonView } from './components/AssimilLessonView';
import { UserProfileModal } from './components/UserProfileModal';
import { AssimilProgress, CEFRLevel, ChatMessage, Domain, ErrorRate, SRSFlashcard, SystemState } from './types';
import { INITIAL_FLASHCARDS } from './data/constants';
import {
  fetchServerProgress,
  saveServerProgress,
  triggerServerSyncDebounced,
  subscribeToSyncStatus,
  SyncStatus,
  getActiveProfileEmail,
  getActiveProfileName,
  setActiveProfile,
} from './utils/syncService';

const STORAGE_KEY_STATE = 'sla_coach_system_state_v1';
const STORAGE_KEY_MESSAGES = 'sla_coach_messages_v1';
const STORAGE_KEY_SRS = 'sla_coach_srs_deck_v1';
const STORAGE_KEY_ACCENT = 'sla_coach_voice_accent_v1';
const STORAGE_KEY_ASSIMIL_CURRENT = 'assimil_current_lesson_num_v1';
const STORAGE_KEY_ASSIMIL_PROGRESS = 'assimil_student_progress_v1';

const INITIAL_SYSTEM_STATE: SystemState = {
  cefrLevel: 'A1',
  currentDomain: 'Vocabulario',
  errorRate: 'Baja (<10%)',
  targetVocabulary: ['keen on', 'at the weekend', 'fancy doing', 'in the long run', 'get used to'],
  learningTrack: 'Fluidez Conversacional (UK)',
  totalInteractions: 1,
  streakDays: 1,
  xpPoints: 120,
  lastActiveDate: new Date().toISOString(),
};

const INITIAL_WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome-init-1',
  sender: 'coach',
  text: `### 🎯 Feedback & Corrección Rápida
> **Tu frase:** "Welcome Coach, I want to learn British English from zero to bilingual."
> **Versión Natural:** "Welcome, Coach! I'm keen to embark on this journey from absolute beginner to bilingual mastery."
- **Nota técnica:** En **Inglés Británico estándar (UK)** usamos colocaciones como *"keen to embark"* y estructuras naturales como *"at the weekend"* o léxico como *"flat/holiday"*. ¡Gran comienzo!

---

### 📚 Lección del Día: Present Simple & Identidad Personal (Inglés Británico A1)
Bienvenido a tu entrenamiento lingüístico bajo la metodología SLA. En este nivel inicial (A1-A2), aplicamos un **80% de soporte en Español y 20% de Input Comprensible en Inglés Británico (i+1)**. Usamos la estructura canónica: **Sujeto + Verbo + Complemento** con ortografía británica estándar (*favourite, organise, colour*).

* **Ejemplo 1:** I live in a lovely flat and work in central London. -> *Vivo en un piso encantador y trabajo en el centro de Londres.*
* **Ejemplo 2:** At the weekend, she fancies having a cup of tea in the garden. -> *El fin de semana, a ella le apetece tomarse una taza de té en el jardín.*

---

### ⚡ Tu Turno (Ejercicio Activo)
Tell me in English: **What is your name, where do you live, and what is your favourite thing to do at the weekend?** Responde con al menos una frase completa en inglés.`,
  timestamp: Date.now(),
  parsed: {
    userPhrase: 'Welcome Coach, I want to learn British English from zero to bilingual.',
    naturalPhrase: "Welcome, Coach! I'm keen to embark on this journey from absolute beginner to bilingual mastery.",
    technicalNote: 'El uso de chunks léxicos británicos ("keen to embark on a journey", "at the weekend") enriquece la fluidez expresiva desde el primer día.',
    lessonTitle: 'Present Simple & Identidad Personal (British English A1)',
    lessonExplanation: 'Estructura canónica Sujeto + Verbo + Objeto adaptada con colocaciones del inglés británico moderno.',
    examples: [
      { english: 'I live in a lovely flat and work in central London.', spanish: 'Vivo en un piso encantador y trabajo en el centro de Londres.' },
      { english: 'At the weekend, she fancies having a cup of tea in the garden.', spanish: 'El fin de semana, a ella le apetece tomarse una taza de té en el jardín.' },
    ],
    exercisePrompt: 'Tell me in English: What is your name, where do you live, and what is your favourite thing to do at the weekend?',
  },
  quickSuggestions: [
    'My name is Carlos, I live in Madrid, and I fancy travelling at the weekend.',
    'I live in a flat and my favourite hobby is reading British literature.',
    'I want to master British English pronunciation and natural idioms.',
  ],
  isInitial: true,
};

export default function App() {
  // Navigation & Modal States - Defaulting to 'assimil' for lesson-by-lesson study
  const [currentTab, setCurrentTab] = useState<'chat' | 'assimil' | 'roadmap' | 'srs' | 'diagnostic' | 'stats'>('assimil');
  const [currentAssimilLessonNum, setCurrentAssimilLessonNum] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ASSIMIL_CURRENT);
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 1) return val;
      }
      const savedProg = localStorage.getItem(STORAGE_KEY_ASSIMIL_PROGRESS);
      if (savedProg) {
        const parsed = JSON.parse(savedProg);
        if (typeof parsed?.currentLessonNumber === 'number' && parsed.currentLessonNumber >= 1) {
          return parsed.currentLessonNumber;
        }
      }
    } catch {}
    return 8;
  });

  // Assimil Progress State (Synced with Cloud Server for Desktop & Mobile Chrome)
  const [assimilProgress, setAssimilProgress] = useState<AssimilProgress>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ASSIMIL_PROGRESS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.currentLessonNumber === 'number') {
          return parsed;
        }
      }
    } catch {}
    return {
      currentLessonNumber: 8,
      completedLessons: [1, 2, 3, 4, 5, 6, 7],
      listenedLessons: [1, 2, 3, 4, 5, 6, 7, 8],
      masteredActiveLessons: [],
      audioSpeed: 0.9,
      lastUpdated: Date.now(),
    };
  });

  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [userEmail, setUserEmail] = useState<string>(() => getActiveProfileEmail());
  const [userDisplayName, setUserDisplayName] = useState<string>(() => getActiveProfileName());
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [voiceAccent, setVoiceAccent] = useState<'en-US' | 'en-GB'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACCENT);
      return saved === 'en-US' ? 'en-US' : 'en-GB'; // Default: British English ('en-GB')
    } catch {
      return 'en-GB';
    }
  });
  const [suggestedInput, setSuggestedInput] = useState<string>('');

  // Core SLA State
  const [systemState, setSystemState] = useState<SystemState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STATE);
      return saved ? JSON.parse(saved) : INITIAL_SYSTEM_STATE;
    } catch {
      return INITIAL_SYSTEM_STATE;
    }
  });

  // Chat stream messages
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MESSAGES);
      return saved ? JSON.parse(saved) : [INITIAL_WELCOME_MESSAGE];
    } catch {
      return [INITIAL_WELCOME_MESSAGE];
    }
  });

  // Spaced Repetition Flashcards
  const [srsDeck, setSrsDeck] = useState<SRSFlashcard[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SRS);
      return saved ? JSON.parse(saved) : INITIAL_FLASHCARDS;
    } catch {
      return INITIAL_FLASHCARDS;
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(systemState));
    } catch (e) {
      console.warn('Failed to save system state to localStorage', e);
    }
  }, [systemState]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save messages to localStorage', e);
    }
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SRS, JSON.stringify(srsDeck));
    } catch (e) {
      console.warn('Failed to save SRS deck to localStorage', e);
    }
  }, [srsDeck]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACCENT, voiceAccent);
    } catch {
      // ignore
    }
  }, [voiceAccent]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (currentTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentTab]);

  // Load cloud progress with bidirectional conflict resolution
  const applyProfileCloudProgress = async (email: string) => {
    try {
      const cloudData = await fetchServerProgress(email);
      if (cloudData) {
        // 1. Gather current local state
        let localLesson = currentAssimilLessonNum || 8;
        let localCompleted: number[] = assimilProgress?.completedLessons || [1, 2, 3, 4, 5, 6, 7];
        let localListened: number[] = assimilProgress?.listenedLessons || [1, 2, 3, 4, 5, 6, 7, 8];

        try {
          const savedCur = localStorage.getItem(STORAGE_KEY_ASSIMIL_CURRENT);
          if (savedCur) {
            const p = parseInt(savedCur, 10);
            if (!isNaN(p) && p >= 1) localLesson = p;
          }
          const savedProg = localStorage.getItem(STORAGE_KEY_ASSIMIL_PROGRESS);
          if (savedProg) {
            const parsed = JSON.parse(savedProg);
            if (Array.isArray(parsed?.completedLessons) && parsed.completedLessons.length > 0) {
              localCompleted = parsed.completedLessons;
            }
            if (Array.isArray(parsed?.listenedLessons) && parsed.listenedLessons.length > 0) {
              localListened = parsed.listenedLessons;
            }
            if (typeof parsed?.currentLessonNumber === 'number' && parsed.currentLessonNumber >= 1) {
              localLesson = Math.max(localLesson, parsed.currentLessonNumber);
            }
          }
        } catch {}

        // 2. Cloud data
        const cloudCompleted = Array.isArray(cloudData.assimilProgress?.completedLessons)
          ? cloudData.assimilProgress.completedLessons
          : [];
        const cloudListened = Array.isArray(cloudData.assimilProgress?.listenedLessons)
          ? cloudData.assimilProgress.listenedLessons
          : [];
        const cloudLesson = cloudData.currentAssimilLessonNum || cloudData.assimilProgress?.currentLessonNumber || 1;

        // 3. Smart Set-Union merge for completed & listened lessons (no loss!)
        const mergedCompleted = Array.from(new Set([...localCompleted, ...cloudCompleted])).sort((a, b) => a - b);
        const mergedListened = Array.from(new Set([...localListened, ...cloudListened])).sort((a, b) => a - b);

        // 4. Milestone: if completed lessons exist, student has unlocked at least (highestCompleted + 1)
        const highestCompleted = mergedCompleted.length > 0 ? Math.max(...mergedCompleted) : 0;
        const minimumMilestone = Math.max(1, highestCompleted + 1);

        // Target active lesson (never regress below milestone)
        const targetLesson = Math.max(localLesson, cloudLesson, minimumMilestone);

        const mergedAssimilProgress: AssimilProgress = {
          ...(cloudData.assimilProgress || assimilProgress),
          currentLessonNumber: targetLesson,
          completedLessons: mergedCompleted,
          listenedLessons: mergedListened,
          audioSpeed: cloudData.assimilProgress?.audioSpeed ?? assimilProgress?.audioSpeed ?? 0.9,
          lastUpdated: Math.max(
            assimilProgress?.lastUpdated || 0,
            cloudData.assimilProgress?.lastUpdated || 0,
            Date.now()
          ),
        };

        setCurrentAssimilLessonNum(targetLesson);
        setAssimilProgress(mergedAssimilProgress);

        try {
          localStorage.setItem(STORAGE_KEY_ASSIMIL_CURRENT, targetLesson.toString());
          localStorage.setItem(STORAGE_KEY_ASSIMIL_PROGRESS, JSON.stringify(mergedAssimilProgress));
          localStorage.setItem('assimil_highest_milestone_v1', targetLesson.toString());
        } catch {}

        if (cloudData.systemState) {
          setSystemState((prev) => ({
            ...prev,
            ...cloudData.systemState,
          }));
          try {
            localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(cloudData.systemState));
          } catch {}
        }

        // If local had higher progress or more completed lessons than cloud, sync back to server immediately
        if (targetLesson > cloudLesson || mergedCompleted.length > cloudCompleted.length) {
          triggerServerSyncDebounced(
            {
              userEmail: email,
              displayName: userDisplayName,
              currentAssimilLessonNum: targetLesson,
              assimilProgress: mergedAssimilProgress,
              systemState: cloudData.systemState || systemState,
            },
            300
          );
        }
      }
    } catch (e) {
      console.warn('Profile cloud progress sync failed:', e);
    }
  };

  // Cloud Sync Listener & Initial Fetch on Mount
  useEffect(() => {
    const unsub = subscribeToSyncStatus((status) => {
      setSyncStatus(status);
    });

    applyProfileCloudProgress(userEmail);

    return () => {
      unsub();
    };
  }, []);

  const handleUpdateAssimilProgress = (newProg: AssimilProgress) => {
    setAssimilProgress(newProg);
    const targetLesson = Math.max(currentAssimilLessonNum, newProg.currentLessonNumber || 1);
    try {
      localStorage.setItem(STORAGE_KEY_ASSIMIL_PROGRESS, JSON.stringify(newProg));
      localStorage.setItem(STORAGE_KEY_ASSIMIL_CURRENT, targetLesson.toString());
    } catch {}
    triggerServerSyncDebounced({
      userEmail,
      displayName: userDisplayName,
      currentAssimilLessonNum: targetLesson,
      assimilProgress: newProg,
      systemState,
    });
  };

  const handleSelectAssimilLesson = (num: number, isReview = false) => {
    setCurrentAssimilLessonNum(num);
    try {
      localStorage.setItem(STORAGE_KEY_ASSIMIL_CURRENT, num.toString());
    } catch {}
    const updatedProg: AssimilProgress = {
      ...assimilProgress,
      currentLessonNumber: num,
      lastUpdated: Date.now(),
    };
    setAssimilProgress(updatedProg);
    try {
      localStorage.setItem(STORAGE_KEY_ASSIMIL_PROGRESS, JSON.stringify(updatedProg));
    } catch {}
    triggerServerSyncDebounced({
      userEmail,
      displayName: userDisplayName,
      currentAssimilLessonNum: num,
      assimilProgress: updatedProg,
      systemState,
      allowNavigationReview: isReview || num <= (assimilProgress?.completedLessons?.length || 0),
    });
  };

  const handleManualSync = async () => {
    try {
      await applyProfileCloudProgress(userEmail);
    } catch (e) {
      console.warn('Manual sync error:', e);
    }
  };

  const handleProfileSwitched = async (newEmail: string, newDisplayName: string) => {
    setUserEmail(newEmail);
    setUserDisplayName(newDisplayName);
    setActiveProfile(newEmail, newDisplayName);
    await applyProfileCloudProgress(newEmail);
  };

  // Send message to SLA coach
  const handleSendMessage = async (text: string, customTopic?: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/coach/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          history: [...messages, userMessage].slice(-4),
          systemState,
          actionType: 'chat',
          customTopic,
          voiceAccent,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      const coachMessage: ChatMessage = {
        id: `coach-${Date.now()}`,
        sender: 'coach',
        text: data.rawMarkdown,
        timestamp: Date.now(),
        parsed: data.parsed,
        stateSnapshot: data.systemState,
        quickSuggestions: data.quickSuggestions,
      };

      setMessages((prev) => [...prev, coachMessage]);

      if (data.systemState) {
        setSystemState((prev) => ({
          ...prev,
          cefrLevel: data.systemState.cefrLevel || prev.cefrLevel,
          currentDomain: data.systemState.currentDomain || prev.currentDomain,
          errorRate: data.systemState.errorRate || prev.errorRate,
          targetVocabulary: data.systemState.targetVocabulary || prev.targetVocabulary,
          totalInteractions: prev.totalInteractions + 1,
          xpPoints: prev.xpPoints + 35,
        }));
      }
    } catch (err: any) {
      console.error('Failed to get coach response:', err);

      // Intelligent feedback fallback if offline or unexpected network hitch
      const isDangling = text.toLowerCase().includes('about your day-to-day life');
      const cleanNatural = isDangling
        ? text.replace(/about your day-to-day life/gi, '').trim().replace(/\.$/, '') + '. In my day-to-day life, I manage my daily schedule.'
        : `${text.trim().replace(/\.$/, '')}, which works out well for me.`;

      const techNote = isDangling
        ? 'En tu frase habías incluido la instrucción de la consigna ("about your day-to-day life") al final. Para sonar natural en inglés británico, separamos la idea o usamos "In my day-to-day life..." como frase introductoria.'
        : 'Tu frase ha sido registrada y analizada. En inglés británico procuramos integrar colocaciones idiomáticas como "at the weekend" o "fancy doing".';

      const fallbackMsg: ChatMessage = {
        id: `coach-${Date.now()}`,
        sender: 'coach',
        text: `### 🎯 Feedback & Corrección Rápida
> **Tu frase:** "${text}"
> **Versión Natural:** "${cleanNatural}"
- **Nota técnica:** ${techNote}

---

### 📚 Lección del Día: Conectores y Rutinas en Inglés Británico (UK)
Para hablar de tu día a día con total naturalidad, en el Reino Unido se utilizan expresiones como **"at the weekend"** (el fin de semana) y **"fancy (+ -ing)"** (apetecer).

* **Ejemplo 1:** At the weekend, I fancy taking a stroll in the park. -> *El fin de semana, me apetece dar un paseo por el parque.*
* **Ejemplo 2:** In my day-to-day life, I start with a warm cuppa. -> *En mi vida cotidiana, empiezo con una taza de té caliente.*

---

### ⚡ Tu Turno (Ejercicio Activo)
¡Avanzamos de ejercicio! Responde en inglés británico: **What time do you usually finish work, and what do you fancy having for dinner tonight?**`,
        timestamp: Date.now(),
        parsed: {
          userPhrase: text,
          naturalPhrase: cleanNatural,
          technicalNote: techNote,
          lessonTitle: 'Conectores y Rutinas en Inglés Británico (UK)',
          lessonExplanation: 'Uso de colocaciones cotidianas británicas para rutinas y tiempo libre.',
          examples: [
            { english: 'At the weekend, I fancy taking a stroll in the park.', spanish: 'El fin de semana, me apetece dar un paseo por el parque.' },
            { english: 'In my day-to-day life, I start with a warm cuppa.', spanish: 'En mi vida cotidiana, empiezo con una taza de té caliente.' },
          ],
          exercisePrompt: '¡Avanzamos de ejercicio! Responde en inglés británico: What time do you usually finish work, and what do you fancy having for dinner tonight?',
        },
        quickSuggestions: [
          'I finish work at 6 PM and fancy having pasta for dinner.',
          'At the weekend, I fancy going for a relaxing walk.',
          'Can we practice another British English collocation?',
        ],
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Add term from lesson to SRS Deck
  const handleAddToSRS = (term: string, translation: string, contextSentence: string) => {
    const newCard: SRSFlashcard = {
      id: `srs-user-${Date.now()}`,
      term,
      type: 'collocation',
      level: systemState.cefrLevel,
      translation,
      contextSentence,
      repetitionStage: 0,
      easeFactor: 2.5,
      nextReviewDate: Date.now() - 1000, // Due immediately for first drill
      reviewCount: 0,
    };

    setSrsDeck((prev) => [newCard, ...prev]);

    // Also add to active target vocabulary if not already present
    if (!systemState.targetVocabulary.includes(term)) {
      setSystemState((prev) => ({
        ...prev,
        targetVocabulary: [term, ...prev.targetVocabulary].slice(0, 10),
      }));
    }
  };

  // SRS card review rating
  const handleReviewCard = (id: string, grade: 'again' | 'hard' | 'good' | 'easy') => {
    setSrsDeck((prev) =>
      prev.map((card) => {
        if (card.id !== id) return card;

        let nextStage = card.repetitionStage;
        let intervalDays = 1;

        if (grade === 'again') {
          nextStage = 0;
          intervalDays = 0.05; // ~1 hour
        } else if (grade === 'hard') {
          nextStage = Math.max(1, nextStage);
          intervalDays = 1;
        } else if (grade === 'good') {
          nextStage += 1;
          intervalDays = Math.pow(2.2, nextStage);
        } else if (grade === 'easy') {
          nextStage += 2;
          intervalDays = Math.pow(2.8, nextStage);
        }

        const nextReviewDate = Date.now() + intervalDays * 86400000;
        return {
          ...card,
          repetitionStage: nextStage,
          nextReviewDate,
          reviewCount: card.reviewCount + 1,
        };
      })
    );

    setSystemState((prev) => ({
      ...prev,
      xpPoints: prev.xpPoints + 15,
    }));
  };

  // Manual CEFR Level Selection
  const handleSelectLevel = (newLevel: CEFRLevel) => {
    setSystemState((prev) => ({
      ...prev,
      cefrLevel: newLevel,
    }));

    // Trigger level calibration message
    handleSendMessage(
      `Hola Coach, he actualizado mi nivel objetivo a ${newLevel}. Por favor calibra el scaffolding de la sesión (recuerda: A1-A2 80% ES / 20% EN, B1-B2 30% ES / 70% EN, C1-C2 100% EN) y facilítame un ejercicio activo representativo de este nivel.`
    );
  };

  // Start practice for a specific level from the Roadmap
  const handleStartLevelPractice = (level: CEFRLevel) => {
    setSystemState((prev) => ({
      ...prev,
      cefrLevel: level,
    }));
    setCurrentTab('chat');
    handleSendMessage(
      `Coach, quiero entrenar específicamente el Nivel ${level} hoy. Comencemos con la lección y tu primer ejercicio activo.`
    );
  };

  // Clear or restart conversation
  const handleResetChat = () => {
    if (confirm('¿Deseas reiniciar la conversación con el Coach? El historial de tarjetas SRS se conservará.')) {
      setMessages([INITIAL_WELCOME_MESSAGE]);
    }
  };

  const latestCoachMessage = [...messages].reverse().find((m) => m.sender === 'coach');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'diagnostic') {
            setIsDiagnosticOpen(true);
          } else if (tab === 'stats') {
            setIsStatsOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        systemState={systemState}
        onSelectLevel={handleSelectLevel}
        voiceAccent={voiceAccent}
        onToggleAccent={() => setVoiceAccent(voiceAccent === 'en-US' ? 'en-GB' : 'en-US')}
        onOpenDiagnostic={() => setIsDiagnosticOpen(true)}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenVoicePractice={() => setIsVoiceModalOpen(true)}
        currentAssimilLesson={currentAssimilLessonNum}
        completedLessonsCount={assimilProgress.completedLessons.length}
        syncStatus={syncStatus}
        onManualSync={handleManualSync}
        userEmail={userEmail}
        userDisplayName={userDisplayName}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {currentTab === 'assimil' && (
          <AssimilLessonView
            currentLessonNum={currentAssimilLessonNum}
            onSelectLesson={handleSelectAssimilLesson}
            onStartCoachChat={(prompt, topic) => {
              setCurrentTab('chat');
              handleSendMessage(prompt, topic);
            }}
            voiceAccent={voiceAccent}
            syncedProgress={assimilProgress}
            onUpdateProgress={handleUpdateAssimilProgress}
            onManualSync={handleManualSync}
            syncStatus={syncStatus}
            userDisplayName={userDisplayName}
            userEmail={userEmail}
            onOpenProfile={() => setIsProfileModalOpen(true)}
          />
        )}

        {currentTab === 'chat' && (
          <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto px-4 sm:px-6 pt-6 pb-2">
            {/* Top coaching bar */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentTab('assimil')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[11px] font-bold transition-all cursor-pointer"
                  title="Ir a tu lección actual de Assimil"
                >
                  <BookOpen className="w-3.5 h-3.5 text-rose-400" />
                  <span>Assimil Lección #{currentAssimilLessonNum}</span>
                </button>
                <span className="text-slate-500 hidden sm:inline">&bull;</span>
                <span className="text-slate-400 hidden sm:inline">
                  {systemState.learningTrack}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    handleSendMessage(
                      'Coach, dame feedback sobre mi progreso y avancemos inmediatamente a un nuevo tema y ejercicio de inglés británico.'
                    )
                  }
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/35 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
                  title="Avanzar de inmediato a un nuevo tema y ejercicio"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Avanzar Ejercicio</span>
                </button>

                <button
                  onClick={handleResetChat}
                  className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors p-1"
                  title="Reiniciar conversación"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="text-[11px] hidden sm:inline">Reiniciar</span>
                </button>
              </div>
            </div>

            {/* Messages stream */}
            <div className="flex-1 space-y-4">
              {messages.map((msg) => (
                <CoachMessageCard
                  key={msg.id}
                  message={msg}
                  cefrLevel={systemState.cefrLevel}
                  voiceAccent={voiceAccent}
                  onAddToSRS={handleAddToSRS}
                  onApplySuggestion={(sug) => setSuggestedInput(sug)}
                  onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
                  onSendMessage={handleSendMessage}
                />
              ))}

              {/* Loading animation indicator */}
              {isLoading && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 max-w-sm mb-6 animate-pulse">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600/30 flex items-center justify-center text-indigo-400">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200">Coach analizando sintaxis...</p>
                    <p className="text-[10px] text-slate-400">Calculando corrección y siguiente input i+1</p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <CoachInputArea
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              systemState={systemState}
              suggestedInput={suggestedInput}
              onClearSuggested={() => setSuggestedInput('')}
              onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
              voiceAccent={voiceAccent}
            />
          </div>
        )}

        {currentTab === 'roadmap' && (
          <RoadmapView
            currentLevel={systemState.cefrLevel}
            onSelectLevel={handleSelectLevel}
            onStartLevelPractice={handleStartLevelPractice}
            voiceAccent={voiceAccent}
          />
        )}

        {currentTab === 'srs' && (
          <SRSDeckView
            cards={srsDeck}
            onReviewCard={handleReviewCard}
            onAddCard={(cardData) => {
              const newCard: SRSFlashcard = {
                ...cardData,
                id: `custom-srs-${Date.now()}`,
                repetitionStage: 0,
                easeFactor: 2.5,
                nextReviewDate: Date.now() - 1000,
                reviewCount: 0,
              };
              setSrsDeck((prev) => [newCard, ...prev]);
            }}
            voiceAccent={voiceAccent}
          />
        )}
      </main>

      {/* Diagnostic Placement Test Modal */}
      <PlacementTestModal
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
        onCompleteTest={({ level, targetVocab }) => {
          setSystemState((prev) => ({
            ...prev,
            cefrLevel: level,
            targetVocabulary: targetVocab && targetVocab.length > 0 ? targetVocab : prev.targetVocabulary,
          }));
          setCurrentTab('chat');
          handleSendMessage(
            `Coach, he completado mi Test Diagnóstico Oficial con resultado de Nivel ${level}. Por favor calibra la dificultad de nuestras interacciones y facilítame un ejercicio adaptado a mi nivel.`
          );
        }}
      />

      {/* System State & Linguistic Diagnostics Modal */}
      <LinguisticDiagnosticsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        systemState={systemState}
        onUpdateState={(updated) => setSystemState((prev) => ({ ...prev, ...updated }))}
        onOpenDiagnosticTest={() => {
          setIsStatsOpen(false);
          setIsDiagnosticOpen(true);
        }}
      />

      {/* Interactive Voice Practice Modal */}
      <VoiceConversationModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        systemState={systemState}
        voiceAccent={voiceAccent}
        onSendMessage={async (text) => {
          await handleSendMessage(text);
        }}
        latestCoachParsed={latestCoachMessage?.parsed}
        latestCoachText={latestCoachMessage?.text}
        isLoading={isLoading}
      />

      {/* User Profile & Cross-Device Cloud Sync Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentLessonNum={currentAssimilLessonNum}
        assimilProgress={assimilProgress}
        systemState={systemState}
        onProfileSwitched={handleProfileSwitched}
        syncStatus={syncStatus}
      />
    </div>
  );
}
