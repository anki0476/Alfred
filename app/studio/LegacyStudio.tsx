"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { MaterialsLibrary } from "../../components/MaterialsLibrary";
import { RetroComputer } from "../../components/landing/RetroComputer";
import { WorkspaceHeader } from "../../components/WorkspaceHeader";
import { GeneralSettings } from "../../components/GeneralSettings";
import { Appearance } from "../../components/Appearance";
import { AlfredLoading } from "../../components/AlfredLoading";
import { VoiceOrb } from "../../components/VoiceOrb";
import { NotebookReader } from "../../components/NotebookReader";
import { BooksShowcase } from "../../components/ui/books-showcase";
import {
  BookOpen,
  Mic,
  Square,
  Volume2,
  VolumeX,
  Check,
  RotateCcw,
  Settings2,
  X,
  NotebookPen,
  Sparkles,
  ChevronDown,
  RefreshCw,
  ShieldCheck,
  Pause,
} from "lucide-react";
import {syllabus} from "../../lib/curriculum";
import type {Learning,Question} from "../../lib/adaptive";
import { pack, type Session, type Turn } from "../../lib/pack";
import { notebook } from "../../lib/learning";
import { recordVoice, type AudioSegment } from "../../lib/voice";
import { VoiceGesture, isVoiceShortcut } from "../../lib/voice-gesture";
import { voiceSound } from "../../lib/voice-sounds";

type Bootstrap = {
  canPractice: boolean;
  configured: {
    openai: boolean;
    sarvam: boolean;
    responsesModel: string;
    decisionsModel: string;
  };
  session: Session | null;
};
type Panel = "sources" | "notebook" | "settings" | null;
const emptyNotebookBooks = [{
  id: "empty-notebook", title: "Mistake Notebook", author: "Alfred · Algebra", year: "", stars: 0,
  desc: "Your notebook is ready. Saved mistakes will appear here as you practice.",
  chapters: ["Room for new understanding", "Explain, reflect, try again"],
  images: { front: "/images/mistake-notebook-cover.png" }, spineBg: "#b97558", spineInk: "#f5f2e8", backBg: "#e8e7da",
}];
async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  const result = (await response.json()) as T & { error?: string };
  if (!response.ok)
    throw new Error(result.error || "The request could not complete.");
  return result;
}
const labels: Record<string, string> = {
  needs_clarification: "Needs clarification",
  confirmed_misconception: "Confirmed misconception",
  zero_case_recognised: "Zero case recognised",
  needs_zero_check: "Needs a follow-up",
  demonstrated_on_this_example: "Demonstrated on this example",
  correct_answer_reasoning_unchecked: "Reasoning needs checking",
  incorrect_candidates: "Candidate solutions need correction",
};

export default function Studio({ notebookPage = false, materialsPage = false }: { notebookPage?: boolean; materialsPage?: boolean }) {
  const [learning,setLearning]=useState<{version:number;state:Learning}|null>(null);
  const [selectedAnswer,setSelectedAnswer]=useState("");
  const unified=!materialsPage && !notebookPage;
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [readerOpen, setReaderOpen] = useState(false);
  const [readerStart, setReaderStart] = useState(0);
  const [settingsTab, setSettingsTab] = useState("general");
  const [panel, setPanel] = useState<Panel>(null);
  const [recording, setRecording] = useState(false);
  const [openingMicrophone, setOpeningMicrophone] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [audioPending, setAudioPending] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceReplies, setVoiceReplies] = useState(true);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);
  const [handsFree, setHandsFree] = useState(false);
  const microphoneIntent = useRef(false);
  const microphoneTransition = useRef(false);
  const mounted = useRef(false);
  const voiceActions = useRef<{ start: () => boolean; finish: () => void }>({
    start: () => false,
    finish: () => {},
  });
  const gesture = useRef<VoiceGesture | null>(null);
  if (!gesture.current)
    gesture.current = new VoiceGesture({
      start: () => voiceActions.current.start(),
      finish: () => voiceActions.current.finish(),
      latch: setHandsFree,
    });
  const stopRecording = useRef<null | (() => Promise<void>)>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const audioGeneration = useRef(0);
  const segments = useRef<AudioSegment[]>([]);
  const recordingPrefix = useRef("");
  const transcriptionRunning = useRef(false);
  const requestId = useRef<string | null>(null);
  const lastInput = useRef("");
  const composer = useRef<HTMLTextAreaElement | null>(null);

  function adopt(row:{version:number;state:Learning}) {
    setLearning(row); const a=row.state;
    const interpretation={summary:a.draft?.evidence.summary||"",steps:[],solutions:[],solutionQuote:"",complete:false,method:"other" as const,methodQuote:"",zeroCase:"not_discussed" as const,zeroQuote:"",ambiguous:a.draft?.evidence.reason==="unclear",clarification:"Explain this step more clearly before assessment."};
    const turns:Turn[]=a.attempts.map(t=>({id:t.id,transcript:t.explanation,interpretation:{...interpretation,summary:t.evidence.summary},questionIndex:0,phase:"explain",feedback:t.discussion?.at(-1)?.feedback||t.feedback,action:t.action as Turn['action'],evidenceStatus:t.outcome,verification:{status:"Reasoning assessed with source context and model review",expected:[],proposed:[],missing:[],extra:[],steps:[],complete:false,lostZero:false},decision:{suggested:t.action,applied:t.action as Turn['action'],confidence:null},sourceIds:[],createdAt:t.at}));
    const mapped:Session={id:"shared-learning",version:row.version,state:{questionIndex:0,phase:"explain",draft:a.draft?{id:a.draft.id,transcript:a.draft.explanation,interpretation}:null,turns}};
    setSession(!a.current&&!a.attempts.length?null:mapped);if(a.draft){setText(a.draft.explanation);setSelectedAnswer(a.draft.answer);}return mapped;
  }
  async function refresh() {
    try {
      const result = await api<Bootstrap>("/api/alfred");
      setBootstrap(result);
      if(unified){const row=await api<{version:number;state:Learning}>("/api/learning");adopt(row);}else setSession(result.session);
      if (!unified && result.session?.state.draft)
        setText(result.session.state.draft.transcript);
    } catch (problem) {
      setError(message(problem));
    }
  }
  useEffect(() => {
    mounted.current = true;
    void refresh();
    return () => {
      mounted.current = false;
      microphoneIntent.current = false;
      gesture.current?.reset();
      void stopRecording.current?.();
      audioGeneration.current++;
      audio.current?.pause();
    };
  }, []);
  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [recording]);
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (isVoiceShortcut(event)) {
        event.preventDefault();
        if (!event.repeat) gesture.current?.press();
      } else if (event.key === "Escape" && microphoneIntent.current) {
        event.preventDefault();
        gesture.current?.finish();
      }
    };
    const up = (event: KeyboardEvent) => {
      if (
        [
          "KeyZ",
          "ControlLeft",
          "ControlRight",
          "ShiftLeft",
          "ShiftRight",
        ].includes(event.code)
      )
        gesture.current?.release();
    };
    // Browser shortcuts cannot observe key releases after focus leaves the tab.
    const blur = () => gesture.current?.finish();
    const hidden = () => {
      if (document.hidden) blur();
    };
    window.addEventListener("keydown", down, true);
    window.addEventListener("keyup", up, true);
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.removeEventListener("keydown", down, true);
      window.removeEventListener("keyup", up, true);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, []);

  function stopSpeech() {
    audioGeneration.current++;
    audio.current?.pause();
    audio.current = null;
    setSpeaking(false);
  }
  async function playSpeech(value: string) {
    stopSpeech();
    const generation = audioGeneration.current;
    setSpeaking(true);
    try {
      const result = await api<{ audio: string }>("/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value }),
      });
      if (generation !== audioGeneration.current) return;
      const player = new Audio(`data:audio/wav;base64,${result.audio}`);
      audio.current = player;
      player.onended = () => setSpeaking(false);
      player.onerror = () => {
        setSpeaking(false);
        setError("Audio playback failed. The written response is available.");
      };
      await player.play();
    } catch (problem) {
      if (generation === audioGeneration.current) {
        setSpeaking(false);
        setError(message(problem));
      }
    }
  }
  async function mutate(
    operation: string,
    extra: Record<string, unknown> = {},
  ) {
    if(unified){

      const body:Record<string,unknown>={operation:operation==='start'||operation==='revise'?'next':operation,version:learning?.version||0};
      if(operation==='interpret')Object.assign(body,{explanation:extra.transcript,requestId:extra.requestId,...(selectedAnswer?{answer:selectedAnswer}:{})});
      if(operation==='confirm')body.requestId=extra.requestId;
      if(operation==='correct')body.attemptId=extra.turnId;
      const row=await api<{version:number;state:Learning}>("/api/learning",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      if(['start','revise','confirm','correct'].includes(operation))setSelectedAnswer('');
      return adopt(row);
    }
    const result = await api<{ session: Session }>("/api/alfred", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operation,
        sessionId: session?.id,
        version: session?.version,
        ...extra,
      }),
    });
    setSession(result.session);
    return result.session as Session;
  }
  async function perform(label: string, work: () => Promise<void>) {
    setError("");
    setBusy(label);
    try {
      await work();
    } catch (problem) {
      setError(message(problem));
    } finally {
      setBusy("");
    }
  }
  async function start() {
    stopSpeech();
    await perform("Opening your studio", async () => {
      await mutate("start");
      setText("");
      setPaused(false);
      requestId.current = null;
    });
  }
  async function interpret() {
    stopSpeech();
    const interpretationKey=JSON.stringify([text,selectedAnswer]);
    if (lastInput.current !== interpretationKey || !requestId.current) {
      requestId.current = crypto.randomUUID();
      lastInput.current = interpretationKey;
    }
    await perform("Reading your explanation", async () => {
      await mutate("interpret", {
        transcript: text,
        requestId: requestId.current,
      });
    });
  }
  async function confirm() {
    await perform("Checking your reasoning", async () => {
      const updated = await mutate("confirm", {
        requestId: session?.state.draft?.id,
      });
      setText("");
      requestId.current = null;
      const reply = updated.state.turns.at(-1)?.feedback;
      if (reply && voiceReplies && bootstrap?.configured.sarvam)
        void playSpeech(reply);
    });
  }
  async function correct(turn: Turn) {
    stopSpeech();
    await perform("Reopening your explanation", async () => {
      await mutate("correct", { turnId: turn.id });
      setText(turn.transcript);
      setPanel(null);
      setPaused(false);
      requestId.current = null;
      composer.current?.focus();
    });
  }
  async function drainSegments() {
    if (transcriptionRunning.current) return;
    transcriptionRunning.current = true;
    setTranscribing(true);
    try {
      for (const segment of segments.current) {
        if (segment.transcript !== null) continue;
        const form = new FormData();
        form.set("file", segment.blob, "explanation.wav");
        const result = await api<{ transcript: string }>("/api/speech", {
          method: "POST",
          body: form,
        });
        segment.transcript = result.transcript;
        setText(
          [
            recordingPrefix.current,
            ...segments.current.map((item) => item.transcript || ""),
          ]
            .filter(Boolean)
            .join(" "),
        );
      }
    } catch (problem) {
      setError(message(problem));
    } finally {
      transcriptionRunning.current = false;
      setTranscribing(false);
      setAudioPending(
        segments.current.some((segment) => segment.transcript === null),
      );
    }
  }
  async function finishRecording() {
    const hadIntent = microphoneIntent.current;
    microphoneIntent.current = false;
    setOpeningMicrophone(false);
    if (hadIntent) voiceSound("end");
    const stop = stopRecording.current;
    stopRecording.current = null;
    if (!stop) return; // An outstanding permission request checks intent on return.
    microphoneTransition.current = true;
    setBusy("Finishing recording");
    try {
      await stop();
    } catch (problem) {
      setError(message(problem));
    } finally {
      microphoneTransition.current = false;
      setRecording(false);
      setLevel(0);
      setBusy("");
      void drainSegments();
    }
  }
  async function startRecording() {
    stopSpeech();
    setError("");
    microphoneTransition.current = true;
    microphoneIntent.current = true;
    setOpeningMicrophone(true);
    voiceSound("start");
    setBusy("Opening microphone");
    try {
      segments.current = [];
      recordingPrefix.current = text;
      setElapsed(0);
      const stop = await recordVoice(
        (blob) => {
          if (!mounted.current) return;
          segments.current.push({ blob, transcript: null });
          void drainSegments();
        },
        setLevel,
        () => {
          setError(
            "Microphone disconnected. Your captured speech is being kept for review.",
          );
          gesture.current?.finish();
        },
      );
      if (!mounted.current || !microphoneIntent.current) {
        await stop();
        return;
      }
      stopRecording.current = stop;
      setRecording(true);
    } catch {
      microphoneIntent.current = false;
      gesture.current?.reset();
      setError(
        "The microphone could not start. Check browser permission or type your explanation below.",
      );
    } finally {
      microphoneTransition.current = false;
      setOpeningMicrophone(false);
      if (mounted.current) setBusy("");
    }
  }
  const state = session?.state;
  const currentQuestion=learning?.state.current || learning?.state.attempts.at(-1)?.question;
  const viewPack=unified?{version:"2026–27",title:syllabus.title,scope:syllabus.scope,sources:syllabus.concepts.filter(c=>!currentQuestion || c.id===currentQuestion.concept).map(c=>({id:c.id,title:c.name+" · "+c.source,text:learning?.state.attempts.filter(t=>t.question.concept===c.id).at(-1)?.feedback || c.coverage})),concepts:syllabus.concepts.map(c=>({id:c.id,title:c.name,prerequisite:c.prerequisites.map(id=>syllabus.concepts.find(x=>x.id===id)?.name||id).join(", ")||"no prerequisites in this map"}))}:pack;
  const question = unified && currentQuestion ? {display:currentQuestion.equation.replaceAll("*"," · ").replaceAll("^2","²"),prompt:currentQuestion.prompt} : pack.questions[state?.questionIndex || 0];
  const draft = state?.draft;
  const latest = state?.turns.at(-1);
  const entries = state ? notebook(state) : [];
  const notebookBooks = useMemo(() => (state ? notebook(state) : []).map((turn, index) => ({
    id: turn.id, title: `Algebra · ${index + 1}`, author: "Your mistake notebook", year: "Alfred", stars: 0,
    desc: turn.feedback, chapters: [pack.questions[turn.questionIndex].display, turn.transcript],
    images: { front: "/images/mistake-notebook-cover.png" }, spineBg: "#b97558", spineInk: "#f5f2e8", backBg: "#e8e7da",
  })), [state]);
  const currentPrompt = unified && learning?.state.current ? question.prompt : latest?.feedback || question.prompt;
  const disabled = Boolean(busy) || paused;
  const canRecord = Boolean(
    session &&
    bootstrap?.configured.sarvam &&
    state?.phase !== "complete" &&
    !draft &&
    !disabled &&
    !transcribing &&
    !audioPending,
  );
  voiceActions.current = {
    start: () => {
      if (microphoneTransition.current || !canRecord) return false;
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(
          "Microphone access is unavailable here. Open Alfred on HTTPS, or type your explanation.",
        );
        return false;
      }
      void startRecording();
      return true;
    },
    finish: () => {
      void finishRecording();
    },
  };
  const voiceActive = recording || transcribing || speaking || Boolean(busy);
  const voiceLabel = recording
    ? handsFree
      ? "Listening hands-free"
      : "Listening to you"
    : transcribing
      ? "Transcribing your words"
      : busy ||
        (speaking
          ? "Alfred is speaking"
          : paused
            ? "Session paused"
            : draft
              ? "Check your explanation"
              : audioPending
                ? "Transcription needs retry"
                : !bootstrap
                  ? "Opening your studio"
                  : !bootstrap.canPractice
                    ? "Opening your study studio"
                    : !bootstrap.configured.sarvam
                      ? "Voice connection needed"
                      : !session
                        ? "Start a session to speak"
                        : state?.phase === "complete"
                          ? "Ready for recall practice"
                          : "Ready when you are");
  const status = paused
    ? "Paused"
    : recording
      ? "Listening"
      : transcribing
        ? "Transcribing"
        : busy || (speaking ? "Speaking" : "Your turn");

  const notebookContent = readerOpen ? <NotebookReader entries={entries} initialPage={readerStart} onClose={() => setReaderOpen(false)} /> : <>
    <BooksShowcase books={notebookBooks.length ? notebookBooks : emptyNotebookBooks} heroTitle="Notebooks" navTitle="YOUR LEARNING, REVISITED" showDetailPanel={false} className="notebook-showcase" onBookSelect={(book) => { if (book) { const index = entries.findIndex(turn => turn.id === book.id); setReaderStart(index < 0 ? 0 : index * 2 + 1); setReaderOpen(true); } }} />
    <button className="text-button" onClick={() => { setReaderStart(0); setReaderOpen(true); }}>Open mistake notebook · {entries.length} saved entries</button>
  </>;
  return (
    <div className="app-shell">
      <WorkspaceHeader active={notebookPage ? "/notebook" : materialsPage ? "/materials" : "/studio"} onSettings={() => setPanel("settings")} onStudio={() => { if (notebookPage || materialsPage) window.location.href = "/studio"; else setPanel(null); }} />
      {materialsPage ? <main className="main"><MaterialsLibrary /></main> : notebookPage ? <main className="main notebook-page"><section className="notebook-page-content">{notebookContent}</section></main> : <main className="main">
        {(openingMicrophone || recording || speaking) && <div className="voice-notch-dock">
          <div
            className={`voice-notch ${recording ? "is-listening" : ""} ${voiceActive ? "is-active" : ""}`}
            style={{ "--voice-level": level } as CSSProperties}
          >
            <VoiceOrb listening={recording} />
            <span className="notch-label" role="status">
              {voiceLabel}
            </span>
            {recording || openingMicrophone ? (
              <>
                <span className="voice-wave" aria-hidden="true">
                  {[0.4, 0.75, 1, 0.6, 0.9].map((scale, i) => (
                    <i
                      key={i}
                      style={{ height: `${4 + level * 24 * scale}px` }}
                    />
                  ))}
                </span>
                <span className="notch-timer">
                  {Math.floor(elapsed / 60)}:
                  {String(elapsed % 60).padStart(2, "0")}
                </span>
                {handsFree && <button
                  className="notch-action"
                  onClick={() => gesture.current?.finish()}
                  aria-label="Finish listening"
                  data-voice-cue
                >
                  <Check size={15} /> Done
                </button>}
              </>
            ) : speaking ? (
              <button className="notch-action" onClick={stopSpeech}>
                <Square size={13} /> Stop
              </button>
            ) : (
              <button
                className="notch-action"
                disabled={!canRecord}
                onClick={() => gesture.current?.toggleHandsFree()}
                aria-label="Start hands-free microphone"
              >
                <Mic size={17} />
              </button>
            )}
          </div>
        </div>
        }
        <div className="studio">
          {(transcribing || (busy && !openingMicrophone && !recording && busy !== "Finishing recording")) && <AlfredLoading label={transcribing ? "Listening back to your explanation…" : busy === "Opening your studio" || busy === "Opening recall practice" ? "Preparing your next question…" : busy + "…"} />}
          <div className="intro intro-with-mascot">
            <span className="eyebrow">TEACH TO UNDERSTAND</span>
            <h1>Let’s hear your thinking.</h1>
            <p>Take your time. Explain it in your own words.</p>
            <a className="material-studio-link" href="/materials">Practice with your uploaded materials →</a>
            <div className="studio-mascot"><RetroComputer sound={false} faceOnly listening={recording} voiceLevel={level} /></div>
          </div>
          {!bootstrap && !error && (
            <AlfredLoading label="Opening your study studio…" />
          )}
          {bootstrap?.canPractice && !bootstrap.configured.openai && (
            <div className="notice">
              <div>
                <strong>Connect your reasoning model</strong>
                <p>
                  Add your OpenAI key in the server configuration to begin live
                  practice.
                </p>
              </div>
              <button
                className="text-button"
                onClick={() => setPanel("settings")}
              >
                Connections
              </button>
            </div>
          )}
          {error && (
            <div className="error" role="alert">
              <span>{error}</span>
              <button
                className="icon-button"
                onClick={() => setError("")}
                aria-label="Dismiss error"
              >
                <X size={16} />
              </button>
            </div>
          )}
          <section className="question-card" aria-labelledby="question-title">
            <div className="card-heading">
              <span className="small-label">
                {state?.questionIndex === 1
                  ? "FRESH APPLICATION"
                  : state?.questionIndex === 2
                    ? "RECALL PRACTICE"
                    : "TODAY’S QUESTION"}
              </span>
              <span className="subject-tag">{currentQuestion ? syllabus.concepts.find(c=>c.id===currentQuestion.concept)?.unit : "Class 10 Maths"}</span>
            </div>
            <h2 id="question-title" className="equation">
              {question.display}
            </h2>
            <p>{question.prompt}</p>
            {unified && currentQuestion?.options.length ? <fieldset className="studio-answer-options" disabled={disabled || !!draft || !learning?.state.current}>
              <legend>Choose an answer, then explain your reasoning</legend>
              {currentQuestion.options.map(option=><label className="studio-answer-option" key={option}><input type="radio" name="studio-answer" value={option} checked={selectedAnswer===option} onChange={()=>{setSelectedAnswer(option);requestId.current=null;}}/><span>{option}</span></label>)}
            </fieldset> : null}
            <div className="question-footer">
              <span>
                <ShieldCheck size={16} /> Source-reviewed practice
              </span>
              <button
                className="text-button"
                onClick={() => { window.location.href = "/materials"; }}
              >
                View study pack <ChevronDown size={15} />
              </button>
            </div>
          </section>
          {!session && bootstrap?.canPractice && (
            <div className="start-row">
              <button
                className="primary-button"
                disabled={Boolean(busy) || !bootstrap.configured.openai}
                onClick={start}
              >
                Start explaining
              </button>
              <p>One question at a time. Your progress is remembered in this browser.</p>
            </div>
          )}
          {session && (
            <>
              {latest && (
                <section className="alfred-response" aria-live="polite">
                  <div className="response-avatar">a</div>
                  <div>
                    <div className="response-heading">
                      <strong>Alfred</strong>
                      <span>{labels[latest.evidenceStatus] || latest.evidenceStatus.replaceAll("_"," ")}</span>
                    </div>
                    <p>{currentPrompt}</p>
                    <div className="response-controls">
                      {latest.sourceIds.map((id) => (
                        <button
                          key={id}
                          className="source-chip"
                          onClick={() => { window.location.href = "/materials"; }}
                        >
                          {id}
                        </button>
                      ))}
                      <button
                        className="text-button"
                        disabled={
                          recording ||
                          Boolean(busy) ||
                          !bootstrap?.configured.sarvam
                        }
                        onClick={() =>
                          speaking
                            ? stopSpeech()
                            : void playSpeech(currentPrompt)
                        }
                      >
                        {speaking ? (
                          <VolumeX size={16} />
                        ) : (
                          <Volume2 size={16} />
                        )}
                        {speaking ? "Interrupt" : "Read aloud"}
                      </button>
                    </div>
                  </div>
                </section>
              )}
              {unified && !learning?.state.current && !draft && learning?.state.attempts.length ? <div className="button-row studio-followup-actions"><button className="primary-button" disabled={disabled || recording || transcribing} onClick={()=>void start()}>Continue practice</button><a className="secondary-button" href="/notebook">Review notebook</a></div> : null}
              {state?.phase === "complete" && !draft ? (
                <section className="completion">
                  <span className="completion-icon">
                    <Check size={24} />
                  </span>
                  <h2>Understanding takes practice.</h2>
                  <p>
                    Your work is saved. Continue your learning journey to check what you
                    remember, or try the recall question now.
                  </p>
                  <div className="button-row">
                    <button
                      className="primary-button"
                      disabled={disabled}
                      onClick={() =>
                        perform("Opening recall practice", async () => {
                          await mutate("revise");
                        })
                      }
                    >
                      Continue practice
                    </button>
                    <button
                      className="secondary-button"
                      onClick={() => { window.location.href = "/notebook"; }}
                    >
                      Review notebook
                    </button>
                  </div>
                </section>
              ) : (
                <section
                  className={`composer-card ${recording ? "voice-listening" : ""}`}
                  style={{ "--voice-level": level } as CSSProperties}
                >
                  <div className="composer-heading">
                    <span className="small-label">YOUR EXPLANATION</span>
                    <span
                      className={`live-state ${recording ? "is-recording" : ""}`}
                      aria-live="polite"
                    >
                      {recording && <span className="record-dot" />}
                      {status}
                      {recording &&
                        ` · ${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`}
                    </span>
                  </div>
                  <textarea
                    ref={composer}
                    aria-label="Your explanation or transcript"
                    placeholder="I would start by…"
                    value={text}
                    maxLength={6000}
                    readOnly={recording || transcribing || Boolean(draft)}
                    disabled={disabled}
                    onChange={(event) => setText(event.target.value)}
                  />
                  {audioPending && (
                    <div className="audio-retry">
                      <span>
                        A recording segment is waiting to be transcribed. It
                        stays in this tab until you retry.
                      </span>
                      <button
                        className="text-button"
                        disabled={transcribing}
                        onClick={() => {
                          setError("");
                          void drainSegments();
                        }}
                      >
                        Retry transcription
                      </button>
                    </div>
                  )}
                  <div className="composer-actions">
                    <div className="voice-actions">
                      <button
                        className={`mic-button ${recording ? "recording" : ""}`}
                        data-voice-cue
                        onClick={() => gesture.current?.toggleHandsFree()}
                        disabled={!recording && !canRecord}
                        aria-pressed={recording}
                        aria-keyshortcuts="Control+Shift+Z"
                        aria-label={
                          recording
                            ? "Finish recording"
                            : "Start hands-free microphone"
                        }
                      >
                        {recording ? (
                          <Square size={19} fill="currentColor" />
                        ) : (
                          <Mic size={21} />
                        )}
                      </button>
                      <span>
                        {recording
                          ? "Finish when you’re ready"
                          : "Speak hands-free"}
                      </span>
                    </div>
                    <button
                      className="primary-button"
                      onClick={interpret}
                      disabled={
                        disabled ||
                        recording ||
                        transcribing ||
                        audioPending ||
                        !text.trim() ||
                        Boolean(draft)
                      }
                    >
                      Review my explanation
                    </button>
                  </div>
                  <div className="voice-shortcut-help">
                    <span>
                      Hold <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> to
                      speak. Release to finish.
                    </span>
                    <span>
                      Double-tap for hands-free. Keep this tab focused.
                    </span>
                  </div>
                  <div className="composer-note">
                    {recording
                      ? "Pauses are welcome. Alfred waits until you finish."
                      : "Check the transcript before your reasoning is assessed."}
                  </div>
                </section>
              )}
              {draft && (
                <section className="interpretation">
                  <div className="card-heading">
                    <h3>Did I understand you correctly?</h3>
                    <span className="subject-tag">
                      Awaiting your confirmation
                    </span>
                  </div>
                  <p>{draft.interpretation.summary}</p>{unified && <blockquote>{learning?.state.draft?.evidence.quote}</blockquote>}
                  {!unified && <dl>
                    <div>
                      <dt>Proposed solutions</dt>
                      <dd>
                        {draft.interpretation.solutions.length
                          ? draft.interpretation.solutions
                              .map((root) => `x = ${root}`)
                              .join(" or ")
                          : "No final solutions stated"}
                      </dd>
                    </div>
                    <div>
                      <dt>Your method</dt>
                      <dd>
                        {draft.interpretation.method.replaceAll("_", " ")}
                      </dd>
                    </div>
                    <div>
                      <dt>What you said about zero</dt>
                      <dd>
                        {draft.interpretation.zeroCase === "valid"
                          ? "Zero is a solution"
                          : draft.interpretation.zeroCase === "invalid"
                            ? "Zero is not a solution"
                            : draft.interpretation.zeroCase === "unsure"
                              ? "Uncertain"
                              : "Not discussed"}
                      </dd>
                    </div>
                  </dl>}
                  {draft.interpretation.steps.length > 0 && (
                    <div className="parsed-steps">
                      {draft.interpretation.steps.map((step, index) => (
                        <div key={index}>
                          <code>{step.equation}</code>
                          <span>“{step.quote}”</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {draft.interpretation.ambiguous && (
                    <p className="ambiguity">
                      {draft.interpretation.clarification}
                    </p>
                  )}
                  <div className="button-row">
                    <button
                      className="primary-button"
                      disabled={disabled}
                      onClick={confirm}
                    >
                      <Check size={17} /> That’s what I meant
                    </button>
                    <button
                      className="secondary-button"
                      disabled={disabled}
                      onClick={() =>
                        perform("Reopening transcript", async () => {
                          await mutate("discard");
                          requestId.current = null;
                          composer.current?.focus();
                        })
                      }
                    >
                      Correct my words
                    </button>
                  </div>
                </section>
              )}
              <div className="session-controls">
                <button
                  className="text-button"
                  disabled={Boolean(busy) || recording || transcribing}
                  onClick={() => {
                    stopSpeech();
                    setPaused(!paused);
                  }}
                >
                  <Pause size={15} />
                  {paused ? "Resume session" : "Pause"}
                </button>
                <label className="voice-toggle">
                  <input
                    type="checkbox"
                    checked={voiceReplies}
                    onChange={(event) => {
                      setVoiceReplies(event.target.checked);
                      if (!event.target.checked) stopSpeech();
                    }}
                  />{" "}
                  Spoken replies
                </label>
                <button
                  className="text-button"
                  disabled={Boolean(busy) || recording || transcribing}
                  onClick={refresh}
                >
                  <RefreshCw size={15} /> Refresh saved work
                </button>
              </div>
              {state && state.turns.length > 0 && (
                <details className="history">
                  <summary>
                    Your session · {state.turns.length}{" "}
                    {state.turns.length === 1 ? "attempt" : "attempts"}
                    <ChevronDown size={16} />
                  </summary>
                  {state.turns.map((turn) => (
                    <article className="history-turn" key={turn.id}>
                      <div className="card-heading">
                        <span className="small-label">
                          {unified ? learning?.state.attempts.find(t=>t.id===turn.id)?.question.prompt : pack.questions[turn.questionIndex].display}
                        </span>
                        <button
                          className="text-button"
                          disabled={Boolean(busy) || recording || transcribing}
                          onClick={() => correct(turn)}
                        >
                          <RotateCcw size={14} /> Correct from here
                        </button>
                      </div>
                      <p className="student-quote">“{turn.transcript}”</p>
                      <p>{turn.feedback}</p>
                      <details className="evidence">
                        <summary>How this was checked</summary>
                        <p>{labels[turn.evidenceStatus]}</p>
                        <p>
                          Mathematical check: {turn.verification.status}.{" "}
                          {turn.verification.complete
                            ? "The proposed solution set is complete."
                            : "Completeness has not been established for the proposed answer."}
                        </p>
                        <p>
                          Next action:{" "}
                          {turn.decision.applied.replaceAll("_", " ")}.
                          Decisions confidence is an action-selection estimate.
                        </p>
                        <p>
                          Correcting this attempt removes it and all subsequent
                          dependent assessments from the active notebook.
                        </p>
                      </details>
                    </article>
                  ))}
                </details>
              )}
            </>
          )}
          <footer className="studio-footer">
            Stay curious. Make your reasoning visible.
          </footer>
        </div>
      </main>}
      {panel && (
        <div className="panel-backdrop" onClick={() => setPanel(null)}>
          <aside
            className={`side-panel${panel === "notebook" ? " notebook-panel" : ""}`}
            aria-label={panel}
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="panel-heading">
              <h2>
                {panel === "sources"
                  ? "Your study material"
                  : panel === "notebook"
                    ? "Mistake notebook"
                    : "Settings"}
              </h2>
              <button
                className="icon-button"
                aria-label="Close panel"
                onClick={() => setPanel(null)}
              >
                <X size={21} />
              </button>
            </div>
            {panel === "sources" && (
              <>
                <span className="eyebrow">
                  {unified ? "CBSE MATHEMATICS" : "ALGEBRA PACK"} · VERSION {viewPack.version}
                </span>
                <h3>{viewPack.title}</h3>
                <p className="panel-intro">{viewPack.scope}</p>
                <div className="scope-note">
                  {unified ? "Teaching is generated from CBSE source context and your confirmed explanations. AI review is not a guarantee of correctness." : "These are authored notes from the earlier algebra prototype."}
                </div>
                {viewPack.sources.map((source) => (
                  <article className="source-card" key={source.id}>
                    <span className="source-chip">{source.id}</span>
                    <h3>{source.title}</h3>
                    <p>{source.text}</p>
                  </article>
                ))}
                <h3>Concept connections</h3>
                {viewPack.concepts.map((concept) => (
                  <p className="concept-line" key={concept.id}>
                    <span>{concept.title}</span>
                    <small>
                      Builds on {concept.prerequisite.replaceAll("-", " ")}
                    </small>
                  </p>
                ))}
              </>
            )}
            {panel === "settings" && (
              <>
                <nav className="settings-tabs" aria-label="Settings sections"><button aria-pressed={settingsTab === "general"} onClick={() => setSettingsTab("general")}>General</button><button aria-pressed={settingsTab === "connections"} onClick={() => setSettingsTab("connections")}>Connections</button><button aria-pressed={settingsTab === "appearance"} onClick={() => setSettingsTab("appearance")}>Appearance</button></nav>
                {settingsTab === "general" ? <GeneralSettings /> : settingsTab === "appearance" ? <Appearance /> : <>
                <p className="panel-intro">
                  Provider keys are read by the server. Audio is sent to Sarvam
                  for transcription; confirmed learning evidence is saved in
                  your account.
                </p>
                <div className="connection">
                  <strong>OpenAI Responses</strong>
                  <span>
                    {bootstrap?.configured.responsesModel || "gpt-6-luna"}
                  </span>
                  <em>
                    {bootstrap?.configured.openai
                      ? "Key configured"
                      : "Key required"}
                  </em>
                </div>
                <div className="connection">
                  <strong>OpenAI Decisions</strong>
                  <span>
                    {bootstrap?.configured.decisionsModel || "gpt-6-luna"}
                  </span>
                  <em>Uses your OpenAI key</em>
                </div>
                <div className="connection">
                  <strong>Sarvam voice</strong>
                  <span>Speech recognition and spoken replies</span>
                  <em>
                    {bootstrap?.configured.sarvam
                      ? "Key configured"
                      : "Key required · typing is available"}
                  </em>
                </div>
                <p className="scope-note">
                  For local development, save OPENAI_API_KEY and SARVAM_API_KEY
                  in .dev.vars and restart the server. For the hosted app,
                  configure the same names as runtime secrets.
                </p>
                <button className="secondary-button" onClick={refresh}>
                  Refresh connections
                </button>
                {session && (
                  <button
                    className="text-button new-session"
                    disabled={Boolean(busy) || recording || transcribing}
                    onClick={() => {
                      setPanel(null);
                      void start();
                    }}
                  >
                    Start another practice session
                  </button>
                )}
                </>}
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
function message(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Your saved work is preserved.";
}
