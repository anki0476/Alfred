import { env } from "cloudflare:workers";
import { AppError } from "./providers";
import { initialLearning, normalizeLearning, type Learning } from "./adaptive";
export type LearnerRow = { user_id: string; version: number; state: string };
export function learningDB() {
  if (!env.DB) throw new AppError("Learning storage is unavailable.", 503);
  return env.DB;
}
export async function loadLearning(user: string) {
  await learningDB()
    .prepare(
      "INSERT OR IGNORE INTO adaptive_learners (user_id, version, state) VALUES (?, 0, ?)",
    )
    .bind(user, JSON.stringify(initialLearning()))
    .run();
  const row = await learningDB()
    .prepare(
      "SELECT user_id,version,state FROM adaptive_learners WHERE user_id=?",
    )
    .bind(user)
    .first<LearnerRow>();
  if (!row)
    throw new AppError("Your learning record could not be loaded.", 503);
  return { version: row.version, state: normalizeLearning(JSON.parse(row.state) as Learning) };
}
export async function saveLearning(
  user: string,
  version: number,
  state: Learning,
) {
  const result = await learningDB()
    .prepare(
      "UPDATE adaptive_learners SET state=?,version=version+1 WHERE user_id=? AND version=?",
    )
    .bind(JSON.stringify(state), user, version)
    .run();
  if (result.meta.changes !== 1)
    throw new AppError(
      "Your learning record changed in another tab. Refresh before continuing.",
      409,
    );
  return { version: version + 1, state };
}
