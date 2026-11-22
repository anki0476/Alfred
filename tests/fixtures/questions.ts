// Deterministic state-transition fixtures. Never imported by the app.
import {solutions,polynomial} from "../../lib/math.mjs";
import {concept,target,type Learning,type ConceptId,type Question} from "../../lib/adaptive";
import {expandedQuestion} from "./curriculum-questions";
export function generateQuestion(
  s: Learning,
  now = new Date().toISOString(),
  id = crypto.randomUUID(),
  reviewConcept?: ConceptId,
): Question {
  if(reviewConcept && !concept(reviewConcept)?.supported) throw new Error("This concept is mapped only; tutoring is not supported yet.");
  const next = reviewConcept ? {id:reviewConcept,mode:"review" as const,why:"Revisit a concept from your mistake notebook with a fresh question."} : target(s, now),
    m = s.mastery[next.id];
  const level =
    next.mode === "diagnostic" || next.mode === "probe"
      ? 1
      : m.score >= 0.7
        ? 3
        : m.score >= 0.35
          ? 2
          : 1;
  const n = s.attempts.length + s.correctionCount;
  if(!["factor","product","division","complete"].includes(next.id)) {
    let generated; try {generated=expandedQuestion(next.id,level,n);} catch {generated={prompt:"State transition test fixture",equation:"1+1",options:["2","1","0"],expected:"2"};}
    return {...generated,id,concept:next.id,level,k:1,a:1,mode:next.mode,why:next.why,createdAt:now};
  }
  const k = level === 1 ? 2 + (n % 7) : -(2 + (n % 13));
  const a = level === 3 ? 2 + (n % 4) : 1;
  const equation = `${a}*x^2=${a * k}*x`;
  const factored = `${a}*x*(x-(${k}))`;
  const all = `0 and ${k}`;
  let prompt: string, options: string[], expected: string;
  switch (next.id) {
    case "factor":
      prompt = `Factor ${a}x² − (${a * k})x. Explain how multiplying your factors reconstructs both terms.`;
      options = [factored, `${a}*x*(x+(${k}))`, `x-(${k})`];
      expected = factored;
      break;
    case "product":
      prompt = `Solve ${factored} = 0. Explain which factors can be zero and why.`;
      options = [all, `${k} only`, "0 only"];
      expected = all;
      break;
    case "division":
      prompt = `A student divides ${equation} by x and reports x = ${k}. What must they do to keep every solution? Explain what happens when x = 0.`;
      options = [
        "Check x = 0 separately, then divide only when x ≠ 0",
        "Divide for every x, including zero",
        "Reject x = 0 because division by zero is undefined",
      ];
      expected = options[0];
      break;
    default:
      prompt = `For ${equation}, a student checks x = ${k} by substitution. Is that enough to prove they found every solution? Explain how to establish completeness.`;
      options = [
        "No: consider both factors or split zero and nonzero cases",
        "Yes: one successful substitution proves completeness",
        "No: zero can never solve a quadratic",
      ];
      expected = options[0];
  }
  // Each generated numerical instance is checked independently by exact arithmetic.
  const roots = solutions(equation).roots;
  if (
    JSON.stringify([...roots].sort()) !==
    JSON.stringify(["0", String(k)].sort())
  )
    throw new Error("Question verification failed");
  if (
    JSON.stringify(
      polynomial(factored).map(
        (v: { n: bigint; d: bigint }) => `${v.n}/${v.d}`,
      ),
    ) !==
    JSON.stringify(
      polynomial(`${a}*x^2-(${a * k})*x`).map(
        (v: { n: bigint; d: bigint }) => `${v.n}/${v.d}`,
      ),
    )
  )
    throw new Error("Factorisation verification failed");
  const rotate = n % options.length;
  options = [...options.slice(rotate), ...options.slice(0, rotate)];
  return {
    id,
    concept: next.id,
    level,
    k,
    a,
    mode: next.mode,
    prompt: next.mode === "probe" ? `Follow-up check: ${prompt}` : prompt,
    equation,
    options,
    expected,
    why: next.why,
    createdAt: now,
  };
}
