import { readJson } from "../../../lib/request-security";
import {REASONING_MODEL,DECISIONS_MODEL} from "../../../lib/models";
import { env } from "cloudflare:workers";
import { z } from "zod";
import { getLearningIdentity } from "../../../lib/learning-identity";
import { AppError, interpret, chooseAction } from "../../../lib/providers";
import { createSession, loadSession, saveSession } from "../../../lib/storage";
import { evaluate, applyAssessment, correctFrom } from "../../../lib/learning";
import { pack } from "../../../lib/pack";

export const dynamic = "force-dynamic";
const reply = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
const input = z
  .object({
    operation: z.enum([
      "start",
      "interpret",
      "confirm",
      "discard",
      "correct",
      "revise",
    ]),
    sessionId: z.string().uuid().optional(),
    version: z.number().int().nonnegative().optional(),
    transcript: z.string().trim().min(1).max(6000).optional(),
    requestId: z.string().uuid().optional(),
    turnId: z.string().uuid().optional(),
  })
  .strict();

export async function GET(request: Request) {
  try {
    const user = await getLearningIdentity(request);
    const configured = {
      openai: Boolean(env.OPENAI_API_KEY?.trim()),
      sarvam: Boolean(env.SARVAM_API_KEY?.trim()),
      decisionsModel: DECISIONS_MODEL,
      responsesModel: REASONING_MODEL,
    };
    return reply({
      authenticated: user.signedIn,
      canPractice: true,
      configured,
      pack,
      session: await loadSession(user.userId),
    });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getLearningIdentity(request);
    const body = input.parse(await readJson(request, 20000));
    if (body.operation === "start")
      return reply({ session: await createSession(user.userId) });
    if (!body.sessionId) throw new AppError("A session is required.");
    const session = await loadSession(user.userId, body.sessionId);
    if (!session) throw new AppError("Session not found.", 404);
    if (
      body.operation === "confirm" &&
      session.state.turns.some((turn) => turn.id === body.requestId)
    )
      return reply({ session });
    if (
      body.operation === "interpret" &&
      session.state.draft?.id === body.requestId
    )
      return reply({ session });
    if (session.version !== body.version)
      throw new AppError(
        "Your session changed. Refresh to load the latest saved work.",
        409,
      );
    let state = session.state;
    if (
      state.turns.length >= 60 &&
      !["correct", "discard"].includes(body.operation)
    )
      throw new AppError("This session is full. Start a new practice session.");
    switch (body.operation) {
      case "interpret": {
        if (!body.transcript || !body.requestId)
          throw new AppError("An explanation and request ID are required.");
        if (state.phase === "complete")
          throw new AppError(
            "Choose revision or start a new practice session.",
          );
        const interpretation = await interpret(body.transcript, state);
        state = {
          ...state,
          draft: {
            id: body.requestId,
            transcript: body.transcript,
            interpretation,
          },
        };
        break;
      }
      case "confirm": {
        if (!state.draft || state.draft.id !== body.requestId)
          throw new AppError("Confirm the latest interpretation.");
        const evidence = evaluate(state, state.draft.interpretation);
        const routing = await chooseAction(
          {
            question: pack.questions[state.questionIndex],
            phase: state.phase,
            interpretation: state.draft.interpretation,
            evidence,
            sources: pack.sources,
          },
          evidence.allowed,
        );
        state = applyAssessment(state, state.draft, routing);
        break;
      }
      case "discard":
        state = { ...state, draft: null };
        break;
      case "correct": {
        if (!body.turnId) throw new AppError("Choose an attempt to correct.");
        state = correctFrom(state, body.turnId);
        break;
      }
      case "revise":
        state = { ...state, questionIndex: 2, phase: "explain", draft: null };
        break;
    }
    return reply({ session: await saveSession(user.userId, session, state) });
  } catch (error) {
    return failure(error);
  }
}

function failure(error: unknown) {
  if (error instanceof AppError)
    return reply({ error: error.message }, error.status);
  if (error instanceof z.ZodError || error instanceof SyntaxError)
    return reply({ error: "Please check the request fields." }, 400);
  return reply(
    {
      error:
        "The operation could not be saved. Your previous work is preserved. Please retry.",
    },
    500,
  );
}
