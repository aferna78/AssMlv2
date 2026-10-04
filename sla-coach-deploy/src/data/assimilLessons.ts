import { AssimilLesson } from '../types';
import { LESSONS_1_TO_10 } from './lessons1_10';
import { LESSONS_11_TO_20 } from './lessons11_20';
import { LESSONS_21_TO_30 } from './lessons21_30';
import { LESSONS_31_TO_40 } from './lessons31_40';
import { LESSONS_41_TO_50 } from './lessons41_50';
import { LESSONS_51_TO_75 } from './lessons51_75';
import { LESSONS_76_TO_100 } from './lessons76_100';
import { LESSONS_101_TO_125 } from './lessons101_125';
import { LESSONS_126_TO_146 } from './lessons126_146';

export { ASSIMIL_IRREGULAR_VERBS } from './irregularVerbs';

export const ASSIMIL_METHOD_EXPLANATION = {
  title: 'El Método Assimil: El nuevo inglés sin esfuerzo',
  subtitle: 'Aprendizaje intuitivo mediante la asimilación natural diaria',
  description:
    'El método Assimil se basa en dos fases fundamentales: la Fase Pasiva (la primera ola, lecciones 1 a 50) y la Fase Activa (la segunda ola, lecciones 51 a 146). Cada lección diaria incluye un diálogo auténtico con humor y realismo, pronunciación figurada simplificada, traducción bilingüe, notas explicativas culturales y gramaticales sin jerga árida, y dos ejercicios de consolidación inmediata.',
  phases: [
    {
      name: 'Primera Ola: La Fase Pasiva (Lecciones 1 a 50)',
      icon: 'Headphones',
      color: 'from-blue-500 to-indigo-600',
      rule: 'No fuerces el hablar ni la memorización de gramática abstracta. Escucha el diálogo, lee la pronunciación figurada, compara con el español, lee las notas y completa los dos ejercicios diarios. Tu cerebro asimila los patrones sin esfuerzo consciente.',
    },
    {
      name: 'Segunda Ola: La Fase Activa (Lecciones 51 a 146)',
      icon: 'Zap',
      color: 'from-amber-500 to-rose-600',
      rule: 'A partir de la lección 50, además de la lección diaria nueva en modo pasivo, activas una lección anterior (empezando por la lección 1): ocultas el inglés e intentas traducirla tú mismo desde el español para afianzar el bilingüismo activo.',
    },
    {
      name: 'Lecciones de Repaso cada 7 días (7, 14, 21, 28, 35, 42, 49, 56, 63...)',
      icon: 'Sparkles',
      color: 'from-emerald-500 to-teal-600',
      rule: 'Cada séptima lección es una síntesis pedagógica donde no hay diálogo nuevo, sino un repaso estructurado de la gramática, fonética inglesa y peculiaridades asimiladas durante la semana.',
    },
  ],
};

// All 146 lessons strictly ordered from 1 to 146 with ZERO duplicates
export const DETAILED_ASSIMIL_LESSONS: AssimilLesson[] = [
  ...LESSONS_1_TO_10,
  ...LESSONS_11_TO_20,
  ...LESSONS_21_TO_30,
  ...LESSONS_31_TO_40,
  ...LESSONS_41_TO_50,
  ...LESSONS_51_TO_75,
  ...LESSONS_76_TO_100,
  ...LESSONS_101_TO_125,
  ...LESSONS_126_TO_146,
].sort((a, b) => a.number - b.number);

// Fast map lookup by lesson number
const LESSON_MAP = new Map<number, AssimilLesson>(
  DETAILED_ASSIMIL_LESSONS.map((l) => [l.number, l])
);

// Helper to retrieve any of the 146 lessons of the Assimil course
export function getAssimilLesson(lessonNum: number): AssimilLesson {
  const lesson = LESSON_MAP.get(lessonNum);
  if (lesson) return lesson;
  return DETAILED_ASSIMIL_LESSONS[0];
}

export const TOTAL_ASSIMIL_LESSONS = 146;
