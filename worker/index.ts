import { enforceRequestBudget } from "../lib/request-budget";
import { assertSameOrigin } from "../lib/request-security";
import handler from "vinext/server/fetch-handler";
import { runWithConnectorBinding } from "../lib/connector-context";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";

const worker = {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>) {
    let pathname: string;
    try { pathname = decodeURIComponent(new URL(request.url).pathname); }
    catch { return new Response("Invalid URL", { status: 400 }); }
    const api = pathname === "/api" || pathname.startsWith("/api/");
    if (api) {
      if (!["GET", "HEAD", "POST"].includes(request.method)) return new Response(null, { status: 405 });
      if (request.method === "POST") {
        try { assertSameOrigin(request); }
        catch { return Response.json({error: "Cross-origin request denied."}, {status: 403, headers: {"Cache-Control": "no-store"}}); }
      }
      const denied = await enforceRequestBudget(request, env.DB);
      if (denied) return denied;
    }
    let binding = ctx.props?.CONNECTORS;
    // Local preview emulates the same request-scoped capability. This branch and
    // the auxiliary service binding are absent from production builds.
    if (import.meta.env.DEV && !binding && env.CONNECTORS) {
      const preview = env.CONNECTORS;
      const expiresAt = Date.now() + 60_000;
      binding = {
        async getContext() {
          if (Date.now() >= expiresAt) return { status: "request_context_expired" };
          return preview.getContext?.() ?? { status: "binding_unavailable" };
        },
        async invoke(connectorId, actionName, args) {
          if (Date.now() >= expiresAt) {
            return { status: "request_context_expired", message: "This request has expired. Please try again." };
          }
          return preview.invoke(connectorId, actionName, args);
        },
      };
    }
    const result = await runWithConnectorBinding(binding, () => handler.fetch(request, env, ctx));
    const response = new Response(result.body, result);
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    if (api) response.headers.set("Cache-Control", "no-store");
    return response;
  },
};

export default worker;
