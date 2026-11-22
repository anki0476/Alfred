# Alfred

Alfred is a voice-first Feynman study companion for CBSE Class 10 Mathematics Standard (041). The existing Studio, Learning Journey and Mistake Notebook use one learner record. The interface, fonts, navigation and voice controls are retained.

## Runtime learning flow

1. A 52-concept graph covers the seven units in the official 2026–27 syllabus. Prerequisites and curriculum boundaries are metadata, not a question bank.
2. The scheduler selects a diagnostic, suspected-gap probe, Decisions follow-up, due review, or weak prerequisite. GPT-6 Luna generates an original question from CBSE source excerpts, mastery evidence, prior mistakes and recent questions.
3. Before presentation, references must match supplied sources, applicable rational calculations/roots/identities must pass the bounded checker, and a separate GPT-6 Luna call solves the question without seeing the proposed answer. Invalid questions are retried once, then rejected without changing saved learning.
4. GPT-6 Luna interprets an English or Hinglish explanation, quoting the student's actual words. The student confirms or corrects this interpretation. Correct guesses and unclear reasoning do not establish mastery.
5. The OpenAI Decisions API, also pinned to GPT-6 Luna, chooses among permitted teaching actions. GPT generates contextual feedback, and a second review checks that feedback before anything is saved.
6. One atomic versioned update saves the attempt, feedback, evidence estimate and review date. Studio and Journey share this state. The notebook projects these attempts, earlier studio records and uploaded-material feedback without creating a separate mastery system. Later demonstrated answers update prior mistake status. Correction replays earlier evidence and removes dependent later changes.

Generation and reasoning use Responses; routing uses Decisions. Both model IDs are pinned in lib/models.ts. Sarvam handles STT/TTS. API keys remain in server secrets; .dev.vars is ignored.

## Scope and limits

All 52 concepts are eligible for self-contained text practice. Missing-diagram questions are rejected. Calculation checks cover rational arithmetic, degree-two polynomial identities and rational roots; they do not formally verify geometry proofs, general symbolic mathematics, or every claim in an explanation. Proofs and teaching are AI-reviewed. Model agreement is not a correctness guarantee.

Difficulty follows the requested 1–2, 2–3 and 3–5 mark reasoning/application demands, not an empirically calibrated question model. Full-syllabus mapping does not mean exhaustive subject-expert validation. Coverage labels state these limits. Sixteen sampled live topics span all seven units; repeat sampling and independent teacher review remain necessary.

Mastery uses a transparent heuristic: supported success adds .25/.30/.35 by level, an assessed difficulty subtracts .25, unclear evidence leaves the estimate unchanged. First success schedules one day; due successes double intervals to 30 days; lapses schedule ten minutes. Early practice does not postpone a pending review. These are evidence estimates, not board grades.

Uploaded materials use GPT-6 Luna with source-quotation validation. Their feedback enters the shared notebook; it does not silently change board-syllabus mastery without the main assessment gate.

## Source provenance

Server-only source excerpts and hashes are in lib/server/cbse-source-pack.json:
- [Official syllabus](https://cbseacademic.nic.in/web_material/CurriculumMain27/SecPart1/Maths_SecP1X_2026-27.pdf)
- [Standard sample paper](https://cbseacademic.nic.in/web_material/SQP/ClassX_2026_27/MathsStandard-SQP.pdf)
- [Standard marking scheme](https://cbseacademic.nic.in/web_material/SQP/ClassX_2026_27/MathsStandard-MS.pdf)

The pinned extracts were retrieved on 21 November 2026. The refresh script requires a working trusted HTTPS connection and pypdf. A failed refresh leaves the checked-in pack intact. Text extraction can lose diagram/formula information; the generator must not rely on missing visual evidence. No NCERT textbook is repackaged.

## Local development and validation

Copy .env.example to .dev.vars and enter server API keys locally. Install dependencies, build once, apply each existing drizzle migration in order to the local D1 database, then run npm run dev. Sites applies the tracked migrations on deployment. Do not reapply CREATE TABLE migrations to an existing database.

Run npm test and npx tsc --noEmit. scripts/test-live-model.ts uses local keys for billed generation/solution-review sampling; it writes synthetic results to ignored outputs/. It is run with a TypeScript runner. The numerical examples under tests/fixtures are regression data only; production generation never imports them.

The active learning APIs use optimistic version checks and idempotent confirmations. Provider failures preserve saved work. Guest work follows an HttpOnly cookie; signing in enables account-scoped access. Guest records are not automatically merged on sign-in.

The Classroom dashboard is available to the owner of a class that learners explicitly join. It reports aggregated concept gaps, not transcripts or uploads.

## Voice

Hold Ctrl+Shift+Z to speak, or double-tap for hands-free capture; double-tap again, Done, or Escape finishes. The shortcut requires the browser tab to be focused. The microphone button also works on touch devices. Recording produces an editable transcript and does not automatically confirm an assessment. Raw recordings are not stored in D1.

Voice interaction was adapted from [SceneSense](https://github.com/anki0476/SceneSense). Physical microphone permissions and browser-delivered shortcuts still need testing on the learner's device.

