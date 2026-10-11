// Modern Speech Synthesis and Voice Recognition Service for My Week AI Coach & Language Practice

export interface SpeechOptions {
  voice?: string; // Gemini TTS voice: 'Kore', 'Puck', 'Zephyr', 'Fenrir', 'Charon'
  langCode?: string; // e.g. 'es-ES', 'fr-FR', 'en-US'
  rate?: number; // 0.75 to 1.2
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

// Global active audio reference to allow instant cancellation/stopping
let currentAudioElement: HTMLAudioElement | null = null;
let currentAudioUrl: string | null = null;
let isCurrentlySpeaking = false;

export function stopSpeaking(): void {
  isCurrentlySpeaking = false;
  if (currentAudioElement) {
    try {
      currentAudioElement.pause();
      currentAudioElement.currentTime = 0;
    } catch {
      // ignore
    }
    currentAudioElement = null;
  }
  if (currentAudioUrl) {
    try {
      URL.revokeObjectURL(currentAudioUrl);
    } catch {
      // ignore
    }
    currentAudioUrl = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

export function isSpeaking(): boolean {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
    return true;
  }
  return isCurrentlySpeaking;
}

// Convert raw 16-bit PCM byte stream to a playable WAV Blob
function pcm16ToWavBlob(pcmData: Uint8Array, sampleRate = 24000, numChannels = 1): Blob {
  const byteRate = sampleRate * numChannels * 2;
  const blockAlign = numChannels * 2;
  const dataSize = pcmData.byteLength;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF chunk descriptor
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');

  // fmt sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // 16 bits per sample

  // data sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // write PCM samples
  new Uint8Array(buffer, 44).set(pcmData);

  return new Blob([buffer], { type: 'audio/wav' });
}

// Sanitize text for clean voice narration (strip markdown, links, symbols)
export function sanitizeTextForSpeech(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/[*_~`#>-]/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Speaks text using Gemini TTS backend (/api/tts).
 * Automatically falls back gracefully to browser SpeechSynthesis if offline,
 * if rate limit is reached, or if unsupported.
 */
export async function speakText(text: string, options: SpeechOptions = {}): Promise<void> {
  const {
    voice = 'Kore',
    langCode = 'en-US',
    rate = 1.0,
    onStart,
    onEnd,
    onError,
  } = options;

  stopSpeaking();

  const cleanText = sanitizeTextForSpeech(text);
  if (!cleanText) {
    onEnd?.();
    return;
  }

  isCurrentlySpeaking = true;

  // Fallback to browser SpeechSynthesis
  const speakWithBrowserSynthesis = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      isCurrentlySpeaking = false;
      onEnd?.();
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = rate;

      // Select voice matching language if available
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const langPrefix = langCode.split('-')[0].toLowerCase();
        const matchedVoice =
          voices.find((v) => v.lang.toLowerCase() === langCode.toLowerCase()) ||
          voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix));
        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }
      }

      utterance.lang = langCode;

      utterance.onstart = () => {
        isCurrentlySpeaking = true;
        onStart?.();
      };

      utterance.onend = () => {
        isCurrentlySpeaking = false;
        onEnd?.();
      };

      utterance.onerror = (e) => {
        isCurrentlySpeaking = false;
        onError?.(e);
      };

      window.speechSynthesis.speak(utterance);
    } catch (synthErr) {
      isCurrentlySpeaking = false;
      onError?.(synthErr);
      onEnd?.();
    }
  };

  try {
    // Attempt high-fidelity Gemini TTS
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: cleanText.slice(0, 1500),
        voice,
      }),
    });

    if (!res.ok) {
      // Fallback to browser synthesis
      speakWithBrowserSynthesis();
      return;
    }

    const data = await res.json();
    if (!data.audioBase64) {
      speakWithBrowserSynthesis();
      return;
    }

    // Decode base64 audio
    const binary = atob(data.audioBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    let blob: Blob;
    // Check if it already has a RIFF header
    if (binary.startsWith('RIFF')) {
      blob = new Blob([bytes], { type: 'audio/wav' });
    } else {
      // Raw PCM 24kHz
      blob = pcm16ToWavBlob(bytes, 24000, 1);
    }

    const audioUrl = URL.createObjectURL(blob);
    currentAudioUrl = audioUrl;

    const audio = new Audio(audioUrl);
    currentAudioElement = audio;
    audio.playbackRate = rate;

    audio.onplay = () => {
      isCurrentlySpeaking = true;
      onStart?.();
    };

    audio.onended = () => {
      isCurrentlySpeaking = false;
      if (currentAudioUrl) {
        URL.revokeObjectURL(currentAudioUrl);
        currentAudioUrl = null;
      }
      currentAudioElement = null;
      onEnd?.();
    };

    audio.onerror = (err) => {
      console.warn('Audio element error, falling back to browser synthesis', err);
      if (currentAudioUrl) {
        URL.revokeObjectURL(currentAudioUrl);
        currentAudioUrl = null;
      }
      currentAudioElement = null;
      speakWithBrowserSynthesis();
    };

    await audio.play();
  } catch (err) {
    console.warn('Gemini TTS network failure, falling back to browser speech synthesis', err);
    speakWithBrowserSynthesis();
  }
}

// Browser Web Speech Recognition interface for typing by speaking
export interface SpeechRecognitionListener {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onEnd: () => void;
}

export function createSpeechRecognizer(
  langCode: string,
  listener: SpeechRecognitionListener
): { start: () => void; stop: () => void; isSupported: boolean } {
  if (typeof window === 'undefined') {
    return { start: () => {}, stop: () => {}, isSupported: false };
  }

  const SpeechRecognitionClass =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognitionClass) {
    return { start: () => {}, stop: () => {}, isSupported: false };
  }

  let recognition: any = null;

  try {
    recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = langCode;

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          final += item[0].transcript;
        } else {
          interim += item[0].transcript;
        }
      }
      const combined = (final || interim).trim();
      listener.onResult(combined, Boolean(final));
    };

    recognition.onerror = (event: any) => {
      listener.onError(event.error || 'Speech recognition error');
    };

    recognition.onend = () => {
      listener.onEnd();
    };

    return {
      start: () => {
        try {
          recognition.lang = langCode;
          recognition.start();
        } catch (e) {
          console.warn('SpeechRecognition start failed', e);
        }
      },
      stop: () => {
        try {
          recognition.stop();
        } catch {
          // ignore
        }
      },
      isSupported: true,
    };
  } catch (e) {
    console.warn('Could not initialize SpeechRecognition', e);
    return { start: () => {}, stop: () => {}, isSupported: false };
  }
}
