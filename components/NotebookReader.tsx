"use client";
import { useEffect, useRef, useState } from "react";
import type {NotebookEntry} from "../lib/unified-notebook";
import { pack, type Turn } from "../lib/pack";

export function NotebookReader({ entries, initialPage, onClose, onReview, onCorrect, reviewDisabled }: { entries: (Turn | NotebookEntry)[]; initialPage: number; onClose: () => void; onReview?:(entry:NotebookEntry)=>void; onCorrect?:(entry:NotebookEntry)=>void; reviewDisabled?:boolean }) {
  const [webView,setWebView]=useState(true);
  useEffect(()=>{try{setWebView(localStorage.getItem("alfred-notebook-view")!=="reader")}catch{}},[]);
  const changeView=(web:boolean)=>{setWebView(web);try{localStorage.setItem("alfred-notebook-view",web?"web":"reader")}catch{}};
  const viewSwitch=<div className="notebook-view-switch" role="group" aria-label="Notebook layout"><button aria-pressed={!webView} onClick={()=>changeView(false)}>Page reader</button><button aria-pressed={webView} onClick={()=>changeView(true)}>Webpage</button></div>;
  const total = Math.max(2, entries.length * 2 + 1);
  const [page, setPage] = useState(Math.min(initialPage, total - 1));
  const [direction, setDirection] = useState("next");
  const [zoom, setZoom] = useState(100);
  const paper = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => { close.current?.focus(); }, []);
  const go = (next: number) => { setDirection(next > page ? "next" : "previous"); setPage(Math.max(0, Math.min(total - 1, next))); };
  useEffect(() => { paper.current?.scrollTo(0, 0); }, [page]);
  const entry = page > 0 ? entries[Math.floor((page - 1) / 2)] : null;
  const unified=entry && "origin" in entry ? entry : null;
  const legacy=entry && "questionIndex" in entry ? entry : null;
  const reflection = page > 0 && page % 2 === 0;
  if(webView)return <section className="notebook-web" aria-label="Mistake notebook" onKeyDown={event=>{if(event.key==="Escape")onClose()}}>
    <header className="notebook-web-toolbar"><button ref={close} onClick={onClose}>Close notebook</button>{viewSwitch}</header>
    <h1>Mistake notebook</h1><p className="notebook-web-intro">Your thinking, feedback and next steps — all in one place.</p>
    {!entries.length?<div className="notebook-web-empty"><h2>Room for new understanding.</h2><p>Your explanations and feedback will appear here as you practice.</p><a href="/studio">Go to study studio</a></div>:entries.map((item,index)=>{const note="origin" in item?item:null;const old="questionIndex" in item?item:null;const sources=note?.sources||old!.sourceIds.flatMap(id=>{const source=pack.sources.find(s=>s.id===id);return source?[source]:[]});return <article className="notebook-web-entry" key={item.id}><span className="eyebrow">ENTRY {index+1}</span><h2>{note?.title||(old?pack.questions[old.questionIndex].display:"")}</h2><p className="reader-date">{new Date(note?.at||old!.createdAt).toLocaleDateString()}</p><div className="notebook-web-columns"><section><h3>My original thinking</h3><blockquote>{note?.explanation||old?.transcript}</blockquote></section><section><h3>Reflect &amp; revisit</h3><p>{item.feedback}</p>{note&&<p className="notebook-web-status">{note.status}</p>}{sources.length>0&&<details><summary>Supporting study notes</summary>{sources.map((source,i)=><aside key={i}><h4>{source.title}</h4><p>{source.text}</p></aside>)}</details>}{note?.attemptId&&<div className="button-row">{onReview&&<button disabled={reviewDisabled} onClick={()=>onReview(note)}>Practice this concept</button>}{onCorrect&&<button onClick={()=>onCorrect(note)}>Correct recorded explanation</button>}</div>}</section></div></article>})}
  </section>;
  return <section className="notebook-reader" aria-label="Mistake notebook reader" onKeyDown={event => {
    if ((event.target as HTMLElement).matches("input,select,textarea")) return;
    if (event.key === "ArrowRight") { event.preventDefault(); go(page + 1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); go(page - 1); }
    if (event.key === "Escape") onClose();
  }}>
    <header className="reader-toolbar">
      <button ref={close} onClick={onClose}>← Close notebook</button>
      {viewSwitch}<span aria-live="polite">Page {page + 1} of {total}</span>
      <label>Zoom <select value={zoom} onChange={event => setZoom(Number(event.target.value))}>{[75,100,125,150].map(value => <option key={value} value={value}>{value}%</option>)}</select></label>
    </header>
    <div className="reader-scroll" ref={paper}>
      <article key={page} className={`reader-paper turn-${direction}`} style={{ width: `${zoom * 6.4}px` }}>
        {page === 0 ? <img className="reader-cover" src="/images/mistake-notebook-cover.png" alt="Mistake Notebook — Alfred" /> : entry ? <div className="reader-page-content">
          <span className="eyebrow">ENTRY {Math.floor((page - 1) / 2) + 1} · {reflection ? "REFLECT & REVISIT" : "MY ORIGINAL THINKING"}</span>
          <h1>{unified?.title || (legacy ? pack.questions[legacy.questionIndex].display : "")}</h1>
          <p className="reader-date">{new Date(unified?.at || legacy!.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}</p>
          {reflection ? <><h2>What to revisit</h2><p>{entry.feedback}</p>{unified && <><p>{unified.status}</p>{unified.attemptId && <div className="button-row"><button disabled={reviewDisabled} onClick={()=>onReview?.(unified)}>Practice this concept</button><button onClick={()=>onCorrect?.(unified)}>Correct recorded explanation</button></div>}</>}{(unified?.sources || legacy!.sourceIds.flatMap(id=>{const s=pack.sources.find(s=>s.id===id);return s?[s]:[]})).map((source,index) => { const id=String(index); return source ? <aside key={id}><h3>{source.title}</h3><p>{source.text}</p></aside> : null; })}</> : <><h2>In my own words</h2><blockquote>{unified?.explanation || legacy?.transcript}</blockquote><p className="reader-footnote">Turn the page to revisit the feedback and supporting study notes.</p></>}
        </div> : <div className="reader-page-content"><span className="eyebrow">A FRESH PAGE</span><h1>Room for new understanding.</h1><p>No mistakes saved yet. Your original explanations and the feedback they raised will fill these pages as you practice.</p><a href="/studio">Go to study studio →</a></div>}
        <footer className="reader-folio">alfred. <span>{page + 1}</span></footer>
      </article>
    </div>
    <nav className="reader-pagination" aria-label="Notebook pages"><button disabled={page === 0} onClick={() => go(page - 1)}>← Previous page</button><label>Go to page <select value={page} onChange={event => go(Number(event.target.value))}>{Array.from({length:total},(_,i) => <option key={i} value={i}>{i + 1}</option>)}</select></label><button disabled={page === total - 1} onClick={() => go(page + 1)}>Next page →</button></nav>
  </section>;
}
