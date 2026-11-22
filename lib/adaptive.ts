
import {syllabus,supportedConcepts,diagnosticCount} from "./curriculum";
export {syllabus,supportedConcepts,diagnosticCount};
export type ConceptId = string;
export type Reason = "supported" | "misconception" | "unclear";
export type Evidence = { reason: Reason; quote: string; summary: string };
export type Question = {
  id: string;
  concept: ConceptId;
  level: number;
  k: number;
  a: number;
  mode: "diagnostic" | "practice" | "review" | "probe";
  prompt: string;
  equation: string;
  options: string[];
  expected: string;
  why: string;
  createdAt: string;
  parameters?: Record<string,number|number[]>;
  teaching?: {solution:string;rubric:string[];source:string;citations:{id:string;quote:string}[];checks:{kind:"arithmetic"|"roots"|"identity";input:string;expected:string;purpose:string}[];marks:number;model:string;verification:string;sourceHashes:{id:string;sha256:string}[];audit:string};
};
export type Mastery = {
  score: number;
  attempts: number;
  assessed: number;
  demonstrated: number;
  streak: number;
  interval: number;
  dueAt: string | null;
  lastAt: string | null;
  suspected: boolean;
  confirmed: boolean;
};
export type Attempt = {
  discussion?: {id:string;explanation:string;feedback:string;at:string}[];
  id: string;
  question: Question;
  answer: string;
  explanation: string;
  evidence: Evidence;
  outcome: "demonstrated" | "needs_practice" | "unverified";
  feedback: string;
  source: string;
  at: string;
  before: number;
  after: number;
  action: string;
};
export type Draft = {
  id: string;
  questionId: string;
  answer: string;
  explanation: string;
  evidence: Evidence;
};
export type Learning = {
  revision: 1;
  followUp: ConceptId | null;
  diagnostic: string[];
  mastery: Record<ConceptId, Mastery>;
  current: Question | null;
  draft: Draft | null;
  attempts: Attempt[];
  correctionCount: number;
};
export function initialLearning(): Learning {
  return {
    revision: 1,
    followUp: null,
    diagnostic: [],
    mastery: Object.fromEntries(
      syllabus.concepts.map((c) => [
        c.id,
        {
          score: 0,
          attempts: 0,
          assessed: 0,
          demonstrated: 0,
          streak: 0,
          interval: 0,
          dueAt: null,
          lastAt: null,
          suspected: false,
          confirmed: false,
        },
      ]),
    ) as Learning["mastery"],
    current: null,
    draft: null,
    attempts: [],
    correctionCount: 0,
  };
}
export function normalizeLearning(state:Learning):Learning {
  const initial=initialLearning();
  return {...initial,...state,mastery:{...initial.mastery,...state.mastery}};
}
export const concept = (id: string) =>
  syllabus.concepts.find((c) => c.id === id)!;
export function masteryLabel(m: Mastery) {
  return !m.assessed
    ? "Not assessed"
    : m.score >= 0.8 && m.demonstrated >= 3
      ? "Demonstrated repeatedly"
      : m.score >= 0.5
        ? "Developing"
        : "Needs practice";
}
export function target(
  s: Learning,
  now = new Date().toISOString(),
): { id: ConceptId; mode: Question["mode"]; why: string } {
  const probe = supportedConcepts.find(
    (c) => s.mastery[c.id as ConceptId].suspected,
  );
  if (probe)
    return {
      id: probe.id as ConceptId,
      mode: "probe",
      why: "Check a suspected reasoning gap with a fresh example before recording a confirmed misconception.",
    };
  if (s.followUp)
    return {
      id: s.followUp,
      mode: "practice",
      why: "Alfred selected a focused follow-up to clarify or strengthen the reasoning on this concept.",
    };
  const diagnostic = supportedConcepts.find(
    (c) => !s.diagnostic.includes(c.id),
  );
  if (diagnostic)
    return {
      id: diagnostic.id as ConceptId,
      mode: "diagnostic",
      why: "Diagnostic: establish a baseline for each concept before choosing practice.",
    };
  const due = supportedConcepts
    .filter((c) => {
      const m = s.mastery[c.id as ConceptId];
      return m.dueAt && m.dueAt <= now;
    })
    .sort((a, b) =>
      s.mastery[a.id as ConceptId].dueAt!.localeCompare(
        s.mastery[b.id as ConceptId].dueAt!,
      ),
    )[0];
  if (due)
    return {
      id: due.id as ConceptId,
      mode: "review",
      why: "This concept is due for a spaced recall check.",
    };
  const weak = [...supportedConcepts].sort(
    (a, b) =>
      s.mastery[a.id as ConceptId].score - s.mastery[b.id as ConceptId].score,
  )[0];
  const prerequisite = weak.prerequisites.find(
    (id) => concept(id).supported && s.mastery[id as ConceptId].score < 0.5,
  );
  return {
    id: (prerequisite || weak.id) as ConceptId,
    mode: "practice",
    why: prerequisite
      ? "Strengthen this prerequisite before returning to the dependent concept."
      : "This is your least demonstrated concept. Fresh practice will test the gap.",
  };
}
export function publicQuestion(q: Question | null) {
  if (!q) return null;
  const { expected, teaching, ...rest } = q;
  return rest;
}
export function assess(q: Question, d: Draft, m: Mastery) {
  const correct = d.answer === q.expected;
  const outcome: Attempt["outcome"] =
    d.evidence.reason === "unclear"
      ? "unverified"
      : correct && d.evidence.reason === "supported"
        ? "demonstrated"
        : "needs_practice";
  const confirmed =
    d.evidence.reason === "misconception" && m.suspected && q.mode === "probe";
  const feedback =
    outcome === "demonstrated"
      ? "Your answer and explanation support this concept on this example. A later fresh question will check retention."
      : outcome === "unverified"
        ? "Your reasoning is not clear enough to assess. Explain the mathematical step in your own words; the mastery estimate is unchanged."
        : confirmed
          ? `The follow-up confirms a recurring reasoning gap. Please explain the disputed step so Alfred can guide your revision.`
          : d.evidence.reason === "misconception"
            ? "Your explanation suggests a reasoning gap. Alfred will ask a fresh follow-up before calling it a confirmed misconception."
            : `Your reasoning principle is supported, but the selected answer needs correction. Please explain the disputed step so Alfred can guide your revision.`;
  return { outcome, confirmed, feedback };
}
export function applyAnswer(
  s: Learning,
  d: Draft,
  action: string,
  now = new Date().toISOString(),
  teaching?: {feedback:string;source:string},
): Learning {
  if (s.attempts.some((t) => t.id === d.id)) return s;
  if (!s.current || s.current.id !== d.questionId)
    throw new Error("Question changed");
  const next = structuredClone(s),
    q = next.current!,
    m = next.mastery[q.concept];
  const result = assess(q, d, m),
    before = m.score;
  m.attempts++;
  m.lastAt = now;
  if (result.outcome !== "unverified") m.assessed++;
  if (result.outcome === "demonstrated") {
    m.score = Math.min(
      1,
      Math.round((m.score + 0.2 + q.level * 0.05) * 100) / 100,
    );
    m.demonstrated++;
    m.streak++;
    // Early extra practice must not push back a review already scheduled in the future.
    if (!m.dueAt || m.dueAt <= now) {
      m.interval = m.interval ? Math.min(30, m.interval * 2) : 1;
      m.dueAt = new Date(Date.parse(now) + m.interval * 86400000).toISOString();
    }
    m.suspected = false;
    m.confirmed = false;
  } else if (result.outcome === "needs_practice") {
    m.score = Math.max(0, Math.round((m.score - 0.25) * 100) / 100);
    m.streak = 0;
    m.interval = 0;
    m.dueAt = new Date(Date.parse(now) + 10 * 60000).toISOString();
    m.confirmed = result.confirmed || m.confirmed;
    m.suspected = d.evidence.reason === "misconception" && !m.confirmed;
  }
  if (
    q.mode === "diagnostic" &&
    result.outcome !== "unverified" &&
    !next.diagnostic.includes(q.concept)
  )
    next.diagnostic.push(q.concept);
  next.attempts.push({
    id: d.id,
    question: q,
    answer: d.answer,
    explanation: d.explanation,
    evidence: d.evidence,
    outcome: result.outcome,
    feedback: teaching?.feedback || result.feedback,
    source: teaching?.source || q.teaching?.source || concept(q.concept).source,
    at: now,
    before,
    after: m.score,
    action,
  });
  next.followUp =
    action === "probe_method" || action === "teach" || result.outcome === "unverified"
      ? q.concept
      : null;
  next.draft = null;
  next.current = null;
  return next;
}
export function correctAttempt(s: Learning, id: string): Learning {
  const index = s.attempts.findIndex((t) => t.id === id);
  if (index < 0) throw new Error("Attempt not found");
  let rebuilt = initialLearning();
  for (const t of s.attempts.slice(0, index)) {
    rebuilt.current = t.question;
    rebuilt = applyAnswer(
      rebuilt,
      {
        id: t.id,
        questionId: t.question.id,
        answer: t.answer,
        explanation: t.explanation,
        evidence: t.evidence,
      },
      t.action,
      t.at,
      {feedback:t.feedback,source:t.source},
    );
  }
  rebuilt.current = s.attempts[index].question;
  rebuilt.correctionCount = s.correctionCount + 1;
  return rebuilt;
}
export function relevantMemory(s: Learning, id: ConceptId) {
  return s.attempts
    .filter((t) => t.question.concept === id)
    .slice(-3)
    .map((t) => ({
      at: t.at,
      quote: t.evidence.quote,
      outcome: t.outcome,
      feedback: t.feedback,
    }));
}

export function appendDiscussion(s:Learning,id:string,explanation:string,feedback:string):Learning {
 if(s.current || !s.attempts.length) throw new Error("No completed question to discuss");
 if(s.attempts.some(t=>t.discussion?.some(r=>r.id===id))) return s;
 const next=structuredClone(s),attempt=next.attempts.at(-1)!;
 if((attempt.discussion?.length||0)>=30) throw new Error("Start a fresh practice question to continue");
 attempt.discussion=[...(attempt.discussion||[]),{id,explanation,feedback,at:new Date().toISOString()}];
 next.draft=null;
 return next;
}
