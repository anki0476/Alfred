export const pack = {
  id: "algebra-zero-v1",
  title: "The solution that disappears",
  subtitle: "Quadratic equations · Real numbers",
  version: 1,
  scope:
    "Equations x² = kx, where k is a small nonzero integer. Factorisation, the zero-product rule and division by a variable. This first pack does not assess arbitrary uploaded material.",
  concepts: [
    {
      id: "zero-product",
      title: "Zero-product rule",
      prerequisite: "factorisation",
    },
    {
      id: "division-domain",
      title: "When division is valid",
      prerequisite: "zero-product",
    },
    {
      id: "solution-check",
      title: "Checking every solution",
      prerequisite: "division-domain",
    },
  ],
  sources: [
    {
      id: "S1",
      title: "Keep the zero case",
      text: "For real numbers, dividing by x is permitted only when x ≠ 0. Before dividing, consider x = 0 separately in the original equation. An operation can lose solutions if its restriction is ignored.",
    },
    {
      id: "S2",
      title: "Factor, then consider both factors",
      text: "Rewrite x² = kx as x² − kx = 0, then factor to x(x − k) = 0. A product of real numbers equals zero exactly when at least one factor equals zero. Thus x = 0 or x = k. Both must be checked in the original equation.",
    },
    {
      id: "S3",
      title: "What checking establishes",
      text: "Substituting a candidate in the original equation establishes whether it is a solution. Checking one candidate does not establish that all solutions have been found. Factoring the polynomial and considering every factor establishes completeness for this question family.",
    },
  ],
  questions: [
    {
      id: "initial",
      equation: "x^2=x",
      display: "x² = x",
      k: 1,
      prompt:
        "Find every real solution. Teach me how you know your method keeps every possibility.",
    },
    {
      id: "transfer",
      equation: "x^2=3*x",
      display: "x² = 3x",
      k: 3,
      prompt:
        "Try a fresh example. Find every real solution and explain the step that keeps zero in consideration.",
    },
    {
      id: "revision",
      equation: "x^2=-2*x",
      display: "x² = −2x",
      k: -2,
      prompt:
        "Revisit the same idea with a negative coefficient. Explain how you find all the solutions.",
    },
  ],
} as const;

export type Interpretation = {
  summary: string;
  steps: { equation: string; quote: string }[];
  solutions: string[];
  solutionQuote: string;
  complete: boolean;
  method:
    "factorisation" | "case_split" | "divide_by_x" | "substitution" | "other";
  methodQuote: string;
  zeroCase: "valid" | "invalid" | "unsure" | "not_discussed";
  zeroQuote: string;
  ambiguous: boolean;
  clarification: string;
};

export type Action =
  "clarify" | "probe_zero" | "probe_method" | "teach" | "retest";
export type Verification = {
  status: string;
  reason?: string;
  expected: string[];
  proposed: string[];
  missing: string[];
  extra: string[];
  steps: { equation: string; equivalent: boolean; roots: string[] }[];
  complete: boolean;
  lostZero: boolean;
};
export type Turn = {
  id: string;
  transcript: string;
  interpretation: Interpretation;
  questionIndex: number;
  phase: string;
  feedback: string;
  action: Action;
  evidenceStatus: string;
  verification: Verification;
  decision: { suggested: string; applied: Action; confidence: number | null };
  sourceIds: string[];
  createdAt: string;
};
export type SessionState = {
  questionIndex: number;
  phase: "explain" | "probe_zero" | "probe_method" | "refine" | "complete";
  draft: {
    id: string;
    transcript: string;
    interpretation: Interpretation;
  } | null;
  turns: Turn[];
};
export type Session = { id: string; version: number; state: SessionState };
