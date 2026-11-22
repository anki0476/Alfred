import {syllabus,type Learning} from "./adaptive";
import {pack,type SessionState} from "./pack";
import {notebook} from "./learning";
export type NotebookEntry={id:string;attemptId?:string;origin:string;title:string;explanation:string;feedback:string;at:string;status:string;dueAt?:string|null;sources:{title:string;text:string}[];href:string};
export function projectNotebook(state:Learning,sessions:{id:string;state:SessionState}[],materials:NotebookEntry[]=[]):NotebookEntry[]{
 const adaptive=state.attempts.filter(t=>t.outcome!=="demonstrated").map(t=>{
 const later=state.attempts.filter(x=>x.question.concept===t.question.concept&&state.attempts.indexOf(x)>state.attempts.indexOf(t));
 const resolved=later.at(-1)?.outcome==="demonstrated";
 const c=syllabus.concepts.find(c=>c.id===t.question.concept)!;
 return {id:"learning:"+t.id,attemptId:t.id,origin:"Study practice",title:t.question.prompt,explanation:t.explanation,feedback:t.feedback,at:t.at,status:resolved?"Demonstrated on a later question":t.outcome==="unverified"?"Reasoning needs clarification":"Needs practice",dueAt:state.mastery[t.question.concept].dueAt,sources:[{title:t.source,text:t.feedback}],href:"/studio"};});
 const legacy=sessions.flatMap(s=>notebook(s.state).map(t=>({id:"studio:"+s.id+":"+t.id,origin:"Earlier studio practice",title:pack.questions[t.questionIndex].display,explanation:t.transcript,feedback:t.feedback,at:t.createdAt,status:t.evidenceStatus.replaceAll("_"," "),sources:t.sourceIds.flatMap(id=>{const x=pack.sources.find(s=>s.id===id);return x?[{title:x.title,text:x.text}]:[]}),href:"/studio"})));
 return [...adaptive,...legacy,...materials].sort((a,b)=>b.at.localeCompare(a.at));
}
