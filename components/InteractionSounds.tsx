"use client";

import { useEffect } from "react";
import { voiceSound } from "../lib/voice-sounds";

export function InteractionSounds() {
  useEffect(() => {
    const click = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const control = event.target.closest('button, a[href], summary, select, input[type="checkbox"], input[type="radio"], [role="button"], [role="switch"]');
      if (!control || control.matches(':disabled, [aria-disabled="true"]') || control.closest('[data-voice-cue]')) return;
      voiceSound("tap");
    };
    document.addEventListener("click", click, true);
    return () => document.removeEventListener("click", click, true);
  }, []);
  return null;
}
