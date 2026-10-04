import React from 'react';
import {
  BarChart3,
  X,
  Target,
  Activity,
  Layers,
  Sparkles,
  BookOpen,
  Check,
  TrendingUp,
} from 'lucide-react';
import { CEFRLevel, Domain, ErrorRate, SystemState } from '../types';

interface LinguisticDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemState: SystemState;
  onUpdateState: (newState: Partial<SystemState>) => void;
  onOpenDiagnosticTest: () => void;
}

export const LinguisticDiagnosticsModal: React.FC<LinguisticDiagnosticsModalProps> = ({
  isOpen,
  onClose,
  systemState,
  onUpdateState,
  onOpenDiagnosticTest,
}) => {
  const [newVocabInput, setNewVocabInput] = React.useState('');

  if (!isOpen) return null;

  const domains: Domain[] = [
    'Gramática',
    'Vocabulario',
    'Expresiones Idiomáticas',
    'Fluidez Conversacional',
  ];

  const errorRates: ErrorRate[] = ['Baja (<10%)', 'Media (10-30%)', 'Alta (>30%)'];

  const handleAddTargetVocab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVocabInput.trim()) return;
    const updated = [...systemState.targetVocabulary, newVocabInput.trim()];
    onUpdateState({ targetVocabulary: updated });
    setNewVocabInput('');
  };

  const handleRemoveTargetVocab = (index: number) => {
    const updated = systemState.targetVocabulary.filter((_, i) => i !== index);
    onUpdateState({ targetVocabulary: updated });
  };

  const getScaffoldingInfo = (level: CEFRLevel) => {
    switch (level) {
      case 'A1':
      case 'A2':
        return {
          ratio: '80% Español / 20% Inglés',
          desc: 'Oraciones simples (Sujeto + Verbo + Objeto), vocabulario de alta frecuencia y explicaciones breves.',
          color: 'text-emerald-400',
        };
      case 'B1':
      case 'B2':
        return {
          ratio: '30% Español / 70% Inglés',
          desc: 'Conectores complejos, condicionales y phrasal verbs idiomáticos.',
          color: 'text-indigo-400',
        };
      case 'C1':
      case 'C2':
        return {
          ratio: '100% Inglés',
          desc: 'Registro académico, sutilezas estilísticas, modismos avanzados e ironía/matices culturales.',
          color: 'text-amber-400',
        };
    }
  };

  const scaffolding = getScaffoldingInfo(systemState.cefrLevel);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Registro de Progreso Lingüístico (System State)
              </h2>
              <p className="text-[11px] text-slate-400">
                Variables SLA del modelo pedagógico Krashen i+1
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic State Scheme Table */}
        <div className="space-y-6">
          {/* Variable 1: CEFR Level */}
          <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-indigo-400" />
                <span>Nivel CEFR Actual</span>
              </span>
              <button
                onClick={() => {
                  onClose();
                  onOpenDiagnosticTest();
                }}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
              >
                ⚡ Ejecutar Test Diagnóstico
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-3xl font-extrabold text-white">
                {systemState.cefrLevel}
              </span>
              <div className="border-l border-slate-800 pl-3">
                <span className={`text-xs font-bold block ${scaffolding.color}`}>
                  Scaffolding: {scaffolding.ratio}
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  {scaffolding.desc}
                </p>
              </div>
            </div>
          </div>

          {/* Variable 2: Dominio Actual */}
          <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2.5 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Dominio Lingüístico en Foco</span>
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {domains.map((dom) => (
                <button
                  key={dom}
                  onClick={() => onUpdateState({ currentDomain: dom })}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                    systemState.currentDomain === dom
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {dom}
                </button>
              ))}
            </div>
          </div>

          {/* Variable 3: Tasa de Error Reciente */}
          <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2.5 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Tasa de Error Reciente</span>
            </span>

            <div className="grid grid-cols-3 gap-2">
              {errorRates.map((rate) => (
                <button
                  key={rate}
                  onClick={() => onUpdateState({ errorRate: rate })}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                    systemState.errorRate === rate
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {rate}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              El Coach ajusta automáticamente la complejidad del input i+1 según la tasa de error observada en tus últimas respuestas.
            </p>
          </div>

          {/* Variable 4: Vocabulario Objetivo (5-10 collocations activas) */}
          <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>Vocabulario Objetivo ({systemState.targetVocabulary.length}/10 collocations)</span>
              </span>
            </div>

            <p className="text-[11px] text-slate-400 mb-3">
              Términos que el Coach integrará proactivamente en los ejercicios de active recall del módulo:
            </p>

            <div className="flex flex-wrap gap-2 mb-3">
              {systemState.targetVocabulary.map((term, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-cyan-200"
                >
                  <span>{term}</span>
                  <button
                    onClick={() => handleRemoveTargetVocab(idx)}
                    className="hover:text-rose-400 text-slate-400 font-bold ml-1 text-xs"
                    title="Eliminar de la lista activa"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>

            {/* Add term input */}
            <form onSubmit={handleAddTargetVocab} className="flex gap-2">
              <input
                type="text"
                value={newVocabInput}
                onChange={(e) => setNewVocabInput(e.target.value)}
                placeholder="Añadir nueva collocation o chunk..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={!newVocabInput.trim()}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold"
              >
                Añadir
              </button>
            </form>
          </div>

          {/* Enfoque / Track de Aprendizaje */}
          <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Enfoque Pedagógico Seleccionado</span>
            </span>

            <select
              value={systemState.learningTrack}
              onChange={(e) => onUpdateState({ learningTrack: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="Fluidez Conversacional">Fluidez Conversacional Diaria (Krashen SLA)</option>
              <option value="Inglés Profesional & Negocios">Inglés Profesional & Negocios</option>
              <option value="Exámenes & Maestría C1/C2">Exámenes Oficiales & Maestría (Cambridge / IELTS)</option>
              <option value="Viajes & Inmersión">Viajes, Restaurantes & Vida Cotidiana</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-slate-800 mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
          >
            Guardar &amp; Continuar
          </button>
        </div>
      </div>
    </div>
  );
};
