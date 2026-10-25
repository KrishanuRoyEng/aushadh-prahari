/**
 * speech.ts — Web Speech API wrapper
 *
 * Provides:
 * - readAloud(text, lang) — TTS via speechSynthesis
 * - startRecognition(lang, onResult, onError) — STT via SpeechRecognition
 * - hasVoiceForLang(lang) — check if device has a voice
 */

import { SPEECH_LANG, type Lang } from "./i18n";

// ─── TTS ──────────────────────────────────────────────────────────────────────

export function hasVoiceForLang(lang: Lang): boolean {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;
  const bcp47 = SPEECH_LANG[lang];
  const voices = window.speechSynthesis.getVoices();
  return voices.some(
    (v) => v.lang === bcp47 || v.lang.startsWith(bcp47.split("-")[0])
  );
}

export function readAloud(text: string, lang: Lang): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = SPEECH_LANG[lang];
  utter.rate = 0.9;
  utter.pitch = 1;

  // Try to find a voice for the language
  const voices = window.speechSynthesis.getVoices();
  const bcp47 = SPEECH_LANG[lang];
  const voice = voices.find((v) => v.lang === bcp47) ??
    voices.find((v) => v.lang.startsWith(bcp47.split("-")[0]));
  if (voice) utter.voice = voice;

  window.speechSynthesis.speak(utter);
}

export function stopReadAloud(): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

// ─── STT ──────────────────────────────────────────────────────────────────────

export interface RecognitionHandle {
  stop: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionClass = any;

function getSpeechRecognition(): SpeechRecognitionClass | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function startRecognition(
  lang: Lang,
  onResult: (transcript: string, isFinal: boolean) => void,
  onError: (err: string) => void,
  onEnd?: () => void
): RecognitionHandle | null {
  const SR = getSpeechRecognition();
  if (!SR) {
    onError("SpeechRecognition not supported on this device.");
    return null;
  }

  const recognition: SpeechRecognitionClass = new SR();
  recognition.lang = SPEECH_LANG[lang];
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  recognition.continuous = false;

  recognition.onresult = (event: SpeechRecognitionClass) => {
    const results = event.results;
    const last = results[results.length - 1];
    const transcript = last[0].transcript;
    const isFinal = last.isFinal;
    onResult(transcript, isFinal);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition.onerror = (event: any) => {
    onError(event.error ?? "Speech recognition error");
  };

  recognition.onend = () => {
    onEnd?.();
  };

  recognition.start();

  return {
    stop: () => {
      try {
        recognition.stop();
      } catch {
        // ignore
      }
    },
  };
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognition() !== null;
}
