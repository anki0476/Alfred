"use client";
import { VoiceOrb } from "./VoiceOrb";
export function AlfredLoading({label}:{label:string}){
 return <div className="alfred-loading" role="status" aria-live="polite" aria-atomic="true"><VoiceOrb listening={false}/><span>{label}</span></div>;
}
