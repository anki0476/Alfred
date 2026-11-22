import { AppError } from "./app-error";

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get("sec-fetch-site") === "cross-site") {
    throw new AppError("Cross-origin request denied.", 403);
  }
}

// Count actual bytes before parsing: Content-Length is only an early rejection hint.
export async function readLimitedBody(request: Request, maximum: number): Promise<Uint8Array> {
  if (Number(request.headers.get("content-length")) > maximum) {
    void request.body?.cancel().catch(() => {});
    throw new AppError("The request is too large.", 413);
  }
  const encoding = request.headers.get("content-encoding");
  if (encoding && encoding !== "identity") throw new AppError("Compressed requests are not supported.", 415);
  const reader = request.body?.getReader();
  if (!reader) throw new AppError("A request body is required.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; void reader.cancel().catch(() => {}); }, 30_000);
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (timedOut) throw new AppError("The upload timed out. Please retry.", 408);
      if (done) break;
      length += value.byteLength;
      if (length > maximum) {
        void reader.cancel().catch(() => {});
        throw new AppError("The request is too large.", 413);
      }
      chunks.push(value);
    }
    const result = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.byteLength; }
    return result;
  } finally { clearTimeout(timeout); reader.releaseLock(); }
}

export async function readJson(request: Request, maximum: number): Promise<unknown> {
  assertSameOrigin(request);
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    throw new AppError("Use a JSON request.", 415);
  }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(await readLimitedBody(request, maximum)));
}

export async function readForm(request: Request, maximum: number) {
  assertSameOrigin(request);
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data;")) throw new AppError("Use a multipart upload.", 415);
  const bytes = await readLimitedBody(request, maximum);
  return new Response(bytes as BodyInit, { headers: { "Content-Type": contentType } }).formData();
}
