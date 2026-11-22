export type MusicState = { time: number; volume: number; wanted: boolean };
const key = 'alfred-bgm';
export function readMusicState(): MusicState {
  const fallback = { time: 0, volume: .2, wanted: false };
  try {
    const value = JSON.parse(sessionStorage.getItem(key) ?? 'null');
    if (!value) return fallback;
    return {
      time: Number.isFinite(value.time) && value.time >= 0 ? value.time : 0,
      volume: Number.isFinite(value.volume) ? Math.max(0, Math.min(1, value.volume)) : .2,
      wanted: false,
    };
  } catch { return fallback; }
}
export function saveMusicState(state: MusicState) {
  try { sessionStorage.setItem(key, JSON.stringify(state)); } catch { /* Playback still works without storage. */ }
}

type Audio = Pick<HTMLAudioElement, 'currentTime' | 'duration' | 'readyState' | 'volume' | 'paused' | 'play' | 'pause'>;
/** Keep user intent separate from browser-driven pauses when leaving the page. */
export class MusicPlayback {
  private audio: Audio;
  private state: MusicState;
  private persist: (state: MusicState) => void;
  private onError: () => void;
  private restored = false;
  private active = false;
  private suspended = false;
  constructor(audio: Audio, state: MusicState, persist: (state: MusicState) => void, onError: () => void) {
    this.audio = audio; this.state = state; this.persist = persist; this.onError = onError;
    audio.volume = state.volume;
  }
  save() {
    this.persist({ ...this.state, time: this.restored ? this.audio.currentTime : this.state.time, volume: this.audio.volume });
  }
  setActive(active: boolean) { this.active = active; if (active) this.resume(); else this.audio.pause(); }
  resume() {
    if (!this.active || this.suspended || this.audio.readyState < 1) return;
    if (!this.restored) {
      const duration = this.audio.duration;
      this.audio.currentTime = Number.isFinite(duration) && duration > 0 ? this.state.time % duration : this.state.time;
      this.restored = true;
    }
    if (this.state.wanted && this.audio.paused) {
      void this.audio.play().then(() => {
        if (!this.active || this.suspended || !this.state.wanted) this.audio.pause();
      }).catch(() => { if (!this.suspended) this.onError(); });
    }
  }
  suspend() { this.suspended = true; this.save(); this.audio.pause(); }
  stop() { this.state.wanted = false; this.audio.pause(); this.save(); }
  returnToPage() { this.suspended = false; this.resume(); }
  toggle() {
    this.state.wanted = this.audio.paused;
    if (this.state.wanted) this.resume(); else this.audio.pause();
    this.save();
  }
}
