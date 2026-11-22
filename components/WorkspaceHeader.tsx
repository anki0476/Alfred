"use client";
import {useState} from "react";
import {Sparkles,NotebookPen,BookOpen,Users,Route,Settings2,X} from "lucide-react";
import {GeneralSettings} from "./GeneralSettings";
import {Appearance} from "./Appearance";
export function WorkspaceHeader({active,onSettings,onStudio}:{active:string;onSettings?:()=>void;onStudio?:()=>void}) {
 const [settings,setSettings]=useState(false);
 const links=[['/learn','Learning journey',Route],['/studio','Study studio',Sparkles],['/notebook','Mistake notebook',NotebookPen],['/materials','Study material',BookOpen],['/teacher','Classroom',Users]] as const;
 return <><header className="workspace-header"><a className="brand" href="/" aria-label="Alfred home">
          <span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 40 40" width="34" height="34" fill="none"><path d="M33 8C28 4 25 11 21 18C17 25 11 32 7 29C3 26 5 15 10 13C16 9 20 16 23 22C26 28 29 31 33 28" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
          <span>
            alfred<span className="brand-period">.</span>
          </span>
        </a><nav aria-label="Study navigation">{links.map(([href,label,Icon])=><a key={href} href={href} className={`nav-item ${active===href?'active':''}`} aria-current={active===href?'page':undefined} onClick={href==='/studio'&&onStudio?e=>{e.preventDefault();onStudio()}:undefined}><Icon size={19}/>{label}</a>)}</nav><div className="workspace-tools"><a href="/about" className="workspace-settings workspace-settings-icon" aria-label="About Alfred" title="About Alfred" style={{textDecoration:"none",fontFamily:"Georgia, serif",fontSize:22}}>i</a><button className="workspace-settings workspace-settings-icon" aria-label="Open settings" title="Settings" onClick={onSettings||(()=>setSettings(true))}><Settings2 size={20}/></button></div></header>{settings&&<dialog open aria-label="Settings" className="shared-settings-panel" onKeyDown={e=>{if(e.key==='Escape')setSettings(false)}}><button autoFocus className="text-button" aria-label="Close settings" onClick={()=>setSettings(false)}><X size={20}/></button><h2>Settings</h2><GeneralSettings/><Appearance/></dialog>}</>;
}

