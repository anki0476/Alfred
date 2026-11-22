"use client";
import {ConceptMap} from "./ConceptMap";
import {RetroComputer} from "./landing/RetroComputer";
import {WorkspaceHeader} from "./WorkspaceHeader";
import { useEffect, useState } from "react";
import {
  syllabus,
  diagnosticCount,
  masteryLabel,
  type Learning,
  type Question,
} from "../lib/adaptive";
import "./learning.css";
type Data = {
  version: number;
  state: Omit<Learning, "current"> & {
    current: Omit<Question, "expected"> | null;
  };
  memory: { at: string; quote: string; outcome: string; feedback: string }[];
};
export default function LearningJourney() {
  const [data,setData]=useState<Data|null>(null);
  const [error,setError]=useState("");
  const s=data?.state,q=s?.current;
  async function refresh(){try{const r=await fetch("/api/learning");const result=await r.json() as Data & {error?:string};if(!r.ok)throw new Error(result.error||"Could not load your progress.");setData(result);setError("");}catch(e){setError(String(e));}}
  useEffect(()=>{void refresh();const reload=()=>void refresh();window.addEventListener("focus",reload);return()=>window.removeEventListener("focus",reload);},[]);
  return (
    <div className="app-shell"><WorkspaceHeader active="/learn"/><main className="learning-shell">
      <header className="learning-heading learning-heading-with-mascot"><div className="learning-heading-copy">
        <span className="eyebrow">EXPLAIN · CHECK · REVISIT</span>
        <h1>Your understanding, connected.</h1>
        <p>{syllabus.title}</p>
        <p className="learning-muted">{syllabus.scope} <a href={syllabus.sourceUrl} target="_blank" rel="noreferrer">Official syllabus</a></p>
      </div><div className="studio-mascot learning-mascot"><RetroComputer sound={false} faceOnly /></div></header>
      {error && (
        <div role="alert" className="learning-error">
          {error}{" "}
          <button onClick={() => void refresh()}>
            Refresh saved work
          </button>
        </div>
      )}
      {!data ? (
        <p role="status">Opening your learning record…</p>
      ) : (
        <>
          <section className="learning-card">
            <div className="learning-row">
              <h2>
                {s!.diagnostic.length < diagnosticCount
                  ? "Start with what you know"
                  : "Your learning map"}
              </h2>
              <span>Diagnostic: {s!.diagnostic.length} / {diagnosticCount} supported concepts</span>
            </div>
            <p className="learning-muted">
              Connections show prerequisites. Estimates use confirmed answer
              evidence; they are not exam grades or calibrated probabilities.
              Three successful explanations are needed for “demonstrated
              repeatedly”.
            </p>
            <ConceptMap concepts={syllabus.concepts} />
            <div className="concept-grid">
              {syllabus.concepts.map((c) => {
                const m = s!.mastery[c.id as keyof Learning["mastery"]];
                return (
                  <article
                    key={c.id}
                    className={
                      q?.concept === c.id
                        ? "concept-node selected"
                        : "concept-node"
                    }
                  >
                    <h3>{syllabus.concepts.indexOf(c)+1}. {c.name}</h3><small>{c.unit} · {c.supported ? "AI-guided · text practice" : "Not supported — mapped only"}</small><small>{c.coverage}</small>
                    <small>
                      {c.prerequisites.length
                        ? "Builds on " +
                          c.prerequisites
                            .map(
                              (id) =>
                                syllabus.concepts.find((x) => x.id === id)!
                                  .name,
                            )
                            .join(" + ")
                        : "Starting concept"}
                    </small>
                    <progress
                      max={100}
                      value={m.score * 100}
                      aria-label={c.name + " evidence estimate"}
                    />
                    <strong>
                      {c.supported ? masteryLabel(m) : "Not assessed · unavailable"}{" "}
                      {m.assessed > 0 && "· " + Math.round(m.score * 100) + "%"}
                    </strong>
                    <small>
                      {m.demonstrated} demonstrated / {m.assessed} assessed
                      attempts
                    </small>
                    {m.confirmed && (
                      <span className="learning-badge">
                        Confirmed reasoning gap
                      </span>
                    )}
                    {m.suspected && (
                      <span className="learning-badge">Follow-up needed</span>
                    )}
                    <small>
                      {m.dueAt
                        ? "Review " + new Date(m.dueAt).toLocaleString()
                        : c.supported ? "Review scheduled after assessment" : "No assessment or review available"}
                    </small>
                  </article>
                );
              })}
            </div>
          </section>
          <section className="learning-card" aria-label="Continue in Study Studio">
            <h2>{q || s!.draft ? "Continue your session" : "Put your understanding into practice"}</h2>
            <p>Your questions, voice explanations and feedback live in Study Studio. Your progress and review dates stay connected here.</p>
            <a className="primary-button" href="/studio">{q || s!.draft ? "Continue in Study Studio" : "Open Study Studio"}</a>
          </section>
          <section className="learning-card">
            <h2>Study notes</h2>
            <p className="learning-muted">
              Your latest AI-guided feedback for each concept. Alfred uses CBSE source context and your confirmed explanations.
            </p>
            {syllabus.concepts.map((c) => (
              <details key={c.id}>
                <summary>
                  {c.name} · {c.source}
                </summary>
                <p>{s!.attempts.filter(t=>t.question.concept===c.id).at(-1)?.feedback || "No feedback yet."}</p>
              </details>
            ))}
          </section>
          <section className="learning-card">
            <h2>Learning evidence & mistake notebook</h2>
            <p className="learning-muted">
              Correcting an attempt reopens it and removes all later dependent
              assessments, mastery changes and review dates. Your earlier
              evidence is preserved.
            </p>
            {s!.attempts.length === 0 ? (
              <p>Your confirmed explanations will appear here.</p>
            ) : (
              s!.attempts
                .slice()
                .reverse()
                .map((t) => (
                  <details key={t.id}>
                    <summary>
                      {
                        syllabus.concepts.find(
                          (c) => c.id === t.question.concept,
                        )?.name
                      }{" "}
                      · {t.outcome.replaceAll("_", " ")} ·{" "}
                      {new Date(t.at).toLocaleString()}
                    </summary>
                    <p>{t.question.prompt}</p>
                    <blockquote>{t.explanation}</blockquote>
                    <p>{t.feedback}</p>
                    <small>
                      {t.source} · Teaching action: {t.action}
                    </small>
                    <a className="text-button" href="/studio">Review or correct this attempt in Study Studio</a>
                  </details>
                ))
            )}
          </section>
          <p className="learning-muted">
            Learning is saved to your account when signed in, otherwise to this
            browser’s visitor identity. Clearing cookies loses access to guest
            records.{" "}
            <a href="/signin-with-chatgpt?return_to=/learn">
              Sign in for an account learning record
            </a>
            .
          </p>
        </>
      )}
    </main></div>
  );
}
