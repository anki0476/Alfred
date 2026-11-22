"use client";

import { AlfredLoading } from "./AlfredLoading";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, BookOpen, Sparkles } from "lucide-react";

import { savedMaterialPracticeSchema, type MaterialPracticeState, type PracticeResult } from "../lib/material-practice";
import type { Material } from "./MaterialsLibrary";

const empty: MaterialPracticeState = { questions: [], answers: [], feedback: [], index: 0 };
const assessmentLabels = { supported: "Supported by your material", partly_supported: "A good start—keep explaining", needs_revision: "A point to revisit", not_enough_evidence: "Let’s clarify your reasoning" };

export function MaterialPractice({ material, onClose, onRead }: { material: Material; onClose: () => void; onRead: () => void }) {
  const [state, setState] = useState<MaterialPracticeState>(empty);
  const [focus, setFocus] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loaded, setLoaded] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const lock = useRef(false);
  const storageKey = `alfred-material-practice:${material.id}`;
  useEffect(() => {
    try { const saved = localStorage.getItem(storageKey); if (saved) setState(savedMaterialPracticeSchema.parse(JSON.parse(saved))); }
    catch { setNotice("Saved practice could not be loaded. You can start a new set below."); }
    setLoaded(true);
    return () => { controller.current?.abort(); };
  }, [storageKey]);
  function commit(next: MaterialPracticeState) {
    setState(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); }
    catch { setNotice("Browser storage is full or unavailable. Keep this page open to preserve your current practice."); }
  }
  async function ask(operation: "generate" | "feedback") {
    if (lock.current) return;
    lock.current = true; setBusy(operation); setError(""); setNotice("");
    const abort = new AbortController(); controller.current = abort;
    const timeout = setTimeout(() => abort.abort(), 90000);
    try {
      const form = new FormData(); form.set("operation", operation); form.set("file", material.file, material.name);
      if (operation === "generate") form.set("focus", focus);
      else { form.set("question", state.questions[state.index].question); form.set("answer", state.answers[state.index] || ""); }
      const response = await fetch("/api/material-practice", { method: "POST", body: form, signal: abort.signal });
      const result = await response.json() as PracticeResult & { error?: string };
      if (!response.ok) { throw new Error(result.error || "Alfred could not complete this request."); }
      if (result.status === "insufficient_source") { setNotice(result.message || "This material does not provide enough information for this request. Try a clearer source or another focus."); return; }
      if (operation === "generate") commit({ questions: result.questions, answers: result.questions.map(() => ""), feedback: result.questions.map(() => null), index: 0 });
      else { const feedback = [...state.feedback]; feedback[state.index] = result.feedback; commit({ ...state, feedback }); }
    } catch (problem) {
      if (problem instanceof Error && problem.name === "AbortError") setError("The request took too long. Your answer is preserved; please retry.");
      else setError(problem instanceof Error ? problem.message : "Something went wrong. Please retry.");
    } finally { clearTimeout(timeout); lock.current = false; setBusy(""); }
  }
  const question = state.questions[state.index];
  const feedback = state.feedback[state.index];
  return <section className="materials-page material-practice">
    <button className="text-button" onClick={onClose} disabled={Boolean(busy)}><ArrowLeft size={17} /> All materials</button>
    <header className="materials-heading"><div><h1>Teach it to Alfred.</h1><p className="practice-source"><BookOpen size={17} /> {material.name}</p></div><button className="text-button" onClick={onRead} disabled={Boolean(busy)}>View source</button></header>
    <p className="materials-note">Practice from your uploaded material. Questions and feedback are AI-generated, with source references to help you check them. When you request questions or feedback, this file and your answer are sent to Alfred’s AI service. Your practice stays saved in this browser.</p>
    {error && <p role="alert" className="notice error">{error}</p>}
    {notice && <p role="status" className="notice">{notice}</p>}
    {!question && <div className="practice-setup"><label htmlFor="practice-focus">What would you like to practice? <span>(optional)</span></label><input id="practice-focus" value={focus} maxLength={500} onChange={event => setFocus(event.target.value)} placeholder="For example: compare the key ideas, or test my understanding of chapter 2" disabled={Boolean(busy)} /><button className="primary-button" onClick={() => void ask("generate")} disabled={!loaded || Boolean(busy)}><Sparkles size={18} />{busy ? "Reading your material…" : "Generate practice questions"}</button></div>}
    {question && <>
      <nav className="practice-questions" aria-label="Practice questions">{state.questions.map((q, index) => <button key={index} aria-current={state.index === index ? "step" : undefined} disabled={Boolean(busy)} onClick={() => commit({ ...state, index })}>Question {index + 1}{state.feedback[index] ? " · reviewed" : ""}</button>)}</nav>
      <article className="practice-question"><span className="small-label">{question.concept}</span><h2>{question.question}</h2><label htmlFor="material-answer">Explain it in your own words</label><textarea id="material-answer" value={state.answers[state.index] || ""} maxLength={10000} rows={7} disabled={Boolean(busy)} placeholder="Walk Alfred through your thinking, including any parts you’re unsure about." onChange={event => { const answers = [...state.answers], nextFeedback = [...state.feedback]; answers[state.index] = event.target.value; nextFeedback[state.index] = null; commit({ ...state, answers, feedback: nextFeedback }); }} /><button className="primary-button" disabled={Boolean(busy) || !(state.answers[state.index] || "").trim()} onClick={() => void ask("feedback")}>{busy === "feedback" ? "Reading your explanation…" : "Ask Alfred for feedback"}</button>
      <details className="practice-evidence"><summary>Find this idea in your material</summary>{question.evidence.map((source, index) => <blockquote key={index}><p>{source.quote}</p><cite>{source.location}</cite></blockquote>)}</details></article>
      {feedback && <section className="practice-feedback" aria-live="polite"><span className="small-label">Alfred’s feedback</span><h2>{assessmentLabels[feedback.assessment]}</h2>{feedback.answerQuote && <blockquote><span>You said</span><p>“{feedback.answerQuote}”</p></blockquote>}{feedback.strengths && <p>{feedback.strengths}</p>}<p>{feedback.guidance}</p>{feedback.followUp && <div className="practice-followup"><strong>Think it through</strong><p>{feedback.followUp}</p><small>Add your reasoning to the answer above, then ask for feedback again.</small></div>}{feedback.evidence.length > 0 && <details className="practice-evidence" open><summary>Evidence from {material.name}</summary>{feedback.evidence.map((source, index) => <blockquote key={index}><p>{source.quote}</p><cite>{source.location}</cite></blockquote>)}</details>}</section>}
      <details className="practice-new-set"><summary>Start a new set of questions</summary><p>This replaces this file’s current questions and answers.</p><label htmlFor="new-practice-focus">Focus (optional)</label><input id="new-practice-focus" maxLength={500} value={focus} disabled={Boolean(busy)} onChange={event => setFocus(event.target.value)} /><button className="text-button" disabled={Boolean(busy)} onClick={() => void ask("generate")}>{busy === "generate" ? "Preparing questions…" : "Replace with a new set"}</button></details>
    </>}
    {busy && <AlfredLoading label={busy === "generate" ? "Preparing questions from your material…" : "Thinking through your explanation…"} />}
  </section>;
}
