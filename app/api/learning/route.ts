import { readJson } from "../../../lib/request-security";
import {generateModelQuestion,generateTeaching,continueDiscussion} from "../../../lib/server/model-tutor";
import { z } from "zod";
import { getLearningIdentity } from "../../../lib/learning-identity";
import { AppError, chooseAction, openai } from "../../../lib/providers";
import { readReasoning } from "../../../lib/adaptive-provider";
import {
  loadLearning,
  saveLearning,
  learningDB,
} from "../../../lib/adaptive-storage";
import {
  syllabus,
  publicQuestion,
  applyAnswer,
  appendDiscussion,
  assess,
  correctAttempt,
  relevantMemory,
  type Learning,
} from "../../../lib/adaptive";
export const dynamic = "force-dynamic";
const json = (v: unknown, status = 200) =>
  Response.json(v, { status, headers: { "Cache-Control": "no-store" } });
function snapshot(row: { version: number; state: Learning }) {
  return {
    ...row,
    state: { ...row.state, current: publicQuestion(row.state.current), attempts:row.state.attempts.map(t=>{const {teaching,...question}=t.question;return {...t,question};}) },
    syllabus,
    memory: row.state.current
      ? relevantMemory(row.state, row.state.current.concept)
      : [],
  };
}
export async function GET(request: Request) {
  try {
    const user = await getLearningIdentity(request);
    return json(snapshot(await loadLearning(user.userId)));
  } catch (e) {
    return failure(e);
  }
}
const schema = z
  .object({
    operation: z.enum(["next", "interpret", "confirm", "discard", "correct", "review"]),
    version: z.number().int().nonnegative(),
    requestId: z.string().uuid().optional(),
    answer: z.string().max(250).optional(),
    explanation: z.string().trim().min(10).max(4000).optional(),
    attemptId: z.string().uuid().optional(),
  })
  .strict();
export async function POST(request: Request) {
  try {
    const parsedRequest=schema.safeParse(await readJson(request, 16000));
    if(!parsedRequest.success) throw new AppError("Check the request fields.");
    const body = parsedRequest.data,
      user = await getLearningIdentity(request),
      row = await loadLearning(user.userId);
    let s = row.state;
    if (
      body.operation === "confirm" &&
      s.attempts.some((t) => t.id === body.requestId || t.discussion?.some(r=>r.id===body.requestId))
    )
      return json(snapshot(row));
    if (body.operation === "interpret" && s.draft?.id === body.requestId)
      return json(snapshot(row));
    if (body.version !== row.version)
      throw new AppError(
        "Your work changed in another tab. Refresh to continue.",
        409,
      );
    if (body.operation === "next") {
      if (s.draft)
        throw new AppError("Confirm or correct your explanation first.");
      if (!s.current) s = { ...s, current: await generateModelQuestion(s,openai) };
    }
    if (body.operation === "interpret" && !s.current && s.attempts.length) {
      if(!body.explanation || !body.requestId) throw new AppError("Explain your thinking first.");
      if(s.draft) throw new AppError("Confirm or correct your explanation first.");
      s={...s,draft:{id:body.requestId,questionId:s.attempts.at(-1)!.question.id,answer:"",explanation:body.explanation,evidence:{reason:"unclear",quote:body.explanation,summary:body.explanation}}};
    } else if (body.operation === "interpret") {
      if (
        !s.current ||
        !body.explanation ||
        !body.requestId ||
        (body.answer !== undefined && !s.current.options.includes(body.answer))
      )
        throw new AppError("Select an answer and explain your thinking.");
      if (s.draft)
        throw new AppError("Confirm or correct the current explanation first.");
      if (s.attempts.length >= 200)
        throw new AppError("This prototype supports 200 attempts per learner.");
      const interpreted = await readReasoning(s.current, body.explanation);
      const answer=body.answer ?? interpreted.answer;
      const conflict=Boolean(body.answer && interpreted.answer && body.answer!==interpreted.answer);
      const evidence={reason:!answer || conflict ? "unclear" as const : interpreted.reason,quote:interpreted.quote,summary:conflict?"Your selected answer and spoken answer differ. Please clarify which answer you intended.":interpreted.summary};
      s = {
        ...s,
        draft: {
          id: body.requestId,
          questionId: s.current.id,
          answer: answer || "Unclear spoken answer",
          explanation: body.explanation,
          evidence,
        },
      };
    }
    if (body.operation === "discard") s = { ...s, draft: null };
    if (body.operation === "confirm" && !s.current) {
      if(!s.draft || s.draft.id!==body.requestId) throw new AppError("This reply is no longer current.");
      const feedback=await continueDiscussion(s,s.draft.explanation,openai);
      s=appendDiscussion(s,s.draft.id,s.draft.explanation,feedback);
    } else if (body.operation === "confirm") {
      if (!s.draft || s.draft.id !== body.requestId || !s.current)
        throw new AppError("This interpretation is no longer current.");
      const assessment = assess(
        s.current,
        s.draft,
        s.mastery[s.current.concept],
      );
      const allowed =
        assessment.outcome === "demonstrated"
          ? ["retest" as const, "probe_method" as const]
          : assessment.outcome === "unverified"
            ? ["clarify" as const, "probe_method" as const]
            : assessment.confirmed
              ? ["teach" as const, "clarify" as const]
              : s.draft.evidence.reason === "misconception"
                ? ["probe_method" as const, "clarify" as const]
                : ["teach" as const, "probe_method" as const];
      const routing = await chooseAction(
        {
          concept: s.current.concept,
          assessment,
          evidence: s.draft.evidence,
          previous: relevantMemory(s, s.current.concept),
        },
        allowed,
      );
      const teaching=await generateTeaching(s,s.draft,routing.choice,openai);
      s = applyAnswer(s, s.draft, routing.choice,undefined,teaching);
    }
    if (body.operation === "review") {
      if(s.current || s.draft) throw new AppError("Finish your current studio question before starting this review.",409);
      const attempt=s.attempts.find(t=>t.id===body.attemptId);
      if(!attempt) throw new AppError("Notebook entry not found.",404);
      s={...s,current:await generateModelQuestion(s,openai,attempt.question.concept)};
    }
    if (body.operation === "correct") {
      if (!body.attemptId) throw new AppError("Choose an attempt.");
      s = correctAttempt(s, body.attemptId);
    }
    return json(snapshot(await saveLearning(user.userId, row.version, s)));
  } catch (e) {
    if(new URL(request.url).hostname==="127.0.0.1") console.warn("Learning validation:",e instanceof z.ZodError?JSON.stringify(e.issues):e instanceof Error?e.message:"failed");
    return failure(e);
  }
}
function failure(e: unknown) {
  return json(
    {
      error:
        e instanceof AppError
          ? e.message
          : e instanceof z.ZodError
            ? "Alfred’s response did not pass validation. Your previous work is preserved; please retry."
            : "Learning request failed. Your previous work is preserved.",
    },
    e instanceof AppError ? e.status : 400,
  );
}
