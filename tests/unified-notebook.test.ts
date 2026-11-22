import {generateQuestion} from "./fixtures/questions";
import test from "node:test";
import assert from "node:assert/strict";
import {initialLearning,applyAnswer,correctAttempt,type Learning} from "../lib/adaptive";
import {projectNotebook,type NotebookEntry} from "../lib/unified-notebook";
function answer(s:Learning,reason:"misconception"|"supported"|"unclear"){const q=s.current!;return applyAnswer(s,{id:crypto.randomUUID(),questionId:q.id,answer:q.expected,explanation:"My reasoning",evidence:{reason,quote:"My reasoning",summary:"Evidence"}},"retest");}
test("one notebook reflects new mistakes, later review and correction rollback without duplicated copies",()=>{
 let s=initialLearning();s.current=generateQuestion(s);s=answer(s,"misconception");const first=s.attempts[0];
 assert.equal(projectNotebook(s,[]).length,1);assert.equal(projectNotebook(s,[])[0].status,"Needs practice");
 const before=structuredClone(s.mastery);s.current=generateQuestion(s,undefined,undefined,first.question.concept);assert.equal(s.current.mode,"review");assert.deepEqual(s.mastery,before);
 s=answer(s,"supported");assert.equal(projectNotebook(s,[]).length,1);assert.equal(projectNotebook(s,[])[0].status,"Demonstrated on a later question");assert.ok(s.mastery.factor.dueAt);
 s=correctAttempt(s,s.attempts[1].id);assert.equal(projectNotebook(s,[])[0].status,"Needs practice");
 s=correctAttempt(s,first.id);assert.equal(projectNotebook(s,[]).length,0);
});
test("uncertain reasoning is labelled separately and material entries do not change mastery",()=>{
 let s=initialLearning();s.current=generateQuestion(s);s=answer(s,"unclear");assert.equal(projectNotebook(s,[])[0].status,"Reasoning needs clarification");
 const before=structuredClone(s);const material:NotebookEntry={id:"material:one",origin:"Uploaded material",title:"Question",explanation:"Answer",feedback:"Clarify",at:new Date().toISOString(),status:"Needs review",sources:[],href:"/materials"};
 assert.equal(projectNotebook(s,[],[material]).length,2);assert.deepEqual(s,before);
});
