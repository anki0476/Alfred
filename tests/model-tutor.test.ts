import test from "node:test";
import assert from "node:assert/strict";
import {initialLearning,appendDiscussion,publicQuestion,applyAnswer,correctAttempt,type Draft} from "../lib/adaptive";
import {generateModelQuestion,generateTeaching,continueDiscussion,type ModelCall} from "../lib/server/model-tutor";
import {sourcesFor,validateCitations} from "../lib/server/cbse-sources";
import {verifyChecks} from "../lib/server/question-checks";
const source=sourcesFor("factor").find(p=>p.kind==="syllabus")!;
const citations=[{id:source.id,quote:source.text.split(/\s+/).slice(0,12).join(" ")}];
const checks=[{kind:"identity" as const,input:"x^2-5*x",expected:"x*(x-5)",purpose:"Verify the proposed factorisation reconstructs the original polynomial."}];
const candidate={prompt:"Factor x² − 5x and explain how expanding checks each term.",equation:"x² − 5x",options:["x(x−5)","x(x+5)","x−5"],answer:"x(x−5)",solution:"The common factor is x. Multiplying x by x−5 gives x²−5x, recovering both terms.",rubric:["Identifies x as a common factor","Expands the product to reconstruct both terms"],marks:2,citations,checks,numerical:true};
const audit={answer:candidate.answer,solution:candidate.solution,boardAligned:true,inScope:true,selfContained:true,uniqueAnswer:true,checksRelevant:true,rubric:candidate.rubric,checks,reason:"The reconstruction is exact and the task is in scope."};
const complete=(value:unknown)=>({status:"completed",output:[{content:[{type:"output_text",text:JSON.stringify(value)}]}]});
function fake(overrides:Record<string,unknown>={},seen:Record<string,any>[]=[]):ModelCall{return async(path,body)=>{assert.equal(path,"responses");assert.equal(body.model,"gpt-6-luna");seen.push(body);const name=(body.text as any).format.name;return complete(overrides[name]??(name==="board_question"?candidate:name==="blind_solution_review"?audit:name==="personal_teaching"?{feedback:"You identified the common factor. Explain how expanding the product recovers both original terms.",citations}:{approved:true,reason:"Feedback asks for the relevant justification."}));};}
test("source citations must identify a supplied page and quote actual text",()=>{
 validateCitations(citations,[source]);
 assert.throws(()=>validateCitations([{id:"invented",quote:citations[0].quote}],[source]));
 assert.throws(()=>validateCitations([{id:source.id,quote:"Invented theorem from nowhere"}],[source]));
});
test("math checks reject wrong results, unsafe grammar, lost roots and false identities",()=>{
 assert.equal(verifyChecks(checks),1);
 for(const c of [
 {kind:"arithmetic",input:"1/3+1/6",expected:"1/3"},
 {kind:"roots",input:"x^2=5*x",expected:"5"},
 {kind:"identity",input:"x^2-5*x",expected:"x*(x+5)"},
 {kind:"arithmetic",input:"process.exit()",expected:"0"}
 ])assert.throws(()=>verifyChecks([{...c,purpose:"Check the mathematical answer"} as any]));
 assert.equal(verifyChecks([{kind:"roots",input:"x^2=5*x",expected:"0,5",purpose:"Check every real solution"}]),1);
});
test("generation supplies learner history and sources, keeps answers private, and review solves blind",async()=>{
 const s=initialLearning(),seen:Record<string,any>[]=[];
 const q=await generateModelQuestion(s,fake({},seen));
 assert.ok(q.teaching?.citations.length);assert.equal(q.teaching?.model,"gpt-6-luna");
 assert.ok(!("teaching" in publicQuestion(q)!));assert.ok(!("expected" in publicQuestion(q)!));
 const review=JSON.parse(String(seen[1].input));assert.ok(!("answer" in review));assert.ok(!("solution" in review));assert.ok(!("checks" in review));
 assert.equal(JSON.parse(String(seen[0].input)).sources[0].kind,"syllabus");
 assert.deepEqual(s,initialLearning());
});
test("unverified questions never enter state or silently fall back to templates",async()=>{
 for(const overrides of [
  {board_question:{...candidate,citations:[{id:"fake",quote:"An invented source quote"}]}},
  {board_question:{...candidate,checks:[{...checks[0],expected:"x*(x+5)"}]}},
  {blind_solution_review:{...audit,answer:"x−5"}},
  {blind_solution_review:{...audit,selfContained:false}},
  {board_question:{...candidate,checks:[]}}
 ]) {
  const s=initialLearning(),before=structuredClone(s);
  await assert.rejects(generateModelQuestion(s,fake(overrides)));assert.deepEqual(s,before);
 }
});
test("teaching is audited and stored feedback survives correction replay",async()=>{
 let s=initialLearning();s.current=await generateModelQuestion(s,fake());
 const d:Draft={id:crypto.randomUUID(),questionId:s.current.id,answer:s.current.expected,explanation:"x is a common factor and expanding recovers both terms.",evidence:{reason:"supported",quote:"x is a common factor",summary:"Explained the common factor."}};
 await assert.rejects(generateTeaching(s,d,"retest",fake({teaching_review:{approved:false,reason:"Invented claim"}})));
 const teaching=await generateTeaching(s,d,"retest",fake());
 s=applyAnswer(s,d,"retest",undefined,teaching);
 assert.equal(s.attempts[0].feedback,teaching.feedback);
 s.current={...s.attempts[0].question,id:crypto.randomUUID()};const second={...d,id:crypto.randomUUID(),questionId:s.current.id};s=applyAnswer(s,second,"retest");
 const rebuilt=correctAttempt(s,second.id);assert.equal(rebuilt.attempts[0].feedback,teaching.feedback);
});


test("follow-up replies persist without awarding mastery or clearing notebook evidence",async()=>{
 const s=initialLearning();s.current=await generateModelQuestion(s,fake());
 const d:Draft={id:crypto.randomUUID(),questionId:s.current.id,answer:s.current.expected,explanation:"Expanding x times x minus five gives both terms.",evidence:{reason:"supported",quote:"both terms",summary:"Checks the expansion"}};
 const assessed=applyAnswer(s,d,"retest");
 const before=structuredClone(assessed.mastery);
 const feedback=await continueDiscussion(assessed,"I would check both cross terms and the constant.",fake({discussion_reply:{feedback:"Yes. Compare the combined cross terms with the original middle term and check the constant product."}}));
 const next=appendDiscussion(assessed,"reply-one","I check each term",feedback);
 assert.deepEqual(next.mastery,before);assert.equal(next.attempts.length,1);
 assert.equal(next.attempts[0].discussion?.length,1);assert.equal(next.draft,null);
 assert.equal(next.attempts[0].feedback,assessed.attempts[0].feedback);
 assert.deepEqual(appendDiscussion(next,"reply-one","duplicate",feedback),next);
 assert.equal(assessed.attempts[0].discussion,undefined);
 await assert.rejects(()=>continueDiscussion(assessed,"My answer",fake({discussion_reply:{feedback:"This is an incorrect mathematical assertion."},discussion_review:{approved:false,reason:"Wrong maths"}})));
});
