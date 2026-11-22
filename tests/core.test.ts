import test from "node:test";
import assert from "node:assert/strict";
import { polynomial, solutions, verifyWork } from "../lib/math.mjs";
import {
  evaluate,
  applyAssessment,
  correctFrom,
  notebook,
} from "../lib/learning";
import type { Interpretation, SessionState } from "../lib/pack";

function interpretation(
  overrides: Partial<Interpretation> = {},
): Interpretation {
  return {
    summary: "Student explanation",
    steps: [],
    solutions: [],
    solutionQuote: "",
    complete: false,
    method: "other",
    methodQuote: "",
    zeroCase: "not_discussed",
    zeroQuote: "",
    ambiguous: false,
    clarification: "",
    ...overrides,
  };
}
function session(): SessionState {
  return { questionIndex: 0, phase: "explain", draft: null, turns: [] };
}
function draft(work: Interpretation, id = "test-turn") {
  return { id, transcript: "test explanation", interpretation: work };
}

test("quadratic roots are exact across the supported family", () => {
  for (let k = -20; k <= 20; k++) {
    assert.deepEqual(
      solutions(`x^2=(${k})*x`).roots,
      [...new Set(["0", String(k)])].sort(),
    );
  }
});
test("fractions, decimal rationals and repeated roots", () => {
  assert.deepEqual(solutions("2*x^2=x").roots, ["0", "1/2"]);
  assert.deepEqual(solutions("(x-0.5)^2=0").roots, ["1/2"]);
  assert.deepEqual(solutions("x^2+1=0").roots, []);
});
test("unary signs respect exponent precedence", () => {
  assert.deepEqual(solutions("-x^2=-x").roots, ["0", "1"]);
  assert.deepEqual(solutions("(-x)^2=x").roots, ["0", "1"]);
});
test("identity and contradiction are distinct", () => {
  assert.equal(solutions("x=x").kind, "all");
  assert.deepEqual(solutions("1=2"), { kind: "finite", roots: [] });
});
test("reject unsafe code and unsupported expressions", () => {
  for (const expression of [
    "globalThis.process.exit()",
    "sqrt(x)",
    "x^3",
    "x/x",
    "1/0",
    "x+",
    "(x",
    "x**2",
    "2e5",
  ])
    assert.throws(() => polynomial(expression));
  assert.throws(() => solutions("x^2=2"), /Irrational/);
});
test("losing zero asks a probe without diagnosing a misconception", () => {
  const work = interpretation({
    solutions: ["1"],
    complete: true,
    method: "divide_by_x",
    steps: [{ equation: "x=1", quote: "x equals one" }],
  });
  const result = evaluate(session(), work);
  assert.equal(result.verification.lostZero, true);
  assert.equal(result.confirmedMisconception, false);
  assert.equal(result.suggested, "probe_zero");
  assert.ok(!result.allowed.includes("teach"));
});
test("correct final answers alone never establish reasoning", () => {
  const result = evaluate(
    session(),
    interpretation({ solutions: ["0", "1"], complete: true }),
  );
  assert.equal(result.evidenceStatus, "correct_answer_reasoning_unchecked");
  assert.ok(!result.allowed.includes("retest"));
});
test("valid factorisation unlocks transfer", () => {
  const work = interpretation({
    solutions: ["0", "1"],
    complete: true,
    method: "factorisation",
    steps: [{ equation: "x*(x-1)=0", quote: "factor it" }],
  });
  assert.equal(evaluate(session(), work).reasoningSupported, true);
  const result = applyAssessment(session(), draft(work), {
    choice: "retest",
    confidence: 0.9,
  });
  assert.equal(result.questionIndex, 1);
});
test("parentheses alone do not establish a factored proof", () => {
  const work = interpretation({
    solutions: ["0", "1"],
    complete: true,
    method: "factorisation",
    steps: [{ equation: "x*(x)=x", quote: "group x" }],
  });
  assert.equal(evaluate(session(), work).reasoningSupported, false);
});
test("supported alternative zero/nonzero case split is accepted", () => {
  const work = interpretation({
    solutions: ["0", "1"],
    complete: true,
    method: "case_split",
    zeroCase: "valid",
    steps: [{ equation: "x=1", quote: "when nonzero x is one" }],
  });
  assert.equal(evaluate(session(), work).reasoningSupported, true);
});
test("an invalid intermediate step prevents completion despite correct roots", () => {
  const work = interpretation({
    solutions: ["0", "1"],
    complete: true,
    method: "factorisation",
    steps: [
      { equation: "x*(x-1)=0", quote: "factor" },
      { equation: "x=2", quote: "two" },
    ],
  });
  assert.ok(!evaluate(session(), work).allowed.includes("retest"));
});
test("misconception requires an explicit rejection after the zero probe", () => {
  const work = interpretation({
    zeroCase: "invalid",
    zeroQuote: "zero cannot work",
  });
  assert.equal(evaluate(session(), work).confirmedMisconception, false);
  assert.equal(
    evaluate({ ...session(), phase: "probe_zero" }, work)
      .confirmedMisconception,
    true,
  );
});
test("ambiguous wording never enables a confirmed diagnosis or transfer", () => {
  const result = evaluate(
    { ...session(), phase: "probe_zero" },
    interpretation({ zeroCase: "invalid", ambiguous: true }),
  );
  assert.equal(result.evidenceStatus, "needs_clarification");
  assert.ok(!result.allowed.includes("teach"));
});
test("unverified mathematical syntax cannot pass as correct", () => {
  const result = verifyWork(
    "x^2=x",
    interpretation({ solutions: ["garbage"], complete: true }),
  );
  assert.equal(result.status, "unverified");
  assert.equal(result.complete, false);
});
test("a forbidden Decisions action cannot advance the learner", () => {
  assert.throws(() =>
    applyAssessment(session(), draft(interpretation()), {
      choice: "retest",
      confidence: 1,
    }),
  );
});
test("correcting an earlier transcript removes all dependent active evidence", () => {
  const first = applyAssessment(
    session(),
    draft(interpretation({ solutions: ["1"], complete: true }), "first"),
    { choice: "probe_zero", confidence: 0.9 },
  );
  const second = applyAssessment(
    first,
    draft(interpretation({ zeroCase: "invalid" }), "second"),
    { choice: "teach", confidence: 0.9 },
  );
  assert.equal(notebook(second).length, 2);
  const corrected = correctFrom(second, "first");
  assert.equal(corrected.turns.length, 0);
  assert.equal(notebook(corrected).length, 0);
  assert.equal(corrected.phase, "explain");
});
