"use client";
import { useEffect, useRef, useState } from 'react';
import './music-player.css';
import { MusicPlayback, readMusicState, saveMusicState } from './MusicPlayback';

// Adapted from @componentry/music-player: record, grooves, glare and tonearm.
// Native CSS replaces its Tailwind/Framer Motion styling for this portfolio.
export function MusicPlayer({ active }: { active: boolean }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [initial] = useState(readMusicState);
  const [volume, setVolume] = useState(initial.volume);
  const [failed, setFailed] = useState(false);
  const playback = useRef<MusicPlayback | null>(null);
  useEffect(() => {
    const element = audio.current!;
    const controller = new MusicPlayback(element, { ...initial }, saveMusicState, () => setPlaying(false));
    playback.current = controller;
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('alfred-music') : null;
    const claim = () => channel?.postMessage('playing');
    if (channel) channel.onmessage = () => controller.stop();
    element.addEventListener('play', claim);
    const resume = () => controller.returnToPage();
    const suspend = () => controller.suspend();
    const visibility = () => document.hidden ? suspend() : resume();
    const metadata = () => controller.resume();
    let savedAt = 0;
    const checkpoint = () => { if (performance.now() - savedAt > 2000) { controller.save(); savedAt = performance.now(); } };
    const start = (event: Event) => {
      if ((event.target as Element)?.closest?.('.music-player')) return;
      controller.resume();
    };
    window.addEventListener('pagehide', suspend);
    window.addEventListener('pageshow', resume);
    document.addEventListener('visibilitychange', visibility);
    element.addEventListener('loadedmetadata', metadata);
    element.addEventListener('timeupdate', checkpoint);
    document.addEventListener('pointerdown', start);
    document.addEventListener('keydown', start);
    if (document.hidden) suspend();
    return () => {
      controller.stop(); controller.suspend(); playback.current = null;
      element.removeEventListener('play', claim); channel?.close();
      window.removeEventListener('pagehide', suspend); window.removeEventListener('pageshow', resume);
      document.removeEventListener('visibilitychange', visibility);
      element.removeEventListener('loadedmetadata', metadata); element.removeEventListener('timeupdate', checkpoint);
      document.removeEventListener('pointerdown', start); document.removeEventListener('keydown', start);
    };
  }, [initial]);
  useEffect(() => { playback.current?.setActive(active); }, [active]);
  useEffect(() => { if (audio.current) audio.current.volume = volume; playback.current?.save(); }, [volume]);
  const toggle = () => {
    setFailed(false); playback.current?.toggle();
  };
  return <aside className={`music-player ${playing ? 'is-playing' : ''}`} hidden={!active} aria-label="Background music player">
    <audio ref={audio} src="/audio/chill-vibes.mp3" loop preload="metadata" onPlaying={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => { setFailed(true); setPlaying(false); }}/>
    <button className="music-record-button" onClick={toggle} aria-label={playing ? 'Pause background music' : 'Play background music'} aria-pressed={playing}>
      <span className="music-tonearm"><i/></span>
      <span className="music-record"><span className="music-label">✳<i/></span></span>
      <span className="music-play-icon" aria-hidden="true">{playing ? 'Ⅱ' : '▶'}</span>
    </button>
    <div className="music-settings"><span className="music-title">CHILL VIBES</span><span className="music-status" role="status">{failed ? 'Tap to retry' : playing ? 'Playing · BGM' : 'Paused · BGM'}</span><label>Volume<input type="range" min="0" max="1" step=".01" value={volume} onChange={event => setVolume(Number(event.target.value))} aria-label="Background music volume"/></label></div>
  </aside>;
}
