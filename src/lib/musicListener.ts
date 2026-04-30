import { useGameStore } from "../store/gameStore";

class MusicListener {
  private audio = new Audio();
  private timeout: any = null;
  private discussionIndex = 0;
  private volume = 0.4;
  private currentState = "";

  private discussionTracks = [
    "/assets/music/discussion_1.ogg",
    "/assets/music/discussion_2.ogg",
    "/assets/music/discussion_3.ogg",
    "/assets/music/discussion_4.ogg",
    "/assets/music/discussion_5.ogg",
  ];

  start() {
    let prevState = "";

    useGameStore.subscribe((state) => {
      // ❗ реагируем ТОЛЬКО если реально сменился этап
      if (state.musicState !== prevState) {
        prevState = state.musicState;
        this.handleState(state.musicState);
      }
    });
  }

  private handleState(state: string) {
    // ❗ если тот же state — ничего не делаем
    if (this.currentState === state) return;
    this.currentState = state;

    this.stop();

    if (state === "discussion") {
      this.playDiscussion();
      return;
    }

    let src = "";

    if (state === "disaster") src = "/assets/music/disaster.ogg";
    if (state === "elimination") src = "/assets/music/elimination.ogg";
    if (state === "victory") src = "/assets/music/victory.ogg";
    if (state === "defeat") src = "/assets/music/defeat.ogg";

    if (!src) return;

    this.audio = new Audio(src);
    this.audio.volume = this.volume;
    this.audio.loop = true;

    this.audio.play().catch(() => {});
  }

  private playDiscussion() {
    const playNext = () => {
      // ❗ если этап сменился — выходим
      if (this.currentState !== "discussion") return;

      const src =
        this.discussionTracks[
          this.discussionIndex % this.discussionTracks.length
        ];

      this.discussionIndex++;

      this.audio = new Audio(src);
      this.audio.volume = this.volume;
      this.audio.loop = false;

      this.audio.onended = () => {
        this.timeout = setTimeout(() => {
          playNext();
        }, 5000);
      };

      this.audio.play().catch(() => {});
    };

    playNext();
  }

  private stop() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    this.audio.pause();
    this.audio.currentTime = 0;
  }

  // 🔊 управление громкостью
  setVolume(v: number) {
    this.volume = v;
    this.audio.volume = v;
  }
}

export const musicListener = new MusicListener();