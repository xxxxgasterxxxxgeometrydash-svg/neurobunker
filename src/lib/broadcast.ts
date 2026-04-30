// ============================================================
// BROADCAST CHANNEL — связь между панелью и OBS Overlay
// ============================================================
import type { SaveState, MusicState } from '../types/game';

export type BroadcastMessage =
  | { type: 'STATE_UPDATE'; payload: SaveState }
  | { type: 'MUSIC_CHANGE'; payload: MusicState }
  | { type: 'SPEAKING_START'; payload: { playerId: string; text: string } }
  | { type: 'SPEAKING_END'; payload: { playerId: string } }
  | { type: 'PLAYER_ELIMINATED'; payload: { playerId: string } }
  | { type: 'GAME_RESET' };

const CHANNEL_NAME = 'neurobunker';

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel {
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
  return channel;
}

export function broadcast(msg: BroadcastMessage): void {
  try {
    getChannel().postMessage(msg);
  } catch (e) {
    console.error('[Broadcast] Ошибка отправки:', e);
  }
}

export function subscribeToBroadcast(handler: (msg: BroadcastMessage) => void): () => void {
  const ch = getChannel();
  const listener = (e: MessageEvent) => handler(e.data as BroadcastMessage);
  ch.addEventListener('message', listener);
  return () => ch.removeEventListener('message', listener);
}

export function closeBroadcast(): void {
  channel?.close();
  channel = null;
}
