// SceneSense's hold / double-tap interaction, adapted for a focused browser tab.
export class VoiceGesture {
  private held = false;
  private active = false;
  private latched = false;
  private lastPress: number | null = null;
  private releaseTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private callbacks: {
      start: () => boolean;
      finish: () => void;
      latch: (value: boolean) => void;
    },
  ) {}

  press(now = Date.now()) {
    if (this.held) return;
    this.held = true;
    const double = this.lastPress !== null && now - this.lastPress < 350;
    this.lastPress = now;
    this.clearTimer();
    if (double) {
      this.lastPress = null;
      if (this.latched) this.finish();
      else if (this.active || this.begin()) this.setLatch(true);
    } else if (!this.latched) this.begin();
  }

  release() {
    if (!this.held) return;
    this.held = false;
    if (!this.latched) this.releaseTimer = setTimeout(() => this.finish(), 350);
  }

  toggleHandsFree() {
    if (this.active) this.finish();
    else if (this.begin()) this.setLatch(true);
  }

  finish() {
    const wasActive = this.active;
    this.reset();
    if (wasActive) this.callbacks.finish();
  }

  reset() {
    this.clearTimer();
    this.active = false;
    this.held = false;
    this.lastPress = null;
    this.setLatch(false);
  }

  private begin() {
    if (this.active) return true;
    this.active = this.callbacks.start();
    return this.active;
  }
  private setLatch(value: boolean) {
    this.latched = value;
    this.callbacks.latch(value);
  }
  private clearTimer() {
    if (this.releaseTimer) clearTimeout(this.releaseTimer);
    this.releaseTimer = null;
  }
}

export function isVoiceShortcut(
  event: Pick<
    KeyboardEvent,
    "code" | "ctrlKey" | "shiftKey" | "altKey" | "metaKey" | "isComposing"
  >,
) {
  return (
    event.code === "KeyZ" &&
    event.ctrlKey &&
    event.shiftKey &&
    !event.altKey &&
    !event.metaKey &&
    !event.isComposing
  );
}
