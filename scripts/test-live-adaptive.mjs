import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
const origin='http://127.0.0.1:5174';
function client(){let cookie='';return async(path,body,expected=200)=>{const r=await fetch(origin+path,{method:body?'POST':'GET',headers:{...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json',Origin:origin}:{})},body:body?JSON.stringify(body):undefined});const incoming=r.headers.getSetCookie();if(incoming.length)cookie=incoming.map(x=>x.split(';')[0]).join('; ');const value=await r.json();assert.equal(r.status,expected,JSON.stringify(value));return value;};}
const learner=client(),teacher=client(),outsider=client();
let row=await learner('/api/learning');
async function act(operation,extra={}){row=await learner('/api/learning',{operation,version:row.version,...extra});return row;}
function correct(q){switch(q.concept){case 'factor':return {answer:q.options.find(x=>x===q.a+'*x*(x-('+q.k+'))'),explanation:`I take the common factor ${q.a}x from both terms. Multiplying ${q.a}x by x gives ${q.a}x squared, and multiplying it by negative ${q.k} gives negative ${q.a*q.k}x, so both original terms are reconstructed.`};case 'product':return {answer:'0 and '+q.k,explanation:`A product equals zero when at least one factor is zero. The constant ${q.a} is nonzero. x can equal zero, or x minus ${q.k} can equal zero, giving x equal ${q.k}. Those are both solutions.`};case 'division':return {answer:q.options.find(x=>x.startsWith('Check')),explanation:`When x is zero both sides of the original equation equal zero, so zero is a solution. Dividing by x is valid only for nonzero x and would lose zero if we did not check it separately. The nonzero branch gives x equal ${q.k}.`};default:return {answer:q.options.find(x=>x.startsWith('No: consider')),explanation:`Checking x equal ${q.k} by substitution only verifies that candidate. Factor the equation as ${q.a} times x times x minus ${q.k} equals zero; the zero-product rule covers both x equal zero and x equal ${q.k}. Considering both factors proves completeness for this quadratic.`};}}
for(let i=0;i<4;i++){
 await act('next');const response=correct(row.state.current);const id=randomUUID();await act('interpret',{...response,requestId:id});assert.equal(row.state.draft.evidence.reason,'supported',JSON.stringify(row.state.draft.evidence));await act('confirm',{requestId:id});assert.equal(row.state.diagnostic.length,i+1);console.log('PASS diagnostic concept',i+1);
 const version=row.version;await act('confirm',{requestId:id});assert.equal(row.version,version);
}
assert.equal(row.state.attempts.length,4);
const reloaded=await learner('/api/learning');assert.deepEqual(reloaded.state.mastery,row.state.mastery);
await teacher('/api/classroom',{operation:'create',name:'Local integration test class'});
let classroom=await teacher('/api/classroom');assert.equal(classroom.dashboard.count,0);
await learner('/api/classroom',{operation:'join',code:classroom.owned.join_code,alias:'Test learner'});
classroom=await teacher('/api/classroom');assert.equal(classroom.dashboard.count,1);assert.equal(classroom.dashboard.diagnosed,1);assert.ok(classroom.dashboard.concepts.every(c=>c.assessed===1&&c.average===25));
const privateView=await outsider('/api/classroom');assert.equal(privateView.owned,null);assert.equal(privateView.dashboard,null);assert.equal(privateView.membership.length,0);
await outsider('/api/learning',{operation:'next',version:999},409);
const undone=row.state.attempts[1].id;await act('correct',{attemptId:undone});assert.equal(row.state.diagnostic.length,1);assert.equal(row.state.mastery.product.dueAt,null);
classroom=await teacher('/api/classroom');assert.equal(classroom.dashboard.diagnosed,0);assert.equal(classroom.dashboard.concepts[1].unknown,1);
await learner('/api/classroom',{operation:'leave',classId:classroom.owned.id});assert.equal((await teacher('/api/classroom')).dashboard.count,0);
console.log('PASS: live Responses + Decisions diagnostic, reload, idempotency, stale versions, class join, owner isolation, correction propagation and leaving class.');

