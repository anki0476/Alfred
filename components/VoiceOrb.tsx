"use client";

import { useEffect, useState } from "react";
import { ThinkingOrb } from "thinking-orbs";

export function VoiceOrb({ listening }: { listening: boolean }) {
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return <ThinkingOrb className="notch-orb" state={listening ? "listening" : "composing"}
    size={32} theme="dark" color="#b7c6ff" paused={reducedMotion} aria-hidden="true" />;
}
