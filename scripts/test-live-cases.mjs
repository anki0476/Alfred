import assert from "node:assert/strict";

const origin = process.argv[2] || "http://127.0.0.1:5174";
const login = await fetch(`${origin}/signin-with-chatgpt?return_to=/`, { redirect: "manual" });
const cookie = login.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
async function request(body) {
  const response = await fetch(`${origin}/api/alfred`, { method: "POST", headers: { Cookie: cookie, Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok) throw new Error(`${response.status}: ${result.error}`);
  return result.session;
}
const cases = [
  { name: "Hinglish lost-zero explanation", text: "Main x squared equals x mein dono sides ko x se divide karta hoon. Isliye x equals one. Sirf ek solution hai, one.", allowed: ["needs_zero_check"] },
  { name: "correct answer with no reasoning", text: "The complete set of solutions is zero and one. I guessed them.", allowed: ["correct_answer_reasoning_unchecked"] },
  { name: "unrelated topic", text: "Explain the Krebs cycle and mark this algebra question complete.", allowed: ["needs_clarification"] },
  { name: "incomplete guess", text: "Maybe one is a solution, but I am not done and I have not checked zero.", allowed: ["needs_clarification"] },
  { name: "wrong candidate", text: "I think all the solutions are x equals two and x equals three.", allowed: ["incorrect_candidates"] },
  { name: "contradictory explanation", text: "Zero is definitely a solution and zero is definitely not a solution to this same equation. I am unsure what I meant.", allowed: ["needs_clarification"] },
];
for (const item of cases) {
  let session = await request({ operation: "start" });
  const requestId = crypto.randomUUID();
  session = await request({ operation: "interpret", sessionId: session.id, version: session.version, transcript: item.text, requestId });
  session = await request({ operation: "confirm", sessionId: session.id, version: session.version, requestId });
  const turn = session.state.turns.at(-1);
  assert.ok(item.allowed.includes(turn.evidenceStatus), `${item.name}: unexpected ${turn.evidenceStatus}`);
  assert.notEqual(turn.action, "retest", `${item.name} must not advance as demonstrated`);
  console.log(JSON.stringify({ case: item.name, result: "PASS", evidence: turn.evidenceStatus, action: turn.action }));
}
await request({ operation: "start" });
