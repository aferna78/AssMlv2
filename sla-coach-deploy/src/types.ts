export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type Domain = 'Gramática' | 'Vocabulario' | 'Expresiones Idiomáticas' | 'Fluidez Conversacional';

export type ErrorRate = 'Baja (<10%)' | 'Media (10-30%)' | 'Alta (>30%)';

export interface SystemState {
  cefrLevel: CEFRLevel;
  currentDomain: Domain;
  errorRate: ErrorRate;
  targetVocabulary: string[];
  learningTrack: string;
  totalInteractions: number;
  streakDays: number;
  xpPoints: number;
  lastActiveDate: string;
}

export interface ExamplePair {
  english: string;
  spanish: string;
}

export interface ParsedCoachResponse {
  userPhrase: string;
  naturalPhrase: string;
  technicalNote: string;
  lessonTitle: string;
  lessonExplanation: string;
  examples: ExamplePair[];
  exercisePrompt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: number;
  parsed?: ParsedCoachResponse;
  stateSnapshot?: Partial<SystemState>;
  quickSuggestions?: string[];
  isInitial?: boolean;
}

export interface SRSFlashcard {
  id: string;
  term: string;
  type: 'collocation' | 'phrasal_verb' | 'idiom' | 'connector' | 'chunk';
  level: CEFRLevel;
  ipa?: string;
  translation: string;
  contextSentence: string;
  translationContext?: string;
  notes?: string;
  repetitionStage: number; // 0 to 5
  easeFactor: number;
  nextReviewDate: number; // timestamp
  reviewCount: number;
}

export interface CEFRMilestone {
  level: CEFRLevel;
  name: string;
  subtitle: string;
  scaffoldingRatio: string;
  scaffoldingColor: string;
  description: string;
  coreCompetencies: string[];
  grammarFocus: string[];
  lexicalThemes: string[];
  sampleSentence: {
    en: string;
    es: string;
  };
}

export interface PlacementQuestion {
  id: number;
  level: CEFRLevel;
  prompt: string;
  context?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

// Assimil Method "El nuevo inglés sin esfuerzo" Types
export interface AssimilDialogueLine {
  id: string;
  speaker?: string;
  english: string;
  phonetic: string; // Pronunciación figurada Assimil (ej: "Gud morning, sör!")
  spanish: string; // Traducción literal/natural en español
  noteRef?: number; // Referencia a nota [1], [2], etc.
}

export interface AssimilNote {
  number: number;
  title?: string;
  content: string;
}

export interface AssimilExercise1Item {
  id: string;
  english: string;
  spanish: string;
  phonetic?: string;
}

export interface AssimilExercise2Item {
  id: string;
  promptWithBlank: string; // Frase en inglés con hueco "___" o "..."
  missingWord: string; // Palabra que debe rellenar
  spanishTranslation: string; // Traducción completa en español
  hint?: string;
}

export interface AssimilLesson {
  number: number;
  titleEnglish: string;
  titleSpanish: string;
  weekNumber: number;
  phase: 'passive' | 'active'; // 1-50: Onda Pasiva, 51+: Onda Activa
  isReviewLesson?: boolean; // Lecciones 7, 14, 21, etc.
  levelCEFR: CEFRLevel;
  introduction: string;
  dialogue: AssimilDialogueLine[];
  notes: AssimilNote[];
  exercise1: AssimilExercise1Item[];
  exercise2: AssimilExercise2Item[];
  culturalTidbit?: string;
  keyVocabulary: string[];
}

export interface AssimilProgress {
  currentLessonNumber: number;
  completedLessons: number[];
  listenedLessons: number[];
  masteredActiveLessons: number[];
  audioSpeed: number; // 0.8 | 1.0 | 1.2
  lastUpdated?: number;
}

export interface AssimilIrregularVerb {
  infinitive: string;
  past: string;
  participle: string;
  spanish: string;
  notes?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarColor?: string;
  createdAt: number;
  lastActive: number;
}

export interface UserProfileSummary {
  email: string;
  displayName: string;
  currentLesson: number;
  completedLessonsCount: number;
  streakDays: number;
  lastActive: number;
  avatarColor?: string;
}

