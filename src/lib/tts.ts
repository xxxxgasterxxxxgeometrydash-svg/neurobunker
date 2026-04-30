// ============================================================
// TTS — Web Speech API + выбор голоса
// ============================================================

export interface VoiceOption {
  id: string;
  name: string;
  lang: string;
  localService: boolean;
}

let voices: SpeechSynthesisVoice[] = [];
let voicesLoaded = false;

export function loadVoices(): Promise<VoiceOption[]> {
  return new Promise((resolve) => {
    const load = () => {
      voices = window.speechSynthesis.getVoices();
      voicesLoaded = true;
      resolve(mapVoices(voices));
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      load();
    } else {
      window.speechSynthesis.addEventListener('voiceschanged', load, { once: true });
      setTimeout(load, 1000);
    }
  });
}

function mapVoices(raw: SpeechSynthesisVoice[]): VoiceOption[] {
  return raw
    .filter(v => v.lang.startsWith('ru') || v.lang.startsWith('en'))
    .map(v => ({
      id: v.voiceURI,
      name: v.name,
      lang: v.lang,
      localService: v.localService,
    }));
}

export function getAvailableVoices(): VoiceOption[] {
  if (!voicesLoaded) voices = window.speechSynthesis.getVoices();
  return mapVoices(voices);
}

export function speak(text: string, voiceId: string, onEnd?: () => void): void {
  if (!window.speechSynthesis) {
    console.warn('[TTS] Web Speech API не поддерживается');
    onEnd?.();
    return;
  }

  stopSpeaking();

  const utterance = new SpeechSynthesisUtterance(text);

  const allVoices = window.speechSynthesis.getVoices();
  const voiceToUse = voiceId || selectedVoiceId;

  const voice = allVoices.find(v => v.voiceURI === voiceToUse);
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    const ruVoice = allVoices.find(v => v.lang.startsWith('ru'));
    if (ruVoice) {
      utterance.voice = ruVoice;
      utterance.lang = 'ru-RU';
    }
  }

  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  utterance.onend = () => { onEnd?.(); };
  utterance.onerror = (e) => {
    console.error('[TTS] Ошибка:', e.error);
    onEnd?.();
  };

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeaking(): boolean {
  return window.speechSynthesis?.speaking ?? false;
}

// Примерный подсчёт токенов (1 токен ≈ 4 символа)
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
// выбранный голос (по умолчанию null)
let selectedVoiceId: string | null = localStorage.getItem('tts_voice');

// установить голос
export function setVoice(id: string) {
  selectedVoiceId = id;
  localStorage.setItem('tts_voice', id);
}

// получить текущий голос
export function getVoice(): string | null {
  return selectedVoiceId;
}
