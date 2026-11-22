"use client";
import {useEffect} from 'react';
export function SmoothScroll(){useEffect(()=>{
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let frame=0,target=0,last=0;
 const stop=()=>{cancelAnimationFrame(frame);frame=0};
 const tick=(now:number)=>{const root=document.scrollingElement;if(!root){stop();return}const dt=Math.min(50,now-last);last=now;target=Math.max(0,Math.min(target,root.scrollHeight-innerHeight));const distance=target-root.scrollTop;root.scrollTo({top:root.scrollTop+distance*(1-Math.exp(-dt/70)),behavior:"instant"});if(Math.abs(distance)<.5){root.scrollTo({top:target,behavior:"instant"});frame=0}else frame=requestAnimationFrame(tick)};
 const wheel=(event:WheelEvent)=>{
  if(reduced.matches||event.ctrlKey||event.defaultPrevented||Math.abs(event.deltaX)>Math.abs(event.deltaY))return;
  // Nested readers, editors and panels keep their own native scrolling.
  for(let el=event.target instanceof Element?event.target:null;el&&el!==document.body;el=el.parentElement){if(el.matches('input,textarea,select,[contenteditable=true]')||(/auto|scroll/.test(getComputedStyle(el).overflowY)&&el.scrollHeight>el.clientHeight))return}
  const root=document.scrollingElement;if(!root||getComputedStyle(document.body).overflow==='hidden'||root.scrollHeight<=innerHeight)return;
  const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);
  event.preventDefault();if(!frame)target=root.scrollTop;
  target=Math.max(0,Math.min(target+delta,root.scrollHeight-innerHeight));
  if(!frame){last=performance.now();frame=requestAnimationFrame(tick)}
 };
 window.addEventListener('wheel',wheel,{passive:false});
 window.addEventListener('pointerdown',stop);window.addEventListener('keydown',stop);window.addEventListener('hashchange',stop);reduced.addEventListener('change',stop);
 return()=>{stop();window.removeEventListener('wheel',wheel);window.removeEventListener('pointerdown',stop);window.removeEventListener('keydown',stop);window.removeEventListener('hashchange',stop);reduced.removeEventListener('change',stop)};
 },[]);return null}

