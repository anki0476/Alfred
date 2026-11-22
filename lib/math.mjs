// Exact rational arithmetic. The grammar deliberately supports only real
// polynomials of degree <= 2, with rational constants and rational roots.
function gcd(a, b) {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a || 1n;
}
function rational(n, d = 1n) {
  if (d === 0n) throw new Error("Division by zero is undefined.");
  if (d < 0n) {
    n = -n;
    d = -d;
  }
  const divisor = gcd(n, d);
  return { n: n / divisor, d: d / divisor };
}
const zero = () => rational(0n);
const add = (a, b) => rational(a.n * b.d + b.n * a.d, a.d * b.d);
const negate = (a) => rational(-a.n, a.d);
const multiply = (a, b) => rational(a.n * b.n, a.d * b.d);
const divide = (a, b) => rational(a.n * b.d, a.d * b.n);
const label = (a) => (a.d === 1n ? String(a.n) : `${a.n}/${a.d}`);
const constant = (a) => [a, zero(), zero()];
const sum = (a, b) => a.map((value, i) => add(value, b[i]));
function product(a, b) {
  const result = Array.from({ length: 5 }, zero);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++)
      result[i + j] = add(result[i + j], multiply(a[i], b[j]));
  }
  if (result[3].n || result[4].n)
    throw new Error("This checker supports degree two or lower.");
  return result.slice(0, 3);
}

export function polynomial(expression) {
  if (typeof expression !== "string" || expression.length > 180)
    throw new Error("Use a short algebraic expression.");
  const normalized = expression
    .toLowerCase()
    .replaceAll("²", "^2")
    .replaceAll("−", "-")
    .replaceAll("×", "*")
    .replace(/\s+/g, "");
  const tokens = normalized.match(/\d+(?:\.\d+)?|x|[()+*/^\-]/g) || [];
  if (!tokens.length || tokens.join("") !== normalized)
    throw new Error(
      "Unsupported notation. Use x, numbers, parentheses and arithmetic signs.",
    );
  if (tokens.length > 80)
    throw new Error("The expression is too long to verify.");
  let index = 0;
  function primary() {
    const token = tokens[index++];
    if (token === "(") {
      const value = expressionSum();
      if (tokens[index++] !== ")") throw new Error("Check the parentheses.");
      return value;
    }
    if (token === "x") return [zero(), rational(1n), zero()];
    if (!token || !/^\d+(\.\d+)?$/.test(token) || token.length > 12)
      throw new Error("Expected a number or x.");
    const digits = token.split(".");
    return constant(
      rational(BigInt(digits.join("")), 10n ** BigInt(digits[1]?.length || 0)),
    );
  }
  function power() {
    let value = primary();
    if (tokens[index] === "^") {
      index++;
      const exponent = tokens[index++];
      if (!["0", "1", "2"].includes(exponent))
        throw new Error("Only powers zero, one and two are supported.");
      if (exponent === "0") value = constant(rational(1n));
      if (exponent === "2") value = product(value, value);
    }
    return value;
  }
  function unary() {
    if (tokens[index] === "-") {
      index++;
      return unary().map(negate);
    }
    if (tokens[index] === "+") {
      index++;
      return unary();
    }
    return power();
  }
  function term() {
    let value = unary();
    while (index < tokens.length) {
      const token = tokens[index];
      if (token === "*" || token === "/") {
        index++;
        const right = unary();
        if (token === "/") {
          if (right[1].n || right[2].n)
            throw new Error(
              "A variable denominator needs a separate domain check. Please explain the excluded case.",
            );
          value = value.map((part) => divide(part, right[0]));
        } else value = product(value, right);
      } else if (token === "x" || token === "(" || /^\d/.test(token)) {
        value = product(value, unary());
      } else break;
    }
    return value;
  }
  function expressionSum() {
    let value = term();
    while (["+", "-"].includes(tokens[index])) {
      const operator = tokens[index++];
      const right = term();
      value = sum(value, operator === "-" ? right.map(negate) : right);
    }
    return value;
  }
  const result = expressionSum();
  if (index !== tokens.length)
    throw new Error("Unexpected notation in the equation.");
  return result;
}

function squareRoot(n) {
  if (n < 0n) return null;
  if (n < 2n) return n;
  let current = n;
  let next = (current + 1n) / 2n;
  while (next < current) {
    current = next;
    next = (current + n / current) / 2n;
  }
  return current * current === n ? current : null;
}

export function solutions(equation) {
  if (typeof equation !== "string") throw new Error("An equation is required.");
  const sides = equation.split("=");
  if (sides.length !== 2) throw new Error("Use one equals sign.");
  const [c, b, a] = sum(polynomial(sides[0]), polynomial(sides[1]).map(negate));
  if (!a.n && !b.n)
    return c.n ? { kind: "finite", roots: [] } : { kind: "all", roots: [] };
  if (!a.n) return { kind: "finite", roots: [label(divide(negate(c), b))] };
  const discriminant = add(
    multiply(b, b),
    negate(multiply(rational(4n), multiply(a, c))),
  );
  if (discriminant.n < 0n) return { kind: "finite", roots: [] };
  const numerator = squareRoot(discriminant.n);
  const denominator = squareRoot(discriminant.d);
  if (numerator === null || denominator === null)
    throw new Error("Irrational roots are outside this first practice pack.");
  const root = rational(numerator, denominator);
  const divisor = multiply(rational(2n), a);
  return {
    kind: "finite",
    roots: [
      ...new Set([
        label(divide(add(negate(b), root), divisor)),
        label(divide(add(negate(b), negate(root)), divisor)),
      ]),
    ].sort(),
  };
}

export function normalizeRoot(value) {
  const result = polynomial(value);
  if (result[1].n || result[2].n)
    throw new Error("A proposed solution must be a number.");
  return label(result[0]);
}

export function verifyWork(equation, work) {
  const expected = solutions(equation);
  try {
    const proposed = [...new Set(work.solutions.map(normalizeRoot))].sort();
    const missing = expected.roots.filter((root) => !proposed.includes(root));
    const extra = proposed.filter((root) => !expected.roots.includes(root));
    const steps = work.steps.map((step) => {
      const result = solutions(step.equation);
      const equivalent =
        result.kind === expected.kind &&
        JSON.stringify(result.roots) === JSON.stringify(expected.roots);
      return { equation: step.equation, equivalent, roots: result.roots };
    });
    return {
      status: "checked",
      expected: expected.roots,
      proposed,
      missing,
      extra,
      steps,
      complete:
        work.complete &&
        proposed.length > 0 &&
        missing.length === 0 &&
        extra.length === 0,
      lostZero:
        work.complete &&
        missing.includes("0") &&
        extra.length === 0 &&
        proposed.length > 0,
    };
  } catch (error) {
    return {
      status: "unverified",
      reason:
        error instanceof Error
          ? error.message
          : "Unable to verify this notation.",
      expected: expected.roots,
      proposed: [],
      missing: [],
      extra: [],
      steps: [],
      complete: false,
      lostZero: false,
    };
  }
}
