import { VoiceProfile } from "./voiceProfiles";

const map = new Map<string, VoiceProfile>();

export function setPlayerVoice(playerId: string, profile: VoiceProfile) {
  map.set(playerId, profile);
}

export function getPlayerVoice(playerId: string): VoiceProfile | undefined {
  return map.get(playerId);
}

export function clearVoices() {
  map.clear();
}