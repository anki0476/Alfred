import { WorkspaceHeader } from "../../components/WorkspaceHeader";
import "./about.css";
export const metadata = { title: "About Alfred" };
const measures = [
 ["Your work stays yours", "Saved sessions and notebooks are scoped to your account or private browser visitor cookie."],
 ["Safer requests", "Alfred checks where requests come from and limits upload and request sizes before processing them."],
 ["Protection against abuse", "Shared request limits help prevent automated abuse and excessive AI and voice usage."],
 ["Careful with your materials", "Uploaded material is treated as untrusted content. Supported file types are checked, and text is displayed without running it as code."],
 ["Keys stay on the server", "AI and voice API keys are kept out of browser code. Learning API responses are marked not to be cached."],
 ["Checked and maintained", "Security fixes are covered by regression tests. The latest review included dependency checks, a production build and local API checks."]
];
const alignment = [
 ["Diagnostic test", "Starting questions and explanations establish what you understand. Unclear reasoning is clarified before it counts."],
 ["One connected syllabus", "A 52-concept graph maps all seven units of CBSE Class 10 Maths and links their prerequisites."],
 ["A learner model", "Each confirmed answer updates your concept record. Mastery estimates use both the answer and its reasoning; unclear evidence leaves the estimate unchanged."],
 ["Targeted questions", "GPT-6 Luna generates fresh questions using CBSE sources, weak concepts and your history. Difficulty adapts to your evidence, from foundations to multi-step board-style applications."],
 ["Reasoning-based misconception detection", "Alfred examines your explanation, quotes the relevant reasoning and probes suspected gaps before marking them as recurring misconceptions."],
 ["Spaced repetition", "Review dates adapt to your answers: successful recall lengthens the interval, while difficulties bring practice forward."],
 ["Class-wide insights", "Classroom shows teachers aggregate concept gaps for learners who join their class, without exposing transcripts or uploaded files."]
];
export default function AboutPage(){return <div className="app-shell"><WorkspaceHeader active="/about"/><main className="about-alfred"><span className="eyebrow">A LITTLE CURIOSITY. A LITTLE CARE.</span><h1>About Alfred</h1><p className="about-intro">Your study companion for explaining, checking and understanding. Built with care for your learning and your data.</p><h2>How Alfred meets the challenge.</h2><p className="about-intro">Seven requirements, connected through one learning record and mistake notebook.</p><div className="about-measures">{alignment.map(([title,text])=><section key={title}><h3>{title}</h3><p>{text}</p></section>)}</div><p className="about-note">Current scope: self-contained text practice across Class 10 Maths. Questions receive source and solution review, with calculation checks where supported. Proofs are AI-reviewed; mastery and difficulty are estimates, not guaranteed exam scores.</p><h2>Security, simply.</h2><div className="about-measures">{measures.map(([title,text])=><section key={title}><h3>{title}</h3><p>{text}</p></section>)}</div><p className="about-note">Uploaded files are saved in this browser. Material you choose to practice with, and voice you submit, are sent to the AI or speech service to process your request. Security is ongoing; no review guarantees zero risk.</p></main></div>}
