import assert from "node:assert/strict";

const origin = process.argv[2] || "http://127.0.0.1:5174";
const login = await fetch(`${origin}/signin-with-chatgpt?return_to=/`, { redirect: "manual" });
const cookie = login.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
assert.ok(cookie, "Local development sign-in must issue a cookie.");
async function request(body) {
  const response = await fetch(`${origin}/api/alfred`, {
    method: body ? "POST" : "GET",
    headers: { Cookie: cookie, Origin: origin, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json();
  assert.ok(response.ok, `${response.status}: ${result.error || "request failed"}`);
  return result;
}
let { session } = await request({ operation: "start" });
async function turn(transcript) {
  const requestId = crypto.randomUUID();
  const initialVersion = session.version;
  ({ session } = await request({ operation: "interpret", sessionId: session.id, version: initialVersion, transcript, requestId }));
  console.log(JSON.stringify({ step: "interpreted", interpretation: session.state.draft.interpretation }));
  const draftVersion = session.version;
  ({ session } = await request({ operation: "confirm", sessionId: session.id, version: draftVersion, requestId }));
  const result = session.state.turns.at(-1);
  console.log(JSON.stringify({ step: "assessed", evidence: result.evidenceStatus, action: result.action, phase: session.state.phase }));
  const replay = await request({ operation: "confirm", sessionId: session.id, version: draftVersion, requestId });
  assert.equal(replay.session.state.turns.length, session.state.turns.length, "A retry must not duplicate an assessment.");
  return result;
}
const first = await turn("For x squared equals x, I divide both sides by x and get x equals one. The only solution is one.");
assert.equal(first.evidenceStatus, "needs_zero_check");
assert.equal(first.action, "probe_zero");
const second = await turn("Zero is not a solution to the original equation because division by zero is undefined.");
assert.equal(second.evidenceStatus, "confirmed_misconception");
assert.equal(second.action, "teach");
const third = await turn("I subtract x to get x^2-x=0 and factor to x*(x-1)=0. A product is zero when either factor is zero, so all solutions are x=0 or x=1. Zero is a valid solution in the original equation.");
assert.equal(third.evidenceStatus, "demonstrated_on_this_example");
assert.equal(third.action, "retest");
assert.equal(session.state.questionIndex, 1);
const fourth = await turn("For x^2=3*x, I get x^2-3*x=0, then x*(x-3)=0. The zero product rule means x=0 or x=3. These are all the real solutions; both satisfy the original equation.");
assert.equal(fourth.evidenceStatus, "demonstrated_on_this_example");
assert.equal(session.state.phase, "complete");
const reloaded = await request();
assert.equal(reloaded.session.id, session.id);
assert.equal(reloaded.session.state.turns.length, 4);
({ session } = await request({ operation: "correct", sessionId: session.id, version: session.version, turnId: first.id }));
assert.equal(session.state.turns.length, 0);
assert.equal(session.state.phase, "explain");
console.log(JSON.stringify({ result: "PASS", checks: ["live Responses interpretation", "live Decisions routing", "lost-zero probe", "confirmed diagnosis", "verified refinement", "fresh application", "reload", "idempotent confirmation", "correction invalidates dependent evidence"] }));
// Leave a clean practice session as the current local session.
await request({ operation: "start" });
