import { z } from "zod";

export const citationSchema = z.object({
  location: z.string().min(1).max(180),
  quote: z.string().min(1).max(700),
}).strict();
export const materialQuestionSchema = z.object({
  question: z.string().min(1).max(1500),
  concept: z.string().min(1).max(160),
  evidence: z.array(citationSchema).min(1).max(3),
}).strict();
export const materialFeedbackSchema = z.object({
  assessment: z.enum(["supported", "partly_supported", "needs_revision", "not_enough_evidence"]),
  answerQuote: z.string().max(1500),
  strengths: z.string().max(1800),
  guidance: z.string().min(1).max(2500),
  followUp: z.string().max(800),
  evidence: z.array(citationSchema).max(4),
}).strict();
export const practiceResultSchema = z.object({
  status: z.enum(["ready", "insufficient_source"]),
  message: z.string().max(1000),
  questions: z.array(materialQuestionSchema).max(3),
  feedback: materialFeedbackSchema.nullable(),
}).strict();
export type MaterialQuestion = z.infer<typeof materialQuestionSchema>;
export type MaterialFeedback = z.infer<typeof materialFeedbackSchema>;
export type PracticeResult = z.infer<typeof practiceResultSchema>;
const stringField = { type: "string" };
const objectField = (properties: Record<string, unknown>) => ({ type: "object", additionalProperties: false, properties, required: Object.keys(properties) });
const evidenceField = { type: "array", items: objectField({ location: stringField, quote: stringField }) };
export const practiceOutputFormat = objectField({
  status: { type: "string", enum: ["ready", "insufficient_source"] },
  message: stringField,
  questions: { type: "array", items: objectField({ question: stringField, concept: stringField, evidence: evidenceField }) },
  feedback: { anyOf: [{ type: "null" }, objectField({
    assessment: { type: "string", enum: ["supported", "partly_supported", "needs_revision", "not_enough_evidence"] },
    answerQuote: stringField, strengths: stringField, guidance: stringField, followUp: stringField, evidence: evidenceField,
  })] },
});
export type MaterialPracticeState = {
  questions: MaterialQuestion[];
  answers: string[];
  feedback: (MaterialFeedback | null)[];
  index: number;
};

export function validatePracticeResult(result: unknown, operation: string, sourceText: string | null, answer: string) {
  const value = practiceResultSchema.parse(result);
  if (value.status === "insufficient_source") {
    if (value.questions.length || value.feedback) throw new Error("Unsupported material was assessed.");
    return value;
  }
  if (operation === "generate" && (!value.questions.length || value.feedback)) throw new Error("No valid questions were returned.");
  if (operation === "feedback" && (!value.feedback || value.questions.length)) throw new Error("No valid feedback was returned.");
  const citations = [...value.questions.flatMap(q => q.evidence), ...(value.feedback?.evidence || [])];
  const normalized = (text: string) => text.replace(/\s+/g, " ").trim();
  if (sourceText !== null && citations.some(c => !normalized(sourceText).includes(normalized(c.quote)))) throw new Error("A reference could not be traced to the uploaded text.");
  if (value.feedback?.answerQuote && !answer.includes(value.feedback.answerQuote)) throw new Error("Feedback did not quote your answer accurately.");
  if (value.feedback && value.feedback.assessment !== "not_enough_evidence" && !value.feedback.evidence.length) throw new Error("Feedback is missing source evidence.");
  return value;
}

export const savedMaterialPracticeSchema = z.object({ questions: z.array(materialQuestionSchema).max(3), answers: z.array(z.string().max(10000)).max(3), feedback: z.array(materialFeedbackSchema.nullable()).max(3), index: z.number().int().min(0).max(2) }).refine(value => value.answers.length === value.questions.length && value.feedback.length === value.questions.length && (value.questions.length ? value.index < value.questions.length : value.index === 0), "Saved practice is incomplete or has an invalid question index.");
