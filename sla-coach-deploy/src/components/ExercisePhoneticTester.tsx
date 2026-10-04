import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import {
  evaluateExercisePhonetics,
  PhoneticEvaluationResult,
  WordPhoneticResult,
} from '../utils/phoneticAnalysis';
import { voiceDictation, VoiceStatus } from '../utils/speech';
import { speakText, stopSpeaking } from '../utils/speech';

interface ExercisePhoneticTesterProps {
  exerciseId: string;
  targetSentence: string;
  phoneticGuide?: string;
  spanishTranslation?: string;
  voiceAccent?: 'en-GB' | 'en-US';
  lessonNumber?: number;
  onEvaluationComplete?: (result: PhoneticEvaluationResult) => void;
  className?: string;
}

export const ExercisePhoneticTester: React.FC<ExercisePhoneticTesterProps> = ({
  exerciseId,
  targetSentence,
  phoneticGuide,
  spanishTranslation,
  voiceAccent = 'en-GB',
  lessonNumber = 1,
  onEvaluationComplete,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [evaluation, setEvaluation] = useState<PhoneticEvaluationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [playingWord, setPlayingWord] = useState<string | null>(null);
  const [isPlayingFull, setIsPlayingFull] = useState(false);
  const [isLoadingAiFeedback, setIsLoadingAiFeedback] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [selectedWordForDetails, setSelectedWordForDetails] = useState<WordPhoneticResult | null>(null);

  // Stop listening when unmounted or changing sentence
  useEffect(() => {
    return () => {
      if (isListening) {
        voiceDictation.stopListening();
      }
    };
  }, [isListening, exerciseId]);

  // Clean target text for speech comparison
  const cleanTargetText = targetSentence
    .replace(/^\s*\d+\s*[—–-]\s*/, '')
    .trim();

  // Handle Start Recording
  const handleStartSpeaking = async () => {
    stopSpeaking();
    setErrorMsg(null);
    setLiveTranscript('');
    setIsListening(true);
    setAiFeedback(null);

    await voiceDictation.startListening(
      (result) => {
        setLiveTranscript(result.transcript);
        if (result.isFinal && result.transcript.trim()) {
          // Finished speaking
          handleFinishEvaluation(result.transcript);
        }
      },
      (err) => {
        setErrorMsg(err);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      },
      (status: VoiceStatus) => {
        if (status === 'error') {
          setIsListening(false);
        }
      },
      voiceAccent
    );
  };

  // Handle Stop Recording manually
  const handleStopSpeaking = () => {
    voiceDictation.stopListening();
    setIsListening(false);
    if (liveTranscript.trim()) {
      handleFinishEvaluation(liveTranscript);
    } else {
      setErrorMsg('No se detectó audio. Pulsa el micrófono y di la frase en voz alta.');
    }
  };

  // Evaluate speech against target
  const handleFinishEvaluation = (transcript: string) => {
    const evalResult = evaluateExercisePhonetics(cleanTargetText, transcript, phoneticGuide);
    setEvaluation(evalResult);

    // If there are mispronounced words, auto-select the first one for detailed advice
    const firstBadWord = evalResult.words.find((w) => w.status !== 'correct');
    if (firstBadWord) {
      setSelectedWordForDetails(firstBadWord);
    } else {
      setSelectedWordForDetails(null);
    }

    if (onEvaluationComplete) {
      onEvaluationComplete(evalResult);
    }
  };

  // Play full native reference
  const handlePlayFullAudio = async () => {
    stopSpeaking();
    setIsPlayingFull(true);
    await speakText(cleanTargetText, { lang: voiceAccent, rate: 0.88 });
    setIsPlayingFull(false);
  };

  // Play isolated word audio
  const handlePlayWordAudio = async (word: string) => {
    stopSpeaking();
    setPlayingWord(word);
    await speakText(word, { lang: voiceAccent, rate: 0.82 });
    setPlayingWord(null);
  };

  // Request in-depth AI phonetics feedback
  const handleRequestAiAdvice = async () => {
    if (!evaluation || isLoadingAiFeedback) return;

    setIsLoadingAiFeedback(true);
    try {
      const res = await fetch('/api/coach/phonetics-evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetSentence: cleanTargetText,
          spokenTranscript: evaluation.spokenTranscript,
          phoneticHint: phoneticGuide || '',
          lessonNumber,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiFeedback(data.coachAdvice || 'Buen trabajo con la práctica fonética.');
      }
    } catch {
      setAiFeedback('Recuerda practicar la colocación de la lengua y escuchar el audio nativo varias veces.');
    } finally {
      setIsLoadingAiFeedback(false);
    }
  };

  return (
    <div className={`rounded-xl border transition-all ${className} ${
      isOpen
        ? 'bg-slate-900/95 border-indigo-500/40 shadow-lg'
        : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
    }`}>
      {/* Header bar / Toggle */}
      <div className="p-3 sm:p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => {
              const next = !isOpen;
              setIsOpen(next);
              if (next && !evaluation && !isListening) {
                // Open panel and ready
              }
            }}
            className={`p-2 rounded-xl flex items-center gap-2 transition-all text-xs font-semibold cursor-pointer ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse shadow-md'
                : evaluation
                ? evaluation.score >= 80
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30'
                  : 'bg-amber-600/20 text-amber-300 border border-amber-500/40 hover:bg-amber-600/30'
                : 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30'
            }`}
            title="Prueba de fonética y pronunciación en voz alta"
          >
            <Mic className={`w-4 h-4 ${isListening ? 'animate-bounce' : ''}`} />
            <span className="hidden xs:inline">
              {isListening ? 'Grabando...' : evaluation ? `Fonética: ${evaluation.score}%` : 'Prueba de Fonética'}
            </span>
          </button>

          <div className="truncate text-xs text-slate-300">
            {evaluation ? (
              <span className="flex items-center gap-1.5 font-medium">
                {evaluation.score === 100 ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ¡100% Nativo!
                  </span>
                ) : evaluation.score >= 75 ? (
                  <span className="text-emerald-400">
                    {evaluation.perfectCount}/{evaluation.totalWords} palabras correctas
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {evaluation.totalWords - evaluation.perfectCount} palabra(s) a corregir
                  </span>
                )}
              </span>
            ) : (
              <span className="text-slate-400 text-[11px]">
                Habla por el micrófono y recibe corrección palabra por palabra
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handlePlayFullAudio}
            disabled={isPlayingFull}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
            title="Escuchar modelo nativo británico"
          >
            <Volume2 className={`w-4 h-4 ${isPlayingFull ? 'text-indigo-400 animate-pulse' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
            title={isOpen ? 'Plegar panel' : 'Desplegar prueba fonética'}
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Interactive Evaluation Body */}
      {isOpen && (
        <div className="p-4 pt-1 border-t border-slate-800/80 space-y-4">
          {/* Target phrase & Phonetic reference */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-indigo-400">
                Frase a pronunciar:
              </span>
              {phoneticGuide && (
                <span className="text-amber-400/90 font-mono text-[11px]">
                  Pron. Assimil: {phoneticGuide}
                </span>
              )}
            </div>
            <p className="text-sm sm:text-base font-bold text-white tracking-wide">
              {cleanTargetText}
            </p>
            {spanishTranslation && (
              <p className="text-xs text-slate-400 italic">
                {spanishTranslation}
              </p>
            )}
          </div>

          {/* Action: Record Button & Live Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20">
            <div className="flex items-center gap-3">
              {!isListening ? (
                <button
                  type="button"
                  onClick={handleStartSpeaking}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer transition-transform active:scale-95"
                >
                  <Mic className="w-4 h-4" />
                  <span>{evaluation ? 'Repetir y Hablar' : 'Decir en Voz Alta'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStopSpeaking}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg animate-pulse cursor-pointer"
                >
                  <MicOff className="w-4 h-4" />
                  <span>Detener y Analizar</span>
                </button>
              )}

              {isListening && (
                <div className="flex items-center gap-2 text-xs text-rose-300 font-medium animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span>Escuchando tu dicción... Habla ahora con naturalidad.</span>
                </div>
              )}

              {!isListening && !evaluation && (
                <span className="text-xs text-slate-400">
                  Haz clic en el micrófono y lee la frase en voz alta.
                </span>
              )}
            </div>

            {evaluation && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Puntuación:</span>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-black font-mono border ${
                  evaluation.score >= 85
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : evaluation.score >= 60
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}>
                  {evaluation.score}%
                </span>
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="text-rose-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Live transcript preview while speaking */}
          {isListening && liveTranscript && (
            <div className="p-3 rounded-xl bg-slate-950/90 border border-indigo-500/40 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                Audio reconocido en tiempo real:
              </span>
              <p className="text-xs sm:text-sm text-slate-200 font-mono italic">
                "{liveTranscript}"
              </p>
            </div>
          )}

          {/* WORD-BY-WORD PHONETIC BREAKDOWN */}
          {evaluation && (
            <div className="space-y-4">
              {/* Spoken sentence diagnosis */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">
                    Diagnóstico palabra por palabra:
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Toca cualquier palabra para escuchar su audio o ver consejos
                  </span>
                </div>

                {/* Word badges */}
                <div className="flex flex-wrap gap-2 p-3.5 rounded-xl bg-slate-950/90 border border-slate-800">
                  {evaluation.words.map((item, idx) => {
                    const isCorrect = item.status === 'correct';
                    const isSelected = selectedWordForDetails?.cleanWord === item.cleanWord;

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedWordForDetails(isSelected ? null : item);
                          handlePlayWordAudio(item.cleanWord);
                        }}
                        className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          isCorrect
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/40'
                            : item.status === 'mispronounced'
                            ? 'bg-rose-950/50 text-rose-300 border-rose-500/50 hover:bg-rose-900/50 ring-1 ring-rose-500/30'
                            : 'bg-amber-950/40 text-amber-300 border-amber-500/40 hover:bg-amber-900/40'
                        } ${isSelected ? 'ring-2 ring-indigo-400 scale-105' : ''}`}
                      >
                        <span>{item.word}</span>
                        {isCorrect ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        )}

                        {/* Speaker audio indicator */}
                        <Volume2 className={`w-3 h-3 text-slate-400 group-hover:text-white transition-opacity ${
                          playingWord === item.cleanWord ? 'text-indigo-400 animate-pulse' : 'opacity-60'
                        }`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* What the user said */}
              <div className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-slate-300">Lo que dijiste:</span>
                <span className="italic text-slate-300 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  "{evaluation.spokenTranscript || '(sin palabras reconocidas)'}"
                </span>
              </div>

              {/* Selected Word Detail Card / Correction Advice */}
              {selectedWordForDetails && (
                <div className={`p-4 rounded-xl border space-y-2.5 transition-all ${
                  selectedWordForDetails.status === 'correct'
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-rose-950/30 border-rose-500/40'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white">
                        {selectedWordForDetails.word}
                      </span>
                      {selectedWordForDetails.assimilPhonetic && (
                        <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {selectedWordForDetails.assimilPhonetic}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePlayWordAudio(selectedWordForDetails.cleanWord)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Escuchar palabra</span>
                    </button>
                  </div>

                  {selectedWordForDetails.status !== 'correct' && (
                    <div className="space-y-1 text-xs">
                      {selectedWordForDetails.spokenVariant && (
                        <p className="text-rose-300">
                          <strong className="text-white">Pronunciaste:</strong> "{selectedWordForDetails.spokenVariant}"
                        </p>
                      )}
                      <p className="text-slate-300 leading-relaxed">
                        <strong className="text-amber-300">Consejo fonético: </strong>
                        {selectedWordForDetails.phoneticTip}
                      </p>
                    </div>
                  )}

                  {selectedWordForDetails.status === 'correct' && (
                    <p className="text-xs text-emerald-300">
                      ¡Pronunciada correctamente con nitidez británica!
                    </p>
                  )}
                </div>
              )}

              {/* General feedback message */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-2">
                <p className="text-slate-200 leading-relaxed font-medium">
                  {evaluation.overallFeedback}
                </p>

                {evaluation.tipsForImprovement.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      Puntos clave a fijar:
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-slate-300">
                      {evaluation.tipsForImprovement.map((tip, idx) => (
                        <li key={idx} dangerouslySetInnerHTML={{ __html: tip.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* AI Coach Phonetics Advice (Deep Analysis) */}
              <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleRequestAiAdvice}
                  disabled={isLoadingAiFeedback}
                  className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>
                    {isLoadingAiFeedback ? 'Analizando con Tutor IA...' : 'Pedir consejo fonético detallado al Tutor IA'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleStartSpeaking}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Volver a intentar</span>
                </button>
              </div>

              {aiFeedback && (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/40 to-slate-900 border border-indigo-500/30 text-xs text-indigo-200 space-y-1.5 animate-in fade-in">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Consejo de Articulación del Tutor IA:</span>
                  </div>
                  <p className="leading-relaxed text-slate-200 pl-5">
                    {aiFeedback}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
