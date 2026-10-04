import React from 'react';
import {
  Compass,
  CheckCircle2,
  Volume2,
  ArrowRight,
  BookOpen,
  Award,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';
import { CEFR_MILESTONES } from '../data/constants';
import { CEFRLevel } from '../types';
import { speakText } from '../utils/speech';

interface RoadmapViewProps {
  currentLevel: CEFRLevel;
  onSelectLevel: (level: CEFRLevel) => void;
  onStartLevelPractice: (level: CEFRLevel) => void;
  voiceAccent: 'en-US' | 'en-GB';
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({
  currentLevel,
  onSelectLevel,
  onStartLevelPractice,
  voiceAccent,
}) => {
  const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const [playingSentence, setPlayingSentence] = React.useState<string | null>(null);

  const handlePlaySentence = async (text: string, id: string) => {
    try {
      setPlayingSentence(id);
      await speakText(text, { lang: voiceAccent, rate: 0.9 });
      setPlayingSentence(null);
    } catch {
      setPlayingSentence(null);
    }
  };

  const getLevelIndex = (lvl: CEFRLevel) => levels.indexOf(lvl);
  const currentIdx = getLevelIndex(currentLevel);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Hero description */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
          <Compass className="w-3.5 h-3.5" />
          <span>Trayectoria Lingüística SLA (A1 &rarr; C2)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          De Principiante Absoluto a Maestría Bilingüe
        </h1>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
          Diseñado bajo los principios del Marco Común Europeo de Referencia (CEFR), el Enfoque Léxico de Lewis y el Input Comprensible i+1 de Krashen.
        </p>
      </div>

      {/* Progress timeline summary */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 mb-8 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tu Posición Actual en el Mapa:
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl font-extrabold text-indigo-400">Nivel {currentLevel}</span>
              <span className="text-xs text-slate-300">
                &bull; {CEFR_MILESTONES[currentLevel]?.name}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Progreso:</span>
            <div className="w-32 bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${((currentIdx + 1) / levels.length) * 100}%` }}
              />
            </div>
            <span className="text-xs font-bold text-indigo-300 font-mono">
              {Math.round(((currentIdx + 1) / levels.length) * 100)}%
            </span>
          </div>
        </div>

        {/* Milestone Steps Bar */}
        <div className="grid grid-cols-6 gap-1.5 sm:gap-2 pt-2 border-t border-slate-800/80">
          {levels.map((lvl, index) => {
            const isCompleted = index < currentIdx;
            const isCurrent = index === currentIdx;
            return (
              <button
                key={lvl}
                onClick={() => onSelectLevel(lvl)}
                className={`py-2 px-1 rounded-xl text-center transition-all ${
                  isCurrent
                    ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400'
                    : isCompleted
                    ? 'bg-slate-800/90 text-slate-200 hover:bg-slate-800 border border-emerald-500/30'
                    : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800/60 border border-slate-800'
                }`}
              >
                <div className="text-xs sm:text-sm font-bold">{lvl}</div>
                <div className="text-[9px] uppercase font-semibold hidden sm:block truncate opacity-80">
                  {lvl === 'A1'
                    ? 'Inicio'
                    : lvl === 'A2'
                    ? 'Básico'
                    : lvl === 'B1'
                    ? 'Autónomo'
                    : lvl === 'B2'
                    ? 'Avanzado'
                    : lvl === 'C1'
                    ? 'Eficaz'
                    : 'Maestría'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards list of all levels */}
      <div className="space-y-6">
        {levels.map((lvl, idx) => {
          const m = CEFR_MILESTONES[lvl];
          const isCurrent = lvl === currentLevel;
          const isPassed = idx < currentIdx;

          return (
            <div
              key={lvl}
              className={`rounded-2xl border transition-all ${
                isCurrent
                  ? 'bg-slate-900/95 border-indigo-500 shadow-xl shadow-indigo-950/40 ring-1 ring-indigo-500/40'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              } p-5 sm:p-6`}
            >
              {/* Level header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-lg bg-gradient-to-br ${m.scaffoldingColor} text-white shadow-md`}
                  >
                    {lvl}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-bold text-white">{m.name}</h2>
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          Tu Nivel Actual
                        </span>
                      )}
                      {isPassed && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Dominado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{m.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Scaffolding de Input
                    </span>
                    <span className="text-xs font-semibold text-slate-300 font-mono">
                      {m.scaffoldingRatio}
                    </span>
                  </div>

                  {!isCurrent ? (
                    <button
                      onClick={() => onSelectLevel(lvl)}
                      className="px-3 py-1.5 rounded-lg border border-slate-700 hover:border-indigo-500 text-slate-300 hover:text-white text-xs font-medium transition-colors"
                    >
                      Seleccionar nivel
                    </button>
                  ) : null}

                  <button
                    onClick={() => onStartLevelPractice(lvl)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all active:scale-95"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Entrenar {lvl}</span>
                  </button>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed my-4">
                {m.description}
              </p>

              {/* Details grid: Competencies & Grammar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                {/* Core Competencies */}
                <div className="rounded-xl bg-slate-950/50 border border-slate-800/80 p-3.5">
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                    <Award className="w-3.5 h-3.5" />
                    <span>Competencias Operativas (Can-Do)</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {m.coreCompetencies.map((comp, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">&bull;</span>
                        <span>{comp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Grammar & Lexical focus */}
                <div className="rounded-xl bg-slate-950/50 border border-slate-800/80 p-3.5">
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Enfoque Gramatical &amp; Léxico</span>
                  </div>
                  <div className="space-y-2 text-xs text-slate-300">
                    <div>
                      <span className="font-semibold text-slate-400 block text-[11px] mb-1">
                        Estructuras Clave:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {m.grammarFocus.map((g, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[11px] text-slate-300"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-1">
                      <span className="font-semibold text-slate-400 block text-[11px] mb-1">
                        Campos Léxicos:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {m.lexicalThemes.map((th, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400"
                          >
                            {th}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sample benchmark sentence with audio */}
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950/30 p-3 rounded-xl border border-slate-800/50">
                <div className="flex-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                    Ejemplo Canónico {lvl}:
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-slate-200">
                    "{m.sampleSentence.en}"
                  </p>
                  <p className="text-xs text-slate-400 italic">
                    &rarr; {m.sampleSentence.es}
                  </p>
                </div>
                <button
                  onClick={() => handlePlaySentence(m.sampleSentence.en, `roadmap-${lvl}`)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors shrink-0 self-start sm:self-auto"
                >
                  <Volume2 className={`w-3.5 h-3.5 ${playingSentence === `roadmap-${lvl}` ? 'text-indigo-400 animate-pulse' : ''}`} />
                  <span>{playingSentence === `roadmap-${lvl}` ? 'Reproduciendo...' : 'Escuchar'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
