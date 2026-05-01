import { useGameStore } from '../store/gameStore';

class MusicListener {
  public audio = new Audio(); // Один объект на всё время
  public volume = Number(localStorage.getItem('musicVolume') ?? '0.4');
  private currentState = "";
  private discussionTracks = [
    "/assets/music/discussion_1.ogg",
    "/assets/music/discussion_2.ogg",
    "/assets/music/discussion_3.ogg",
    "/assets/music/discussion_4.ogg",
    "/assets/music/discussion_5.ogg"
  ];
  private discussionIndex = 0;

  constructor() {
    this.audio.loop = true;
    this.audio.volume = this.volume;

    // Слушаем мгновенное изменение громкости
    window.addEventListener('volumeChanged', (e: any) => {
      this.volume = e.detail;
      this.audio.volume = this.volume;
    });
  }

  public start() {
    useGameStore.subscribe((state) => {
      if (state.musicState !== this.currentState) {
        this.handleState(state.musicState);
      }
    });
  }

  private handleState(state: string) {
    this.currentState = state;
    
    // Сначала останавливаем текущий трек
    this.audio.pause();

    if (state === "discussion") {
      this.playDiscussion();
      return;
    }

    let src = "";
    if (state === "disaster") src = "/assets/music/disaster.ogg";
    if (state === "elimination") src = "/assets/music/elimination.ogg";
    if (state === "victory") src = "/assets/music/victory.ogg";
    if (state === "defeat") src = "/assets/music/defeat.ogg";

    if (src) {
      this.audio.src = src;
      this.audio.play().catch(() => console.log("Нужен клик по экрану"));
    }
  }

  private playDiscussion() {
    const src = this.discussionTracks[this.discussionIndex % this.discussionTracks.length];
    this.discussionIndex++;
    
    this.audio.src = src;
    this.audio.play().catch(() => console.log("Нужен клик по экрану"));
  }
}

export const musicListener = new MusicListener();
