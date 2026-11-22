"use client";
import { useEffect, useRef, useState } from "react";
import { recordVoice } from "../lib/voice";
import { VoiceGesture, isVoiceShortcut } from "../lib/voice-gesture";
export function LearningVoice({
  disabled,
  value,
  onChange,
  onBusy,
}: {
  disabled: boolean;
  value: string;
  onChange: (s: string) => void;
  onBusy: (v: boolean) => void;
}) {
  const [status, setStatus] = useState("Ready to listen"),
    [recording, setRecording] = useState(false),
    [pending, setPending] = useState(false),
    [level, setLevel] = useState(0),
    [error, setError] = useState("");
  const current = useRef({ disabled, value, onChange, onBusy });
  current.current = { disabled, value, onChange, onBusy };
  const stop = useRef<null | (() => Promise<void>)>(null),
    intent = useRef(false),
    transition = useRef(false),
    alive = useRef(true),
    draining = useRef(false),
    prefix = useRef(""),
    queue = useRef<{ blob: Blob; text: string | null }[]>([]);
  const actions = useRef<{ start: () => boolean; finish: () => void }>({
      start: () => false,
      finish: () => {},
    }),
    gesture = useRef<VoiceGesture | null>(null);
  if (!gesture.current)
    gesture.current = new VoiceGesture({
      start: () => actions.current.start(),
      finish: () => actions.current.finish(),
      latch: () => {},
    });
  async function drain() {
    if (draining.current || !alive.current) return;
    draining.current = true;
    current.current.onBusy(true);
    setPending(true);
    try {
      for (const segment of queue.current) {
        if (segment.text !== null) continue;
        const form = new FormData();
        form.set("file", segment.blob, "explanation.wav");
        const r = await fetch("/api/speech", { method: "POST", body: form });
        const result = (await r.json()) as {
          error?: string;
          transcript: string;
        };
        if (!r.ok) throw new Error(result.error || "Transcription failed");
        segment.text = result.transcript;
        if (alive.current)
          current.current.onChange(
            [prefix.current, ...queue.current.map((q) => q.text || "")]
              .filter(Boolean)
              .join(" "),
          );
      }
      setError("");
    } catch (e) {
      if (alive.current)
        setError(e instanceof Error ? e.message : "Transcription failed");
    } finally {
      draining.current = false;
      const waiting = queue.current.some((q) => q.text === null);
      if (alive.current) {
        setPending(waiting);
        current.current.onBusy(intent.current || transition.current || waiting);
        if (!intent.current)
          setStatus(waiting ? "Retry transcription" : "Check your transcript");
      }
    }
  }
  async function finish() {
    intent.current = false;
    const fn = stop.current;
    stop.current = null;
    if (!fn) return;
    transition.current = true;
    setStatus("Finishing");
    try {
      await fn();
    } finally {
      transition.current = false;
      if (alive.current) {
        setRecording(false);
        void drain();
      }
    }
  }
  async function start() {
    intent.current = true;
    transition.current = true;
    current.current.onBusy(true);
    setStatus("Opening microphone");
    setError("");
    prefix.current = current.current.value;
    queue.current = [];
    try {
      const fn = await recordVoice(
        (blob) => {
          if (alive.current) {
            queue.current.push({ blob, text: null });
            void drain();
          }
        },
        (v) => {
          if (alive.current) setLevel(v);
        },
        () => gesture.current?.finish(),
      );
      if (!alive.current || !intent.current) {
        await fn();
        return;
      }
      stop.current = fn;
      setRecording(true);
      setStatus("Listening");
    } catch (e) {
      intent.current = false;
      gesture.current?.reset();
      if (alive.current) {
        setError(
          "Microphone could not start. Check permission or type your explanation.",
        );
        setStatus("Microphone unavailable");
      }
    } finally {
      transition.current = false;
      if (alive.current && !intent.current && !draining.current)
        current.current.onBusy(queue.current.some((q) => q.text === null));
    }
  }
  actions.current = {
    start: () => {
      if (
        current.current.disabled ||
        transition.current ||
        draining.current ||
        queue.current.some((q) => q.text === null)
      )
        return false;
      void start();
      return true;
    },
    finish: () => {
      void finish();
    },
  };
  useEffect(() => {
    alive.current = true;
    const down = (e: KeyboardEvent) => {
      if (isVoiceShortcut(e)) {
        e.preventDefault();
        if (!e.repeat) gesture.current?.press();
      } else if (e.key === "Escape") gesture.current?.finish();
    };
    const up = (e: KeyboardEvent) => {
      if (
        [
          "KeyZ",
          "ControlLeft",
          "ControlRight",
          "ShiftLeft",
          "ShiftRight",
        ].includes(e.code)
      )
        gesture.current?.release();
    };
    const blur = () => gesture.current?.finish();
    window.addEventListener("keydown", down, true);
    window.addEventListener("keyup", up, true);
    window.addEventListener("blur", blur);
    return () => {
      alive.current = false;
      intent.current = false;
      gesture.current?.reset();
      void stop.current?.();
      window.removeEventListener("keydown", down, true);
      window.removeEventListener("keyup", up, true);
      window.removeEventListener("blur", blur);
    };
  }, []);
  return (
    <div className="learn-voice">
      <div className="learn-notch">
        <span aria-hidden="true" className="learn-avatar">
          a
        </span>
        <span role="status">{status}</span>
        {recording && (
          <meter aria-label="Microphone level" min={0} max={1} value={level} />
        )}
        <button
          type="button"
          disabled={!recording && (disabled || transition.current || pending)}
          onClick={() => gesture.current?.toggleHandsFree()}
        >
          {recording ? "Done" : "Speak"}
        </button>
      </div>
      <small>
        Hold Ctrl + Shift + Z to speak; release to finish. Double-tap for
        hands-free. Keep this tab focused.
      </small>
      {error && <p role="alert">{error}</p>}
      {pending && !recording && (
        <button
          type="button"
          disabled={draining.current}
          onClick={() => void drain()}
        >
          Retry transcription
        </button>
      )}
    </div>
  );
}
