"use client";

import { useState, type CSSProperties } from "react";
import { MeetAlfred } from "./MeetAlfred";

import { PopLink } from "../ui/pop-button";
import { AnnotatedText } from "../ui/annotated-text";
import { RetroComputer } from "./RetroComputer";
import "./landing.css";

export default function LandingPage() {
  const [meetPose, setMeetPose] = useState({ x: 0, y: 0, height: 850 });
  const [meeting, setMeeting] = useState(false);
  const sound = false;
  const [intro, setIntro] = useState(0);

  return <div className={`alfred-experience ${meeting ? "is-meeting" : ""}`} style={{ "--meet-x": `${meetPose.x}px`, "--meet-y": `${meetPose.y}px`, "--meet-height": `${meetPose.height}px` } as CSSProperties}><main className="alfred-landing" id="home">
    <a className="alfred-skip" href="#start-learning">Skip to start learning</a>
    <header className="alfred-header">
      <div className="alfred-identity">
        <a href="#home" className="alfred-wordmark" aria-label="Alfred home">alfred<span>.</span></a>
        <p className="alfred-eyebrow">A little curiosity. A deeper understanding.</p>
        <h1>Teach it.<br/><AnnotatedText key={intro} variant="doubleUnderline" delay={0.25} duration={0.8} color="text-[#a3b0e3]" className="alfred-title-annotation">Understand it<span>.</span></AnnotatedText></h1>

      </div>
      <nav className="alfred-nav" aria-label="Main navigation">
        <a href="#home" aria-current="page">Home</a>
        <a href="#how-it-works">How it works</a>
        <button onClick={() => { window.scrollTo({ top: 0, behavior: "instant" }); const scene = document.querySelector(".alfred-centerpiece")!.getBoundingClientRect(); const hero = document.querySelector(".alfred-landing")!.getBoundingClientRect(); const mobile = window.innerWidth <= 760; setMeetPose({x: window.innerWidth * (mobile ? .5 : .28) - (scene.left + scene.width / 2), y: window.innerHeight * (mobile ? .21 : .48) - (scene.top + scene.height / 2), height: hero.height}); setMeeting(true); }}>Meet Alfred</button>
        <a href="#faq">FAQ</a>
      </nav>
    </header>

    <div className="alfred-centerpiece" key={intro}><RetroComputer sound={sound} showcase={meeting}/></div>

    {meeting && <MeetAlfred onClose={() => setMeeting(false)}/>}
    <div className="alfred-side-note"><span className="alfred-asterisk" aria-hidden="true">✳</span><p>You do the explaining.<br/>I’ll bring the questions.</p></div>
    <div className="alfred-hello"><span className="alfred-handwriting">your curious study companion</span><AnnotatedText key={intro} variant="loopArrow" delay={0.6} duration={1.35} color="text-[#98a18f]" className="alfred-arrow-annotation"><span aria-hidden="true">&nbsp;</span></AnnotatedText></div>

    <div className="alfred-start" id="start-learning">
      <p className="alfred-keyboard-hint"><span aria-hidden="true">⌨</span> Go on, press a key.</p>
      <PopLink className="alfred-primary alfred-pop" href="/studio">Start learning <span className="alfred-enter" aria-hidden="true">↵</span></PopLink>

    </div>

    <footer className="alfred-footer">
      <div className="alfred-meta"><span className="alfred-eyebrow">The approach</span><p>Explain it in your own words.<br/>Find the gaps, together.</p></div>
      <div className="alfred-meta"><span className="alfred-eyebrow">On the desk</span><p>A very curious computer.</p></div>
      <div className="alfred-meta alfred-footer-sign"><span className="alfred-eyebrow">Made for understanding</span><p>Small steps. Real lightbulb moments.</p></div>

    </footer>


  </main>
  <section className="alfred-how" id="how-it-works" aria-labelledby="alfred-how-title"><div><span className="alfred-eyebrow">Learning by explaining</span><h2 id="alfred-how-title">Your thinking.<br/>A little clearer<span>.</span></h2><p>Explain, reflect, and try again.</p><a className="alfred-faq-start" href="/studio"><span>Start learning</span></a></div><div className="alfred-steps">
        <section><span aria-hidden="true">✳</span><div><h3>Explain your approach</h3><p>Work through an algebra problem and tell Alfred how you got there. Use your voice or type it out.</p></div></section>
        <section><span aria-hidden="true">⌘</span><div><h3>Make your thinking clear</h3><p>Check what Alfred understood before it looks at your reasoning. A good question can uncover a missed assumption.</p></div></section>
        <section><span aria-hidden="true">✧</span><div><h3>Give it another go</h3><p>Refine your explanation, then try a fresh problem. The study studio keeps your learning evidence in view.</p></div></section>
      </div></section>
  <section className="alfred-faq" id="faq" aria-labelledby="alfred-faq-title">
    <div className="alfred-faq-intro"><span className="alfred-eyebrow">A few things you might be wondering</span><h2 id="alfred-faq-title">Curiosity goes<br/>both ways<span>.</span></h2><p>Good questions are a great place to start.</p><div className="alfred-faq-mark" aria-hidden="true">?</div></div>
    <div className="alfred-faq-list">
      {[
        ["What is Alfred?", "Alfred is a study companion that helps you work through your reasoning. Explain how you approached a problem, check what Alfred understood, and explore the steps that need another look."],
        ["How is this different from asking for an answer?", "The starting point is your explanation. Alfred asks follow-up questions about your approach and helps you revisit assumptions, so you can understand why a method works and try it on a fresh problem."],
        ["Do I have to speak out loud?", "You can speak or type in the study studio. If you use voice, you can review and edit the transcript before confirming it. Choose whichever helps you express your thinking."],
        ["What can I study right now?", "This first version focuses on a small algebra practice set, including equations such as x² = x and x² = 3x. It’s a focused starting point for explaining your steps, checking solutions and spotting missed assumptions."],
        ["What if Alfred misunderstands me?", "You get a confirmation step before your explanation is assessed. Edit the transcript or interpretation until it matches what you meant, then continue. You can also correct an earlier explanation in the study studio."],
        ["Can Alfred make mistakes?", "Yes. Alfred uses AI to interpret explanations and choose follow-up questions. Mathematical checks support the current algebra exercises, but you should still review the reasoning and compare it with your course material when something seems wrong."],
      ].map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true"/></summary><p>{answer}</p></details>)}
      <a className="alfred-faq-start" href="/studio">Ready to think it through? <span>Start learning</span></a>
    </div>
    <footer className="alfred-faq-footer"><a href="#home" aria-label="Alfred, back to top">alfred<span>.</span></a><p>A little curiosity goes a long way.</p><a href="#home">Back to top</a></footer>
  </section></div>;
}

