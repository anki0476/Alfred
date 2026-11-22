import {generateQuestion} from "./fixtures/questions";
import test from "node:test";
import assert from "node:assert/strict";
import {syllabus,supportedConcepts,diagnosticCount,initialLearning,normalizeLearning,target} from "../lib/adaptive";
import {expandedQuestion,verifyExpanded} from "./fixtures/curriculum-questions";
const oldIds=['factor','product','division','complete'];
test('full graph has seven units, unique concepts, valid edges and no cycles',()=>{
 assert.equal(new Set(syllabus.concepts.map(c=>c.unit)).size,7);assert.ok(syllabus.concepts.length>=50);assert.equal(new Set(syllabus.concepts.map(c=>c.id)).size,syllabus.concepts.length);
 const done=new Set<string>(),visiting=new Set<string>();function visit(id:string){if(done.has(id))return;assert.ok(!visiting.has(id),'Cycle at '+id);visiting.add(id);const c=syllabus.concepts.find(c=>c.id===id);assert.ok(c,'Missing prerequisite '+id);c.prerequisites.forEach(visit);visiting.delete(id);done.add(id);}syllabus.concepts.forEach(c=>{visit(c.id);assert.ok(c.coverage);assert.ok(c.page>=3&&c.page<=7);});
 assert.equal(diagnosticCount,supportedConcepts.length);assert.ok(diagnosticCount>20);
});
test('legacy learning state preserves assessed evidence while newly mapped concepts start unassessed',()=>{
 const legacy=initialLearning();for(const id of Object.keys(legacy.mastery))if(!oldIds.includes(id))delete legacy.mastery[id];legacy.mastery.factor.score=.5;legacy.mastery.factor.assessed=2;legacy.diagnostic=['factor'];const copy=structuredClone(legacy),updated=normalizeLearning(legacy);assert.deepEqual(legacy,copy);assert.equal(updated.mastery.factor.score,.5);assert.equal(Object.keys(updated.mastery).length,syllabus.concepts.length);for(const c of syllabus.concepts)if(!oldIds.includes(c.id)){assert.equal(updated.mastery[c.id].assessed,0);assert.equal(updated.mastery[c.id].dueAt,null);}
});
test('mapped-only concepts never generate questions or enter adaptive targeting',()=>{
 const s=initialLearning();s.diagnostic=supportedConcepts.map(c=>c.id);for(const c of supportedConcepts)s.mastery[c.id].score=.9;for(const c of syllabus.concepts.filter(c=>!c.supported)){assert.throws(()=>generateQuestion(s,undefined,undefined,c.id));}assert.ok(supportedConcepts.some(c=>c.id===target(s).id));
});
test('historical numerical fixtures remain valid for stored-session regression',()=>{
 for(const c of supportedConcepts)for(const [level,score] of [[1,0],[2,.5],[3,.9]])for(let seed=0;seed<60;seed++){
 const s=initialLearning();s.mastery[c.id].score=score;s.correctionCount=seed;const q=generateQuestion(s,undefined,undefined,c.id);assert.equal(q.level,level,c.id);assert.equal(q.concept,c.id);assert.equal(new Set(q.options).size,3,c.id+' '+seed);assert.equal(q.options.filter(o=>o===q.expected).length,1);if(q.parameters){assert.equal(verifyExpanded(c.id,q.parameters,q.expected),true);assert.throws(()=>verifyExpanded(c.id,q.parameters!,q.options.find(o=>o!==q.expected)!));}
 }
});
test('representative independent known results cover arithmetic, roots, coordinates and probability',()=>{
 assert.equal(expandedQuestion('hcf-lcm',1,0).expected,'HCF 2, LCM 30');
 assert.equal(expandedQuestion('quadratic-roots',1,0).expected,'2 and 4');
 assert.equal(expandedQuestion('linear-elimination',1,0).expected,'(2, 3)');
 assert.equal(expandedQuestion('ap-nth',1,0).expected,'6');
 assert.equal(expandedQuestion('ap-sum',1,0).expected,'20');
 assert.equal(expandedQuestion('distance',1,0).expected,'5');
 assert.equal(expandedQuestion('section',1,0).expected,'(-1, 0)');
 assert.equal(expandedQuestion('trig-ratios',1,0).expected,'3/5');
 assert.equal(expandedQuestion('probability',1,0).expected,'1/2');
});
