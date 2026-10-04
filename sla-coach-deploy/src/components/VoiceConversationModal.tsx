import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Check,
  ArrowRight,
  RotateCcw,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { CEFRLevel, SystemState, ParsedCoachResponse } from '../types';
import { voiceDictation, VoiceStatus, speakText, stopSpeaking } from '../utils/speech';

interface VoiceConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemState: SystemState;
  voiceAccent: 'en-US' | 'en-GB';
  onSendMessage: (text: string) => Promise<void>;
  latestCoachParsed?: ParsedCoachResponse;
  latestCoachText?: string;
  isLoading: boolean;
}

export const VoiceConversationModal: React.FC<VoiceConversationModalProps> = ({
  isOpen,
  onClose,
  systemState,
  voiceAccent,
  onSendMessage,
  latestCoachParsed,
  latestCoachText,
  isLoading,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [autoSpeakResponse, setAutoSpeakResponse] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [handsFreeMode, setHandsFreeMode] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);

  const silenceTimerRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');
  const prevParsedRef = useRef<ParsedCoachResponse | undefined>(undefined);

  // Keep transcriptRef synchronized
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Clear timers
  const clearAutoSendTimers = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdown(null);
  };

  const handleSendSpokenPhrase = async () => {
    const textToSend = transcriptRef.current.trim();
    if (!textToSend || isLoading) return;

    clearAutoSendTimers();
    voiceDictation.stopListening();
    setIsListening(false);
    setTranscript('');
    transcriptRef.current = '';

    await onSendMessage(textToSend);
  };

  // Start auto-send countdown after speech pause
  const triggerAutoSendCountdown = () => {
    if (!handsFreeMode || isLoading) return;
    clearAutoSendTimers();

    let seconds = 2;
    setCountdown(seconds);

    countdownIntervalRef.current = setInterval(() => {
      seconds -= 1;
      if (seconds <= 0) {
        clearAutoSendTimers();
        handleSendSpokenPhrase();
      } else {
        setCountdown(seconds);
      }
    }, 1000);
  };

  // Handle incoming speech tokens
  const handleTranscriptResult = (text: string) => {
    const clean = text.trim();
    setTranscript(clean);
    transcriptRef.current = clean;

    if (handsFreeMode && clean.length > 2) {
      // Clear previous silence timer and reset
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        setCountdown(null);
      }

      // If user pauses for 2 seconds, begin send countdown
      silenceTimerRef.current = setTimeout(() => {
        triggerAutoSendCountdown();
      }, 2000);
    }
  };

  const startListeningSession = () => {
    setPermissionError(null);
    clearAutoSendTimers();
    stopSpeaking();
    setIsPlayingAudio(false);

    voiceDictation.startListening(
      (result) => {
        handleTranscriptResult(result.transcript);
      },
      (err) => {
        setPermissionError(err);
        setIsListening(false);
        setVoiceStatus('error');
      },
      () => {
        setIsListening(false);
        setVoiceStatus('idle');
        // If recognition naturally ends and we have words, trigger auto-send
        if (handsFreeMode && transcriptRef.current.trim().length > 2) {
          triggerAutoSendCountdown();
        }
      },
      (status) => {
        setVoiceStatus(status);
        setIsListening(status === 'listening');
      },
      voiceAccent || 'en-GB'
    );
  };

  const handleToggleListening = () => {
    if (isListening) {
      voiceDictation.stopListening();
      setIsListening(false);
      setVoiceStatus('idle');
      // If user clicked Detener while transcript has content, prompt or auto-send
      if (transcript.trim().length > 2) {
        triggerAutoSendCountdown();
      }
    } else {
      startListeningSession();
    }
  };

  // Auto-speak latest coach response and optionally re-enable mic for continuous practice
  useEffect(() => {
    if (isOpen && latestCoachParsed && latestCoachParsed !== prevParsedRef.current) {
      prevParsedRef.current = latestCoachParsed;
      clearAutoSendTimers();
      setTranscript('');

      if (autoSpeakResponse) {
        const textToSpeak = `${latestCoachParsed.naturalPhrase}. ${latestCoachParsed.exercisePrompt}`;
        setIsPlayingAudio(true);
        speakText(textToSpeak, { lang: voiceAccent, rate: 0.95 }).finally(() => {
          setIsPlayingAudio(false);
          // If in hands-free mode, start listening immediately for user's turn!
          if (handsFreeMode && isOpen) {
            setTimeout(() => {
              startListeningSession();
            }, 600);
          }
        });
      } else if (handsFreeMode) {
        setTimeout(() => {
          startListeningSession();
        }, 600);
      }
    }
  }, [isOpen, latestCoachParsed, autoSpeakResponse, voiceAccent, handsFreeMode]);

  // Global Enter key listener inside modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && transcriptRef.current.trim() && !isLoading) {
        e.preventDefault();
        handleSendSpokenPhrase();
      } else if (e.key === 'Escape') {
        clearAutoSendTimers();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading]);

  // Clean up on unmount or close
  useEffect(() => {
    if (!isOpen) {
      clearAutoSendTimers();
      voiceDictation.stopListening();
      setIsListening(false);
      stopSpeaking();
      setIsPlayingAudio(false);
      setTranscript('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePlayCoachAudio = () => {
    if (isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
    } else if (latestCoachParsed) {
      setIsPlayingAudio(true);
      const text = `${latestCoachParsed.naturalPhrase}. ${latestCoachParsed.exercisePrompt}`;
      speakText(text, { lang: voiceAccent, rate: 0.95 }).finally(() => {
        setIsPlayingAudio(false);
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl flex flex-col relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Mic className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Modo Práctica Oral con el Coach
                </h2>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  En Vivo
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Nivel {systemState.cefrLevel} &bull; Acento: {voiceAccent === 'en-US' ? 'US (American)' : 'UK (British)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Hands-Free Auto-Send Toggle */}
            <button
              onClick={() => setHandsFreeMode(!handsFreeMode)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                handsFreeMode
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title={handsFreeMode ? 'Modo Manos Libres activo: se envía automáticamente al terminar de hablar' : 'Modo Manual: pulsa el botón para enviar'}
            >
              <span className={`w-2 h-2 rounded-full ${handsFreeMode ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span className="hidden sm:inline">Auto-enviar:</span>
              <span>{handsFreeMode ? 'Activado' : 'Manual'}</span>
            </button>

            <button
              onClick={() => setAutoSpeakResponse(!autoSpeakResponse)}
              className={`p-2 rounded-xl border text-xs transition-colors ${
                autoSpeakResponse
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title={autoSpeakResponse ? 'Voz automática del coach activada' : 'Voz automática desactivada'}
            >
              {autoSpeakResponse ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Coach Latest Prompt / Feedback Section */}
        {latestCoachParsed && (
          <div className="mb-6 rounded-2xl bg-slate-950/70 border border-slate-800/90 p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Coach SLA &bull; Tu Turno:</span>
              </span>
              <button
                onClick={handlePlayCoachAudio}
                className="flex items-center gap-1 text-[11px] text-indigo-300 hover:text-indigo-200 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md"
              >
                <Volume2 className={`w-3.5 h-3.5 ${isPlayingAudio ? 'animate-pulse text-indigo-400' : ''}`} />
                <span>{isPlayingAudio ? 'Reproduciendo...' : 'Escuchar Coach (UK)'}</span>
              </button>
            </div>

            <p className="text-sm sm:text-base font-semibold text-slate-100 mb-2 leading-relaxed">
              "{latestCoachParsed.exercisePrompt}"
            </p>

            {latestCoachParsed.naturalPhrase && (
              <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400 flex items-start gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-emerald-300">Versión natural previa:</strong> {latestCoachParsed.naturalPhrase}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Countdown Banner if auto-send is triggered */}
        {countdown !== null && (
          <div className="mb-4 p-3 rounded-2xl bg-indigo-600/20 border border-indigo-500/60 flex items-center justify-between gap-3 text-xs text-indigo-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-indigo-500 text-white font-bold flex items-center justify-center text-sm shadow-md animate-bounce">
                {countdown}
              </div>
              <div>
                <p className="font-bold text-white">¡Frase capturada! Enviando al Coach...</p>
                <p className="text-[11px] text-indigo-300">El Coach te evaluará y avanzará de ejercicio en {countdown} segundos</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSendSpokenPhrase}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                Enviar Ya ➔
              </button>
              <button
                onClick={clearAutoSendTimers}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
              >
                Pausar
              </button>
            </div>
          </div>
        )}

        {/* Central Orb / Voice Recording Visualizer */}
        <div className="my-5 flex flex-col items-center justify-center text-center">
          <div className="relative mb-4">
            {/* Outer animated pulse rings when listening */}
            {isListening && (
              <>
                <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping" />
                <div className="absolute -inset-3 rounded-full bg-rose-500/10 animate-pulse" />
              </>
            )}

            <button
              onClick={handleToggleListening}
              disabled={isLoading}
              className={`relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center transition-all shadow-2xl cursor-pointer active:scale-95 ${
                isListening
                  ? 'bg-gradient-to-tr from-rose-600 to-rose-500 text-white ring-4 ring-rose-500/40 shadow-rose-600/50'
                  : voiceStatus === 'transcribing'
                  ? 'bg-amber-600 text-white ring-4 ring-amber-500/40 animate-pulse'
                  : 'bg-gradient-to-tr from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-indigo-600/40'
              }`}
            >
              {isListening ? (
                <>
                  <Mic className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse mb-1" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Detener</span>
                </>
              ) : voiceStatus === 'transcribing' ? (
                <>
                  <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin mb-1" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Procesando</span>
                </>
              ) : (
                <>
                  <Mic className="w-8 h-8 sm:w-10 sm:h-10 mb-1" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Pulsar para hablar</span>
                </>
              )}
            </button>
          </div>

          {/* Status badge */}
          <div>
            {isListening ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Escuchando tu voz... Lee o di tu frase en inglés (UK)</span>
              </div>
            ) : voiceStatus === 'requesting_permission' ? (
              <span className="text-xs text-indigo-400 font-medium animate-pulse">
                Solicitando acceso al micrófono...
              </span>
            ) : voiceStatus === 'transcribing' ? (
              <span className="text-xs text-amber-400 font-medium">
                Transcribiendo audio con alta fidelidad...
              </span>
            ) : (
              <span className="text-xs text-slate-400">
                Presiona el botón para hablar. Al terminar de leer la frase, el Coach responderá automáticamente.
              </span>
            )}
          </div>

          {/* Permission error banner */}
          {permissionError && (
            <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2 text-left max-w-md">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div>
                <p className="font-semibold mb-0.5">Acceso al micrófono requerido</p>
                <p className="opacity-90">{permissionError}</p>
                <p className="text-[11px] opacity-75 mt-1">
                  En Chrome o Edge: Haz clic en el icono del candado o cámara/micrófono en la barra de direcciones y cambia a "Permitir".
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Live Transcript Display */}
        <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Tu respuesta oral capturada:
            </span>
            {transcript && (
              <button
                onClick={() => {
                  clearAutoSendTimers();
                  setTranscript('');
                }}
                className="text-[11px] text-slate-500 hover:text-slate-300"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="min-h-[56px] flex flex-col justify-center">
            {transcript ? (
              <div>
                <p className="text-sm sm:text-base font-semibold text-slate-100 leading-relaxed italic">
                  "{transcript}"
                </p>

                {/* Big glowing button to immediately send and advance */}
                <button
                  type="button"
                  onClick={handleSendSpokenPhrase}
                  disabled={isLoading}
                  className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-indigo-600 to-indigo-500 hover:from-emerald-500 hover:to-indigo-400 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/40 transition-all active:scale-98 cursor-pointer border border-emerald-400/30 animate-pulse"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Coach evaluando y preparando el siguiente ejercicio...</span>
                    </>
                  ) : (
                    <>
                      <span>⚡ Enviar frase al Coach y avanzar al siguiente ejercicio (Enter)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                {isListening ? '🎙️ Escuchando... Las palabras que digas aparecerán aquí en vivo.' : 'Aún no has hablado. Presiona el botón del micrófono o habla para comenzar.'}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Volver al chat
          </button>

          <button
            type="button"
            onClick={handleSendSpokenPhrase}
            disabled={!transcript.trim() || isLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Coach evaluando tu inglés...</span>
              </>
            ) : (
              <>
                <span>Enviar mi respuesta oral</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
