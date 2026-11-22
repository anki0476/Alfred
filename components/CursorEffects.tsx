'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';

type ClickBurst = {
  id: number;
  x: number;
  y: number;
};

const BURST_LINES = [0, 1, 2, 3];
const BURST_PARTICLES = [0, 1, 2, 3, 4, 5, 6, 7];
const CURSOR_STORAGE_KEY = 'alfred.cursor-animation.v1';
const CURSOR_CHANGE_EVENT = 'alfred:cursor-change';

function readCursorPreference() {
  try {
    return window.localStorage.getItem(CURSOR_STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

function subscribeToCursorPreference(onStoreChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === CURSOR_STORAGE_KEY) onStoreChange();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(CURSOR_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(CURSOR_CHANGE_EVENT, onStoreChange);
  };
}

export default function GlobalInteractionEffects() {
  const cursorEnabled = useSyncExternalStore(subscribeToCursorPreference, readCursorPreference, () => true);
  useEffect(() => { const sync=()=>{let enabled=true;try{enabled=localStorage.getItem("alfred.cursor-skin.v1")!=="off"}catch{}document.documentElement.classList.toggle("alfred-cursor-skin",enabled)};sync();window.addEventListener("storage",sync);window.addEventListener(CURSOR_CHANGE_EVENT,sync);return()=>{window.removeEventListener("storage",sync);window.removeEventListener(CURSOR_CHANGE_EVENT,sync);document.documentElement.classList.remove("alfred-cursor-skin")}},[]);
  const [bursts, setBursts] = useState<ClickBurst[]>([]);
  const nextId = useRef(0);
  const timeoutIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    setBursts([]);
    const activeTimeoutIds = timeoutIds.current;
    const canUseCursor = window.matchMedia('(pointer: fine)').matches;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!canUseCursor || reduceMotion || !cursorEnabled) {
      document.documentElement.classList.remove('alfred-cursor-effects');
      return;
    }
    document.documentElement.classList.add('alfred-cursor-effects');

    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const id = nextId.current++;
      setBursts((current) => [...current.slice(-4), { id, x: event.clientX, y: event.clientY }]);
      const timeoutId = window.setTimeout(() => {
        setBursts((current) => current.filter((burst) => burst.id !== id));
        activeTimeoutIds.delete(timeoutId);
      }, 680);
      activeTimeoutIds.add(timeoutId);
    };

    window.addEventListener('pointerdown', onDown, { passive: true });

    return () => {
      activeTimeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
      activeTimeoutIds.clear();
      document.documentElement.classList.remove('alfred-cursor-effects');
      window.removeEventListener('pointerdown', onDown);
    };
  }, [cursorEnabled]);

  return (
    <div className="interaction-layer" aria-hidden="true">
        {bursts.map((burst) => (
          <div
            className="click-burst"
            key={burst.id}
            style={{ left: burst.x, top: burst.y }}
          >
            <span className="burst-ring" />
            {BURST_LINES.map((line) => (
              <span className={`burst-line burst-line-${line}`} key={line} />
            ))}
            {BURST_PARTICLES.map((particle) => (
              <span
                className="burst-particle"
                key={particle}
                style={{ '--burst-angle': `${particle * 45}deg` } as CSSProperties}
              />
            ))}
          </div>
        ))}
    </div>
  );
}

