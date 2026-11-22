"use client";
// Adapted from anki0476/creativejuices, src/RetroComputer.tsx.
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// The supplied typing component's timed key-down/key-up behavior, rebuilt around
// a front-facing, real-time 3D version of the user's retro computer reference.
export function RetroComputer({ sound, showcase = false, faceOnly = false, listening = false, voiceLevel = 0 }: { sound: boolean; showcase?: boolean; faceOnly?: boolean; listening?: boolean; voiceLevel?: number }) {
  const listeningRef = useRef(listening);
  const voiceLevelRef = useRef(voiceLevel);
  useEffect(() => { listeningRef.current = listening; voiceLevelRef.current = Math.max(0, Math.min(1, voiceLevel)); }, [listening, voiceLevel]);
  const faceOnlyRef = useRef(faceOnly);
  useEffect(() => { faceOnlyRef.current = faceOnly; }, [faceOnly]);
  const showcaseRef = useRef(showcase);
  useEffect(() => { showcaseRef.current = showcase; }, [showcase]);
  const mount = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);
  const soundEnabled = useRef(sound);
  useEffect(() => { soundEnabled.current = sound; }, [sound]);
  useEffect(() => {
    const host = mount.current!;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
    catch { setFallback(true); return; }
    renderer.setPixelRatio(Math.min(Math.max(window.devicePixelRatio, 1.5), 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    host.appendChild(renderer.domElement);
    renderer.domElement.tabIndex = faceOnlyRef.current ? -1 : 0;
    renderer.domElement.setAttribute('aria-label', faceOnlyRef.current ? 'Alfred, a retro computer with animated eyes and a smile.' : 'Interactive cream retro computer. Press your keyboard or tap the 3D keys to type on its screen.');
    renderer.domElement.setAttribute('role', 'img');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(33, 1, .1, 100);
    camera.position.set(.2, 4.6, 11.8);
    camera.lookAt(0, 1.8, .25);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x827b68, 2.4));
    const keyLight = new THREE.DirectionalLight(0xfff8e7, 4.5);
    keyLight.position.set(-3, 7, 5); keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    Object.assign(keyLight.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: .1, far: 25 });
    keyLight.shadow.normalBias = .035;
    keyLight.shadow.bias = -.0001;
    keyLight.shadow.radius = 5;
    scene.add(keyLight);
    const fill = new THREE.DirectionalLight(0xe3edff, 1.1); fill.position.set(5, 4, -2); scene.add(fill);
    const model = new THREE.Group(); scene.add(model);
    const shell = new THREE.MeshStandardMaterial({ color: 0xdedac1, roughness: .32, metalness: .02 });
    const edge = new THREE.MeshStandardMaterial({ color: 0xa6a28c, roughness: .65 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x252d28, roughness: .48 });
    const caps = new THREE.MeshStandardMaterial({ color: 0xc7c5b7, roughness: .45 });
    const accent = new THREE.MeshStandardMaterial({ color: 0x8c9b82, roughness: .5 });
    function box(w: number, h: number, d: number, r: number, mat: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = model) {
      const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 5, r), mat);
      mesh.position.set(x,y,z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
    }
    box(4.25,.2,3.1,.08,edge,0,.2,.35);
    box(4.4,.52,3.2,.16,shell,0,.49,.35);
    box(2.65,.23,1.4,.08,edge,0,.83,-.38);
    box(2.8,.2,1.48,.07,shell,0,.95,-.4);
    // A deep rounded enclosure and layered bevel form a recessed CRT face.
    box(3.62,2.6,1.55,.28,shell,0,2.28,-.35);
    box(3.01,2.03,.12,.24,edge,0,2.36,.441);
    box(2.87,1.91,.12,.23,dark,0,2.36,.5);
    const screenCanvas = document.createElement('canvas'); screenCanvas.width = 2048; screenCanvas.height = 1360;
    const ctx = screenCanvas.getContext('2d')!; ctx.scale(2, 2);
    const screenTexture = new THREE.CanvasTexture(screenCanvas); screenTexture.colorSpace = THREE.SRGBColorSpace; screenTexture.anisotropy = renderer.capabilities.getMaxAnisotropy(); screenTexture.generateMipmaps = false; screenTexture.minFilter = THREE.LinearFilter;
    const screenMaterial = new THREE.MeshBasicMaterial({ map: screenTexture, toneMapped: false });
    const screenMesh = box(2.7,1.75,.11,.2,screenMaterial,0,2.36,.565);
    // Thin glass glint near the upper edge, instead of a flat floating display.
    const glint = new THREE.MeshBasicMaterial({ color: 0xcde2d7, transparent: true, opacity: .1 });
    box(2.25,.013,.006,.003,glint,0,3.12,.625);
    for (let i = 0; i < 2; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.066,24,16),shell); b.scale.set(1,.75,.5); b.position.set(1.23+i*.19,1.2,.46); model.add(b); }
    const led = new THREE.Mesh(new THREE.SphereGeometry(.027,16,12),new THREE.MeshBasicMaterial({color:0xa9dba1})); led.position.set(-1.33,1.21,.46); model.add(led);
    // A slim manufacturer's mark and inset horizontal ventilation lines.
    box(.28,.035,.009,.004,edge,-1.06,1.21,.463);
    for(let i=0;i<8;i++) box(.19,.012,.013,.004,edge,1.68,1.62+i*.11,.407);
    const keys = new Map<string, THREE.Mesh>(); const keyMeshes: THREE.Mesh[] = [];
    const layouts = [ ['esc','1','2','3','4','5','6','7','8','9','0','⌫'], ['tab','q','w','e','r','t','y','u','i','o','p','['], ['caps','a','s','d','f','g','h','j','k','l','enter'], ['shift','z','x','c','v','b','n','m',',','.','shift'], ['ctrl','alt','space','alt','ctrl'] ];
    layouts.forEach((row, ri) => {
      const widths = row.map(label => label==='space'?1.84:label==='shift'?.49:label==='enter'?.45:label==='caps'?.4:label==='ctrl'||label==='alt'?.39:.28);
      const total = widths.reduce((a,b)=>a+b,0)+(row.length-1)*.035; let x = -total/2;
      row.forEach((label, i) => {
        const w = widths[i]; const key = box(w,.115,.245,.035,label==='enter'?accent:caps,x+w/2,.805,.32+ri*.285);
        key.userData = { label, rest: .805, until: 0 }; keyMeshes.push(key); keys.set(label,key); x+=w+.035;
        const labelCanvas=document.createElement('canvas'); labelCanvas.width=128;labelCanvas.height=64;
        const lc=labelCanvas.getContext('2d')!;lc.fillStyle='#696c60';lc.font=`${label.length>2?18:24}px monospace`;lc.textAlign='center';lc.textBaseline='middle';lc.fillText(label==='space'?'':label,64,32);
        const texture = new THREE.CanvasTexture(labelCanvas); const labelMesh = new THREE.Mesh(new THREE.PlaneGeometry(w*.85,.17),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}));
        labelMesh.rotation.x=-Math.PI/2;labelMesh.position.y=.059;key.add(labelMesh);
      });
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.035}));floor.rotation.x=-Math.PI/2;floor.position.y=.08;floor.receiveShadow=true;scene.add(floor);
    const shadowCanvas=document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=128;const sc=shadowCanvas.getContext('2d')!;const grad=sc.createRadialGradient(64,64,10,64,64,64);grad.addColorStop(0,'rgba(40,38,20,.22)');grad.addColorStop(1,'rgba(40,38,20,0)');sc.fillStyle=grad;sc.fillRect(0,0,128,128);
    const contactShadow=new THREE.Mesh(new THREE.PlaneGeometry(5.8,4.5),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));contactShadow.rotation.x=-Math.PI/2;contactShadow.position.set(0,.085,.45);scene.add(contactShadow);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const message = 'Teach me your thinking.\nLet’s figure it out.\n\nOne idea at a time_';
    let text = reduced ? message : '', index = 0, nextType = performance.now()+2800, userUntil = 0, raf = 0, lastDraw = '', audio: AudioContext | null = null;
    let pointerX=0, pointerY=0;
    let cursorX=-10000,cursorY=-10000,screenHoverStart:number|null=null,eyesUntil=0,eyesActive=false;
    let happyUntil=0,nextBlink=performance.now()+3000,blinkUntil=0;
    let gazeX=0,gazeY=0,lastGazeTime=0,happyBlend=0;
    function drawEyes(now:number) {
      if(now>=nextBlink){blinkUntil=now+140;nextBlink=now+2800+Math.random()*3200;}
      const happy=!listeningRef.current && (((showcaseRef.current || faceOnlyRef.current) && (reduced || now%8000>4500))||now<happyUntil),blinking=now<blinkUntil;
      ctx.fillStyle='#071310';ctx.fillRect(0,0,1024,680);
      const r=renderer.domElement.getBoundingClientRect();
      const gx=THREE.MathUtils.clamp((cursorX-r.left-r.width/2)/(r.width*.25),-1,1);
      const gy=THREE.MathUtils.clamp((cursorY-r.top-r.height*.45)/(r.height*.25),-1,1);
      const elapsed=lastGazeTime?Math.min((now-lastGazeTime)/1000,.05):1/60;
      lastGazeTime=now;
      const follow=1-Math.exp(-10*elapsed);
      gazeX+=(gx*48-gazeX)*follow;gazeY+=(gy*36-gazeY)*follow;
      const dx=gazeX,dy=gazeY;
      ctx.fillStyle='#70ff80';ctx.shadowColor='#40ff66';ctx.shadowBlur=16;
      happyBlend+=((happy?1:0)-happyBlend)*(1-Math.exp(-9*elapsed));
      const blend=happyBlend*happyBlend*(3-2*happyBlend);
      const mix=(a:number,b:number)=>a+(b-a)*blend;
      for(const x of [336,600]) {
        // Morph six adjoining pixel columns from a capsule into a smile arch.
        for(let column=0;column<6;column++){
          const edge=column===0||column===5;
          const normalTop=blinking?328:edge?256:232;
          const normalHeight=blinking?24:edge?168:216;
          const archTop=[316,292,280,280,292,316][column];
          ctx.fillRect(x+dx+mix(column*16,-12+column*24),dy+mix(normalTop,archTop),mix(16,24)+.25,mix(normalHeight,edge?48:24));
        }
      }
      ctx.globalAlpha=blend;
      const smileY=dy+(1-blend)*12;
      ctx.fillRect(476+dx,400+smileY,24,24);ctx.fillRect(548+dx,400+smileY,24,24);
      ctx.fillRect(500+dx,424+smileY,48,24);
      ctx.globalAlpha=1;
      if(listeningRef.current){
        // Actual microphone energy drives the display; silence stays calm.
        const energy=voiceLevelRef.current;
        for(let bar=0;bar<19;bar++){
          const envelope=1-Math.abs(bar-9)/12;
          const motion=reduced ? .75 : .45+.55*Math.abs(Math.sin(now/170+bar*.65));
          const height=8+energy*95*envelope*motion;
          ctx.fillRect(270+bar*26,555-height/2,14,height);
        }
      }
      ctx.shadowBlur=0;
      screenTexture.needsUpdate=true;
    }
    function drawScreen(value: string) {
      const gradient=ctx.createLinearGradient(0,0,1024,680);gradient.addColorStop(0,'#284a47');gradient.addColorStop(.5,'#183a37');gradient.addColorStop(1,'#102f2e');ctx.fillStyle=gradient;ctx.fillRect(0,0,1024,680);
      ctx.fillStyle='#87a99c';ctx.font='23px monospace';ctx.fillText('ALFRED / OS',72,79);ctx.textAlign='right';ctx.fillText('STUDY COMPANION',951,79);ctx.textAlign='left';ctx.fillStyle='#52776c';ctx.fillRect(72,107,880,1);
      ctx.fillStyle='#def0cd';ctx.font='600 64px monospace';ctx.fillText("Hello, I’m Alfred.",72,214);
      ctx.font='500 52px monospace';ctx.fillStyle='#e1f2d3';value.split('\n').slice(-5).forEach((line,i)=>ctx.fillText(line,72,312+i*67));
      ctx.fillStyle='#739487';ctx.font='19px monospace';ctx.fillText('EXPLAIN × QUESTION × UNDERSTAND',72,619);
      // No scanline overlay on text: preserve screen readability.
      const shine=ctx.createRadialGradient(200,0,20,200,0,800);shine.addColorStop(0,'rgba(255,255,255,.025)');shine.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=shine;ctx.fillRect(0,0,1024,680);screenTexture.needsUpdate=true;
    }
    function clickSound() {
      if(!soundEnabled.current)return;
      try {
        audio??=new AudioContext();void audio.resume();
        const t=audio.currentTime;
        const buffer=audio.createBuffer(1,Math.ceil(audio.sampleRate*.035),audio.sampleRate);
        const data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/(audio.sampleRate*.006));
        const noise=audio.createBufferSource();noise.buffer=buffer;
        const filter=audio.createBiquadFilter();filter.type='highpass';filter.frequency.value=1100;
        const snap=audio.createGain();snap.gain.value=.13;
        noise.connect(filter);filter.connect(snap);snap.connect(audio.destination);noise.start(t);
        const body=audio.createOscillator(),gain=audio.createGain();body.type='triangle';body.frequency.setValueAtTime(210+Math.random()*60,t);body.frequency.exponentialRampToValueAtTime(95,t+.045);
        gain.gain.setValueAtTime(.065,t);gain.gain.exponentialRampToValueAtTime(.001,t+.055);
        body.connect(gain);gain.connect(audio.destination);body.start(t);body.stop(t+.06);
        noise.onended=()=>{noise.disconnect();filter.disconnect();snap.disconnect();};body.onended=()=>{body.disconnect();gain.disconnect();};
      }catch{}
    }
    function press(char: string, manual=false) {const label=char===' '?'space':char==='Backspace'?'⌫':char.toLowerCase();const key=keys.get(label);if(key){key.userData.until=performance.now()+125;if(manual)clickSound();}}
    function type(char:string, manual=true) {const now=performance.now();if(now>userUntil)text='';userUntil=now+6500;index=0;if(char==='Backspace')text=text.slice(0,-1);else if(char==='Enter')text+='\n';else if(char.length===1)text=(text+char).slice(-145);press(char,manual);}
    const onKey=(e:KeyboardEvent)=>{if(showcaseRef.current||faceOnlyRef.current)return;if(host.getBoundingClientRect().bottom <= 0 || host.getBoundingClientRect().top >= window.innerHeight)return;if(document.querySelector('dialog[open]')||e.metaKey||e.ctrlKey||e.altKey||(e.target instanceof HTMLElement&&['INPUT','TEXTAREA','BUTTON','A'].includes(e.target.tagName)))return;if(e.key.length===1||e.key==='Backspace'||e.key==='Enter'){if(e.key===' '||e.key==='Backspace')e.preventDefault();type(e.key);}};
    const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();
    const onTap=(e:PointerEvent)=>{if(faceOnlyRef.current)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);if(raycaster.intersectObject(screenMesh,false).length){const now=performance.now();cursorX=e.clientX;cursorY=e.clientY;eyesActive=true;eyesUntil=now+2000;happyUntil=now+2500;return;}const hit=raycaster.intersectObjects(keyMeshes,false)[0];if(hit){const label=hit.object.userData.label;type(label==='space'?' ':label==='⌫'?'Backspace':label==='enter'?'Enter':label.length===1?label:'',false);press(label,true);}};
    const onMove=(e:PointerEvent)=>{if(e.pointerType!=='mouse')return;cursorX=e.clientX;cursorY=e.clientY;const r=host.getBoundingClientRect();pointerX=(e.clientX-r.left)/r.width-.5;pointerY=(e.clientY-r.top)/r.height-.5;};
    const onLeave=()=>{pointerX=0;pointerY=0;cursorX=-10000;cursorY=-10000;};
    window.addEventListener('keydown',onKey);renderer.domElement.addEventListener('pointerdown',onTap);window.addEventListener('pointermove',onMove);document.documentElement.addEventListener('pointerleave',onLeave);window.addEventListener('blur',onLeave);
    const resize=()=>{const width=host.clientWidth,height=host.clientHeight;renderer.setSize(width,height);camera.aspect=width/height;camera.position.z=camera.aspect<1.15?13.3:11.8;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(host);resize();
    let firstFrame=true,wasActive=false, pose=0, poseVelocity=0, previousFrame=0;
    const animate=(now:number)=>{raf=requestAnimationFrame(animate);if(document.hidden)return;const active=host.getBoundingClientRect().bottom > 0 && host.getBoundingClientRect().top < window.innerHeight;if(!firstFrame&&!active){wasActive=false;return;}if(active&&!wasActive){nextType=now+350;wasActive=true;}if(!faceOnlyRef.current&&!reduced&&active&&now>nextType&&now>userUntil){if(index===0)text='';const char=message[index];text+=char;press(char);index++;nextType=now+55+Math.random()*70;if(index===message.length){index=0;nextType=now+4200;}}
      const bounds=renderer.domElement.getBoundingClientRect();
      pointer.set((cursorX-bounds.left)/bounds.width*2-1,-(cursorY-bounds.top)/bounds.height*2+1);
      raycaster.setFromCamera(pointer,camera);
      const overScreen=raycaster.intersectObject(screenMesh,false).length>0;
      if(overScreen){screenHoverStart??=now;if(eyesActive||now-screenHoverStart>=300){eyesActive=true;eyesUntil=now+2000;}}
      else {screenHoverStart=null;if(now>=eyesUntil)eyesActive=false;}
      const display=text+(!reduced&&Math.floor(now/650)%2===0?' ▌':'');if(showcaseRef.current||faceOnlyRef.current||eyesActive){drawEyes(now);lastDraw='';}else if(display!==lastDraw){drawScreen(display);lastDraw=display;}
      for(const key of keyMeshes)key.position.y=THREE.MathUtils.lerp(key.position.y,key.userData.rest-(now<key.userData.until?.07:0),.4);
      const dt=Math.min((now-previousFrame)/1000 || 1/60,.033);previousFrame=now;const target=showcaseRef.current?1:0;if(reduced){pose=target;}else{poseVelocity+=(90*(target-pose)-18*poseVelocity)*dt;pose+=poseVelocity*dt;}model.position.y=pose*.18;model.scale.setScalar(1+pose*.08);
      if(!reduced&&!faceOnlyRef.current){model.rotation.y=THREE.MathUtils.lerp(model.rotation.y,THREE.MathUtils.clamp(pointerX,-.5,.5)*.11-pose*.28,.035);model.rotation.x=THREE.MathUtils.lerp(model.rotation.x,THREE.MathUtils.clamp(pointerY,-.5,.5)*.025,.035);}renderer.render(scene,camera);if(firstFrame){firstFrame=false;}
    };raf=requestAnimationFrame(animate);
    return()=>{cancelAnimationFrame(raf);observer.disconnect();window.removeEventListener('keydown',onKey);renderer.domElement.removeEventListener('pointerdown',onTap);window.removeEventListener('pointermove',onMove);document.documentElement.removeEventListener('pointerleave',onLeave);window.removeEventListener('blur',onLeave);void audio?.close();scene.traverse(obj=>{if(obj instanceof THREE.Mesh){obj.geometry.dispose();const mats=Array.isArray(obj.material)?obj.material:[obj.material];mats.forEach(mat=>{Object.values(mat).forEach(v=>{if(v instanceof THREE.Texture)v.dispose();});mat.dispose();});}});renderer.dispose();renderer.domElement.remove();};
  }, []);
  return <div className="computer-mount" ref={mount}>{fallback && <div className="alfred-fallback" role="img" aria-label="Alfred, a friendly retro computer"><div>{faceOnly ? <strong className="computer-fallback-face">◕ ‿ ◕</strong> : <><span>ALFRED / OS</span><strong>Hello, I’m Alfred.</strong><p>Teach me your thinking.<br/>Let’s figure it out.</p><b>▌</b></>}</div><i/><footer>▰ ▰ ▰ ▰ ▰ ▰ ▰ ▰</footer></div>}</div>;
}
