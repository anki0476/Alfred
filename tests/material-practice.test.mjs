import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePracticeResult, savedMaterialPracticeSchema } from '../lib/material-practice.ts';

const evidence = [{ location: 'Uploaded text', quote: 'Roots absorb water.' }];
const source = 'Roots absorb water. Leaves capture light.';
const question = { question: 'Explain how roots help a plant.', concept: 'Roots', evidence };
test('accepts source-grounded questions and rejects invented quotations', () => {
  const output = { status: 'ready', message: '', questions: [question], feedback: null };
  assert.equal(validatePracticeResult(output, 'generate', source, '').questions.length, 1);
  assert.throws(() => validatePracticeResult(output, 'generate', 'Leaves capture light.', ''), /reference/);
});
test('feedback must quote the learner accurately and cite source support', () => {
  const output = { status: 'ready', message: '', questions: [], feedback: { assessment: 'supported', answerQuote: 'Roots absorb water', strengths: 'You explained the role of roots.', guidance: 'Explain how that supports growth.', followUp: 'What else does a plant need?', evidence } };
  assert.ok(validatePracticeResult(output, 'feedback', source, 'Roots absorb water from soil.').feedback);
  assert.throws(() => validatePracticeResult(output, 'feedback', source, 'I do not know'), /accurately/);
  assert.throws(() => validatePracticeResult({ ...output, feedback: { ...output.feedback, evidence: [] } }, 'feedback', source, 'Roots absorb water'), /missing source/);
});
test('unreadable sources cannot silently produce assessments', () => {
  const output = { status: 'insufficient_source', message: 'Upload a clearer scan.', questions: [], feedback: null };
  assert.equal(validatePracticeResult(output, 'generate', null, '').status, 'insufficient_source');
  assert.throws(() => validatePracticeResult({ ...output, questions: [question] }, 'generate', null, ''), /Unsupported/);
});
test('empty generation and missing feedback fail closed', () => {
  const output = { status: 'ready', message: '', questions: [], feedback: null };
  assert.throws(() => validatePracticeResult(output, 'generate', source, ''), /No valid questions/);
  assert.throws(() => validatePracticeResult(output, 'feedback', source, 'My answer'), /No valid feedback/);
});

test("saved practice rejects missing answers and out-of-range questions",()=>{const state={questions:[question],answers:[""],feedback:[null],index:0};assert.ok(savedMaterialPracticeSchema.safeParse(state).success);assert.equal(savedMaterialPracticeSchema.safeParse({...state,index:2}).success,false);assert.equal(savedMaterialPracticeSchema.safeParse({...state,answers:[]}).success,false);});
