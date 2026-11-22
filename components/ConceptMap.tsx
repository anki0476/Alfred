"use client";
import {useState} from "react";
import "./concept-map.css";
type Concept={id:string;name:string;unit:string;prerequisites:readonly string[];supported:boolean};
export function ConceptMap({concepts}:{concepts:readonly Concept[]}){
 const [selected,setSelected]=useState<string|null>(null),[hovered,setHovered]=useState<string|null>(null),[focused,setFocused]=useState<string|null>(null);
 const active=hovered||focused||selected;
 const current=concepts.find(c=>c.id===active);
 const before=current?concepts.filter(c=>current.prerequisites.includes(c.id)):[];
 const after=current?concepts.filter(c=>c.prerequisites.includes(current.id)):[];
 const connected=new Set([active,...before.map(c=>c.id),...after.map(c=>c.id)]);
 const units=[...new Set(concepts.map(c=>c.unit))];
 const links=(items:readonly Concept[],empty:string)=>items.length?items.map(c=><button key={c.id} onClick={()=>{setSelected(c.id);setHovered(null);setFocused(null)}}>{c.name}</button>):<p>{empty}</p>;
 return <section className="concept-map" aria-label="Explore concept connections">
  <div className="map-heading"><div><h3>Explore the connections</h3><p>Hover, focus or tap a concept to see what it builds on and what comes next.</p></div>{selected&&<button className="text-button" onClick={()=>{setSelected(null);setHovered(null);setFocused(null)}}>Clear selection</button>}</div>
  <div className="map-relations" aria-live="polite" aria-atomic="true">
   {current?<><div><span>Builds on</span>{links(before,"No prerequisites in this map.")}</div><div className="map-current"><span>Selected concept</span><strong>{current.name}</strong><small>{current.supported?"AI-guided text practice":"Mapped only · practice unavailable"}</small></div><div><span>Leads to</span>{links(after,"No follow-on concepts in this map.")}</div></>:<p className="map-empty">Choose a concept below. Its direct connections will appear here.</p>}
  </div>
  <div className="map-units">{units.map(unit=><section key={unit}><h4>{unit}</h4><div className="map-nodes">{concepts.filter(c=>c.unit===unit).map(c=><button key={c.id} className={`map-node ${active===c.id?'is-current':active&&connected.has(c.id)?'is-connected':active?'is-muted':''}`} aria-pressed={selected===c.id} onMouseEnter={()=>setHovered(c.id)} onMouseLeave={()=>setHovered(null)} onFocus={()=>setFocused(c.id)} onBlur={()=>setFocused(null)} onClick={()=>setSelected(c.id)}>{c.name}{!c.supported&&<small>Mapped only</small>}</button>)}</div></section>)}</div>
 </section>
}
