import type { Player } from "../types/game";
import type { VoiceOption } from "./tts";

export function createVoiceProfile(player: Player, voices: VoiceOption[]) {

  // 🎯 Мистраль — особый
  if (player.name.toLowerCase().includes("мистраль")) {
    const french = voices.find(v => v.lang.startsWith("fr"));

    return {
      voiceId: french?.id,
      pitch: 0.9,
      rate: 0.95,
    };
  }

  // остальные
  const voice = voices[Math.floor(Math.random() * voices.length)];

  return {
    voiceId: voice?.id,
    pitch: 1,
    rate: 1,
  };
}