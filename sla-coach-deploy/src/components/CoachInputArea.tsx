import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Sparkles,
  HelpCircle,
  Briefcase,
  Plane,
  Compass,
  Repeat,
  Loader2,
  AlertCircle,
  Radio,
} from 'lucide-react';
import { CEFRLevel, SystemState } from '../types';
import { voiceDictation, VoiceStatus } from '../utils/speech';

interface CoachInputAreaProps {
  onSendMessage: (text: string, customTopic?: string) => void;
  isLoading: boolean;
  systemState: SystemState;
  suggestedInput?: string;
  onClearSuggested?: () => void;
  onOpenVoiceModal?: () => void;
  voiceAccent?: 'en-US' | 'en-GB';
}

export const CoachInputArea: React.FC<CoachInputAreaProps> = ({
  onSendMessage,
  isLoading,
  systemState,
  suggestedInput,
  onClearSuggested,
  onOpenVoiceModal,
  voiceAccent = 'en-GB',
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('idle');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [autoSendVoice, setAutoSendVoice] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialTextRef = useRef<string>('');
  const latestTextRef = useRef<string>('');
  const autoSendTimerRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    latestTextRef.current = inputText;
  }, [inputText]);

  useEffect(() => {
    if (suggestedInput) {
      setInputText(suggestedInput);
      latestTextRef.current = suggestedInput;
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
      if (onClearSuggested) {
        onClearSuggested();
      }
    }
  }, [suggestedInput, onClearSuggested]);

  const clearAutoSendTimers = () => {
    if (autoSendTimerRef.current) {
      clearTimeout(autoSendTimerRef.current);
      autoSendTimerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setCountdown(null);
  };

  const handleSend = () => {
    clearAutoSendTimers();
    const textToSend = (
      inputText ||
      textareaRef.current?.value ||
      latestTextRef.current ||
      ''
    ).trim();

    if (!textToSend || isLoading) return;

    if (isListening) {
      voiceDictation.stopListening();
      setIsListening(false);
    }
    onSendMessage(textToSend);
    setInputText('');
    latestTextRef.current = '';
    initialTextRef.current = '';
    if (textareaRef.current) {
      textareaRef.current.value = '';
    }
    setVoiceError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const triggerAutoSendAfterSpeech = () => {
    if (!autoSendVoice || isLoading) return;
    const text = latestTextRef.current.trim();
    if (text.length < 2) return;

    clearAutoSendTimers();
    let sec = 2;
    setCountdown(sec);

    intervalRef.current = setInterval(() => {
      sec -= 1;
      if (sec <= 0) {
        clearAutoSendTimers();
        handleSend();
      } else {
        setCountdown(sec);
      }
    }, 1000);
  };

  const toggleListening = () => {
    setVoiceError(null);
    clearAutoSendTimers();

    if (isListening) {
      voiceDictation.stopListening();
      setIsListening(false);
      setVoiceStatus('idle');
      initialTextRef.current = '';

      // If user stopped dictating and text is present, trigger send
      if (latestTextRef.current.trim().length > 2) {
        triggerAutoSendAfterSpeech();
      }
    } else {
      // Save text already in the input area once before listening starts
      initialTextRef.current = inputText.trim();
      setIsListening(true);
      voiceDictation.startListening(
        (result) => {
          const cleanSpeech = result.transcript.trim();
          if (!cleanSpeech) return;

          let full = '';
          if (initialTextRef.current) {
            full = `${initialTextRef.current} ${cleanSpeech}`;
          } else {
            full = cleanSpeech;
          }
          setInputText(full);
          latestTextRef.current = full;
        },
        (err) => {
          setVoiceError(err);
          setIsListening(false);
          setVoiceStatus('error');
          initialTextRef.current = '';
        },
        () => {
          setIsListening(false);
          setVoiceStatus('idle');
          initialTextRef.current = '';
          if (latestTextRef.current.trim().length > 2) {
            triggerAutoSendAfterSpeech();
          }
        },
        (status) => {
          setVoiceStatus(status);
          setIsListening(status === 'listening');
        },
        voiceAccent || 'en-GB'
      );
    }
  };

  const handleQuickTopic = (topic: string, promptText: string) => {
    onSendMessage(promptText, topic);
  };

  const getScaffoldingBadge = (level: CEFRLevel) => {
    switch (level) {
      case 'A1':
      case 'A2':
        return { text: '80% Español / 20% Inglés', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
      case 'B1':
      case 'B2':
        return { text: '30% Español / 70% Inglés', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' };
      case 'C1':
      case 'C2':
        return { text: '100% Inglés (Full Immersion)', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    }
  };

  const scaffolding = getScaffoldingBadge(systemState.cefrLevel);

  return (
    <div className="sticky bottom-0 z-30 bg-slate-950/95 border-t border-slate-800/90 pt-3 pb-4 backdrop-blur-xl">
      <div className="max-w-3xl mx-auto px-4">
        {/* Scenarios / Quick topic prompt chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 shrink-0">
            Práctica rápida:
          </span>

          {/* Quick interactive voice practice button */}
          {onOpenVoiceModal && (
            <button
              onClick={onOpenVoiceModal}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600/30 to-rose-600/30 border border-indigo-500/40 text-indigo-200 hover:text-white shrink-0 transition-all font-semibold text-[11px] shadow-sm hover:border-indigo-400"
            >
              <Radio className="w-3 h-3 text-rose-400 animate-pulse" />
              <span>Modo Voz en Vivo</span>
            </button>
          )}

          <button
            onClick={() =>
              handleQuickTopic(
                'Phrasal Verbs Comunes',
                'Quiero practicar phrasal verbs esenciales con un ejercicio de rellenar huecos o traducción.'
              )
            }
            disabled={isLoading}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:border-indigo-500 hover:text-white shrink-0 transition-colors disabled:opacity-50 text-[11px]"
          >
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>Phrasal Verbs</span>
          </button>

          <button
            onClick={() =>
              handleQuickTopic(
                'Roleplay: Entrevista de Trabajo',
                "Let's simulate a job interview in English. Ask me a common behavioural question."
              )
            }
            disabled={isLoading}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:border-indigo-500 hover:text-white shrink-0 transition-colors disabled:opacity-50 text-[11px]"
          >
            <Briefcase className="w-3 h-3 text-emerald-400" />
            <span>Entrevista de Trabajo</span>
          </button>

          <button
            onClick={() =>
              handleQuickTopic(
                'Viaje & Inmersión en Aeropuerto',
                "Let's roleplay arriving at airport customs and immigration. Start the dialogue."
              )
            }
            disabled={isLoading}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:border-indigo-500 hover:text-white shrink-0 transition-colors disabled:opacity-50 text-[11px]"
          >
            <Plane className="w-3 h-3 text-cyan-400" />
            <span>Viajes & Aeropuerto</span>
          </button>

          <button
            onClick={() =>
              handleQuickTopic(
                'Argumentación & Conectores',
                'Quiero practicar cómo expresar mi opinión usando conectores lógicos más sofisticados.'
              )
            }
            disabled={isLoading}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:border-indigo-500 hover:text-white shrink-0 transition-colors disabled:opacity-50 text-[11px]"
          >
            <Compass className="w-3 h-3 text-purple-400" />
            <span>Debate & Opinión</span>
          </button>
        </div>

        {/* Microphone permission or error banner if any */}
        {voiceError && (
          <div className="mb-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{voiceError}</span>
            </div>
            <button
              onClick={() => setVoiceError(null)}
              className="text-xs text-rose-400 hover:text-rose-200 font-semibold underline shrink-0"
            >
              Entendido
            </button>
          </div>
        )}

        {/* Auto-send countdown banner */}
        {countdown !== null && (
          <div className="mb-2 p-2.5 rounded-xl bg-indigo-600/25 border border-indigo-500/50 flex items-center justify-between text-xs text-indigo-200 animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
              <span>¡Frase capturada! Enviando al Coach en <strong>{countdown}s</strong>...</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSend}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
              >
                Enviar Ya ➔
              </button>
              <button
                type="button"
                onClick={clearAutoSendTimers}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              >
                Pausar
              </button>
            </div>
          </div>
        )}

        {/* Helper prompt when phrase is typed or spoken but not yet sent */}
        {countdown === null && !isListening && inputText.trim().length > 0 && (
          <div className="mb-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-indigo-500/30 text-indigo-200 text-xs flex items-center justify-between shadow-sm animate-in fade-in">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Frase lista: Haz clic en <strong>"Enviar"</strong> o pulsa <strong>Enter</strong> para recibir evaluación y avanzar.</span>
            </span>
            <button
              type="button"
              onClick={handleSend}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1 shrink-0 ml-2"
            >
              <span>Enviar ➔</span>
            </button>
          </div>
        )}

        {/* Input box */}
        <div className={`relative rounded-2xl bg-slate-900/90 border transition-all shadow-xl ${
          isListening ? 'border-rose-500/80 ring-2 ring-rose-500/20' : 'border-slate-800 focus-within:border-indigo-500'
        }`}>
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={
              isListening
                ? (voiceAccent === 'en-GB' ? '🎙️ Escuchando en Inglés Británico (UK)... Habla con naturalidad...' : '🎙️ Escuchando tu voz... Habla en inglés ahora...')
                : systemState.cefrLevel === 'C1' || systemState.cefrLevel === 'C2'
                ? 'Respond in English (UK Standard) to complete your active recall task...'
                : 'Escribe tu respuesta o pulsa el micrófono para hablar en inglés británico...'
            }
            rows={2}
            className="w-full bg-transparent px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none leading-relaxed"
          />

          <div className="flex items-center justify-between px-3 py-2 border-t border-slate-800/80 bg-slate-950/40 rounded-b-2xl">
            {/* Scaffolding level indicator or live listening status */}
            <div className="flex items-center gap-2">
              {isListening ? (
                <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Escuchando ({voiceAccent === 'en-GB' ? '🇬🇧 UK' : '🇺🇸 US'})... Pulsa 'Detener' al finalizar</span>
                </div>
              ) : voiceStatus === 'requesting_permission' ? (
                <span className="text-xs text-indigo-400 font-medium animate-pulse">
                  Solicitando permiso de micrófono...
                </span>
              ) : voiceStatus === 'transcribing' ? (
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Transcribiendo audio ({voiceAccent === 'en-GB' ? 'UK' : 'US'})...</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${scaffolding.color}`}>
                    Nivel {systemState.cefrLevel} &bull; {scaffolding.text}
                  </span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hidden sm:inline-flex items-center gap-1">
                    <span>{voiceAccent === 'en-GB' ? '🇬🇧 UK Standard' : '🇺🇸 US Standard'}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1.5">
              {/* Voice button to speak with the app */}
              <button
                type="button"
                onClick={toggleListening}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  isListening
                    ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30 animate-pulse'
                    : voiceStatus === 'transcribing'
                    ? 'bg-amber-600 text-white border-amber-500 animate-pulse'
                    : 'bg-slate-800 text-slate-200 border-slate-700 hover:text-white hover:bg-slate-700 hover:border-slate-600'
                }`}
                title={isListening ? 'Detener dictado y procesar' : 'Hablar en inglés británico (Dictado por voz)'}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-3.5 h-3.5 text-white" />
                    <span>Detener</span>
                  </>
                ) : voiceStatus === 'transcribing' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Hablar</span>
                    <span className="text-[10px] text-indigo-300 font-mono opacity-80">{voiceAccent === 'en-GB' ? '🇬🇧' : '🇺🇸'}</span>
                  </>
                )}
              </button>

              {/* Submit button */}
              <button
                type="button"
                onClick={handleSend}
                disabled={(!inputText.trim() && !textareaRef.current?.value?.trim()) || isLoading}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/30 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analizando...</span>
                  </>
                ) : (
                  <>
                    <span>Enviar</span>
                    <Send className="w-3 h-3" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-slate-500 text-center mt-2">
          Pulsa <strong>"Hablar"</strong> para dictar tu respuesta por voz o <strong>"Modo Voz en Vivo"</strong> para una sesión oral guiada.
        </p>
      </div>
    </div>
  );
};

