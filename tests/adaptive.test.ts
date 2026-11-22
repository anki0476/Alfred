import {generateQuestion} from "./fixtures/questions";
import test from "node:test";
import assert from "node:assert/strict";
import {
  initialLearning,
  applyAnswer,
  correctAttempt,
  target,
  masteryLabel,
  publicQuestion,
  relevantMemory,
  syllabus,
  supportedConcepts, diagnosticCount,
  type Learning,
  type Reason,
} from "../lib/adaptive";
const now = "2026-11-21T12:00:00.000Z";
function answer(
  s: Learning,
  reason: Reason = "supported",
  correct = true,
  at = now,
) {
  const q = s.current!;
  return applyAnswer(
    s,
    {
      id: crypto.randomUUID(),
      questionId: q.id,
      answer: correct ? q.expected : q.options.find((x) => x !== q.expected)!,
      explanation: "An explicit explanation",
      evidence: { reason, quote: "explicit explanation", summary: "Evidence" },
    },
    "retest",
    at,
  );
}
function diagnostic() {
  let s = initialLearning();
  for (let i = 0; i < diagnosticCount; i++) {
    s.current = generateQuestion(s, now);
    s = answer(s);
  }
  return s;
}
test("diagnostic covers all supported concepts and changes only the tested concept", () => {
  let s = initialLearning();
  for (let i = 0; i < diagnosticCount; i++) {
    s.current = generateQuestion(s, now);
    const id = s.current.concept,
      before = structuredClone(s.mastery);
    s = answer(s);
    assert.equal(s.diagnostic.length, i + 1);
    for (const c of syllabus.concepts)
      if (c.id !== id)
        assert.deepEqual(
          s.mastery[c.id as keyof typeof before],
          before[c.id as keyof typeof before],
        );
  }
  assert.equal(new Set(s.diagnostic).size, diagnosticCount);
});
test("unclear reasoning neither advances diagnostic nor claims mastery", () => {
  let s = initialLearning();
  s.current = generateQuestion(s, now);
  s = answer(s, "unclear");
  assert.equal(s.diagnostic.length, 0);
  assert.equal(s.mastery.factor.score, 0);
  assert.equal(s.mastery.factor.assessed, 0);
  assert.equal(masteryLabel(s.mastery.factor), "Not assessed");
  assert.equal(s.mastery.factor.dueAt, null);
});
test("correct final answer with explicit incorrect reasoning cannot pass", () => {
  let s = initialLearning();
  s.current = generateQuestion(s, now);
  s = answer(s, "misconception", true);
  assert.equal(s.attempts[0].outcome, "needs_practice");
  assert.equal(s.mastery.factor.demonstrated, 0);
  assert.equal(s.mastery.factor.suspected, true);
  assert.equal(s.mastery.factor.confirmed, false);
});
test("wrong numerical answer with supported principle is not a misconception", () => {
  let s = initialLearning();
  s.current = generateQuestion(s, now);
  s = answer(s, "supported", false);
  assert.equal(s.mastery.factor.confirmed, false);
  assert.equal(s.mastery.factor.suspected, false);
});
test("a fresh probe confirms recurring incorrect reasoning, then success resolves it", () => {
  let s = diagnostic();
  s.current = generateQuestion(s, now);
  const id = s.current.concept;
  s = answer(s, "misconception");
  assert.equal(target(s, now).mode, "probe");
  s.current = generateQuestion(s, now);
  s = answer(s, "misconception");
  assert.equal(s.mastery[id].confirmed, true);
  s.current = generateQuestion(s, now);
  s = answer(s);
  assert.equal(s.mastery[id].confirmed, false);
});
test("successful recall expands intervals; early practice cannot postpone due review", () => {
  let s = initialLearning();
  s.current = generateQuestion(s, now);
  s = answer(s);
  const due = s.mastery.factor.dueAt;
  assert.equal(due, "2026-11-22T12:00:00.000Z");
  s.diagnostic = syllabus.concepts.map((c) => c.id);
  s.current = generateQuestion(s, now);
  s.current.concept = "factor";
  s = answer(s);
  assert.equal(s.mastery.factor.dueAt, due);
  s.current = generateQuestion(s, due!);
  assert.equal(s.current.concept, "factor");
  s = answer(s, "supported", true, due!);
  assert.equal(s.mastery.factor.interval, 2);
  assert.equal(s.mastery.factor.dueAt, "2026-11-24T12:00:00.000Z");
});
test("lapse schedules a ten-minute revisit and lowers evidence estimate", () => {
  let s = diagnostic();
  s.current = generateQuestion(s, now);
  const id = s.current.concept;
  s = answer(s, "supported", false);
  assert.equal(s.mastery[id].score, 0);
  assert.equal(s.mastery[id].dueAt, "2026-11-21T12:10:00.000Z");
});
test("overdue reviews take precedence over ordinary practice", () => {
  const s = diagnostic();
  s.mastery.product.dueAt = "2026-11-20T12:00:00.000Z";
  assert.deepEqual(
    { id: target(s, now).id, mode: target(s, now).mode },
    { id: "product", mode: "review" },
  );
});
test("weak prerequisites are selected before a dependent concept", () => {
  const s = diagnostic();
  s.mastery.complete.score = 0;
  s.mastery.product.score = 0.25;
  s.mastery.factor.score = 0.9;
  s.mastery.division.score = 0.8;
  assert.equal(target(s, now).id, "product");
});
test("difficulty rises with evidence and all generated templates verify", () => {
  for (const c of supportedConcepts)
    for (const score of [0, 0.5, 0.9]) {
      let s = diagnostic();
      s.mastery[c.id as keyof Learning["mastery"]].score = score;
      s.diagnostic = syllabus.concepts
        .filter((x) => x.id !== c.id)
        .map((x) => x.id);
      for (let i = 0; i < 25; i++) {
        s.correctionCount = i;
        const q = generateQuestion(s, now);
        assert.equal(q.options.filter((x) => x === q.expected).length, 1);
        assert.ok(q.k !== 0 && q.a !== 0);
      }
    }
  const s = diagnostic();
  Object.values(s.mastery).forEach((m) => (m.score = 0.9));
  assert.equal(generateQuestion(s, now).level, 3);
});
test("confirmation retry is idempotent and correction rebuilds dependent state", () => {
  const s = diagnostic(),
    t = s.attempts[0];
  assert.equal(
    applyAnswer(
      s,
      {
        id: t.id,
        questionId: t.question.id,
        answer: t.answer,
        explanation: t.explanation,
        evidence: t.evidence,
      },
      t.action,
    ),
    s,
  );
  const rebuilt = correctAttempt(s, s.attempts[1].id);
  assert.equal(rebuilt.attempts.length, 1);
  assert.equal(rebuilt.diagnostic.length, 1);
  assert.equal(rebuilt.mastery.product.score, 0);
  assert.equal(rebuilt.mastery.product.dueAt, null);
  assert.equal(rebuilt.current?.concept, "product");
});
test("public question omits answer key and memory is scoped to its concept", () => {
  const s = diagnostic();
  assert.ok(!("expected" in publicQuestion(generateQuestion(s, now))!));
  assert.equal(relevantMemory(s, "factor").length, 1);
  assert.equal(relevantMemory(s, "factor")[0].quote, "explicit explanation");
});
