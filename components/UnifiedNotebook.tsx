"use client";
import {useEffect,useState} from "react";
import {WorkspaceHeader} from "./WorkspaceHeader";
import {BooksShowcase} from "./ui/books-showcase";
import {NotebookReader} from "./NotebookReader";
import type {NotebookEntry} from "../lib/unified-notebook";
import "./learning.css";
export default function UnifiedNotebook(){
 const [data,setData]=useState<{version:number;current:boolean;entries:NotebookEntry[]}|null>(null),[error,setError]=useState(""),[busy,setBusy]=useState(false),[page,setPage]=useState<number|null>(null);
 async function refresh(){try{const r=await fetch('/api/notebook');const v=await r.json() as {version:number;current:boolean;entries:NotebookEntry[];error?:string};if(!r.ok)throw Error(v.error||"Please retry.");setData(v);setError('');}catch(e){setError(String(e));}}
 useEffect(()=>{void refresh();const focus=()=>void refresh();window.addEventListener('focus',focus);return()=>window.removeEventListener('focus',focus)},[]);
 async function act(e:NotebookEntry,operation:string){if(!data||busy)return;if(operation==='correct'&&!window.confirm('Reopen this attempt? This removes its assessment and all later dependent progress and review dates.'))return;setBusy(true);try{const r=await fetch('/api/learning',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({operation,version:data.version,attemptId:e.attemptId})});const v=await r.json() as {version:number;current:boolean;entries:NotebookEntry[];error?:string};if(!r.ok)throw Error(v.error||"Please retry.");window.location.href='/studio';}catch(e){setError(String(e));setBusy(false);}}
 const books=[{id:"mistake-notebook",title:"Mistake Notebook",author:"Your learning, revisited",year:"Alfred",stars:0,desc:"All your saved mistakes, reflections and supporting notes in one notebook.",chapters:(data?.entries||[]).map(entry=>entry.title),images:{front:"/images/mistake-notebook-cover.png"},spineBg:"#b97558",spineInk:"#f5f2e8",backBg:"#e8e7da"}];
 return <div className="app-shell"><WorkspaceHeader active="/notebook"/><main className="main notebook-page"><section className="notebook-page-content">{error&&<p role="alert">{error} <button onClick={()=>void refresh()}>Refresh</button></p>}{!data?<p role="status">Opening your notebook…</p>:page!==null?<NotebookReader entries={data.entries} initialPage={page} onClose={()=>setPage(null)} onReview={e=>void act(e,'review')} onCorrect={e=>void act(e,'correct')} reviewDisabled={busy||data.current}/>:<><BooksShowcase books={books} heroTitle="Notebook" navTitle="YOUR LEARNING, REVISITED" showDetailPanel={false} className="notebook-showcase" onBookSelect={book=>{if(book)setPage(0);}}/><button className="text-button" onClick={()=>setPage(0)}>Open mistake notebook · {data.entries.length} saved entries</button></>}</section></main></div>;
}
