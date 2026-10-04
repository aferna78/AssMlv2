import React from 'react';
import {
  Volume2,
  Check,
  Plus,
  Sparkles,
  ArrowRight,
  MessageSquare,
  HelpCircle,
  Lightbulb,
  BookmarkCheck,
  Mic,
  Send,
  Radio,
} from 'lucide-react';
import { ChatMessage, CEFRLevel } from '../types';
import { speakText, stopSpeaking } from '../utils/speech';

interface CoachMessageCardProps {
  message: ChatMessage;
  cefrLevel: CEFRLevel;
  voiceAccent: 'en-US' | 'en-GB';
  onAddToSRS?: (term: string, translation: string, contextSentence: string) => void;
  onApplySuggestion?: (text: string) => void;
  onOpenVoiceModal?: () => void;
  onSendMessage?: (text: string) => void;
}

export const CoachMessageCard: React.FC<CoachMessageCardProps> = ({
  message,
  cefrLevel,
  voiceAccent,
  onAddToSRS,
  onApplySuggestion,
  onOpenVoiceModal,
  onSendMessage,
}) => {
  const [playingId, setPlayingId] = React.useState<string | null>(null);
  const [addedTerms, setAddedTerms] = React.useState<Record<string, boolean>>({});

  const handlePlayAudio = async (text: string, id: string) => {
    try {
      if (playingId === id) {
        stopSpeaking();
        setPlayingId(null);
        return;
      }
      setPlayingId(id);
      await speakText(text, { lang: voiceAccent, rate: 0.92 });
      setPlayingId(null);
    } catch (err) {
      console.warn('Audio playback error:', err);
      setPlayingId(null);
    }
  };

  const handleSaveToSRS = (term: string, translation: string, sentence: string) => {
    if (onAddToSRS) {
      onAddToSRS(term, translation, sentence);
      setAddedTerms((prev) => ({ ...prev, [term]: true }));
    }
  };

  if (message.sender === 'user') {
    return (
      <div className="flex justify-end mb-6">
        <div className="max-w-2xl bg-indigo-600/20 border border-indigo-500/30 rounded-2xl rounded-tr-sm px-4 py-3 text-slate-100 shadow-md">
          <div className="flex items-center justify-between gap-3 mb-1 text-[11px] text-indigo-300 font-medium">
            <span>Tu respuesta</span>
            <span className="font-mono text-slate-400">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">{message.text}</p>
        </div>
      </div>
    );
  }

  const parsed = message.parsed;

  return (
    <div className="flex flex-col mb-8 max-w-3xl">
      {/* Coach Header banner */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
          <Sparkles className="w-4 h-4" />
        </div>
        <span className="text-xs font-bold text-slate-200">Master Language Coach</span>
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          Nivel {message.stateSnapshot?.cefrLevel || cefrLevel} &bull; Krashen i+1
        </span>
        <span className="text-[11px] text-slate-500 ml-auto font-mono">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Main Structured Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
        {/* 1. Feedback & Corrección Rápida */}
        {parsed ? (
          <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-900/40">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">🎯</span>
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-400">
                Feedback &amp; Corrección Rápida
              </h3>
            </div>

            <div className="space-y-2.5">
              {/* Tu frase */}
              <div className="rounded-xl bg-slate-950/60 border border-slate-800/70 p-3">
                <span className="text-[11px] font-bold text-slate-400 block mb-1">
                  Tu frase original:
                </span>
                <p className="text-xs sm:text-sm text-slate-300 italic font-mono bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                  "{parsed.userPhrase}"
                </p>
              </div>

              {/* Versión Natural */}
              <div className="rounded-xl bg-gradient-to-r from-emerald-950/40 to-slate-950/60 border border-emerald-500/30 p-3.5">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    Versión Natural (Inglés Nativo Estándar):
                  </span>
                  <button
                    onClick={() => handlePlayAudio(parsed.naturalPhrase, `nat-${message.id}`)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 text-[11px] font-medium transition-colors"
                    title="Escuchar pronunciación nativa"
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${playingId === `nat-${message.id}` ? 'animate-pulse text-emerald-200' : ''}`} />
                    <span>{playingId === `nat-${message.id}` ? 'Reproduciendo...' : 'Escuchar'}</span>
                  </button>
                </div>
                <p className="text-sm sm:text-base font-semibold text-emerald-200 tracking-wide">
                  {parsed.naturalPhrase}
                </p>
              </div>

              {/* Nota técnica */}
              {parsed.technicalNote && (
                <div className="flex items-start gap-2 pt-1 text-xs text-slate-300">
                  <span className="font-semibold text-indigo-400 shrink-0">Nota técnica:</span>
                  <p className="leading-relaxed text-slate-300">{parsed.technicalNote}</p>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* 2. Lección del Día */}
        {parsed ? (
          <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/30">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-base">📚</span>
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-indigo-400">
                Lección del Día: {parsed.lessonTitle}
              </h3>
            </div>

            {/* Explanation */}
            {parsed.lessonExplanation && (
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                {parsed.lessonExplanation}
              </p>
            )}

            {/* Examples list */}
            {parsed.examples && parsed.examples.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Modelos de Input Comprensible (i+1):
                </span>
                {parsed.examples.map((ex, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800/90 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-indigo-300">&bull;</span>
                        <p className="text-xs sm:text-sm font-medium text-slate-100">
                          {ex.english}
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-400 italic pl-3.5 mt-0.5">
                        &rarr; {ex.spanish}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 pl-3.5 sm:pl-0">
                      <button
                        onClick={() => handlePlayAudio(ex.english, `ex-${message.id}-${idx}`)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                        title="Escuchar frase"
                      >
                        <Volume2 className={`w-3.5 h-3.5 ${playingId === `ex-${message.id}-${idx}` ? 'text-indigo-400 animate-pulse' : ''}`} />
                      </button>

                      <button
                        onClick={() => handleSaveToSRS(ex.english, ex.spanish, ex.english)}
                        disabled={addedTerms[ex.english]}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                          addedTerms[ex.english]
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30'
                        }`}
                        title="Guardar en tu Mazo de Repetición Espaciada (SRS)"
                      >
                        {addedTerms[ex.english] ? (
                          <>
                            <BookmarkCheck className="w-3 h-3 text-emerald-400" />
                            <span>En mazo</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            <span>Al SRS</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {/* 3. Tu Turno (Ejercicio Activo) */}
        {parsed ? (
          <div className="p-4 sm:p-5 bg-gradient-to-b from-indigo-950/20 to-slate-950/70 border-t border-indigo-500/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">⚡</span>
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-300">
                Tu Turno (Ejercicio Activo)
              </h3>
              <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full ml-auto">
                Active Recall Obligatorio
              </span>
            </div>

            <div className="rounded-xl bg-slate-900/80 p-3.5 border border-indigo-500/30 mb-3 shadow-inner">
              <p className="text-xs sm:text-sm font-medium text-slate-100 leading-relaxed mb-3">
                {parsed.exercisePrompt}
              </p>

              {/* Action buttons directly on the exercise */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                {/* 1. Voice response button */}
                {onOpenVoiceModal && (
                  <button
                    onClick={onOpenVoiceModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer"
                    title="Abrir práctica de voz para responder oralmente"
                  >
                    <Mic className="w-3.5 h-3.5 text-rose-200 animate-pulse" />
                    <span>Responder Hablando</span>
                  </button>
                )}

                {/* 2. Audio button to listen to prompt */}
                <button
                  onClick={() => handlePlayAudio(parsed.exercisePrompt, `prompt-${message.id}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 text-xs font-medium border border-slate-700 transition-colors"
                  title="Escuchar la pronunciación de la pregunta en inglés británico"
                >
                  <Volume2 className={`w-3.5 h-3.5 text-indigo-400 ${playingId === `prompt-${message.id}` ? 'animate-pulse' : ''}`} />
                  <span>{playingId === `prompt-${message.id}` ? 'Escuchando...' : 'Escuchar pregunta (UK)'}</span>
                </button>
              </div>
            </div>

            {/* Quick response suggestions if provided */}
            {message.quickSuggestions && message.quickSuggestions.length > 0 && (
              <div className="mt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  💡 Ideas para responder (haz clic para insertar o enviar):
                </span>
                <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                  {message.quickSuggestions.map((sug, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1 bg-slate-800/90 border border-slate-700/80 rounded-lg p-1 text-xs text-slate-300"
                    >
                      <button
                        onClick={() => onApplySuggestion && onApplySuggestion(sug)}
                        className="text-left px-2 py-1 hover:text-white transition-colors flex-1"
                        title="Usar esta frase en el chat"
                      >
                        "{sug}"
                      </button>

                      {onSendMessage && (
                        <button
                          onClick={() => onSendMessage(sug)}
                          className="px-2 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600 hover:text-white text-indigo-300 font-semibold text-[10px] flex items-center gap-1 transition-colors"
                          title="Enviar esta respuesta directamente al Coach"
                        >
                          <Send className="w-2.5 h-2.5" />
                          <span>Enviar</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Render raw markdown if not structured */
          <div className="p-5 text-sm text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
};
