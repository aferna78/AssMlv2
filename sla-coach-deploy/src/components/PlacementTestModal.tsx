import React from 'react';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Loader2,
  Award,
  BookOpen,
} from 'lucide-react';
import { PLACEMENT_QUESTIONS } from '../data/constants';
import { CEFRLevel } from '../types';

interface PlacementTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteTest: (result: {
    level: CEFRLevel;
    score: number;
    total: number;
    analysis?: string;
    targetVocab?: string[];
  }) => void;
}

export const PlacementTestModal: React.FC<PlacementTestModalProps> = ({
  isOpen,
  onClose,
  onCompleteTest,
}) => {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [userAnswers, setUserAnswers] = React.useState<Record<number, number>>({});
  const [sampleWriting, setSampleWriting] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [diagnosticResult, setDiagnosticResult] = React.useState<any>(null);

  if (!isOpen) return null;

  const currentQ = PLACEMENT_QUESTIONS[currentStep];
  const isQuestionPhase = currentStep < PLACEMENT_QUESTIONS.length;
  const isWritingPhase = currentStep === PLACEMENT_QUESTIONS.length;
  const isCompletedPhase = diagnosticResult !== null;

  const handleSelectOption = (idx: number) => {
    setUserAnswers((prev) => ({ ...prev, [currentQ.id]: idx }));
  };

  const handleNext = () => {
    if (currentStep < PLACEMENT_QUESTIONS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const calculateDirectLevel = (): { level: CEFRLevel; score: number } => {
    let score = 0;
    PLACEMENT_QUESTIONS.forEach((q) => {
      if (userAnswers[q.id] === q.correctIndex) {
        score++;
      }
    });

    let level: CEFRLevel = 'A1';
    if (score === 1) level = 'A2';
    else if (score === 2) level = 'B1';
    else if (score === 3 || score === 4) level = 'B2';
    else if (score === 5) level = 'C1';
    else if (score === 6) level = 'C2';

    return { level, score };
  };

  const handleFinishAssessment = async () => {
    setIsSubmitting(true);
    const { level, score } = calculateDirectLevel();

    try {
      const res = await fetch('/api/coach/diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: userAnswers,
          sampleWriting,
          currentSelectedLevel: level,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDiagnosticResult({
          recommendedLevel: data.recommendedLevel || level,
          score,
          total: PLACEMENT_QUESTIONS.length,
          analysis:
            data.analysis ||
            `Has obtenido ${score}/${PLACEMENT_QUESTIONS.length} aciertos. Tu nivel sugerido de inicio es ${level}.`,
          strengths: data.strengths || ['Manejo de estructuras funcionales'],
          areasToImprove: data.areasToImprove || ['Ampliación de colocaciones idiomáticas'],
          targetVocabulary: data.targetVocabulary || ['take into account', 'as long as', 'look up to'],
        });
      } else {
        // Fallback
        setDiagnosticResult({
          recommendedLevel: level,
          score,
          total: PLACEMENT_QUESTIONS.length,
          analysis: `Has obtenido ${score}/${PLACEMENT_QUESTIONS.length} respuestas correctas. Tu nivel inicial recomendado es ${level}.`,
          strengths: ['Comprensión sintáctica adecuada'],
          areasToImprove: ['Mayor riqueza léxica y colocaciones'],
          targetVocabulary: ['carry out', 'take for granted', 'in terms of'],
        });
      }
    } catch {
      setDiagnosticResult({
        recommendedLevel: level,
        score,
        total: PLACEMENT_QUESTIONS.length,
        analysis: `Has obtenido ${score}/${PLACEMENT_QUESTIONS.length} respuestas correctas. Tu nivel inicial recomendado es ${level}.`,
        strengths: ['Comprensión sintáctica'],
        areasToImprove: ['Collocations nativas'],
        targetVocabulary: ['make progress', 'get along with', 'set up'],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyResult = () => {
    if (!diagnosticResult) return;
    onCompleteTest({
      level: diagnosticResult.recommendedLevel,
      score: diagnosticResult.score,
      total: diagnosticResult.total,
      analysis: diagnosticResult.analysis,
      targetVocab: diagnosticResult.targetVocabulary,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Test Diagnóstico de Nivel CEFR</h2>
              <p className="text-[11px] text-slate-400">Calibración inicial de Input Comprensible</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs font-semibold p-1"
          >
            Cerrar
          </button>
        </div>

        {/* Phase 1: Multiple choice questions */}
        {isQuestionPhase && (
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
              <span>
                Pregunta {currentStep + 1} de {PLACEMENT_QUESTIONS.length}
              </span>
              <span className="text-indigo-400 font-bold">Objetivo: {currentQ.level}</span>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-1.5 mb-6">
              <div
                className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentStep + 1) / (PLACEMENT_QUESTIONS.length + 1)) * 100}%`,
                }}
              />
            </div>

            <div className="mb-6">
              <span className="text-[11px] uppercase font-bold text-slate-500 block mb-1">
                Completa la oración correctamente:
              </span>
              <p className="text-base sm:text-lg font-semibold text-white leading-relaxed bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                {currentQ.prompt}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-2.5 mb-6">
              {currentQ.options.map((opt, idx) => {
                const isSelected = userAnswers[currentQ.id] === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-indigo-600/30 text-indigo-100 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                        : 'bg-slate-950/50 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="font-mono text-indigo-400 mr-2 font-bold">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-end">
              <button
                onClick={handleNext}
                disabled={userAnswers[currentQ.id] === undefined}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
              >
                <span>{currentStep === PLACEMENT_QUESTIONS.length - 1 ? 'Siguiente paso' : 'Siguiente'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Phase 2: Writing sample (Optional for enhanced AI diagnosis) */}
        {isWritingPhase && !diagnosticResult && (
          <div>
            <div className="mb-4">
              <span className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                Paso Final: Muestra de Expresión Escrita (Opcional)
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white mb-2">
                Escribe 2-4 oraciones en inglés sobre ti, tu trabajo o tus pasatiempos.
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                Esto permitirá al evaluador analizar tu sintaxis, coherencia y uso natural de collocations.
              </p>
              <textarea
                rows={4}
                value={sampleWriting}
                onChange={(e) => setSampleWriting(e.target.value)}
                placeholder="Example: I work as a graphic designer. In my free time, I really enjoy traveling and discovering new culinary traditions..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Volver a preguntas
              </button>

              <button
                onClick={handleFinishAssessment}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Calibrando nivel CEFR...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generar Diagnóstico Completo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Phase 3: Results display */}
        {isCompletedPhase && (
          <div className="space-y-4 animate-in fade-in zoom-in-95">
            <div className="text-center py-2">
              <div className="inline-block p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Nivel CEFR Diagnosticado
                </span>
                <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-300 to-emerald-400">
                  {diagnosticResult.recommendedLevel}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400">
                Puntuación técnica: {diagnosticResult.score} de {diagnosticResult.total} aciertos
              </p>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 leading-relaxed">
              <span className="font-bold text-indigo-300 block mb-1 text-xs">
                Dictamen Pedagógico:
              </span>
              <p>{diagnosticResult.analysis}</p>
            </div>

            {/* Target vocab */}
            {diagnosticResult.targetVocabulary && diagnosticResult.targetVocabulary.length > 0 && (
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Primeras Collocations Recomendadas para este nivel:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {diagnosticResult.targetVocabulary.map((term: string, i: number) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold"
                    >
                      {term}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={handleApplyResult}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all text-center"
              >
                Aplicar Nivel {diagnosticResult.recommendedLevel} e Iniciar Entrenamiento SLA
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
