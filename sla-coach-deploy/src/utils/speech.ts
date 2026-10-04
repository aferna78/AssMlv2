/**
 * Speech utility for audio pronunciation (Web Speech API & Gemini Flash Lite TTS)
 * and Voice dictation (SpeechRecognition).
 */

export interface SpeechOptions {
  rate?: number;
  pitch?: number;
  lang?: 'en-US' | 'en-GB';
}

// Pre-load and cache voices
let cachedVoices: SpeechSynthesisVoice[] = [];
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  cachedVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

// Browser Web Speech API pronunciation
export function speakText(text: string, options: SpeechOptions = {}): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve();
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Clean text: strip markdown characters
    const cleanText = text
      .replace(/[#*`_>~]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      resolve();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const targetLang = options.lang || 'en-GB'; // Default: British English
    utterance.lang = targetLang;
    utterance.rate = options.rate || 0.92; // Slightly measured for pedagogical clarity
    utterance.pitch = options.pitch || 1.0;

    // Pick best English voice prioritizing British English (Received Pronunciation)
    const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
    let bestVoice: SpeechSynthesisVoice | null | undefined = null;

    if (targetLang === 'en-GB') {
      bestVoice =
        voices.find(
          (v) =>
            (v.lang === 'en-GB' || v.lang === 'en_GB') &&
            (v.name.includes('Daniel') ||
             v.name.includes('Oliver') ||
             v.name.includes('George') ||
             v.name.includes('Serena') ||
             v.name.includes('Stephanie') ||
             v.name.includes('Google UK English') ||
             v.name.includes('Hazel') ||
             v.name.includes('Arthur') ||
             v.name.includes('Fiona') ||
             v.name.includes('Kate') ||
             v.name.includes('Natural'))
        ) ||
        voices.find((v) => v.lang === 'en-GB' || v.lang === 'en_GB') ||
        voices.find((v) => v.lang.startsWith('en') && (v.name.includes('UK') || v.name.includes('British') || v.name.includes('Great Britain')));
    } else {
      bestVoice =
        voices.find(
          (v) =>
            (v.lang === 'en-US' || v.lang === 'en_US') &&
            (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Jenny'))
        ) || voices.find((v) => v.lang === 'en-US' || v.lang === 'en_US');
    }

    if (!bestVoice) {
      bestVoice = voices.find((v) => v.lang.startsWith('en')) || null;
    }

    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = () => {
      resolve();
    };

    window.speechSynthesis.speak(utterance);
  });
}

// Stop any currently playing speech
export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

// Speech Recognition & Audio Recording Service (Dual-Engine)
export interface SpeechRecognitionResultState {
  transcript: string;
  isFinal: boolean;
}

export type VoiceStatus = 'idle' | 'requesting_permission' | 'listening' | 'transcribing' | 'error';

export class VoiceDictationService {
  private activeRecognition: any = null;
  private activeMediaRecorder: MediaRecorder | null = null;
  private activeStream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  public isListening: boolean = false;

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const hasSpeechRecognition = Boolean(
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    );
    const hasMediaRecorder = Boolean(
      window.MediaRecorder && navigator.mediaDevices?.getUserMedia
    );
    return hasSpeechRecognition || hasMediaRecorder;
  }

  public async startListening(
    onResult: (state: SpeechRecognitionResultState) => void,
    onError: (errMsg: string) => void,
    onEnd: () => void,
    onStatusChange?: (status: VoiceStatus) => void,
    lang: 'en-GB' | 'en-US' = 'en-GB'
  ) {
    if (this.isListening) {
      this.stopListening();
    }

    if (onStatusChange) onStatusChange('requesting_permission');

    // 1. First ensure microphone permission is granted via getUserMedia
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        this.activeStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (permErr: any) {
      if (onStatusChange) onStatusChange('error');
      const isDenied = permErr?.name === 'NotAllowedError' || permErr?.name === 'PermissionDeniedError';
      onError(
        isDenied
          ? 'El acceso al micrófono fue denegado. Permite el micrófono en la barra de tu navegador para hablar con el Coach.'
          : 'No se pudo acceder al micrófono del dispositivo.'
      );
      this.isListening = false;
      onEnd();
      return;
    }

    this.isListening = true;
    if (onStatusChange) onStatusChange('listening');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    // 2. Try native Web Speech Recognition first for instant streaming
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true; // Keep listening continuously until stopped
        recognition.interimResults = true;
        recognition.lang = lang || 'en-GB'; // British English by default
        this.activeRecognition = recognition;

        recognition.onresult = (event: any) => {
          let fullTranscript = '';
          let isFinal = false;

          for (let i = 0; i < event.results.length; ++i) {
            const item = event.results[i][0];
            if (item && item.transcript) {
              const chunk = item.transcript.trim();
              if (chunk) {
                fullTranscript += (fullTranscript ? ' ' : '') + chunk;
              }
            }
            if (event.results[i].isFinal) {
              isFinal = true;
            }
          }

          onResult({
            transcript: fullTranscript.trim(),
            isFinal,
          });
        };

        recognition.onerror = async (event: any) => {
          // If speech recognition had an issue other than manual abort, fallback to MediaRecorder if available
          if (event.error === 'not-allowed') {
            onError('Permiso de micrófono bloqueado. Habilita el acceso en tu navegador.');
            this.stopListening();
            onEnd();
          } else if (event.error !== 'aborted') {
            // Silently try MediaRecorder fallback
            if (this.activeStream && window.MediaRecorder && !this.activeMediaRecorder) {
              this.startMediaRecorderFallback(onResult, onError, onEnd, onStatusChange);
            }
          }
        };

        recognition.onend = () => {
          this.cleanupStream();
          this.isListening = false;
          if (onStatusChange) onStatusChange('idle');
          onEnd();
        };

        recognition.start();
        return;
      } catch {
        // Fall through to MediaRecorder fallback
      }
    }

    // 3. Fallback to MediaRecorder + Server Transcription
    this.startMediaRecorderFallback(onResult, onError, onEnd, onStatusChange);
  }

  private startMediaRecorderFallback(
    onResult: (state: SpeechRecognitionResultState) => void,
    onError: (errMsg: string) => void,
    onEnd: () => void,
    onStatusChange?: (status: VoiceStatus) => void
  ) {
    if (!this.activeStream || !window.MediaRecorder) {
      this.isListening = false;
      if (onStatusChange) onStatusChange('idle');
      onError('El reconocimiento de voz no está soportado en este navegador.');
      onEnd();
      return;
    }

    try {
      this.audioChunks = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/wav';

      const mediaRecorder = new MediaRecorder(this.activeStream, { mimeType });
      this.activeMediaRecorder = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (this.audioChunks.length === 0) {
          this.cleanupStream();
          this.isListening = false;
          if (onStatusChange) onStatusChange('idle');
          onEnd();
          return;
        }

        if (onStatusChange) onStatusChange('transcribing');

        try {
          const audioBlob = new Blob(this.audioChunks, { type: mimeType });
          const base64Audio = await this.blobToBase64(audioBlob);

          const res = await fetch('/api/coach/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64: base64Audio,
              mimeType,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.text) {
              onResult({ transcript: data.text, isFinal: true });
            }
          }
        } catch {
          // Graceful end
        } finally {
          this.cleanupStream();
          this.isListening = false;
          if (onStatusChange) onStatusChange('idle');
          onEnd();
        }
      };

      mediaRecorder.start(250); // collect every 250ms
    } catch {
      this.cleanupStream();
      this.isListening = false;
      if (onStatusChange) onStatusChange('idle');
      onEnd();
    }
  }

  public stopListening() {
    this.isListening = false;

    if (this.activeRecognition) {
      try {
        this.activeRecognition.stop();
      } catch {
        // Ignore
      }
      this.activeRecognition = null;
    }

    if (this.activeMediaRecorder && this.activeMediaRecorder.state !== 'inactive') {
      try {
        this.activeMediaRecorder.stop();
      } catch {
        // Ignore
      }
      this.activeMediaRecorder = null;
    }

    this.cleanupStream();
  }

  private cleanupStream() {
    if (this.activeStream) {
      try {
        this.activeStream.getTracks().forEach((track) => track.stop());
      } catch {
        // Ignore
      }
      this.activeStream = null;
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

export const voiceDictation = new VoiceDictationService();
