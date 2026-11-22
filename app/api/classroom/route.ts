import { readJson } from "../../../lib/request-security";
import { z } from "zod";
import { getLearningIdentity } from "../../../lib/learning-identity";
import { learningDB } from "../../../lib/adaptive-storage";
import { AppError } from "../../../lib/providers";
import { syllabus, diagnosticCount, normalizeLearning, type Learning, type ConceptId } from "../../../lib/adaptive";
export const dynamic = "force-dynamic";
const json = (v: unknown, status = 200) =>
  Response.json(v, { status, headers: { "Cache-Control": "no-store" } });
export async function GET(request: Request) {
  try {
    const { userId } = await getLearningIdentity(request),
      db = learningDB();
    const owned = await db
      .prepare("SELECT id,name,join_code FROM classrooms WHERE owner_id=?")
      .bind(userId)
      .first<{ id: string; name: string; join_code: string }>();
    const membership = await db
      .prepare(
        "SELECT c.id,c.name,e.alias FROM enrollments e JOIN classrooms c ON c.id=e.class_id WHERE e.user_id=?",
      )
      .bind(userId)
      .all();
    let dashboard = null;
    if (owned) {
      const rows = await db
        .prepare(
          "SELECT e.alias,l.state FROM enrollments e LEFT JOIN adaptive_learners l ON e.user_id=l.user_id WHERE e.class_id=?",
        )
        .bind(owned.id)
        .all<{ alias: string; state: string | null }>();
      const learners = rows.results.map((r) => ({
        alias: r.alias,
        state: r.state ? normalizeLearning(JSON.parse(r.state) as Learning) : null,
      }));
      const now = new Date().toISOString();
      dashboard = {
        count: learners.length,
        diagnosed: learners.filter((l) => l.state?.diagnostic.length === diagnosticCount)
          .length,
        concepts: syllabus.concepts.map((c) => {
          const all = learners.map((l) => l.state?.mastery[c.id as ConceptId]);
          const tested = all.filter((m) => m && m.assessed > 0);
          return {
            id: c.id,
            name: c.name+(c.supported?" · Tested family":" · Not supported"),
            assessed: tested.length,
            unknown: all.length - tested.length,
            average: tested.length
              ? Math.round(
                  (tested.reduce((sum, m) => sum + m!.score, 0) /
                    tested.length) *
                    100,
                )
              : null,
            needsPractice: tested.filter((m) => m!.score < 0.5).length,
            misconceptions: tested.filter((m) => m!.confirmed).length,
            due: tested.filter((m) => m!.dueAt && m!.dueAt <= now).length,
          };
        }),
        learners: learners.map((l) => ({
          alias: l.alias,
          diagnostic: l.state?.diagnostic.length || 0,
          attempts: l.state?.attempts.length || 0,
          due: l.state
            ? Object.values(l.state.mastery).filter(
                (m) => m.dueAt && m.dueAt <= now,
              ).length
            : 0,
        })),
      };
    }
    return json({ owned, membership: membership.results, dashboard });
  } catch (e) {
    return failure(e);
  }
}
const input = z.discriminatedUnion("operation", [
  z.object({
    operation: z.literal("create"),
    name: z.string().trim().min(2).max(70),
  }),
  z.object({
    operation: z.literal("join"),
    code: z.string().regex(/^[a-f0-9]{12}$/),
    alias: z.string().trim().min(2).max(40),
  }),
  z.object({ operation: z.literal("leave"), classId: z.string().uuid() }),
]);
export async function POST(request: Request) {
  try {
    const body = input.parse(await readJson(request, 4000)),
      { userId } = await getLearningIdentity(request),
      db = learningDB();
    if (body.operation === "create")
      await db
        .prepare(
          "INSERT OR IGNORE INTO classrooms (id,owner_id,name,join_code) VALUES (?,?,?,?)",
        )
        .bind(
          crypto.randomUUID(),
          userId,
          body.name,
          crypto.randomUUID().replaceAll("-", "").slice(0, 12),
        )
        .run();
    if (body.operation === "join") {
      const classroom = await db
        .prepare("SELECT id FROM classrooms WHERE join_code=?")
        .bind(body.code)
        .first<{ id: string }>();
      if (!classroom) throw new AppError("Class code not found.", 404);
      await db
        .prepare(
          "INSERT INTO enrollments (id,class_id,user_id,alias) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET alias=excluded.alias",
        )
        .bind(classroom.id + ":" + userId, classroom.id, userId, body.alias)
        .run();
    }
    if (body.operation === "leave")
      await db
        .prepare("DELETE FROM enrollments WHERE class_id=? AND user_id=?")
        .bind(body.classId, userId)
        .run();
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
function failure(e: unknown) {
  return json(
    {
      error:
        e instanceof AppError
          ? e.message
          : "The classroom request could not complete.",
    },
    e instanceof AppError ? e.status : 400,
  );
}
