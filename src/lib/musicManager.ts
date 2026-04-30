class MusicManager {
  private audio = new Audio();
  private currentState: string = "";
  private discussionIndex = 0;
  private timeout: any = null;

  private discussionTracks = [
    "/assets/music/discussion_1.ogg",
    "/assets/music/discussion_2.ogg",
    "/assets/music/discussion_3.ogg",
    "/assets/music/discussion_4.ogg",
    "/assets/music/discussion_5.ogg",
  ];

  play(state: string) {
    // если уже играет это состояние — ничего не делаем
    if (this.currentState === state) return;

    this.stop();
    this.currentState = state;

    // 🎵 ОБСУЖДЕНИЕ (особая логика)
    if (state === "discussion") {
      this.playDiscussion();
      return;
    }

    // ⚡ События (один трек сразу)
    let src = "";

    if (state === "disaster") src = "/assets/music/disaster.ogg";
    if (state === "elimination") src = "/assets/music/elimination.ogg";
    if (state === "victory") src = "/assets/music/victory.ogg";
    if (state === "defeat") src = "/assets/music/defeat.ogg";

    this.audio = new Audio(src);
    this.audio.volume = 0.5;
    this.audio.loop = false;
    this.audio.play().catch(() => {});
  }

  private playDiscussion() {
    const playNext = () => {
      // если состояние сменилось — выходим
      if (this.currentState !== "discussion") return;

      const src =
        this.discussionTracks[
          this.discussionIndex % this.discussionTracks.length
        ];

      this.discussionIndex++;

      this.audio = new Audio(src);
      this.audio.volume = 0.5;
      this.audio.loop = false;

      this.audio.onended = () => {
        // пауза 5 секунд
        this.timeout = setTimeout(() => {
          playNext();
        }, 5000);
      };

      this.audio.play().catch(() => {});
    };

    playNext();
  }

  stop() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    this.audio.pause();
    this.audio.currentTime = 0;
  }
}

export const musicManager = new MusicManager();