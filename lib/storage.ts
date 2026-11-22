import { env } from "cloudflare:workers";
import { AppError } from "./providers";
import type { Session, SessionState } from "./pack";

function database() {
  if (!env.DB)
    throw new AppError("The learning database is not configured.", 503);
  return env.DB;
}

export async function loadSession(
  userId: string,
  id?: string,
): Promise<Session | null> {
  const query = id
    ? database()
        .prepare(
          "SELECT id, version, state FROM sessions WHERE user_id = ? AND id = ?",
        )
        .bind(userId, id)
    : database()
        .prepare(
          "SELECT id, version, state FROM sessions WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1",
        )
        .bind(userId);
  const row = await query.first<{
    id: string;
    version: number;
    state: string;
  }>();
  return row ? { ...row, state: JSON.parse(row.state) } : null;
}

export async function createSession(userId: string): Promise<Session> {
  const session: Session = {
    id: crypto.randomUUID(),
    version: 0,
    state: { questionIndex: 0, phase: "explain", turns: [], draft: null },
  };
  await database()
    .prepare(
      "INSERT INTO sessions (id, user_id, version, state, updated_at) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(
      session.id,
      userId,
      0,
      JSON.stringify(session.state),
      new Date().toISOString(),
    )
    .run();
  return session;
}

export async function saveSession(
  userId: string,
  session: Session,
  state: SessionState,
): Promise<Session> {
  const result = await database()
    .prepare(
      "UPDATE sessions SET state = ?, version = version + 1, updated_at = ? WHERE id = ? AND user_id = ? AND version = ?",
    )
    .bind(
      JSON.stringify(state),
      new Date().toISOString(),
      session.id,
      userId,
      session.version,
    )
    .run();
  if (result.meta.changes !== 1)
    throw new AppError(
      "This session changed in another request. Refresh to recover the latest saved work.",
      409,
    );
  return { ...session, version: session.version + 1, state };
}
