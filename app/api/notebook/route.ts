import {getLearningIdentity} from "../../../lib/learning-identity";
import {learningDB,loadLearning} from "../../../lib/adaptive-storage";
import {projectNotebook,type NotebookEntry} from "../../../lib/unified-notebook";
import type {SessionState} from "../../../lib/pack";
export const dynamic="force-dynamic";
export async function GET(request:Request){try{
 const {userId}=await getLearningIdentity(request);const db=learningDB();
 const [learning,sessions,items]=await Promise.all([loadLearning(userId),db.prepare("SELECT id,state FROM sessions WHERE user_id=?").bind(userId).all<{id:string;state:string}>(),db.prepare("SELECT entry FROM notebook_items WHERE user_id=?").bind(userId).all<{entry:string}>()]);
 return Response.json({version:learning.version,current:!!learning.state.current,entries:projectNotebook(learning.state,sessions.results.map(s=>({id:s.id,state:JSON.parse(s.state) as SessionState})),items.results.map(r=>JSON.parse(r.entry) as NotebookEntry))},{headers:{"Cache-Control":"no-store"}});
}catch{return Response.json({error:"Your notebook could not load. Please retry."},{status:503});}}
