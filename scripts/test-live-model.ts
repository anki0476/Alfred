import assert from "node:assert/strict";
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {generateModelQuestion,type ModelCall} from "../lib/server/model-tutor";
import {initialLearning} from "../lib/adaptive";
const settings:Record<string,string>={};
for(const line of (await readFile(".dev.vars","utf8")).split(/\r?\n/)){const m=line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);if(m)settings[m[1]]=m[2].replace(/^["']|["']$/g,"");}
const calls:{path:string;model:unknown;status:number}[]=[];
const call:ModelCall=async(path,body)=>{const r=await fetch("https://api.openai.com/v1/"+path,{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+settings.OPENAI_API_KEY},body:JSON.stringify(body),signal:AbortSignal.timeout(60000)});calls.push({path,model:body.model,status:r.status});if(!r.ok)throw Error("OpenAI HTTP "+r.status);return r.json();};
const ids=process.argv.slice(2);
const queue=ids.length?ids:["factor","hcf-lcm","irrationality","linear-modelling","quadratic-modelling","ap-modelling","section","bpt","tangent-radius","trig-proofs","heights-distances","segment","composite-surface","grouped-median","grouped-mode","probability"];
const results:any[]=[];
await mkdir("outputs",{recursive:true});
async function worker(){for(;;){const id=queue.shift();if(!id)return;const s=initialLearning();s.mastery[id].score=id==="factor"?0:.9;const at=Date.now();try{const q=await generateModelQuestion(s,call,id);assert.ok(q.teaching?.model==="gpt-6-luna");results.push({id,ok:true,question:q});console.log(JSON.stringify({id,ok:true,seconds:Math.round((Date.now()-at)/1000),prompt:q.prompt,answer:q.expected,verification:q.teaching?.verification}));}catch(e){results.push({id,ok:false,error:String(e)});console.log(JSON.stringify({id,ok:false,error:String(e)}));}await writeFile("outputs/model-coverage.json",JSON.stringify({results,calls},null,2));}}
await Promise.all([worker(),worker()]);
assert.ok(results.every(r=>r.ok),"Some generated questions were rejected; inspect outputs/model-coverage.json");
assert.ok(calls.every(c=>c.model==="gpt-6-luna"));
console.log("PASS "+results.length+" sampled live model questions with reviewed solutions and citations.");

