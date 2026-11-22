import pages from "./cbse-source-pack.json" with {type:"json"};
import { concept } from "../adaptive";
export type SourcePage = typeof pages[number];
export type Citation = { id:string; quote:string };
const normalize=(s:string)=>s.normalize("NFKC").replace(/[–—−]/g,"-").replace(/\s+/g," ").trim();
export function sourcesFor(id:string):SourcePage[] {
 const c=concept(id);
 if(!c) throw new Error("Unknown curriculum concept");
 const terms=(c.name+" "+c.lesson+" "+c.unit).toLowerCase().match(/[a-z]{4,}/g)||[];
 const score=(p:SourcePage)=>terms.reduce((n,w)=>n+(p.text.toLowerCase().includes(w)?1:0),0);
 const ranked=(kind:string,n:number)=>pages.filter(p=>p.kind===kind).sort((a,b)=>score(b)-score(a)).slice(0,n);
 return [pages.find(p=>p.id==="syllabus-p"+c.page)!,...ranked("sample",2),...ranked("marking",3)].filter(Boolean).map(p=>({...p,quoteOptions:p.text.split("\n").map(normalize).filter(t=>t.split(" ").length>=8).map(t=>t.split(" ").slice(0,15).join(" ")).slice(0,12)}));
}
export function validateCitations(refs:Citation[],sources:SourcePage[]) {
 if(!refs.length) throw new Error("Missing source references");
 for(const ref of refs) {
  const page=sources.find(p=>p.id===ref.id),quote=normalize(ref.quote);
  if(!page || quote.length<8 || quote.split(" ").length>25 || !normalize(page.text).includes(quote))
   throw new Error("Source citation "+ref.id+" is invalid: quote must be copied exactly from the supplied page, 8–25 words and at most 200 characters. Use a short prose phrase, avoiding broken math notation.");
 }
}
export function sourceLabel(refs:Citation[],sources:SourcePage[]) {
 return [...new Set(refs.map(r=>{const p=sources.find(p=>p.id===r.id)!;return p.title+" · p. "+p.page;}))].join("; ");
}
