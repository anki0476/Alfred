import { readFile } from "node:fs/promises";

const settings = {};
for (const line of (await readFile(new URL("../.dev.vars", import.meta.url), "utf8")).split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
  if (match) settings[match[1]] = match[2].replace(/^["']|["']$/g, "");
}
async function call(name, url, init) {
  try {
    const response = await fetch(url, { ...init, signal: AbortSignal.timeout(60000) });
    const data = await response.json();
    if (!response.ok) {
      console.log(JSON.stringify({ provider: name, ok: false, status: response.status, code: data.error?.code || null }));
      return null;
    }
    console.log(JSON.stringify({ provider: name, ok: true, status: response.status }));
    return data;
  } catch (error) { console.log(JSON.stringify({ provider: name, ok: false, error: error.name })); return null; }
}
if (!settings.OPENAI_API_KEY || !settings.SARVAM_API_KEY) throw new Error("Both API keys must be configured locally.");
const headers = { Authorization: `Bearer ${settings.OPENAI_API_KEY}`, "Content-Type": "application/json" };
const results = await Promise.allSettled([
  call("OpenAI Responses", "https://api.openai.com/v1/responses", { method: "POST", headers, body: JSON.stringify({ model: settings.OPENAI_MODEL, reasoning: { effort: "medium" }, store: false, max_output_tokens: 1000, input: "Return only the real solutions to x squared equals x." }) }),
  call("OpenAI Decisions", "https://api.openai.com/v1/decisions", { method: "POST", headers, body: JSON.stringify({ model: settings.DECISIONS_MODEL, input: "The student solved x squared equals x by dividing by x and reported only one.", questions: [{ name: "next", type: "choice", instructions: "Choose the next action before diagnosing the learner.", choices: [{ value: "probe", description: "Ask whether zero satisfies the original equation." }, { value: "complete", description: "Declare the learning complete." }] }] }) }),
  call("Sarvam TTS", "https://api.sarvam.ai/text-to-speech", { method: "POST", headers: { "api-subscription-key": settings.SARVAM_API_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ text: "I divide x squared equals x by x, so x equals one.", language_code: "en-IN", model: settings.SARVAM_TTS_MODEL, speaker: settings.SARVAM_SPEAKER, output_audio_codec: "wav" }) }),
]);
for (let i = 0; i < 2; i++) {
  const entry = results[i];
  if (entry.status === "fulfilled" && entry.value) console.log(JSON.stringify({ provider: i === 0 ? "Responses content" : "Decisions content", result: i === 0 ? entry.value.output.flatMap(item => item.content || []).filter(item => item.type === "output_text").map(item => item.text) : entry.value.answers }));
}
const voice = results[2];
if (voice.status === "fulfilled" && voice.value?.audios?.[0]) {
  const file = new Blob([Buffer.from(voice.value.audios[0], "base64")], { type: "audio/wav" });
  const form = new FormData(); form.set("file", file, "synthetic-test.wav"); form.set("model", settings.SARVAM_STT_MODEL); form.set("mode", "codemix");
  const result = await call("Sarvam STT", "https://api.sarvam.ai/speech-to-text", { method: "POST", headers: { "api-subscription-key": settings.SARVAM_API_KEY }, body: form });
  if (result) console.log(JSON.stringify({ syntheticVoiceTranscript: result.transcript }));
}
