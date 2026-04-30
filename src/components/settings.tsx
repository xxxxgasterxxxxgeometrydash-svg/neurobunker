import { useGameStore } from './store';

class MusicListener {
  private audio = new Audio();
  private currentTrack = '';

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
      // Слушаем событие изменения localStorage
      window.addEventListener('storage', () => this.syncVolume());
    }
  }

  private init() {
    useGameStore.subscribe((state) => {
      const track = this.getTrack(state.phase);
      if (this.currentTrack !== track) {
        this.play(track);
      }
    });
    this.syncVolume();
  }

  private syncVolume() {
    const vol = Number(localStorage.getItem('musicVolume') ?? '0.4');
    this.audio.volume = vol;
  }

  private getTrack(phase: string) {
    switch (phase) {
      case 'voting': return '/music/voting.mp3';
      case 'defense': return '/music/defense.mp3';
      case 'final': return '/music/final.mp3';
      default: return '/music/ambient.mp3';
    }
  }

  private play(src: string) {
    this.audio.src = src;
    this.audio.loop = true;
    this.audio.play().catch(() => console.log("Waiting for user interaction..."));
    this.currentTrack = src;
  }
}

export const musicListener = new MusicListener();
