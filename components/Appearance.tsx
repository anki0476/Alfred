"use client";
import {useEffect,useState} from 'react';

export function ThemeInit(){useEffect(()=>{try{document.documentElement.dataset.theme=localStorage.getItem('alfred-theme')||'light'}catch{}},[]);return null}
export function Appearance(){const [dark,setDark]=useState(false);useEffect(()=>setDark(document.documentElement.dataset.theme==='dark'),[]);return <section className="appearance-options"><h3>Appearance</h3><p>Choose the theme that feels comfortable to study in.</p><label className="theme-choice"><span>Dark theme</span><button role="switch" aria-checked={dark} aria-label="Dark theme" className="theme-switch" onClick={()=>{const next=!dark;setDark(next);document.documentElement.dataset.theme=next?'dark':'light';try{localStorage.setItem('alfred-theme',next?'dark':'light')}catch{}}}><span/></button></label><small>{dark?'Dark':'Light'} theme · saved on this device</small></section>}
