import { readJson, readForm, assertSameOrigin } from "../../../lib/request-security";
import { z } from "zod";
import { getLearningIdentity } from "../../../lib/learning-identity";
import { AppError, speak, transcribe } from "../../../lib/providers";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await getLearningIdentity(request);
    if (
      request.headers.get("content-type")?.startsWith("multipart/form-data")
    ) {
      const form = await readForm(request, 2065536);
      const file = form.get("file");
      if (!(file instanceof File) || file.size < 44 || file.size > 2000000)
        throw new AppError("Record a short audio segment first.");
      return Response.json(
        { transcript: await transcribe(file) },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    const { text } = z
      .object({ text: z.string().trim().min(1).max(2400) })
      .strict()
      .parse(await readJson(request, 16000));
    return Response.json(
      { audio: await speak(text) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof AppError
            ? error.message
            : "Voice could not complete. Your written work is preserved.",
      },
      { status: error instanceof AppError ? error.status : 400 },
    );
  }
}
