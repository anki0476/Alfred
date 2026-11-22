"use client";
import {diagnosticCount} from "../lib/curriculum";
import {WorkspaceHeader} from "./WorkspaceHeader";
import { useEffect, useState } from "react";
type Dashboard = {
  count: number;
  diagnosed: number;
  concepts: {
    id: string;
    name: string;
    assessed: number;
    unknown: number;
    average: number | null;
    needsPractice: number;
    misconceptions: number;
    due: number;
  }[];
  learners: {
    alias: string;
    diagnostic: number;
    attempts: number;
    due: number;
  }[];
};
type Data = {
  owned: { id: string; name: string; join_code: string } | null;
  membership: { id: string; name: string; alias: string }[];
  dashboard: Dashboard | null;
};
export default function Classroom() {
  const [data, setData] = useState<Data | null>(null),
    [name, setName] = useState("Class 10 Maths study group"),
    [code, setCode] = useState(""),
    [alias, setAlias] = useState(""),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function refresh() {
    const r = await fetch("/api/classroom");
    const result = (await r.json()) as Data & { error?: string; audio: string };
    if (!r.ok)
      throw new Error(result.error || "The request could not complete.");
    setData(result);
  }
  useEffect(() => {
    void refresh().catch((e) => setError(String(e)));
  }, []);
  async function act(body: unknown) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/classroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await r.json()) as Data & {
        error?: string;
        audio: string;
      };
      if (!r.ok)
        throw new Error(result.error || "The request could not complete.");
      await refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="app-shell"><WorkspaceHeader active="/teacher"/><main className="learning-shell">
      <header className="learning-heading">
        <span className="eyebrow">SEE WHERE SUPPORT HELPS</span>
        <h1>Understanding, across your class.</h1>
        <p>CBSE Class 10 Maths. Progress reflects tested question families; mapped-only concepts remain unassessed.</p>
      </header>
      {error && (
        <p role="alert" className="learning-error">
          {error}
        </p>
      )}
      <section className="learning-card">
        <h2>Join a class as a learner</h2>
        <div className="learning-row">
          <label>
            Class code
            <input
              value={code}
              maxLength={12}
              onChange={(e) => setCode(e.target.value.trim().toLowerCase())}
            />
          </label>
          <label>
            Display name or alias
            <input
              value={alias}
              maxLength={40}
              onChange={(e) => setAlias(e.target.value)}
            />
          </label>
        </div>
        <label className="learning-option">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span>
            Share my alias, concept progress, review counts and misconception
            counts with this class owner. My written explanations and uploaded
            files are not shared.
          </span>
        </label>
        <button
          className="primary-button"
          disabled={
            busy || !consent || code.length !== 12 || alias.trim().length < 2
          }
          onClick={() => void act({ operation: "join", code, alias })}
        >
          Join class
        </button>
        {data?.membership.map((c) => (
          <p key={c.id}>
            {c.name} · {c.alias}{" "}
            <button
              disabled={busy}
              className="text-button"
              onClick={() => void act({ operation: "leave", classId: c.id })}
            >
              Leave and stop sharing
            </button>
          </p>
        ))}
      </section>
      {!data ? (
        <p>Loading classroom…</p>
      ) : !data.owned ? (
        <section className="learning-card">
          <h2>Create a class as a teacher</h2>
          <label>
            Class name
            <input
              value={name}
              maxLength={70}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <button
            className="primary-button"
            disabled={busy || name.trim().length < 2}
            onClick={() => void act({ operation: "create", name })}
          >
            Create my class
          </button>
          <p className="learning-muted">
            Only this identity can view the dashboard. Sign in before creating a
            class to access it on another device.
          </p>
          <a href="/signin-with-chatgpt?return_to=/teacher">Sign in</a>
        </section>
      ) : (
        <section className="learning-card">
          <div className="learning-row">
            <h2>{data.owned.name}</h2>
            <button
              className="secondary-button"
              disabled={busy}
              onClick={() => void refresh().catch((e) => setError(String(e)))}
            >
              Refresh progress
            </button>
          </div>
          <p>
            Invite learners with code{" "}
            <strong className="class-code">{data.owned.join_code}</strong>. Each
            learner joins from their own account or browser identity.
          </p>
          <p>
            {data.dashboard!.count} learners · {data.dashboard!.diagnosed}{" "}
            completed diagnostics
          </p>
          {data.dashboard!.count === 0 ? (
            <p className="learning-muted">
              No learners have joined yet. Class-wide gaps will appear after
              learners join and confirm assessments.
            </p>
          ) : (
            <>
              <div className="learning-table">
                <table>
                  <caption>
                    Concept gaps · unassessed learners are excluded from
                    averages
                  </caption>
                  <thead>
                    <tr>
                      <th>Concept</th>
                      <th>Assessed / unknown</th>
                      <th>Evidence estimate</th>
                      <th>Needs practice</th>
                      <th>Confirmed gaps</th>
                      <th>Reviews due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.dashboard!.concepts.map((c) => (
                      <tr key={c.id}>
                        <th>{c.name}</th>
                        <td>
                          {c.assessed} / {c.unknown}
                        </td>
                        <td>
                          {c.average === null
                            ? "Not assessed"
                            : c.average + "%"}
                        </td>
                        <td>{c.needsPractice}</td>
                        <td>{c.misconceptions}</td>
                        <td>{c.due}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <h3>Where to teach next</h3>
              {data
                .dashboard!.concepts.filter((c) => c.needsPractice > 0)
                .sort((a, b) => b.needsPractice - a.needsPractice)
                .map((c) => (
                  <p key={c.id}>
                    {c.name}: revisit with {c.needsPractice} learner
                    {c.needsPractice === 1 ? "" : "s"}; check prerequisite
                    understanding before increasing difficulty.
                  </p>
                ))}
              <h3>Learner participation</h3>
              {data.dashboard!.learners.map((l, i) => (
                <p key={i}>
                  {l.alias}: {l.diagnostic}/{diagnosticCount} diagnostic concepts · {l.attempts}{" "}
                  attempts · {l.due} reviews due
                </p>
              ))}
            </>
          )}
        </section>
      )}
    </main></div>
  );
}
