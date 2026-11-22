"use client";
import { useEffect, useRef, useState } from "react";

const chapters = [
  { label: "Meet Alfred", title: "A curious mind.\nOn your side.", text: "Hello, I’m Alfred. Think of me as the study companion you can teach. Bring me a problem and explain how you would solve it—in your own words, out loud or in writing. I’ll listen to your reasoning, ask a useful question, and help you explore the steps you’re not quite sure about." },
  { label: "The Feynman technique", title: "To understand it,\ntry teaching it.", text: "The Feynman technique is a simple learning cycle: choose an idea, explain it simply, notice where your explanation gets stuck, then revisit the material and try again. Clear words reveal unclear thinking. You don’t need a perfect explanation to begin; the gaps tell you what to work on next." },
  { label: "The Alfred experience", title: "From “I think so”\nto “now I see.”", text: "Alfred turns that cycle into a conversation. Explain an algebra solution, check what I understood, and work through a follow-up question. Use the study material to refine your reasoning, then test it on a fresh problem. Your learning evidence and mistake notebook give you something concrete to return to. For now, we’re starting with a focused algebra practice set." },
];

export function MeetAlfred({ onClose }: { onClose: () => void }) {
  const [chapter, setChapter] = useState(0);
  const [count, setCount] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const current = chapters[chapter];
  const complete = count >= current.text.length;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const background = Array.from(document.querySelectorAll<HTMLElement>(".alfred-centerpiece,.alfred-skip,.alfred-header,.alfred-side-note,.alfred-hello,.alfred-start,.alfred-footer,.alfred-faq,.music-player"));
    const previousInert = background.map(el => el.inert);
    background.forEach(el => { el.inert = true; });
    close.current?.focus({ preventScroll: true });
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("keydown", escape);
      document.body.style.overflow = overflow;
      background.forEach((el, i) => { el.inert = previousInert[i]; });
      previous?.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    if (chapter > 0) root.current?.querySelector<HTMLElement>("#meet-title")?.focus({ preventScroll: true });
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setCount(media.matches ? current.text.length : 0);
    if (media.matches) return;
    let interval: ReturnType<typeof setInterval> | undefined;
    const delay = setTimeout(() => {
      interval = setInterval(() => setCount(n => {
        if (n >= current.text.length) { clearInterval(interval); return n; }
        return n + 1;
      }), 23);
    }, chapter === 0 ? 1000 : 180);
    const reduce = () => { if (media.matches) { clearTimeout(delay); clearInterval(interval); setCount(current.text.length); } };
    media.addEventListener("change", reduce);
    return () => { clearTimeout(delay); clearInterval(interval); media.removeEventListener("change", reduce); };
  }, [chapter, current.text]);

  return <div className="alfred-meet" ref={root} role="dialog" aria-modal="true" aria-labelledby="meet-title" onKeyDown={event => {
    if (event.key === "Escape") { event.preventDefault(); onClose(); }
    if (event.key === "Tab") {
      const nodes = root.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href]');
      if (!nodes?.length) return;
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  }}>
    <button ref={close} className="alfred-meet-close" onClick={onClose} aria-label="Close Meet Alfred"><span aria-hidden="true">×</span></button>
    <article className="alfred-meet-story">
      <nav className="alfred-chapters" aria-label="Introduction chapters">{chapters.map((item, i) => <button key={item.label} aria-current={chapter === i ? "step" : undefined} onClick={() => setChapter(i)}>{item.label}</button>)}</nav>
      <div className="alfred-meet-copy" key={chapter}>
        <h2 id="meet-title" tabIndex={-1}>{current.title.split("\n").map((line, i) => <span key={line}>{i > 0 && <br/>}{line}</span>)}</h2>
        <p className="alfred-typewriter" aria-hidden="true">{current.text.slice(0, count)}{!complete && <span className="alfred-type-cursor">▌</span>}</p>
        <p className="alfred-accessible-copy" aria-live="polite">{current.text}</p>
      </div>
      <div className="alfred-meet-actions">
        <button disabled={chapter === 0} onClick={() => setChapter(n => n - 1)}>Back</button>
        {!complete && <button onClick={() => setCount(current.text.length)}>Skip typing</button>}
        {chapter < chapters.length - 1 ? <button className="alfred-meet-next" onClick={() => setChapter(n => n + 1)}>Next chapter</button> : <a className="alfred-meet-next" href="/studio">Start learning</a>}
      </div>
    </article>
  </div>;
}
