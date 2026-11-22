import {
  pack,
  type Action,
  type Interpretation,
  type SessionState,
  type Turn,
  type Verification,
} from "./pack";
import { verifyWork, polynomial } from "./math.mjs";

export function evaluate(state: SessionState, interpretation: Interpretation) {
  const question = pack.questions[state.questionIndex];
  const verification: Verification = verifyWork(
    question.equation,
    interpretation,
  );
  const methodSteps = verification.steps.filter(
    (step) => step.equivalent && step.equation !== question.equation,
  );
  const factorisationShown =
    interpretation.method === "factorisation" &&
    methodSteps.some((step) => {
      const [left, right] = step.equation.replace(/\s+/g, "").split("=");
      const zeroRightSide = polynomial(right).every(
        (coefficient: { n: bigint }) => coefficient.n === 0n,
      );
      return zeroRightSide && /x\*?\(|\)\*?x|\)\*?\(/.test(left);
    });
  // Explicit zero-case handling may justify the nonzero branch x=k. Other
  // nonequivalent equations remain a reason to clarify, even with correct roots.
  const invalidStep = verification.steps.some(
    (step) =>
      !step.equivalent &&
      !(
        interpretation.method === "case_split" &&
        interpretation.zeroCase === "valid" &&
        step.roots.length === 1 &&
        step.roots[0] === String(question.k)
      ),
  );
  const nonzeroBranchShown = verification.steps.some(
    (step) => step.roots.length === 1 && step.roots[0] === String(question.k),
  );
  const reasoningSupported =
    verification.complete &&
    !invalidStep &&
    (factorisationShown ||
      (interpretation.method === "case_split" &&
        interpretation.zeroCase === "valid" &&
        nonzeroBranchShown));
  const confirmedMisconception =
    state.phase === "probe_zero" && interpretation.zeroCase === "invalid";
  let suggested: Action = "clarify";
  let evidenceStatus = "needs_clarification";
  let allowed: Action[] = ["clarify", "probe_method"];
  if (!interpretation.ambiguous && verification.status === "checked") {
    if (confirmedMisconception) {
      suggested = "teach";
      evidenceStatus = "confirmed_misconception";
      allowed = ["teach", "clarify"];
    } else if (
      state.phase === "probe_zero" &&
      interpretation.zeroCase === "valid"
    ) {
      suggested = "teach";
      evidenceStatus = "zero_case_recognised";
      allowed = ["teach", "probe_method", "clarify"];
    } else if (verification.lostZero) {
      suggested = "probe_zero";
      evidenceStatus = "needs_zero_check";
      allowed = ["probe_zero", "clarify"];
    } else if (reasoningSupported) {
      suggested = "retest";
      evidenceStatus = "demonstrated_on_this_example";
      allowed = ["retest", "probe_method", "clarify"];
    } else if (verification.complete && !invalidStep) {
      suggested = "probe_method";
      evidenceStatus = "correct_answer_reasoning_unchecked";
      allowed = ["probe_method", "clarify"];
    } else if (verification.extra.length) {
      suggested = "teach";
      evidenceStatus = "incorrect_candidates";
      allowed = ["teach", "clarify"];
    }
  }
  if (
    interpretation.ambiguous ||
    verification.status === "unverified" ||
    (invalidStep && !verification.lostZero)
  )
    allowed = ["clarify", "probe_method"];
  return {
    verification,
    reasoningSupported,
    confirmedMisconception,
    suggested,
    evidenceStatus,
    allowed,
  };
}

export function applyAssessment(
  state: SessionState,
  draft: NonNullable<SessionState["draft"]>,
  routing: { choice: Action; confidence: number | null },
  now = new Date().toISOString(),
): SessionState {
  const result = evaluate(state, draft.interpretation);
  if (!result.allowed.includes(routing.choice))
    throw new Error("Action is not permitted by the verifier.");
  const action = routing.choice;
  const question = pack.questions[state.questionIndex];
  let phase = state.phase;
  let questionIndex = state.questionIndex;
  let feedback: string;
  let sourceIds: string[] = [];
  switch (action) {
    case "clarify":
      feedback =
        draft.interpretation.ambiguous && draft.interpretation.clarification
          ? draft.interpretation.clarification
          : "Please write or say the equation at each step, the solutions you found, and why those are all the possibilities. I have kept this attempt unverified.";
      break;
    case "probe_zero":
      phase = "probe_zero";
      feedback = `Before we decide whether a solution was lost, substitute x = 0 into ${question.display}. Does it satisfy the original equation? Explain what that means for dividing by x.`;
      sourceIds = ["S1"];
      break;
    case "probe_method":
      phase = "probe_method";
      feedback = result.verification.complete
        ? "Your proposed solutions check out. Please show a factored equation or a split into the zero and nonzero cases, and explain why this finds every solution."
        : "Show how you rewrite the original equation before solving it. Explain how your method accounts for x = 0, and give the complete solution set.";
      sourceIds = ["S2", "S3"];
      break;
    case "teach":
      phase = "refine";
      feedback = `For ${question.display}, move the right side to the left and factor: x(x − (${question.k})) = 0. The zero-product rule gives x = 0 or x = ${question.k}. Dividing by x only covers x ≠ 0, so check zero separately. Now explain the solution again in your own words, including both possibilities.`;
      sourceIds = ["S1", "S2"];
      break;
    case "retest":
      sourceIds = ["S1", "S2", "S3"];
      if (state.questionIndex < 1) {
        questionIndex = 1;
        phase = "explain";
        feedback =
          "Both solutions and your algebraic steps are verified for this example. Now apply the idea to x squared equals three x. Explain how you keep every solution.";
      } else {
        phase = "complete";
        feedback =
          "You have provided a complete solution set and supported algebraic steps for this example. Your evidence is saved. Revisit the idea tomorrow with a fresh coefficient to check recall.";
      }
      break;
  }
  const turn: Turn = {
    id: draft.id,
    transcript: draft.transcript,
    interpretation: draft.interpretation,
    questionIndex: state.questionIndex,
    phase: state.phase,
    feedback,
    action,
    evidenceStatus: result.evidenceStatus,
    verification: result.verification,
    decision: {
      suggested: routing.choice,
      applied: action,
      confidence: routing.confidence,
    },
    sourceIds,
    createdAt: now,
  };
  return { questionIndex, phase, draft: null, turns: [...state.turns, turn] };
}

export function correctFrom(state: SessionState, turnId: string) {
  const index = state.turns.findIndex((turn) => turn.id === turnId);
  if (index < 0) throw new Error("Attempt not found.");
  const turn = state.turns[index];
  return {
    questionIndex: turn.questionIndex,
    phase: turn.phase as SessionState["phase"],
    draft: null,
    turns: state.turns.slice(0, index),
  };
}

export function notebook(state: SessionState) {
  return state.turns.filter((turn) =>
    [
      "confirmed_misconception",
      "correct_answer_reasoning_unchecked",
      "needs_zero_check",
      "incorrect_candidates",
    ].includes(turn.evidenceStatus),
  );
}
