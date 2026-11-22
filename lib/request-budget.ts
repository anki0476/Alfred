// Atomic, shared quotas survive Worker restarts and cannot be reset by clearing cookies.
export const consumeBudgetSql = `INSERT INTO request_budgets (id, window, used, expires_at)
VALUES (?, ?, 1, ?)
ON CONFLICT(id) DO UPDATE SET
  used = CASE WHEN window = excluded.window THEN used + 1 ELSE 1 END,
  window = excluded.window, expires_at = excluded.expires_at
WHERE window < excluded.window OR (window = excluded.window AND used < ?)
RETURNING used`;

type BudgetDB = Pick<D1Database, "prepare">;
export async function consumeBudget(db: BudgetDB, id: string, limit: number, seconds: number, now = Date.now()) {
  const window = Math.floor(now / (seconds * 1000));
  const row = await db.prepare(consumeBudgetSql).bind(id, window, (window + 1) * seconds, limit).first();
  return row !== null;
}

export async function enforceRequestBudget(request: Request, db?: BudgetDB): Promise<Response | null> {
  const deny = (status: number, message: string) => Response.json({error: message}, {
    status, headers: { "Cache-Control": "no-store", ...(status === 429 ? { "Retry-After": "60" } : {}) },
  });
  if (!db) return deny(503, "Learning storage is unavailable.");
  try {
    // Charge the site-wide gate first, so rotating IPs cannot grow counters indefinitely.
    if (!await consumeBudget(db, "all:minute", 1800, 60)) return deny(429, "Alfred is busy. Please wait a minute and retry.");
    if (!await consumeBudget(db, "all:hour", 20000, 3600) || !await consumeBudget(db, "all:day", 100000, 86400)) return deny(429, "Alfred's request limit has been reached. Please try again later.");
    const ip = request.headers.get("cf-connecting-ip") || "unknown";
    // Do not store visitor IP addresses. Global quotas still apply if an upstream IP is missing/untrusted.
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
    const peer = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
    if (!await consumeBudget(db, `peer:${peer}:minute`, 180, 60)) return deny(429, "Too many requests. Please wait a minute and retry.");
    if (request.method === "POST") {
      const path = new URL(request.url).pathname.replace(/\/$/, "");
      const group = path === "/api/material-practice" ? "materials" : path === "/api/speech" ? "voice" : "practice";
      const policy = { materials: [6, 100, 500], voice: [60, 3000, 10000], practice: [30, 1000, 5000] }[group];
      const gates: [string, number, number][] = [
        [`${group}:${peer}:minute`, policy[0], 60],
        [`${group}:hour`, policy[1], 3600], [`${group}:day`, policy[2], 86400],
      ];
      for (const [key, limit, seconds] of gates) {
        if (!await consumeBudget(db, key, limit, seconds)) return deny(429, "The practice request limit has been reached. Please try again later.");
      }
    }
    // Bounded cleanup; each key is reused between windows rather than appended forever.
    await db.prepare("DELETE FROM request_budgets WHERE id IN (SELECT id FROM request_budgets WHERE expires_at < ? LIMIT 100)")
      .bind(Math.floor(Date.now() / 1000) - 86400).run();
    return null;
  } catch { return deny(503, "Request protection is temporarily unavailable. Please retry shortly."); }
}
